const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const express = require('../electron/node_modules/express');
const { MedosReader, mountMedicalLibrary } = require('../server/medical-library');

(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qnex-reset-test-'));
  const originalRequest = MedosReader.prototype.request;
  MedosReader.prototype.request = async () => ({ banks: [{ key:'step1', count:1 }, { key:'step2', count:1 }] });
  let server, dispose;
  try {
    const sessionDirectory = path.join(directory, 'library-sessions');
    await fs.mkdir(sessionDirectory);
    const sessions = ['step1', 'step2', 'previous-library-bank'].map(bank => ({
      id:'medos-' + randomUUID(), bank, generation:0, title:bank, date:'2026-10-05',
      questions:[{source:{questionId:1},starred:true,submittedAnswer:{submitted:true,isCorrect:true}}]
    }));
    for (const session of sessions) await fs.writeFile(path.join(sessionDirectory, session.id + '.json'), JSON.stringify(session));
    const app = express(); app.use(express.json()); dispose = mountMedicalLibrary(app, directory);
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const api = async (endpoint, body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/medical-library${endpoint}`, body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {});
      const result = await response.json(); assert.equal(response.status, 200, JSON.stringify(result)); return result;
    };
    assert.equal((await api('/sessions')).length, 3);
    const current = await api('/reset-progress', {scope:'current',bank:'step1'});
    assert.equal(current.generations.step1, 1);
    assert.equal(current.generations.step2, undefined);
    assert.deepEqual((await api('/sessions')).map(s => s.bank).sort(), ['previous-library-bank','step2']);
    const all = await api('/reset-progress', {scope:'all'});
    assert.equal(all.generations.step1, 2);
    assert.equal(all.generations.step2, 1);
    assert.equal(all.generations['previous-library-bank'], 1);
    assert.deepEqual(await api('/sessions'), []);
    const stale = await fetch(`http://127.0.0.1:${server.address().port}/api/medical-library/sessions/${sessions[1].id}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(sessions[1])});
    assert.equal(stale.status, 400, 'Reset sessions cannot restore old progress');
    const context = {window:{},document:{readyState:'loading',addEventListener(){}},console};
    vm.runInNewContext(await fs.readFile(path.join(__dirname,'qbank-workspace.js'),'utf8'), context);
    const table = context.window.QBankWorkspace.sessionTable([], true);
    assert.equal((table.match(/<th>/g) || []).length, 8);
    assert(table.includes('colspan="8"') && table.includes('No sessions yet.'));
    console.log('PASS: current-bank isolation, all-bank reset including previous libraries, stale-save rejection, and empty table row.');
  } finally {
    dispose?.(); if (server) await new Promise(resolve => server.close(resolve));
    MedosReader.prototype.request = originalRequest;
    const resolved = path.resolve(directory);
    assert(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('qnex-reset-test-'));
    await fs.rm(resolved, {recursive:true,force:true});
  }
})().catch(error => {console.error(error);process.exitCode=1;});
