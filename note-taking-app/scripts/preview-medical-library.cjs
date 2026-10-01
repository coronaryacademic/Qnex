// Isolated development preview: normal notes stay in memory; library sessions
// go to a temporary directory. Never opens the user's D:\MyNotes storage.
const express = require('../electron/node_modules/express');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { mountMedicalLibrary } = require('../server/medical-library');
(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qnex-library-preview-'));
  const app = express(); app.use(express.json({ limit: '50mb' }));
  const dispose = mountMedicalLibrary(app, directory);
  app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
  const data = { notes: [], folders: [], questions: { questions: [], folders: [] }, settings: {}, sessions: [], tasks: [], trash: [], stats: {} };
  app.get('/api/:key', (req, res) => res.json(data[req.params.key] || {}));
  app.post('/api/:key', (req, res) => { data[req.params.key] = req.body; res.json({ success: true }); });
  app.use(express.static(path.join(__dirname, '..')));
  const server = app.listen(3001, '127.0.0.1', () => console.log('Isolated preview: http://127.0.0.1:3001'));
  const stop = () => { dispose(); server.close(() => process.exit()); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
})().catch(error => { console.error(error); process.exitCode = 1; });
