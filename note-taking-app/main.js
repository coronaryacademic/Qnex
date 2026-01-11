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
  questions: path.join(dataDir, "questions.json"),
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
  console.log(`[IPC] delete-note requested for ID: ${id}`);
  try {
    // 1. Try direct ID-based path (fastest)
    const idPath = path.join(notesDir, `${id}.md`);
    console.log(`[IPC] Checking for direct note path: ${idPath}`);
    if (await fs.stat(idPath).then(() => true).catch(() => false)) {
      await fs.unlink(idPath);
      console.log(`[IPC] ✅ Deleted note file via direct path: ${id}.md`);
      return { success: true };
    }

    // 2. Search for the file in the entire notes directory (including subdirectories)
    console.log(`[IPC] Note not found via direct path. Starting recursive search for ID: ${id}...`);
    const findAndDelete = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          console.log(`[IPC] Searching in subdirectory: ${entry.name}`);
          if (await findAndDelete(fullPath)) return true;
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const parsed = matter(content);
            if (parsed.data.id === id) {
              console.log(`[IPC] ✅ Found matching note! Deleting: ${fullPath}`);
              await fs.unlink(fullPath);
              return true;
            }
          } catch (e) {
            console.warn(`[IPC] ⚠️ Failed to read ${fullPath} during search:`, e);
          }
        }
      }
      return false;
    };

    if (await findAndDelete(notesDir)) {
      console.log(`[IPC] ✅ Successfully found and deleted note ${id} during search.`);
      return { success: true };
    }

    console.warn(`[IPC] ❌ Note ${id} NOT found on disk after full search.`);
    return { success: true }; // Return success even if not found (idempotent)
  } catch (err) {
    console.error(`[IPC] 🔴 Error during delete-note ${id}:`, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("write-notes", async (event, data) => {
  const notesDir = path.join(dataDir, 'notes');
  console.log(`[IPC] write-notes called with ${data.length} notes`);

  try {
    await fs.mkdir(notesDir, { recursive: true });

    // 1. Get all folders to reconstruct paths
    const folders = await readFile(FILES.folders, []);
    const folderMap = new Map(folders.map(f => [f.id, f]));

    const getFolderPath = (folderId) => {
      const pathSegments = [];
      let currentId = folderId;
      while (currentId) {
        const folder = folderMap.get(currentId);
        if (folder) {
          // Use name for path, sanitized
          const safeName = (folder.name || 'Untitled').replace(/[<>:"/\\|?*]/g, '_');
          pathSegments.unshift(safeName);
          currentId = folder.parentId;
        } else {
          break;
        }
      }
      return path.join(notesDir, ...pathSegments);
    };

    // 2. Map notes to intended paths
    const notePathMap = new Map();
    for (const note of data) {
      if (!note.id) continue;
      const dirPath = note.folderId ? getFolderPath(note.folderId) : notesDir;
      const fileName = `${note.id}.md`;
      notePathMap.set(note.id, path.join(dirPath, fileName));
    }

    // 3. Write/Update notes and create directories
    for (const note of data) {
      if (!note.id) continue;
      const filePath = notePathMap.get(note.id);
      const dirPath = path.dirname(filePath);

      await fs.mkdir(dirPath, { recursive: true });

      const { contentHtml, content, ...meta } = note;
      const body = contentHtml || content || '';
      const fileContent = matter.stringify(body, meta);

      await fs.writeFile(filePath, fileContent, 'utf8');
    }

    // 4. Cleanup orphaned files and empty directories
    const cleanup = async (currentDir) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await cleanup(fullPath);
          // Delete directory if empty
          const remaining = await fs.readdir(fullPath);
          if (remaining.length === 0) {
            await fs.rmdir(fullPath);
            console.log(`[IPC] Cleaned up empty directory: ${fullPath}`);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Check if this file is in our new notePathMap
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const parsed = matter(content);
            const noteId = parsed.data.id || path.basename(entry.name, '.md');

            const intendedPath = notePathMap.get(noteId);
            // If the note doesn't exist in the current collection, or is in the wrong place
            if (!intendedPath || path.resolve(intendedPath) !== path.resolve(fullPath)) {
              await fs.unlink(fullPath);
              console.log(`[IPC] Cleaned up orphaned/misplaced note: ${fullPath}`);
            }
          } catch (e) {
            console.warn(`[IPC] Failed to verify ${fullPath} during cleanup:`, e);
          }
        }
      }
    };

    await cleanup(notesDir);

    console.log(`[INFO] ${data.length} notes synced successfully to disk`);
    return { success: true };
  } catch (err) {
    console.error("[ERROR] Write notes sync error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("read-folders", async () => {
  return await readFile(FILES.folders, []);
});

ipcMain.handle("write-folders", async (event, data) => {
  const result = await writeFile(FILES.folders, data);
  if (result.success) {
    console.log(`[INFO] ${data.length} folder(s) saved to folders.json`);
  }
  return result;
});

ipcMain.handle("delete-folder", async (event, id) => {
  console.log(`[IPC] delete-folder requested for: ${id}`);
  const notesDir = path.join(dataDir, 'notes');

  try {
    const folders = await readFile(FILES.folders, []);
    const folder = folders.find(f => f.id === id);

    if (folder) {
      console.log(`[IPC] Reconstructing path for folder: "${folder.name}" (${id})`);
      // Reconstruct intended directory path
      const folderMap = new Map(folders.map(f => [f.id, f]));
      const getFolderPath = (fid) => {
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

      const dirPath = getFolderPath(id);
      console.log(`[IPC] Targeted physical path for deletion: ${dirPath}`);
      if (await fs.stat(dirPath).then(s => s.isDirectory()).catch(() => false)) {
        await fs.rm(dirPath, { recursive: true, force: true });
        console.log(`[IPC] ✅ Successfully deleted physical folder: ${dirPath}`);
      } else {
        console.log(`[IPC] ℹ️ Physical folder does not exist at path: ${dirPath}`);
      }
    } else {
      console.warn(`[IPC] ⚠️ Folder ${id} not found in folders.json metadata.`);
    }

    return { success: true };
  } catch (err) {
    console.error(`[IPC] 🔴 Delete folder ${id} error:`, err);
    return { success: false, error: err.message };
  }
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

ipcMain.handle("read-questions", async () => {
  return await readFile(FILES.questions, []);
});

ipcMain.handle("write-questions", async (event, data) => {
  return await writeFile(FILES.questions, data);
});

ipcMain.handle("get-data-dir", async () => {
  return dataDir;
});

ipcMain.handle("open-data-directory", async () => {
  await shell.openPath(dataDir);
  return true;
});

ipcMain.handle("show-in-explorer", async (event, id) => {
  const notesDir = path.join(dataDir, 'notes');
  console.log(`[IPC] show-in-explorer requested for ID: ${id}`);

  try {
    // 1. Try direct ID-based path first
    const idPath = path.join(notesDir, `${id}.md`);
    if (await fs.stat(idPath).then(() => true).catch(() => false)) {
      shell.showItemInFolder(idPath);
      return { success: true };
    }

    // 2. Search recursively
    const findAndShow = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (await findAndShow(fullPath)) return true;
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const parsed = matter(content);
            if (parsed.data.id === id) {
              shell.showItemInFolder(fullPath);
              return true;
            }
          } catch (e) { }
        }
      }
      return false;
    };

    if (await findAndShow(notesDir)) return { success: true };

    // 3. Last fallback: just open the notes directory
    shell.openPath(notesDir);
    return { success: true };
  } catch (err) {
    console.error("[IPC] show-in-explorer error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("show-folder-in-explorer", async (event, id) => {
  const notesDir = path.join(dataDir, 'notes');
  console.log(`[IPC] show-folder-in-explorer requested for: ${id}`);

  try {
    const folders = await readFile(FILES.folders, []);
    const folder = folders.find(f => f.id === id);

    if (folder) {
      const folderMap = new Map(folders.map(f => [f.id, f]));
      const segments = [];
      let cid = id;
      while (cid) {
        const f = folderMap.get(cid);
        if (f) {
          segments.unshift(f.name.replace(/[<>:"/\\|?*]/g, '_'));
          cid = f.parentId;
        } else break;
      }
      const dirPath = path.join(notesDir, ...segments);

      // Ensure directory exists before opening
      await fs.mkdir(dirPath, { recursive: true });
      shell.openPath(dirPath);
      return { success: true };
    } else if (id === "" || id === null || id === "uncategorized") {
      shell.openPath(notesDir);
      return { success: true };
    }
  } catch (err) {
    console.error("[IPC] show-folder-in-explorer error:", err);
    return { success: false, error: err.message };
  }
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
