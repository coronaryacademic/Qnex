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

// Ensure base directory exists
fs.ensureDirSync(NOTES_BASE_DIR);
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'notes'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'folders'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'trash'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'settings'));

// Create Express server
function createServer() {
  const expressApp = express();
  
  // Configure CORS
  expressApp.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
  }));
  
  expressApp.use(express.json({ limit: '50mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper function to get safe file path
  function getSafeFilePath(basePath, filename) {
    const safeName = filename.replace(/[<>:"/\\|?*]/g, '_');
    return path.join(basePath, safeName);
  }

  // Helper to parse MD note
  async function readMdNote(filePath) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsed = matter(fileContent);
      
      return {
        ...parsed.data,
        contentHtml: parsed.content, // Plain text content from MD body
        id: parsed.data.id || path.basename(filePath, '.md') 
      };
    } catch (error) {
      console.error(`Error parsing MD file ${filePath}:`, error);
      return null;
    }
  }

  // Helper to sanitize filename
  function sanitizeFilename(title) {
    if (!title || title.trim() === '') return 'Untitled';
    return title
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
  }

  // Helper to convert HTML to Markdown
  function htmlToMarkdown(html) {
    if (!html) return '';
    
    let md = html;
    
    // Convert headings (h1-h6)
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
    
    // Convert bold
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    
    // Convert italic
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Convert code
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Convert links
    md = md.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Convert ordered lists (BEFORE unordered to avoid conflicts)
    md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1;
      const listItems = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (m, item) => {
        return `${counter++}. ${item.trim()}\n`;
      });
      return '\n' + listItems + '\n';
    });
    
    // Convert unordered lists
    md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const listItems = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (m, item) => {
        return `- ${item.trim()}\n`;
      });
      return '\n' + listItems + '\n';
    });
    
    // Convert blockquotes
    md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (match, content) => {
      return content.split('\n').map(line => '> ' + line).join('\n') + '\n\n';
    });
    
    // Convert line breaks
    md = md.replace(/<br\s*\/?>/gi, '\n');
    
    // Convert paragraphs
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    
    // Convert horizontal rules
    md = md.replace(/<hr\s*\/?>/gi, '\n---\n\n');
    
    // Remove remaining HTML tags
    md = md.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&#39;/g, "'");
    
    // Clean up extra whitespace
    md = md.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
    md = md.trim();
    
    return md;
  }

  // Helper to get unique file path (adds _2, _3, etc. if file exists)
  async function getUniqueFilePath(baseDir, filename) {
    const ext = '.md';
    let filePath = path.join(baseDir, `${filename}${ext}`);
    
    // If file doesn't exist, use it
    if (!await fs.pathExists(filePath)) {
      return filePath;
    }
    
    // File exists, try with numbers
    let counter = 2;
    while (await fs.pathExists(path.join(baseDir, `${filename}_${counter}${ext}`))) {
      counter++;
    }
    
    return path.join(baseDir, `${filename}_${counter}${ext}`);
  }

  // NOTES ENDPOINTS
  expressApp.get('/api/notes', async (req, res) => {
    try {
      const notesDir = path.join(NOTES_BASE_DIR, 'notes');
      const files = await fs.readdir(notesDir);
      const notes = [];
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(notesDir, file);
          const noteData = await readMdNote(filePath);
          if (noteData) {
            notes.push(noteData);
          }
        }
      }
      
      res.json(notes);
    } catch (error) {
      console.error('Error loading notes:', error);
      res.status(500).json({ error: 'Failed to load notes' });
    }
  });

  expressApp.delete('/api/notes', async (req, res) => {
    try {
      const notesDir = path.join(NOTES_BASE_DIR, 'notes');
      
      if (await fs.pathExists(notesDir)) {
        // Remove all note files
        const files = await fs.readdir(notesDir);
        for (const file of files) {
          if (file.endsWith('.md')) {
            await fs.remove(path.join(notesDir, file));
          }
        }
      }
      
      res.json({ success: true, message: 'All notes deleted successfully' });
    } catch (error) {
      console.error('Error deleting all notes:', error);
      res.status(500).json({ error: 'Failed to delete all notes' });
    }
  });

  expressApp.post('/api/backup', async (req, res) => {
    try {
      const backupData = {
        notes: [],
        folders: [],
        trash: [],
        settings: {},
        createdAt: new Date().toISOString()
      };
      
      // Load all data
      const notesDir = path.join(NOTES_BASE_DIR, 'notes');
      const foldersDir = path.join(NOTES_BASE_DIR, 'folders');
      const trashFile = path.join(NOTES_BASE_DIR, 'trash', 'trash.json');
      const settingsFile = path.join(NOTES_BASE_DIR, 'settings', 'settings.json');
      
      // Load notes
      if (await fs.pathExists(notesDir)) {
        const noteFiles = await fs.readdir(notesDir);
        for (const file of noteFiles) {
          if (file.endsWith('.md')) {
            const noteData = await readMdNote(path.join(notesDir, file));
            if (noteData) {
              backupData.notes.push(noteData);
            }
          }
        }
      }
      
      // Load folders
      if (await fs.pathExists(foldersDir)) {
        const folderFiles = await fs.readdir(foldersDir);
        for (const file of folderFiles) {
          if (file.endsWith('.json')) {
            const folderData = await fs.readJson(path.join(foldersDir, file));
            backupData.folders.push(folderData);
          }
        }
      }
      
      // Load trash
      if (await fs.pathExists(trashFile)) {
        backupData.trash = await fs.readJson(trashFile);
      }
      
      // Load settings
      if (await fs.pathExists(settingsFile)) {
        backupData.settings = await fs.readJson(settingsFile);
      }
      
      // Save backup file
      const backupDir = path.join(NOTES_BASE_DIR, 'backups');
      await fs.ensureDir(backupDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.json`;
      const backupFilePath = path.join(backupDir, backupFileName);
      
      await fs.writeJson(backupFilePath, backupData, { spaces: 2 });
      
      res.json({ 
        success: true, 
        message: 'Backup created successfully',
        backupFile: backupFileName,
        backupPath: backupFilePath
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ error: 'Failed to create backup' });
    }
  });

  expressApp.post('/api/notes/:noteId', async (req, res) => {
    try {
      const { noteId } = req.params;
      const noteData = req.body;
      
      // Extract contentHtml and convert to Markdown
      const { content, contentHtml, ...metadata } = noteData;
      
      // Ensure ID is in metadata
      if (!metadata.id) metadata.id = noteId;

      const notesDir = path.join(NOTES_BASE_DIR, 'notes');
      
      // ALWAYS use ID for filename to ensure perfect matching and avoid title-based mismatch
      const filePath = path.join(notesDir, `${noteId}.md`);
      
      // Convert HTML to proper Markdown syntax
      const markdownContent = htmlToMarkdown(contentHtml || content || '');
      
      // Create MD file with frontmatter (metadata) and Markdown body
      const fileContent = matter.stringify(markdownContent, metadata);
      
      await fs.writeFile(filePath, fileContent, 'utf8');
      
      console.log(`[EMBEDDED SERVER] Saved note: ${noteId}.md`);
      res.json({ success: true, message: 'Note saved successfully' });
    } catch (error) {
      console.error('Error saving note:', error);
      res.status(500).json({ error: 'Failed to save note' });
    }
  });


  expressApp.delete('/api/notes/:noteId', async (req, res) => {
    try {
      const { noteId } = req.params;
      const notesDir = path.join(NOTES_BASE_DIR, 'notes');
      console.log(`[EMBEDDED SERVER] DELETE request for note ID: ${noteId}`);
      
      // 1. Try direct ID-based path
      const directPath = path.join(notesDir, `${noteId}.md`);
      if (await fs.pathExists(directPath)) {
        await fs.remove(directPath);
        console.log(`[EMBEDDED SERVER] ✅ Deleted note via direct path: ${noteId}.md`);
        return res.json({ success: true, message: 'Note deleted successfully' });
      }

      // 2. Search for the file recursively by reading frontmatter
      console.log(`[EMBEDDED SERVER] Starting recursive search for ID: ${noteId}...`);
      const findAndDelete = async (dir) => {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);

          if (stats.isDirectory()) {
            if (await findAndDelete(filePath)) return true;
          } else if (file.endsWith('.md')) {
            try {
              const fileContent = await fs.readFile(filePath, 'utf8');
              const parsed = matter(fileContent);
              if (parsed.data.id === noteId) {
                console.log(`[EMBEDDED SERVER] ✅ Found matching note! Deleting: ${filePath}`);
                await fs.remove(filePath);
                return true;
              }
            } catch (e) {}
          }
        }
        return false;
      };

      if (await findAndDelete(notesDir)) {
        return res.json({ success: true, message: 'Note deleted successfully' });
      }
      
      res.json({ success: true, message: 'Note already deleted or not found' });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  // FOLDERS ENDPOINTS
  expressApp.get('/api/folders', async (req, res) => {
    try {
      const foldersDir = path.join(NOTES_BASE_DIR, 'folders');
      const files = await fs.readdir(foldersDir);
      const folders = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(foldersDir, file);
          const folderData = await fs.readJson(filePath);
          folders.push(folderData);
        }
      }
      
      res.json(folders);
    } catch (error) {
      console.error('Error loading folders:', error);
      res.status(500).json({ error: 'Failed to load folders' });
    }
  });

  expressApp.post('/api/folders', async (req, res) => {
    try {
      const folders = req.body;
      const foldersDir = path.join(NOTES_BASE_DIR, 'folders');
      
      // Clear existing folder files
      const existingFiles = await fs.readdir(foldersDir);
      for (const file of existingFiles) {
        if (file.endsWith('.json')) {
          await fs.remove(path.join(foldersDir, file));
        }
      }
      
      // Save each folder as a separate file
      for (const folder of folders) {
        const filePath = path.join(foldersDir, `${folder.id}.json`);
        await fs.writeJson(filePath, folder, { spaces: 2 });
      }
      
      res.json({ success: true, message: 'Folders saved successfully' });
    } catch (error) {
      console.error('Error saving folders:', error);
      res.status(500).json({ error: 'Failed to save folders' });
    }
  });

  // Delete a specific folder
  expressApp.delete('/api/folders/:folderId', async (req, res) => {
    try {
      const { folderId } = req.params;
      const metadataPath = path.join(NOTES_BASE_DIR, 'folders', `${folderId}.json`);
      const notesDir = path.join(NOTES_BASE_DIR, 'notes');
      
      console.log(`[EMBEDDED SERVER] DELETE request for folder ID: ${folderId}`);

      // 1. Reconstruct logical path to physical directory
      const loadAllFolders = async () => {
        const fDir = path.join(NOTES_BASE_DIR, 'folders');
        const files = await fs.readdir(fDir);
        const items = [];
        for (const file of files) {
          if (file.endsWith('.json')) items.push(await fs.readJson(path.join(fDir, file)));
        }
        return items;
      };

      const folders = await loadAllFolders();
      const folder = folders.find(f => f.id === folderId);
      
      if (folder) {
        const folderMap = new Map(folders.map(f => [f.id, f]));
        const getPhysicalPath = (fid) => {
          const segments = [];
          let cid = fid;
          while (cid) {
            const f = folderMap.get(cid);
            if (f) {
              segments.unshift(f.name.replace(/[<>:"/\\|?*]/g, '_'));
              cid = f.parentId;
            } else break;
          }
          return path.join(notesDir, ...segments);
        };

        const physicalPath = getPhysicalPath(folderId);
        if (await fs.pathExists(physicalPath)) {
          await fs.remove(physicalPath);
          console.log(`[EMBEDDED SERVER] ✅ Deleted physical folder: ${physicalPath}`);
        }
      }

      // 2. Delete metadata file
      if (await fs.pathExists(metadataPath)) {
        await fs.remove(metadataPath);
      }

      res.json({ success: true, message: 'Folder deleted successfully' });
    } catch (error) {
      console.error('Error deleting folder:', error);
      res.status(500).json({ error: 'Failed to delete folder' });
    }
  });

  // TRASH ENDPOINTS
  expressApp.get('/api/trash', async (req, res) => {
    try {
      const trashFile = path.join(NOTES_BASE_DIR, 'trash', 'trash.json');
      
      if (await fs.pathExists(trashFile)) {
        const trashData = await fs.readJson(trashFile);
        res.json(trashData);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error loading trash:', error);
      res.status(500).json({ error: 'Failed to load trash' });
    }
  });

  expressApp.post('/api/trash', async (req, res) => {
    try {
      const trashData = req.body;
      const trashFile = path.join(NOTES_BASE_DIR, 'trash', 'trash.json');
      
      await fs.writeJson(trashFile, trashData, { spaces: 2 });
      
      res.json({ success: true, message: 'Trash saved successfully' });
    } catch (error) {
      console.error('Error saving trash:', error);
      res.status(500).json({ error: 'Failed to save trash' });
    }
  });

  // Clear all trash
  expressApp.delete('/api/trash', async (req, res) => {
    try {
      const trashFile = path.join(NOTES_BASE_DIR, 'trash', 'trash.json');
      
      // Write empty array to clear all trash
      await fs.writeJson(trashFile, [], { spaces: 2 });
      
      res.json({ success: true, message: 'All trash cleared successfully' });
    } catch (error) {
      console.error('Error clearing trash:', error);
      res.status(500).json({ error: 'Failed to clear trash' });
    }
  });

  // SETTINGS ENDPOINTS
  expressApp.get('/api/settings', async (req, res) => {
    try {
      const settingsFile = path.join(NOTES_BASE_DIR, 'settings', 'settings.json');
      
      if (await fs.pathExists(settingsFile)) {
        const settings = await fs.readJson(settingsFile);
        res.json(settings);
      } else {
        const defaultSettings = {
          theme: 'light',
          foldersOpen: [],
          autoSave: true
        };
        res.json(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  expressApp.post('/api/settings', async (req, res) => {
    try {
      const settings = req.body;
      const settingsFile = path.join(NOTES_BASE_DIR, 'settings', 'settings.json');
      
      await fs.writeJson(settingsFile, settings, { spaces: 2 });
      
      res.json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // TASKS ENDPOINTS
  expressApp.get('/api/tasks', async (req, res) => {
    try {
      const tasksFile = path.join(NOTES_BASE_DIR, 'tasks', 'tasks.json');
      
      if (await fs.pathExists(tasksFile)) {
        const tasks = await fs.readJson(tasksFile);
        res.json(tasks);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      res.status(500).json({ error: 'Failed to load tasks' });
    }
  });

  expressApp.post('/api/tasks', async (req, res) => {
    try {
      const tasks = req.body;
      const tasksDir = path.join(NOTES_BASE_DIR, 'tasks');
      const tasksFile = path.join(tasksDir, 'tasks.json');
      
      await fs.ensureDir(tasksDir);
      await fs.writeJson(tasksFile, tasks, { spaces: 2 });
      
      res.json({ success: true, message: 'Tasks saved successfully' });
    } catch (error) {
      console.error('Error saving tasks:', error);
      res.status(500).json({ error: 'Failed to save tasks' });
    }
  });


  // Health check endpoint
  expressApp.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Electron file system server is running',
      baseDir: NOTES_BASE_DIR,
      timestamp: new Date().toISOString()
    });
  });

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
      log(`VERSION: Notes Engine v1.2 (ID-Based Fixed)`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log(`FATAL ERROR: Port ${SERVER_PORT} is already in use.`);
        log('Please close any other instances of the app or server.');
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

  // Start the embedded server first
  startServer();

  log(`Your notes will be saved to: ${NOTES_BASE_DIR}`);
  log('Checking dependencies... OK');
  log('Launching Electron app...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true, // Show immediately to see startup logs
    backgroundColor: '#121212', // Dark background to avoid white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Allow localhost requests
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png') // Add an icon if you have one
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopServer();
  });
}

// App event handlers
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

// Handle app quit
app.on('before-quit', () => {
  stopServer();
});

// IPC handlers
ipcMain.handle('shell:openPath', async (event, path) => {
  return await shell.openPath(path);
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getStartupLogs', () => {
  return startupLogs;
});
