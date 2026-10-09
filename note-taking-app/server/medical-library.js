'use strict';
const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const { createInterface } = require('readline');
const { randomUUID } = require('crypto');
const bauLibrary = require('./bau-library');

class MedosReader {
  constructor(root) { this.root = root; this.pending = new Map(); this.sequence = 0; }
  start() {
    if (this.child) return;
    const python = process.env.QNEX_MEDOS_PYTHON || path.join(this.root, 'tools', 'python', 'python.exe');
    const child = spawn(python, ['-B', '-u', path.join(__dirname, 'medos-reader.py'), this.root], {
      windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
    });
    this.child = child;
    let detail = '';
    child.stderr.on('data', data => { detail = (detail + data.toString()).slice(-1500); });
    createInterface({ input: child.stdout }).on('line', line => {
      try {
        const message = JSON.parse(line), pending = this.pending.get(message.id);
        if (!pending) return;
        clearTimeout(pending.timer); this.pending.delete(message.id);
        if (message.error) { const error=new Error(message.error);error.status=message.status || 400;pending.reject(error); } else pending.resolve(message.result);
      } catch { /* The reader redirects non-protocol output to stderr. */ }
    });
    const failed = error => {
      if (this.child === child) this.child = null;
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer); pending.reject(error);
      }
      this.pending.clear();
    };
    child.on('error', () => failed(new Error('Could not start the MedOS reader. Check the installation folder and bundled Python.')));
    child.on('exit', () => failed(new Error('The MedOS reader stopped. ' + detail)));
    child.stdin.on('error', () => {});
  }
  request(args) {
    if (String(args.bank || '').startsWith('bau-')) return Promise.resolve().then(() => bauLibrary.dispatch(args));
    this.start();
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => this.close(), 120000);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify({ ...args, id }) + '\n');
    }).then(result => args.action==='catalog' ? {...result,banks:[...result.banks,...bauLibrary.catalog()]} : result);
  }
  close() {
    const child = this.child;
    this.child = null;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer); pending.reject(new Error('The library reader stopped. Please retry.'));
    }
    this.pending.clear();
    if (child) child.kill();
  }
}

function sessionCompleted(session) {
  if (session.settings?.builder === 'amboss') return !!session.completed;
  return !!session.completed || (session.questions.length > 0 && session.questions.every(q => q._tutorMode !== false && q.submittedAnswer?.submitted));
}

function bankStatistics(sessions, bank, totalQuestions = 0, includePerformance = true) {
  const selected = sessions.filter(session => session.bank === bank);
  const latest = new Map(), attemptProgress = {};
  for (const session of selected) for (const question of session.questions) {
    if (session.settings?.builder === 'amboss' && question._tutorMode === false && !sessionCompleted(session)) continue;
    if (!question.submittedAnswer?.submitted) continue;
    const id = String(question.source.questionId);
    const time = question.progressUpdatedAt || session.date;
    if (question.submittedAnswer.selectedId != null) {
      const outcome = !question.submittedAnswer.isCorrect ? 'incorrect' : question._ambossHintUsed || question._ambossKeyUsed ? 'hint' : 'correct';
      const outcomes = attemptProgress[id] ||= [];
      if (!outcomes.includes(outcome)) outcomes.push(outcome);
    }
    if (!latest.has(id) || time >= latest.get(id).time) latest.set(id, { question, time });
  }
  let correct = 0, incorrect = 0, omitted = 0, totalTime = 0;
  const progress = {}, ambossProgress = {}, reports = { subject: {}, system: {} }, changes = { C2I: 0, I2C: 0, I2I: 0 };
  const marked = new Map();
  for (const session of selected) for (const q of session.questions) {
    const id = String(q.source.questionId), time = q.markUpdatedAt || session.date;
    if (!marked.has(id) || time >= marked.get(id).time) marked.set(id, { time, value: !!q.starred });
    for (const key of Object.keys(changes)) changes[key] += Number(q.answerChanges?.[key]) || 0;
  }
  for (const { question } of latest.values()) {
    const answer = question.submittedAnswer;
    if (answer.selectedId == null) omitted++;
    else if (answer.isCorrect) correct++;
    else incorrect++;
    totalTime += Math.max(0, Number(question.timerElapsed) || 0) / 1000;
    const outcome = answer.selectedId == null ? 'omitted' : answer.isCorrect ? 'correct' : 'incorrect';
    progress[question.source.questionId] = outcome;
    ambossProgress[question.source.questionId] = outcome === 'omitted' ? 'new' : outcome === 'correct' && (question._ambossHintUsed || question._ambossKeyUsed) ? 'hint' : outcome;
    for (const field of Object.keys(reports)) for (const name of question.tags?.[field] || ['General']) {
      const row = reports[field][name] ||= { name, correct: 0, incorrect: 0, omitted: 0, used: 0 };
      row[outcome]++; row.used++;
    }
  }
  return { bank, correct, incorrect, omitted, used: latest.size, totalQuestions,
    ...(includePerformance ? {performance:bankStatistics(selected.filter(sessionCompleted),bank,totalQuestions,false)} : {}),
    totalTime, created: selected.length, completed: selected.filter(sessionCompleted).length,
    suspended: selected.filter(s => !sessionCompleted(s)).length,
    usedIds: [...latest.keys()].map(Number), progress, markedIds: [...marked].filter(([, q]) => q.value).map(([id]) => Number(id)),
    reports, changes, ambossProgress, attemptProgress,
    tests: selected.filter(sessionCompleted).map(s => ({ id: s.id, title: s.title, date: s.date,
      score: Math.round(100 * s.questions.filter(q => q.submittedAnswer?.isCorrect).length / s.questions.length) })).sort((a,b) => a.date.localeCompare(b.date)) };
}

function mountMedicalLibrary(app, dataDir) {
  const directory = path.join(dataDir, 'library-sessions');
  const configPath = path.join(dataDir, 'settings', 'medical-library.json');
  const profilePath = path.join(dataDir, 'settings', 'qbank-profile.json');
  let profile = { currentBank: null, generations: {} }, catalog;
  let writes = Promise.resolve();
  const serialized = operation => {
    const result = writes.catch(() => {}).then(operation);
    writes = result;
    return result;
  };
  let reader, root, initialized;
  const mediaCache = new Map(), mediaPending = new Map();
  let mediaCacheBytes = 0;
  async function init() {
    if (!initialized) initialized = (async () => {
      let config = {};
      try { config = JSON.parse(await fs.readFile(configPath, 'utf8')); } catch {}
      root = config.root || process.env.QNEX_MEDOS_ROOT || 'D:\\MedOS\\MedOS';
      reader = new MedosReader(root);
      try { profile = { ...profile, ...JSON.parse(await fs.readFile(profilePath, 'utf8')) }; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    })();
    await initialized;
  }
  async function atomic(file, data) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temp = file + '.' + randomUUID() + '.tmp';
    await fs.writeFile(temp, JSON.stringify(data));
    await fs.rename(temp, file);
  }
  function sessionFile(id) {
    if (!/^medos-[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid library session.');
    return path.join(directory, id + '.json');
  }
  function summary(session) {
    const answered = session.questions.filter(q => q.submittedAnswer?.submitted);
    return { id: session.id, title: session.title, date: session.date, bank: session.bank,
      count: session.questions.length, library: true, folderId: null,
      answered: answered.length, correct: answered.filter(q => q.submittedAnswer.isCorrect).length,
      mode: session.questions[0]?._tutorMode === false ? 'Exam' : 'Tutor',
      timed: session.questions[0]?._timerMode === 'down',
      subjects: [...new Set(session.questions.flatMap(q => q.tags?.subject || []))],
      systems: [...new Set(session.questions.flatMap(q => q.tags?.system || []))],
      usedIds: answered.map(q => q.source.questionId), completed: sessionCompleted(session),
      questionIds: session.questions.map(q => q.source.questionId),
      generation: session.generation || 0 };
  }
  const generation = bank => profile.generations[bank] || 0;
  async function readSessions() {
    await writes.catch(() => {});
    const files = await fs.readdir(directory).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
    const sessions = [];
    for (const file of files.filter(name => /^medos-[a-f0-9-]{36}\.json$/.test(name))) {
      const session = JSON.parse(await fs.readFile(path.join(directory, file), 'utf8'));
      if ((session.generation || 0) === generation(session.bank)) sessions.push(session);
    }
    return sessions;
  }
  async function knownBank(bank) {
    if (!catalog) catalog = await reader.request({ action: 'catalog' });
    const match = catalog.banks.find(item => item.key === bank);
    if (!match) throw new Error('Question bank is not available in the connected library.');
    return match;
  }
  const route = fn => async (req, res) => {
    try { await init(); await fn(req, res); }
    catch (error) { res.status(Number.isInteger(error.status) && error.status>=400 && error.status<=599 ? error.status : 400).json({ error: error.message }); }
  };
  for (const prefix of ['/amboss', '/uworld-library', '/utd']) {
    app.get(prefix + '/*', route(async (req, res) => {
      const result = await reader.request({action:'reference',path:req.originalUrl});
      res.status(result.status).type(result.type).send(Buffer.from(result.body, 'base64'));
    }));
  }
  app.get('/api/medical-library/catalog', route(async (req, res) => {
    catalog = await reader.request({ action: 'catalog' });
    res.json({ ...catalog, root });
  }));
  app.get('/api/medical-library/archive', route(async (req, res) => {
    res.json(await reader.request({ action: 'archive' }));
  }));
  app.get('/api/medical-library/archive/question', route(async (req, res) => {
    res.json(await reader.request({ action: 'archive_detail', bank: req.query.bank, qid: req.query.qid }));
  }));
  app.get('/api/medical-library/profile', route(async (req, res) => {
    await writes.catch(() => {}); res.json(profile);
  }));
  app.post('/api/medical-library/profile', route(async (req, res) => {
    const currentBank = req.body.currentBank || null;
    if (currentBank) await knownBank(currentBank);
    await serialized(async () => {
      const next = { ...profile, currentBank };
      await atomic(profilePath, next); profile = next;
    });
    res.json(profile);
  }));
  app.get('/api/medical-library/statistics', route(async (req, res) => {
    const bank = String(req.query.bank || profile.currentBank || '');
    const info = await knownBank(bank);
    res.json({ ...bankStatistics(await readSessions(), bank, info.count), label: info.label });
  }));
  app.post('/api/medical-library/reset-progress', route(async (req, res) => {
    const scope = req.body.scope || 'current';
    if (!['current', 'all'].includes(scope)) throw new Error('Invalid reset scope.');
    const bank = String(req.body.bank || '');
    if (scope === 'current') await knownBank(bank);
    await serialized(async () => {
      const banks = new Set(scope === 'current' ? [bank] : Object.keys(profile.generations));
      if (scope === 'all') {
        if (profile.currentBank) banks.add(profile.currentBank);
        for (const item of catalog?.banks || []) banks.add(item.key);
        const files = await fs.readdir(directory).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
        for (const file of files.filter(name => /^medos-[a-f0-9-]{36}\.json$/.test(name))) {
          const session = JSON.parse(await fs.readFile(path.join(directory, file), 'utf8'));
          if (session.bank) banks.add(session.bank);
        }
      }
      const generations = { ...profile.generations };
      for (const key of banks) generations[key] = generation(key) + 1;
      const next = { ...profile, generations };
      await atomic(profilePath, next); profile = next;
    });
    res.json(profile);
  }));
  app.post('/api/medical-library/connect', route(async (req, res) => {
    const nextRoot = path.resolve(String(req.body.root || ''));
    await fs.access(path.join(nextRoot, 'app', 'backend', 'qbank_reader.py'));
    const nextReader = new MedosReader(nextRoot);
    let nextCatalog;
    try {
      nextCatalog = await nextReader.request({ action: 'catalog' });
      await atomic(configPath, { root: nextRoot });
    } catch (error) { nextReader.close(); throw error; }
    reader.close(); reader = nextReader; root = nextRoot;
    mediaCache.clear(); mediaPending.clear(); mediaCacheBytes = 0;
    catalog = nextCatalog;
    res.json({ ...catalog, root });
  }));
  app.get('/api/medical-library/filters', route(async (req, res) => {
    res.json(await reader.request({ action: 'filters', bank: req.query.bank }));
  }));
  app.get('/api/medical-library/questions-list', route(async (req, res) => {
    const bank = String(req.query.bank || profile.currentBank || '');
    if (!bank) return res.json({ questions: [], folders: [], bank: null });
    const info = await knownBank(bank);
    const result = await reader.request({ action: 'question_list', bank, limit: 10000 });
    const subjects = new Set();
    const questions = (result.questions || []).map(q => {
      const subject = q.subject || 'General';
      subjects.add(subject);
      const folderId = 'ml-sub-' + encodeURIComponent(subject);
      return {
        id: `medos:${bank}:${q.id}`,
        spId: q.displayId || `QNX-${q.id}`,
        title: q.title || `${info.label} · #${q.id}`,
        text: `Question #${q.id} (${q.subject || 'General'} · ${q.system || 'General'})`,
        explanation: '',
        starred: false,
        folderId,
        library: true,
        source: { bank, questionId: q.id, displayId:q.displayId, aliases:q.aliases },
        tags: {
          subject: q.subject ? [q.subject] : [],
          system: q.system ? [q.system] : [],
          major: [],
          minor: []
        }
      };
    });
    const folders = [...subjects].sort().map(name => ({
      id: 'ml-sub-' + encodeURIComponent(name),
      title: name,
      parentId: null,
      library: true
    }));
    res.json({ bank, label: info.label, count: questions.length, questions, folders });
  }));
  app.get('/api/medical-library/question-detail', route(async (req, res) => {
    const bank = String(req.query.bank || '');
    const qid = Number(req.query.qid || 0);
    await knownBank(bank);
    const result = await reader.request({ action: 'question_detail', bank, qid });
    res.json(result);
  }));
  app.post('/api/medical-library/questions', route(async (req, res) => {
    res.json(await reader.request({ ...req.body, action: 'questions' }));
  }));
  app.get('/api/medical-library/exhibit/:bank/:qid/:exhibitId', route(async (req, res) => {
    if (!/^\d{3,8}$/.test(req.params.exhibitId)) throw new Error('Invalid exhibit ID.');
    res.json(await reader.request({ action: 'exhibit', ...req.params }));
  }));
  app.get('/api/medical-library/media/:bank/:qid/:name', route(async (req, res) => {
    const key = JSON.stringify([root, req.params.bank, req.params.qid, req.params.name]);
    let media = mediaCache.get(key);
    if (!media) {
      let pending = mediaPending.get(key);
      if (!pending) {
        pending = reader.request({ action: 'media', ...req.params }).then(result => ({ type:result.type, body:Buffer.from(result.body, 'base64') }));
        mediaPending.set(key, pending);
      }
      try {
        media = await pending;
        if (media.body.length <= 16 * 1024 * 1024 && !mediaCache.has(key)) {
          while (mediaCache.size && mediaCacheBytes + media.body.length > 64 * 1024 * 1024) {
            const oldest = mediaCache.keys().next().value;
            mediaCacheBytes -= mediaCache.get(oldest).body.length; mediaCache.delete(oldest);
          }
          mediaCache.set(key,media); mediaCacheBytes += media.body.length;
        }
      } finally { mediaPending.delete(key); }
    }
    res.set('Cache-Control', 'private, max-age=3600');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Accept-Ranges', 'bytes'); res.type(media.type);
    if (req.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      const size = media.body.length;
      if (!range || (!range[1] && !range[2])) return res.status(416).set('Content-Range', `bytes */${size}`).end();
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(size - 1,Number(range[2])) : size - 1;
      if (start > end || start >= size) return res.status(416).set('Content-Range', `bytes */${size}`).end();
      return res.status(206).set('Content-Range', `bytes ${start}-${end}/${size}`).send(media.body.subarray(start,end+1));
    }
    res.send(media.body);
  }));
  app.get('/api/medical-library/sessions', route(async (req, res) => {
    const sessions = (await readSessions()).map(summary);
    res.json(sessions.sort((a, b) => b.date.localeCompare(a.date)));
  }));
  app.get('/api/medical-library/flagged', route(async (req, res) => {
    const bank = String(req.query.bank || profile.currentBank || '');
    await knownBank(bank);
    const latest = new Map();
    for (const session of (await readSessions()).filter(s => s.bank === bank)) for (const q of session.questions) {
      const id = String(q.source.questionId), time = q.markUpdatedAt || session.date;
      if (!latest.has(id) || time >= latest.get(id).time) latest.set(id, { time, q, session });
    }
    res.json([...latest.values()].filter(item => item.q.starred).map(({q,session}) => ({
      id:q.id, questionId:q.source.questionId, title:q.title, tags:q.tags || {}, sessionId:session.id, sessionTitle:session.title
    })));
  }));
  app.get('/api/medical-library/sessions/:id', route(async (req, res) => {
    await writes.catch(() => {});
    const session = JSON.parse(await fs.readFile(sessionFile(req.params.id), 'utf8'));
    if ((session.generation || 0) !== generation(session.bank)) throw new Error('This session belongs to progress that was reset. Start a new session.');
    res.json(session);
  }));
  app.put('/api/medical-library/sessions/:id', route(async (req, res) => {
    const session = req.body;
    if (session.id !== req.params.id || !Array.isArray(session.questions) || !session.questions.length ||
        session.questions.some(q => !q.source || q.source.bank !== session.bank)) throw new Error('Invalid library session data.');
    await serialized(async () => {
      if ((session.generation || 0) !== generation(session.bank)) throw new Error('This bank was reset. Start a new session to save progress.');
      let previous;
      try { previous = JSON.parse(await fs.readFile(sessionFile(req.params.id), 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      for (const q of session.questions) {
        const old = previous?.questions.find(item => item.id === q.id);
        q.progressUpdatedAt = old && JSON.stringify(old.submittedAnswer) === JSON.stringify(q.submittedAnswer)
          ? old.progressUpdatedAt || previous.date : new Date().toISOString();
        q.markUpdatedAt = old && !!old.starred === !!q.starred ? old.markUpdatedAt || previous.date : new Date().toISOString();
      }
      await atomic(sessionFile(req.params.id), session);
    });
    res.json(summary(session));
  }));
  app.delete('/api/medical-library/sessions/:id', route(async (req, res) => {
    await serialized(() => fs.unlink(sessionFile(req.params.id))); res.json({ success: true });
  }));
  const dispose = () => reader?.close();
  process.once('exit', dispose);
  return dispose;
}

module.exports = { mountMedicalLibrary, MedosReader, bankStatistics };
