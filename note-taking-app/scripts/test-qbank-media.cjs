const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const express = require('../electron/node_modules/express');
const { MedosReader, mountMedicalLibrary } = require('../server/medical-library');
(async () => {
  const original = MedosReader.prototype.request;
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qnex-media-test-'));
  let requests = 0, server, dispose;
  MedosReader.prototype.request = async () => {
    requests++; await new Promise(resolve => setTimeout(resolve,10));
    return {type:'video/mp4',body:Buffer.from('0123456789').toString('base64')};
  };
  try {
    const app = express(); dispose = mountMedicalLibrary(app,directory);
    server = app.listen(0,'127.0.0.1'); await new Promise(resolve => server.once('listening',resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/medical-library/media/step1/1/clip.mp4`;
    const [a,b] = await Promise.all([fetch(url),fetch(url)]);
    assert.equal(await a.text(),'0123456789'); assert.equal(await b.text(),'0123456789'); assert.equal(requests,1);
    const range = await fetch(url,{headers:{Range:'bytes=2-5'}});
    assert.equal(range.status,206); assert.equal(range.headers.get('content-range'),'bytes 2-5/10'); assert.equal(await range.text(),'2345');
    const suffix = await fetch(url,{headers:{Range:'bytes=-3'}}); assert.equal(await suffix.text(),'789');
    const invalid = await fetch(url,{headers:{Range:'bytes=20-30'}}); assert.equal(invalid.status,416);
    assert.equal(requests,1,'Repeated requests use decoded media cache');
    console.log('PASS: concurrent media deduplication, decoded cache, full response, video/audio byte ranges and invalid-range handling.');
  } finally {
    dispose?.(); if (server) await new Promise(resolve => server.close(resolve));
    MedosReader.prototype.request = original;
    if (path.dirname(path.resolve(directory)) === path.resolve(os.tmpdir()) && path.basename(directory).startsWith('qnex-media-test-')) await fs.rm(directory,{recursive:true,force:true});
  }
})().catch(error => { console.error(error); process.exitCode=1; });
