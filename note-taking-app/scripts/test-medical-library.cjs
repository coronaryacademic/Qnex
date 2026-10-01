const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('../electron/node_modules/express');
const { MedosReader, mountMedicalLibrary } = require('../server/medical-library');

async function main() {
  const reader = new MedosReader(process.env.QNEX_MEDOS_ROOT || 'D:/MedOS/MedOS');
  const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'qnex-library-test-'));
  let server, dispose;
  try {
    const { banks } = await reader.request({ action: 'catalog' });
    assert(banks.length >= 6);
    console.log('Catalog:', banks.length, 'banks');
    let total = 0, mediaCount = 0, missingMedia = 0, sample;
    for (const bank of banks) {
      const core = /^(step|amboss)[123]$/.test(bank.key);
      const result = await reader.request({ action: 'questions', bank: bank.key, count: core ? 10 : 1 });
      assert(result.questions.length, bank.key + ' has no usable sample');
      const filters = await reader.request({ action: 'filters', bank: bank.key });
      assert(Array.isArray(filters.subjects));
      assert.equal(new Set(filters.items.map(q => q.id)).size, bank.count, bank.key + ': taxonomy must cover the entire bank');
      for (const subject of filters.subjects) assert.equal(new Set(filters.items.filter(q => q.subject === subject.id).map(q => q.id)).size, subject.count);
      if (core) {
        const chosen = filters.items.slice(0, 30).map(q => q.id);
        const selected = await reader.request({ action: 'questions', bank: bank.key, count: 3, ids: chosen });
        assert(selected.questions.every(q => chosen.includes(q.id)), 'Custom IDs must never load an unrelated question');
        assert(selected.questions.every(q => q.subject_names.length && q.system_groups.length));
      }
      for (const q of result.questions) {
        assert(q.quality.valid, bank.key + ':' + q.id);
        assert(q.correct >= 1 && q.correct <= q.choices.length);
        assert.equal(q.choices.length, q.choices_html.length);
        total++;
      }
      if (core) {
        const links = result.questions.flatMap(q => {
          const html = [q.stem_html, q.explanation_html, ...q.choices_html].join(' ');
          return [...html.matchAll(/\/qbank\/media\/(\d+)\/([^"'<>?#\s]+)/g)].map(m => ({ qid: Number(m[1]), name: m[2] }));
        });
        for (const link of links.slice(0, 3)) {
          let media;
          try { media = await reader.request({ action: 'media', bank: bank.key, ...link }); }
          catch (error) { if (!error.message.includes('Media file missing')) throw error; missingMedia++; continue; }
          assert(Buffer.from(media.body, 'base64').length > 50);
          assert(media.type.startsWith('image/') || media.type.startsWith('video/') || media.type.startsWith('audio/'));
          mediaCount++;
        }
        console.log(bank.key + ':', result.questions.length, 'valid questions,', Math.min(3, links.length), 'media checked');
      }
      if (bank.key === 'step1') sample = result.questions[0];
    }
    await assert.rejects(reader.request({ action: 'questions', bank: 'missing-bank', count: 1 }));
    await assert.rejects(reader.request({ action: 'media', bank: 'step1', qid: sample.id, name: '../settings.json' }));
    const filtered = await reader.request({ action: 'questions', bank: 'step1', subject: sample.subject_id, count: 3, exclude: [sample.id] });
    assert(filtered.questions.every(q => q.subject_id === sample.subject_id && q.id !== sample.id));
    console.log('Content checked:', total, 'questions;', mediaCount, 'media files;', missingMedia, 'referenced media missing in source; filters and invalid paths passed');

    const app = express(); app.use(express.json({ limit: '50mb' }));
    dispose = mountMedicalLibrary(app, testDirectory);
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/medical-library`;
    const id = 'medos-' + randomUUID();
    const session = { id, title: 'Integration test', date: new Date().toISOString(), bank: 'step1', questions: [{ id: 'medos:step1:' + sample.id, source: { bank: 'step1', questionId: sample.id }, submittedAnswer: { submitted: true, isCorrect: true, selectedId: String(sample.correct) } }] };
    let response = await fetch(base + '/sessions/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(session) });
    assert.equal(response.status, 200); assert.equal((await response.json()).correct, 1);
    const restored = await (await fetch(base + '/sessions/' + id)).json();
    assert.equal(restored.id, session.id);
    assert.deepEqual(restored.questions[0].submittedAnswer, session.questions[0].submittedAnswer);
    const list = await (await fetch(base + '/sessions')).json();
    assert.equal(list.length, 1); assert.deepEqual(list[0].usedIds, [sample.id]);
    assert.equal((await fetch(base + '/sessions/' + id, { method: 'DELETE' })).status, 200);
    assert.equal((await (await fetch(base + '/sessions')).json()).length, 0);
    console.log('Session save / reload / summaries / delete passed');
  } finally {
    reader.close(); dispose?.();
    if (server) await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(testDirectory);
    if (path.dirname(resolved) === path.resolve(os.tmpdir()) && path.basename(resolved).startsWith('qnex-library-test-')) await fs.rm(resolved, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
