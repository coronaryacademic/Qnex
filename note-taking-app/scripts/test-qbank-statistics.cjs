const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const express = require('../electron/node_modules/express');
const { mountMedicalLibrary, MedosReader } = require('../server/medical-library');

(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qnex-stats-test-'));
  const original = MedosReader.prototype.request;
  const banks = [{ key: 'step1', count: 3659, label: 'UWorld Step 1' }, { key: 'step2', count: 4085, label: 'UWorld Step 2' }];
  MedosReader.prototype.request = async () => ({ banks });
  let server, dispose, base;
  async function start() {
    const app = express(); app.use(express.json()); dispose = mountMedicalLibrary(app, directory);
    server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}/api/medical-library`;
  }
  async function stop() { dispose(); await new Promise(resolve => server.close(resolve)); }
  async function request(endpoint, data, method = 'POST', expected = 200) {
    const response = await fetch(base + endpoint, data === undefined ? {} : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await response.json(); assert.equal(response.status, expected, JSON.stringify(json)); return json;
  }
  const question = (bank, id, correct, selectedId = '1') => ({ id: `medos:${bank}:${id}`, source: { bank, questionId: id },
    timerElapsed: 12000, ...(correct === undefined ? {} : { submittedAnswer: { submitted: true, isCorrect: correct, selectedId } }) });
  const session = (bank, questions, completed = false, generation = 0) => ({ id: 'medos-' + randomUUID(), bank, questions, completed, generation, date: new Date().toISOString(), title: 'Test session' });
  try {
    await start();
    const first = session('step1', [question('step1', 1, true), question('step1', 2, false), question('step1', 3)]);
    const other = session('step2', [question('step2', 1, true)]);
    await request('/sessions/' + first.id, first, 'PUT');
    await request('/sessions/' + other.id, other, 'PUT');
    first.questions[0].starred = true;
    await request('/sessions/' + first.id, first, 'PUT');
    let flagged = await request('/flagged?bank=step1');
    assert.equal(flagged.length,1); assert.equal(flagged[0].id,first.questions[0].id); assert.equal(flagged[0].sessionId,first.id);
    assert.equal((await request('/flagged?bank=step2')).length,0);
    first.questions[0].starred = false;
    await request('/sessions/' + first.id, first, 'PUT');
    assert.equal((await request('/flagged?bank=step1')).length,0);
    let stats = await request('/statistics?bank=step1');
    assert.equal(stats.correct, 1); assert.equal(stats.incorrect, 1); assert.equal(stats.used, 2); assert.equal(stats.suspended, 1);
    const retake = session('step1', [question('step1', 1, false), question('step1', 3, false, null)], true);
    await request('/sessions/' + retake.id, retake, 'PUT');
    stats = await request('/statistics?bank=step1');
    assert.equal(stats.used, 3); assert.equal(stats.correct, 0); assert.equal(stats.incorrect, 2); assert.equal(stats.omitted, 1);
    assert.equal(stats.created, 2); assert.equal(stats.completed, 1); assert.equal(stats.totalQuestions, 3659);
    const otherStats = await request('/statistics?bank=step2');
    assert.equal(otherStats.correct, 1); assert.equal(otherStats.completed, 1);
    await request('/profile', { currentBank: 'step2' });
    await stop(); await start();
    assert.equal((await request('/profile')).currentBank, 'step2');
    assert.equal((await request('/statistics')).correct, 1);
    assert.equal((await request('/statistics?bank=step1')).used, 3);
    const profile = await request('/reset-progress', { bank: 'step1' });
    assert.equal(profile.generations.step1, 1);
    const resetStats = await request('/statistics?bank=step1');
    assert.equal(resetStats.used, 0); assert.equal(resetStats.created, 0); assert.equal(resetStats.totalQuestions, 3659);
    assert.equal((await request('/flagged?bank=step1')).length,0);
    assert.deepEqual(await request('/statistics?bank=step2'), otherStats);
    await request('/sessions/' + first.id, first, 'PUT', 400);
    assert.equal((await request('/sessions')).length, 1);
    const fresh = session('step1', [question('step1', 8, true)], false, 1);
    await request('/sessions/' + fresh.id, fresh, 'PUT');
    assert.equal((await request('/statistics?bank=step1')).correct, 1);

    // Exercise the real Statistics renderer with a minimal DOM: it must use the
    // per-bank endpoint and update the existing counters, not /stats.
    const elements = new Map();
    const element = id => { if (!elements.has(id)) elements.set(id, { textContent: '', style: {}, setAttribute() {}, removeAttribute() {} }); return elements.get(id); };
    const context = { window: { MedicalLibrary: { banks, saveQueue: Promise.resolve(), api: endpoint => request(endpoint) } },
      document: { getElementById: element, querySelector: () => ({ querySelector: element }) } };
    vm.runInNewContext(await fs.readFile(path.join(__dirname, 'qbank-dashboard.js'), 'utf8'), context);
    assert.equal(context.window.QBankDashboard.metrics({correct:0,incorrect:0,totalQuestions:3659,used:3658,created:0}).usageLabel,99.9);
    assert.equal(context.window.QBankDashboard.metrics({correct:0,incorrect:0,totalQuestions:3659,used:3659,created:0}).usageLabel,100);
    await context.window.QBankDashboard.renderStatistics();
    assert.equal(element('stat-correct').textContent, '1');
    assert.equal(element('stat-total-questions').textContent, '4085');
    assert.equal(element('stat-accuracy').textContent, '100%');
    assert.equal(element('stat-total-sessions').textContent, '1');
    assert.equal(element('stat-used-pct').textContent, '<0.1%');
    context.window.MedicalLibrary.groupBanks = items => [{ label: 'UWorld', banks: items }];
    await context.window.QBankDashboard.renderMain();
    assert.match(element('qbankMainDashboard').innerHTML, /4,085 Used/);
    assert.match(element('qbankMainDashboard').innerHTML, /1 \/ 1 Completed/);
    assert.match(element('qbankMainDashboard').innerHTML, /100%/);
    assert.match(element('qbankMainDashboard').innerHTML, /UWorld Step 2/);
    console.log('PASS: per-bank totals, latest-answer deduplication, omitted answers, completion, saved selection, restart, isolated reset, stale saves, new progress, Statistics renderer.');
  } finally {
    if (server?.listening) await stop(); MedosReader.prototype.request = original;
    if (path.dirname(path.resolve(directory)) === path.resolve(os.tmpdir()) && path.basename(directory).startsWith('qnex-stats-test-')) await fs.rm(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
