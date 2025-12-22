const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const matter = require('gray-matter');

const app = express();
const PORT = 3001;

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:8080'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Base directory for notes on D drive
const NOTES_BASE_DIR = 'D:\\MyNotes';

// Ensure base directory exists
fs.ensureDirSync(NOTES_BASE_DIR);
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'notes'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'folders'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'trash'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'settings'));

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

// Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const notesDir = path.join(NOTES_BASE_DIR, 'notes');
    const files = await fs.readdir(notesDir);
    const notes = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) { // Changed from .json to .md
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

// Save a single note
app.post('/api/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const noteData = req.body;
    
    // Separate content from metadata
    // The frontend sends contentHtml, convert it to Markdown
    const { content, contentHtml, ...metadata } = noteData;
    
    // Ensure ID is in metadata
    if (!metadata.id) metadata.id = noteId;

    const notesDir = path.join(NOTES_BASE_DIR, 'notes');
    
    // Check if this note already exists (find by ID in frontmatter)
    let existingFilePath = null;
    try {
      const files = await fs.readdir(notesDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(notesDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const parsed = matter(fileContent);
          
          // If this file has the same ID, update it
          if (parsed.data.id === noteId) {
            existingFilePath = filePath;
            break;
          }
        }
      }
    } catch (err) {
      // Directory doesn't exist yet, will be created
    }
    
    let filePath;
    if (existingFilePath) {
      // Update existing file
      filePath = existingFilePath;
    } else {
      // New note - use title for filename
      const filename = sanitizeFilename(noteData.title || noteId);
      filePath = await getUniqueFilePath(notesDir, filename);
    }
    
    // Convert HTML to proper Markdown syntax
    const markdownContent = htmlToMarkdown(contentHtml || content || '');
    
    // Create Markdown content with Frontmatter
    const fileContent = matter.stringify(markdownContent, metadata);
    
    await fs.writeFile(filePath, fileContent, 'utf8');
    
    res.json({ success: true, message: 'Note saved successfully' });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Delete a note
app.delete('/api/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const filePath = path.join(NOTES_BASE_DIR, 'notes', `${noteId}.md`); // Changed to .md
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      res.json({ success: true, message: 'Note deleted successfully' });
    } else {
      res.status(404).json({ error: 'Note not found' });
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// FOLDERS ENDPOINTS (Kept as JSON for structure metadata)

// Get all folders
app.get('/api/folders', async (req, res) => {
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

// Save folders
app.post('/api/folders', async (req, res) => {
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

// Delete a folder
app.delete('/api/folders/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    const filePath = path.join(NOTES_BASE_DIR, 'folders', `${folderId}.json`);
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      res.json({ success: true, message: 'Folder deleted successfully' });
    } else {
      res.status(404).json({ error: 'Folder not found' });
    }
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// TRASH ENDPOINTS

// Get trash items
app.get('/api/trash', async (req, res) => {
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

// Save trash items
app.post('/api/trash', async (req, res) => {
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
app.delete('/api/trash', async (req, res) => {
  try {
    const trashFile = path.join(NOTES_BASE_DIR, 'trash', 'trash.json');
    
    if (await fs.pathExists(trashFile)) {
      await fs.remove(trashFile);
    }
    
    res.json({ success: true, message: 'Trash cleared successfully' });
  } catch (error) {
    console.error('Error clearing trash:', error);
    res.status(500).json({ error: 'Failed to clear trash' });
  }
});

// Delete all notes
app.delete('/api/notes', async (req, res) => {
  try {
    const notesDir = path.join(NOTES_BASE_DIR, 'notes');
    
    if (await fs.pathExists(notesDir)) {
      // Remove all note files
      const files = await fs.readdir(notesDir);
      for (const file of files) {
        if (file.endsWith('.md')) { // Changed to .md
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

// Create full backup
app.post('/api/backup', async (req, res) => {
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
        if (file.endsWith('.md')) { // Changed to .md
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

// SETTINGS ENDPOINTS

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    const settingsFile = path.join(NOTES_BASE_DIR, 'settings', 'settings.json');
    
    if (await fs.pathExists(settingsFile)) {
      const settings = await fs.readJson(settingsFile);
      res.json(settings);
    } else {
      // Return default settings
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

// Save settings
app.post('/api/settings', async (req, res) => {
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

// FILE STRUCTURE ENDPOINT (for sidebar)
app.get('/api/file-structure', async (req, res) => {
  try {
    const structure = {
      folders: [],
      notes: []
    };
    
    // Get folders
    const foldersDir = path.join(NOTES_BASE_DIR, 'folders');
    if (await fs.pathExists(foldersDir)) {
      const folderFiles = await fs.readdir(foldersDir);
      for (const file of folderFiles) {
        if (file.endsWith('.json')) {
          const folderData = await fs.readJson(path.join(foldersDir, file));
          structure.folders.push(folderData);
        }
      }
    }
    
    // Get notes
    const notesDir = path.join(NOTES_BASE_DIR, 'notes');
    if (await fs.pathExists(notesDir)) {
      const noteFiles = await fs.readdir(notesDir);
      for (const file of noteFiles) {
        if (file.endsWith('.md')) { // Changed to .md
          const noteData = await readMdNote(path.join(notesDir, file));
          if (noteData) {
            structure.notes.push({
              id: noteData.id,
              title: noteData.title,
              folderId: noteData.folderId || null,
              createdAt: noteData.createdAt,
              updatedAt: noteData.updatedAt
            });
          }
        }
      }
    }
    
    res.json(structure);
  } catch (error) {
    console.error('Error getting file structure:', error);
    res.status(500).json({ error: 'Failed to get file structure' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'File system server is running',
    baseDir: NOTES_BASE_DIR,
    timestamp: new Date().toISOString()
  });
});

// TASKS ENDPOINTS

// Get tasks
app.get('/api/tasks', async (req, res) => {
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

// Save tasks
app.post('/api/tasks', async (req, res) => {
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


// Start server
app.listen(PORT, () => {
  console.log(`Notes file system server running on http://localhost:${PORT}`);
  console.log(`Base directory: ${NOTES_BASE_DIR}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health - Health check');
  console.log('  GET  /api/notes - Get all notes (MD supported)');
  console.log('  POST /api/notes/:noteId - Save a note (as MD)');
  console.log('  DELETE /api/notes/:noteId - Delete a note');
  console.log('  GET  /api/folders - Get all folders');
  console.log('  POST /api/folders - Save folders');
  console.log('  DELETE /api/folders/:folderId - Delete a folder');
  console.log('  GET  /api/trash - Get trash items');
  console.log('  POST /api/trash - Save trash items');
  console.log('  DELETE /api/trash - Clear all trash');
  console.log('  GET  /api/settings - Get settings');
  console.log('  POST /api/settings - Save settings');
  console.log('  GET  /api/file-structure - Get file structure for sidebar');
});

module.exports = app;
