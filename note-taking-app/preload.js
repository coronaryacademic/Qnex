const { contextBridge, ipcRenderer } = require('electron');

console.log("[PRELOAD] Initializing Electron API exposure...");

try {
  // Expose file system API to renderer process
  contextBridge.exposeInMainWorld('electronAPI', {
    // Notes
    readNotes: () => ipcRenderer.invoke('read-notes'),
    writeNotes: (data) => ipcRenderer.invoke('write-notes', data),
    deleteNote: (id) => ipcRenderer.invoke('delete-note', id),

    // Folders
    readFolders: () => ipcRenderer.invoke('read-folders'),
    writeFolders: (data) => ipcRenderer.invoke('write-folders', data),
    deleteFolder: (id) => ipcRenderer.invoke('delete-folder', id),

    // Settings
    readSettings: () => ipcRenderer.invoke('read-settings'),
    writeSettings: (data) => ipcRenderer.invoke('write-settings', data),

    // Trash
    readTrash: () => ipcRenderer.invoke('read-trash'),
    writeTrash: (data) => ipcRenderer.invoke('write-trash', data),

    // Questions
    readQuestions: () => ipcRenderer.invoke('read-questions'),
    writeQuestions: (data) => ipcRenderer.invoke('write-questions', data),

    // Utility
    getDataDir: () => ipcRenderer.invoke('get-data-dir'),
    openDataDirectory: () => ipcRenderer.invoke('open-data-directory'),
    showInExplorer: (id) => ipcRenderer.invoke('show-in-explorer', id),
    showFolderInExplorer: (id) => ipcRenderer.invoke('show-folder-in-explorer', id),

    // Window close handling
    onAppCloseRequested: (callback) => ipcRenderer.on('app-close-requested', callback),
    confirmAppClose: () => ipcRenderer.send('app-close-confirmed'),

    // Check if running in Electron
    isElectron: true,
  });
  console.log("[PRELOAD] electronAPI exposed successfully");
} catch (error) {
  console.error("[PRELOAD] Failed to expose electronAPI:", error);
}
