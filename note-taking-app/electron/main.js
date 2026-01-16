const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const matter = require('gray-matter');

// Internal logging for "Debug Log" feature
const startupLogs = [];
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry); // Keep console generic logging
  startupLogs.push(logEntry);
  if (mainWindow) {
    mainWindow.webContents.send('startup-log', logEntry);
  }
}

let mainWindow;
let server;
const SERVER_PORT = 3002; // Use different port to avoid conflicts

// Base directory for notes on D drive
const NOTES_BASE_DIR = 'D:\\MyNotes';
const UNCATEGORIZED_DIR_NAME = 'Uncategorized';
const META_FILE = '.folder-meta.json';
const SYSTEM_DIRS = ['trash', 'settings', 'backups', '.git', 'node_modules', 'tasks', 'questions'];

// Ensure base directory exists
fs.ensureDirSync(NOTES_BASE_DIR);
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'trash'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'settings'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'tasks'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'questions'));

// Helper to sanitize filename (directory names)
function sanitizeFilename(name) {
  if (!name || name.trim() === '') return 'Untitled';
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

// Convert HTML to Markdown
function htmlToMarkdown(html) {
  if (!html) return '';
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    const listItems = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (m, item) => `${counter++}. ${item.trim()}\n`);
    return '\n' + listItems + '\n';
  });
  md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    const listItems = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (m, item) => `- ${item.trim()}\n`);
    return '\n' + listItems + '\n';
  });
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (match, content) => content.split('\n').map(line => '> ' + line).join('\n') + '\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n\n');
  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

// Helper to parse MD note
async function readMdNote(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsed = matter(fileContent);
    return {
      ...parsed.data,
      contentHtml: parsed.content,
      id: parsed.data.id || path.basename(filePath, '.md')
    };
  } catch (error) {
    console.error(`Error parsing MD file ${filePath}:`, error);
    return null;
  }
}

// Global scan function (used by Server and IPC)
async function scanFileSystem() {
  const result = { notes: [], folders: [], folderIdMap: new Map(), noteIdMap: new Map() };
  const uncategorizedDir = path.join(NOTES_BASE_DIR, UNCATEGORIZED_DIR_NAME);

  // Ensure Uncategorized exists
  await fs.ensureDir(uncategorizedDir);

  async function crawl(dirPath, parentId = null) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        if (SYSTEM_DIRS.includes(item.name)) continue;
        // Skip hidden folders (except Uncategorized if it's there? No, Uncategorized is visible)
        // Skip Uncategorized directory recursion only IF we are at root AND we want to treat it specially?
        // Actually, we WANT to recurse into Uncategorized to find notes.
        // We just might treat it as "Root" (parentId null) for logic.

        const isUncategorizedRoot = (dirPath === NOTES_BASE_DIR && item.name === UNCATEGORIZED_DIR_NAME);

        let folderId = null;
        let metadata = {};

        // Read metadata
        const metaPath = path.join(fullPath, META_FILE);
        if (await fs.pathExists(metaPath)) {
          try {
            metadata = await fs.readJson(metaPath);
            folderId = metadata.id;
          } catch (e) { }
        }

        // If no ID (and not Uncategorized), generate one
        if (!folderId && !isUncategorizedRoot) {
          folderId = uuidv4();
          await fs.writeJson(metaPath, { id: folderId, createdAt: new Date().toISOString() }, { spaces: 2 });
        }

        if (folderId) result.folderIdMap.set(folderId, fullPath);

        if (!isUncategorizedRoot) {
          result.folders.push({
            id: folderId,
            parentId: parentId,
            name: item.name,
            icon: metadata.icon || 'folder',
            color: metadata.color || null,
            createdAt: metadata.createdAt
          });
          await crawl(fullPath, folderId);
        } else {
          // For Uncategorized folder, notes inside have parentId = null
          // And we don't add it to "folders" list passed to frontend
          await crawl(fullPath, null);
        }

      } else if (item.isFile() && item.name.endsWith('.md')) {
        const note = await readMdNote(fullPath);
        if (note) {
          note.folderId = parentId; // Update logic ID based on physical location
          result.notes.push(note);
          result.noteIdMap.set(note.id, fullPath);
        }
      }
    }
  }

  await crawl(NOTES_BASE_DIR, null);
  return result;
}

// Create Express server
function createServer() {
  const expressApp = express();

  expressApp.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
  }));

  expressApp.use(express.json({ limit: '50mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- MIGRATION LOGIC ---
  async function performMigration() {
    const oldNotesDir = path.join(NOTES_BASE_DIR, 'notes');
    const oldFoldersDir = path.join(NOTES_BASE_DIR, 'folders');
    const uncategorizedDir = path.join(NOTES_BASE_DIR, UNCATEGORIZED_DIR_NAME);

    const hasOldNotes = await fs.pathExists(oldNotesDir);
    const hasOldFolders = await fs.pathExists(oldFoldersDir);

    if (!hasOldNotes && !hasOldFolders) return;

    log('[MIGRATION] converting flat file structure to physical folders...');

    // 1. Uncategorized dir
    await fs.ensureDir(uncategorizedDir);

    // 2. Load old folders to build tree
    let foldersMap = new Map();
    if (hasOldFolders) {
      const files = await fs.readdir(oldFoldersDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = await fs.readJson(path.join(oldFoldersDir, file));
            foldersMap.set(data.id, data);
          } catch (e) { }
        }
      }
    }

    // 3. Create physical folders
    const getFolderPath = (folderId) => {
      const parts = [];
      let currentId = folderId;
      const seen = new Set();
      while (currentId && foldersMap.has(currentId) && !seen.has(currentId)) {
        seen.add(currentId);
        const f = foldersMap.get(currentId);
        parts.unshift(sanitizeFilename(f.name));
        currentId = f.parentId;
      }
      return path.join(NOTES_BASE_DIR, ...parts);
    };

    for (const [id, folder] of foldersMap) {
      const dirPath = getFolderPath(id);
      await fs.ensureDir(dirPath);
      await fs.writeJson(path.join(dirPath, META_FILE), {
        id: folder.id, icon: folder.icon, color: folder.color, createdAt: folder.createdAt
      }, { spaces: 2 });
      log(`[MIGRATION] Created folder: ${dirPath}`);
    }

    // 4. Move notes
    if (hasOldNotes) {
      const noteFiles = await fs.readdir(oldNotesDir);
      for (const file of noteFiles) {
        if (!file.endsWith('.md')) continue;
        const oldPath = path.join(oldNotesDir, file);
        try {
          const content = await fs.readFile(oldPath, 'utf8');
          const parsed = matter(content);
          const folderId = parsed.data.folderId;

          let targetDir = uncategorizedDir;
          if (folderId && foldersMap.has(folderId)) {
            targetDir = getFolderPath(folderId);
          }
          await fs.copy(oldPath, path.join(targetDir, file));
        } catch (e) {
          console.error(`[MIGRATION] Failed note: ${file}`, e);
          await fs.copy(oldPath, path.join(uncategorizedDir, file)).catch(() => { });
        }
      }
    }

    // 5. Cleanup
    if (hasOldNotes) await fs.rename(oldNotesDir, path.join(NOTES_BASE_DIR, 'notes_old_backup'));
    if (hasOldFolders) await fs.rename(oldFoldersDir, path.join(NOTES_BASE_DIR, 'folders_old_backup'));

    log('[MIGRATION] Complete. Backups created.');
  }

  performMigration().catch(e => console.error(e));

  // --- ENDPOINTS ---

  expressApp.get('/api/notes', async (req, res) => {
    try {
      const { notes } = await scanFileSystem();
      res.json(notes);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  expressApp.get('/api/folders', async (req, res) => {
    try {
      const { folders } = await scanFileSystem();
      res.json(folders);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  expressApp.post('/api/notes/:noteId', async (req, res) => {
    try {
      const { noteId } = req.params;
      const { content, contentHtml, folderId, ...metadata } = req.body;

      if (!metadata.id) metadata.id = noteId;
      metadata.folderId = folderId;

      const { folderIdMap, noteIdMap } = await scanFileSystem();

      let targetDir = path.join(NOTES_BASE_DIR, UNCATEGORIZED_DIR_NAME);
      if (folderId && folderIdMap.has(folderId)) {
        targetDir = folderIdMap.get(folderId);
      }
      await fs.ensureDir(targetDir);

      const filePath = path.join(targetDir, `${noteId}.md`);
      const md = htmlToMarkdown(contentHtml || content || '');
      const fileContent = matter.stringify(md, metadata);

      await fs.writeFile(filePath, fileContent, 'utf8');

      // Delete old file if moved
      if (noteIdMap.has(noteId)) {
        const oldPath = noteIdMap.get(noteId);
        if (oldPath !== filePath) {
          await fs.remove(oldPath);
          console.log(`[MOVE] Moved note from ${oldPath} to ${filePath}`);
        }
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  expressApp.delete('/api/notes/:noteId', async (req, res) => {
    try {
      const { noteId } = req.params;
      const { noteIdMap } = await scanFileSystem();
      if (noteIdMap.has(noteId)) {
        await fs.remove(noteIdMap.get(noteId));
        res.json({ success: true });
      } else {
        res.json({ success: true, message: 'Not found' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  expressApp.post('/api/folders', async (req, res) => {
    try {
      const foldersList = req.body; // Full list sync
      const { folderIdMap } = await scanFileSystem();

      for (const f of foldersList) {
        let parentPath = NOTES_BASE_DIR;
        if (f.parentId && folderIdMap.has(f.parentId)) {
          parentPath = folderIdMap.get(f.parentId);
        }

        const safeName = sanitizeFilename(f.name);
        const desiredPath = path.join(parentPath, safeName);

        // If folder exists (by ID context), move/rename if needed
        if (folderIdMap.has(f.id)) {
          const currentPath = folderIdMap.get(f.id);
          if (currentPath !== desiredPath) {
            if (await fs.pathExists(currentPath)) {
              // Check if target exists (merge case?)
              if (await fs.pathExists(desiredPath)) {
                // Merge content
                await fs.copy(currentPath, desiredPath);
                await fs.remove(currentPath);
              } else {
                await fs.move(currentPath, desiredPath);
              }
              // Update map for next iterations in this loop?
              folderIdMap.set(f.id, desiredPath);
            }
          }
          // Update meta
          await fs.writeJson(path.join(desiredPath, META_FILE), {
            id: f.id, icon: f.icon, color: f.color, createdAt: f.createdAt
          }, { spaces: 2 });
        } else {
          // Create
          await fs.ensureDir(desiredPath);
          await fs.writeJson(path.join(desiredPath, META_FILE), {
            id: f.id, icon: f.icon, color: f.color, createdAt: new Date().toISOString()
          }, { spaces: 2 });
          folderIdMap.set(f.id, desiredPath);
        }
      }
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  expressApp.delete('/api/folders/:folderId', async (req, res) => {
    try {
      const { folderId } = req.params;
      const { folderIdMap } = await scanFileSystem();
      if (folderIdMap.has(folderId)) {
        await fs.remove(folderIdMap.get(folderId));
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Not found' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Other endpoints
  expressApp.get('/api/trash', async (req, res) => {
    const f = path.join(NOTES_BASE_DIR, 'trash', 'trash.json');
    res.json(await fs.pathExists(f) ? await fs.readJson(f) : []);
  });
  expressApp.post('/api/trash', async (req, res) => {
    await fs.ensureDir(path.join(NOTES_BASE_DIR, 'trash'));
    await fs.writeJson(path.join(NOTES_BASE_DIR, 'trash', 'trash.json'), req.body, { spaces: 2 });
    res.json({ success: true });
  });
  expressApp.delete('/api/trash', async (req, res) => {
    await fs.ensureDir(path.join(NOTES_BASE_DIR, 'trash'));
    await fs.writeJson(path.join(NOTES_BASE_DIR, 'trash', 'trash.json'), [], { spaces: 2 });
    res.json({ success: true });
  });

  expressApp.get('/api/settings', async (req, res) => {
    const f = path.join(NOTES_BASE_DIR, 'settings', 'settings.json');
    res.json(await fs.pathExists(f) ? await fs.readJson(f) : { theme: 'light' });
  });
  expressApp.post('/api/settings', async (req, res) => {
    await fs.ensureDir(path.join(NOTES_BASE_DIR, 'settings'));
    await fs.writeJson(path.join(NOTES_BASE_DIR, 'settings', 'settings.json'), req.body, { spaces: 2 });
    res.json({ success: true });
  });

  expressApp.get('/api/tasks', async (req, res) => {
    const f = path.join(NOTES_BASE_DIR, 'tasks', 'tasks.json');
    res.json(await fs.pathExists(f) ? await fs.readJson(f) : []);
  });
  expressApp.post('/api/tasks', async (req, res) => {
    await fs.ensureDir(path.join(NOTES_BASE_DIR, 'tasks'));
    await fs.writeJson(path.join(NOTES_BASE_DIR, 'tasks', 'tasks.json'), req.body, { spaces: 2 });
    res.json({ success: true });
  });

  // QUESTIONS ENDPOINTS
  expressApp.get('/api/questions', async (req, res) => {
    const f = path.join(NOTES_BASE_DIR, 'questions', 'questions.json');
    res.json(await fs.pathExists(f) ? await fs.readJson(f) : { questions: [], folders: [] });
  });
  expressApp.post('/api/questions', async (req, res) => {
    await fs.ensureDir(path.join(NOTES_BASE_DIR, 'questions'));
    await fs.writeJson(path.join(NOTES_BASE_DIR, 'questions', 'questions.json'), req.body, { spaces: 2 });
    log(`[SERVER] Saved questions: ${req.body.questions?.length || 0} questions, ${req.body.folders?.length || 0} folders`);
    res.json({ success: true });
  });

  expressApp.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Physical FS Server v2' }));

  return expressApp;
}

// Start the embedded server
function startServer() {
  log('Initializing embedded server...');
  const expressApp = createServer();

  try {
    server = expressApp.listen(SERVER_PORT, () => {
      log(`Embedded server running on http://localhost:${SERVER_PORT}`);
      log(`Base directory: ${NOTES_BASE_DIR}`);
      log(`VERSION: Physical Folders v2.0`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log(`FATAL ERROR: Port ${SERVER_PORT} is already in use.`);
      } else {
        log(`SERVER ERROR: ${err.message}`);
      }
    });

  } catch (err) {
    log(`CRITICAL: Failed to start server: ${err.message}`);
  }
}

// Stop the embedded server
function stopServer() {
  if (server) {
    server.close();
    log('Embedded server stopped');
  }
}

function createWindow() {
  log('Welcome Back Momen');
  log('Starting embedded server and app...');
  startServer();
  log(`Your notes will be saved to: ${NOTES_BASE_DIR}`);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true,
    backgroundColor: '#121212',
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopServer();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopServer();
});

// IPC handlers
ipcMain.handle('shell:openPath', async (event, pathArg) => {
  return await shell.openPath(pathArg);
});

// Show note file in file explorer
ipcMain.handle('show-in-explorer', async (event, id) => {
  try {
    const { noteIdMap } = await scanFileSystem();
    if (noteIdMap.has(id)) {
      shell.showItemInFolder(noteIdMap.get(id));
      return { success: true };
    }
    return { success: false, error: 'Note not found' };
  } catch (error) {
    console.error('Error showing in explorer:', error);
    return { success: false, error: error.message };
  }
});

// Show folder in file explorer
ipcMain.handle('show-folder-in-explorer', async (event, id) => {
  try {
    const { folderIdMap } = await scanFileSystem();
    if (folderIdMap.has(id)) {
      await shell.openPath(folderIdMap.get(id));
      return { success: true };
    }
    return { success: false, error: 'Folder not found' };
  } catch (error) {
    console.error('Error showing folder in explorer:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getStartupLogs', () => {
  return startupLogs;
});

// Window controls for frameless window
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

