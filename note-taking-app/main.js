const { app, BrowserWindow, ipcMain, Tray, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const http = require("http");
const handler = require("serve-handler");

// Track main window and tray
let mainWindow = null;
let tray = null;
let currentSettings = {};

// Define data directory on D: drive
const dataDir = path.join("D:", "MyNotes");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(path.join(dataDir, 'notes'), { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

// File paths
const FILES = {
  // notes: path.join(dataDir, "notes.json"), // Deprecated
  folders: path.join(dataDir, "folders.json"),
  settings: path.join(dataDir, "settings.json"),
  trash: path.join(dataDir, "trash.json"),
};

// Read file with fallback
async function readFile(filePath, defaultData = []) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    // File doesn't exist or is invalid, return default
    return defaultData;
  }
}

// Write file
async function writeFile(filePath, data) {
  try {
    const fileName = path.basename(filePath);
    console.log(`[SAVE] Saving ${fileName}...`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`[SAVED] ${fileName} saved successfully`);
    return { success: true };
  } catch (err) {
    console.error("[ERROR] Write error:", err);
    return { success: false, error: err.message };
  }
}

function createTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, "icon.png");
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open My Notes', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        if (mainWindow) {
          // Force quit
          mainWindow.destroy();
        }
        if (server) {
          server.close();
        }
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('My Notes');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// Create main window
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Disable disk cache to prevent permission warnings
      cache: false,
      // Allow Firebase authentication
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, "icon.png"), // optional: add app icon
  });

  // Allow opening external URLs (for Firebase auth)
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Firebase and Google auth URLs
    if (url.includes('accounts.google.com') || 
        url.includes('firebaseapp.com') || 
        url.includes('googleapis.com')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    }
    // Block other external URLs
    return { action: 'deny' };
  });

  // Intercept window close
  win.on('close', async (e) => {
    // Always prevent default close
    e.preventDefault();

    // Check settings for minimize to tray preference
    // Always read fresh settings from file to ensure we rely on latest state
    const settings = await readFile(FILES.settings, {});

    if (settings.minimizeToTray) {
      // Minimize/Hide to tray
      win.hide();
      
      // Ensure tray exists
      if (!tray) {
        createTray();
      }
    } else {
      // Ask renderer to show confirmation for full quit
      win.webContents.send('app-close-requested');
    }
  });

  // Load via localhost for Firebase auth
  win.loadURL('http://localhost:8080/index.html');

  // Open DevTools in development (remove for production)
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }
  
  return win;
}

// Import gray-matter
const matter = require('gray-matter');

// IPC Handlers for file operations
ipcMain.handle("read-notes", async () => {
  const notesDir = path.join(dataDir, 'notes');
  try {
    const files = await fs.readdir(notesDir);
    const notes = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        try {
          const content = await fs.readFile(path.join(notesDir, file), 'utf8');
          const parsed = matter(content);
          notes.push({
            ...parsed.data,
            contentHtml: parsed.content, // Map content back to contentHtml
            id: parsed.data.id || path.basename(file, '.md')
          });
        } catch (e) {
          console.error(`Error parsing note ${file}:`, e);
        }
      }
    }
    return notes;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error("Error reading notes directory:", err);
    return [];
  }
});

ipcMain.handle("delete-note", async (event, id) => {
  const notesDir = path.join(dataDir, 'notes');
  try {
    const filePath = path.join(notesDir, `${id}.md`);
    await fs.unlink(filePath);
    return { success: true };
  } catch (err) {
    if (err.code === 'ENOENT') return { success: true }; 
    console.error(`[ERROR] Delete note ${id} error:`, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("write-notes", async (event, data) => {
  const notesDir = path.join(dataDir, 'notes');
  try {
    await fs.mkdir(notesDir, { recursive: true });
    
    // 1. Get existing files to identify deletions
    let existingFiles = [];
    try {
      existingFiles = await fs.readdir(notesDir);
    } catch (e) {}
    
    const existingIds = existingFiles
        .filter(f => f.endsWith('.md'))
        .map(f => path.basename(f, '.md'));
        
    const newIds = data.map(n => n.id);
    
    // 2. Delete removed notes
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) {
        await fs.unlink(path.join(notesDir, `${id}.md`)).catch(console.error);
    }

    // 3. Write/Update notes
    for (const note of data) {
      const filePath = path.join(notesDir, `${note.id}.md`);
      // extract content to be body
      const { contentHtml, content, ...meta } = note;
      const body = contentHtml || content || '';
      
      const fileContent = matter.stringify(body, meta);
      await fs.writeFile(filePath, fileContent, 'utf8');
    }

    console.log(`[INFO] ${data.length} notes synced to Markdown files`);
    return { success: true };
  } catch (err) {
    console.error("[ERROR] Write notes error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("read-folders", async () => {
  return await readFile(FILES.folders, []);
});

ipcMain.handle("write-folders", async (event, data) => {
  const result = await writeFile(FILES.folders, data);
  if (result.success) {
    console.log(`[INFO] ${data.length} folder(s) in database`);
  }
  return result;
});

ipcMain.handle("read-settings", async () => {
  const settings = await readFile(FILES.settings, {});
  currentSettings = settings; // Cache settings on read
  return settings;
});

ipcMain.handle("write-settings", async (event, data) => {
  console.log("[SAVE] Writing settings to:", FILES.settings);
  const result = await writeFile(FILES.settings, data);
  if (result.success) {
    currentSettings = data; // Update cache
    if (data.todos) {
      console.log(`[SAVE] ${data.todos.length} todo(s) saved`);
    }
  }
  return result;
});

ipcMain.handle("read-trash", async () => {
  return await readFile(FILES.trash, []);
});

ipcMain.handle("write-trash", async (event, data) => {
  return await writeFile(FILES.trash, data);
});

ipcMain.handle("get-data-dir", async () => {
  return dataDir;
});

ipcMain.handle("open-data-directory", async () => {
  await shell.openPath(dataDir);
  return true;
});

// Handle close confirmation from renderer
ipcMain.on('app-close-confirmed', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Force close regardless of settings for "Close App" button
    mainWindow.destroy();
    mainWindow = null;
    
    // Close server and quit app
    if (server) {
      server.close();
    }
    app.quit();
  }
});

// Start local server for Firebase auth
let server;
function startLocalServer() {
  return new Promise((resolve) => {
    server = http.createServer((request, response) => {
      return handler(request, response, {
        public: __dirname
      });
    });
    
    server.listen(8080, () => {
      console.log("[SERVER] Running at http://localhost:8080");
      resolve();
    });
  });
}

// App lifecycle
app.whenReady().then(async () => {
  console.log("\n");

  await ensureDataDir();
  // Load settings immediately to have them ready
  currentSettings = await readFile(FILES.settings, {});
  
  await startLocalServer();
  console.log("[OK] Ready! Starting application...");
  console.log("Notes saved to:", dataDir);
  console.log("");
  mainWindow = createWindow();
  createTray(); // Initialize tray

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // If minimizing to tray is enabled, we don't quit here usually
  // But since we intercept close event, this might not even be reached unless we destroy window
  if (process.platform !== 'darwin' && (!currentSettings || !currentSettings.minimizeToTray)) {
    // app.quit(); // We rely on explicit quit
  }
});
