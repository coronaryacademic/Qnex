const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const matter = require('gray-matter');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 3001;

// Configure CORS to allow requests from any device on your local network
app.use(cors({
  origin: true, // Echoes the request origin, allowing credentials to work with dynamic IPs
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Base directory for notes on D drive
const NOTES_BASE_DIR = 'D:\\MyNotes';

// Ensure base directory exists
// system folders to ensure
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'trash'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'settings'));
fs.ensureDirSync(path.join(NOTES_BASE_DIR, 'questions'));
// notes, folders, images will be created on demand if needed, but not forced here

// Serve images statically
app.use('/api/images', express.static(path.join(NOTES_BASE_DIR, 'images')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0 AI mode integration',
    storage: NOTES_BASE_DIR
  });
});

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
    await fs.ensureDir(notesDir); // Ensure directory exists before reading
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
    res.status(500).json({ error: 'Failed to load notes', details: error.message });
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
    await fs.ensureDir(notesDir);

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

    // Use ID for filename to ensure perfect matching and avoid title-based mismatch
    const filePath = path.join(notesDir, `${noteId}.md`);

    // Convert HTML to proper Markdown syntax
    const markdownContent = htmlToMarkdown(contentHtml || content || '');

    // Create Markdown content with Frontmatter
    // Clean metadata to remove undefined values which cause js-yaml to crash
    const cleanMetadata = {};
    Object.keys(metadata).forEach(key => {
      if (metadata[key] !== undefined) cleanMetadata[key] = metadata[key];
    });

    const fileContent = matter.stringify(markdownContent, cleanMetadata);

    await fs.writeFile(filePath, fileContent, 'utf8');

    // Log for debugging
    console.log(`[SERVER] Saved note: ${noteId}.md`);

    res.json({ success: true, message: 'Note saved successfully' });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Batch save all notes (more efficient than individual saves)
app.post('/api/notes', async (req, res) => {
  try {
    const notes = req.body;

    if (!Array.isArray(notes)) {
      return res.status(400).json({ error: 'Expected an array of notes' });
    }

    const notesDir = path.join(NOTES_BASE_DIR, 'notes');
    await fs.ensureDir(notesDir);
    let savedCount = 0;
    let errors = [];

    for (const noteData of notes) {
      try {
        const { content, contentHtml, ...metadata } = noteData;

        // Ensure ID is in metadata
        if (!metadata.id) {
          errors.push({ note: noteData.title || 'Unknown', error: 'Missing ID' });
          continue;
        }

        const noteId = metadata.id;
        const filePath = path.join(notesDir, `${noteId}.md`);

        // Convert HTML to proper Markdown syntax
        const markdownContent = htmlToMarkdown(contentHtml || content || '');

        // Create Markdown content with Frontmatter
        // Clean metadata to remove undefined values which cause js-yaml to crash
        const cleanMetadata = {};
        Object.keys(metadata).forEach(key => {
          if (metadata[key] !== undefined) cleanMetadata[key] = metadata[key];
        });

        const fileContent = matter.stringify(markdownContent, cleanMetadata);

        await fs.writeFile(filePath, fileContent, 'utf8');
        savedCount++;
      } catch (error) {
        errors.push({ note: noteData.title || noteData.id, error: error.message });
      }
    }

    console.log(`[SERVER] Batch saved ${savedCount}/${notes.length} notes`);

    if (errors.length > 0) {
      console.warn(`[SERVER] Errors saving ${errors.length} notes:`, errors);
    }

    res.json({
      success: true,
      message: `Saved ${savedCount}/${notes.length} notes`,
      savedCount,
      totalCount: notes.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error batch saving notes:', error);
    res.status(500).json({ error: 'Failed to batch save notes' });
  }
});


// Delete a note
app.delete('/api/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const notesDir = path.join(NOTES_BASE_DIR, 'notes');
    console.log(`[SERVER] DELETE request for note ID: ${noteId}`);

    // 1. Try direct ID-based path
    const directPath = path.join(notesDir, `${noteId}.md`);
    console.log(`[SERVER] Checking direct path: ${directPath}`);
    if (await fs.pathExists(directPath)) {
      await fs.remove(directPath);
      console.log(`[SERVER] ✅ Deleted note via direct path: ${noteId}.md`);
      return res.json({ success: true, message: 'Note deleted successfully' });
    }

    // 2. Search for the file recursively by reading frontmatter
    console.log(`[SERVER] Note not found via direct path. Starting recursive search for ID: ${noteId}...`);

    const findAndDelete = async (dir) => {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          console.log(`[SERVER] Searching in subdirectory: ${file}`);
          if (await findAndDelete(filePath)) return true;
        } else if (file.endsWith('.md')) {
          try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const parsed = matter(fileContent);
            if (parsed.data.id === noteId) {
              console.log(`[SERVER] ✅ Found matching note! Deleting: ${filePath}`);
              await fs.remove(filePath);
              return true;
            }
          } catch (e) {
            console.warn(`[SERVER] ⚠️ Failed to read ${filePath}:`, e);
          }
        }
      }
      return false;
    };

    if (await findAndDelete(notesDir)) {
      return res.json({ success: true, message: 'Note deleted successfully' });
    }

    // If not found, still return success (idempotent)
    console.log(`[SERVER] ℹ️ Note ${noteId} not found on disk after recursive search.`);
    res.json({ success: true, message: 'Note already deleted or not found' });
  } catch (error) {
    console.error(`[SERVER] 🔴 Error deleting note ${noteId}:`, error);
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
    const metadataPath = path.join(NOTES_BASE_DIR, 'folders', `${folderId}.json`);
    const notesDir = path.join(NOTES_BASE_DIR, 'notes');

    console.log(`[SERVER] DELETE request for folder ID: ${folderId}`);

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
      console.log(`[SERVER] Attempting to delete physical folder: ${physicalPath}`);

      if (await fs.pathExists(physicalPath)) {
        await fs.remove(physicalPath);
        console.log(`[SERVER] ✅ Deleted physical folder: ${physicalPath}`);
      }
    }

    // 2. Delete metadata file
    if (await fs.pathExists(metadataPath)) {
      await fs.remove(metadataPath);
      console.log(`[SERVER] ✅ Deleted folder metadata: ${folderId}.json`);
    }

    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    console.error(`[SERVER] 🔴 Error deleting folder ${folderId}:`, error);
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


// QUESTIONS ENDPOINTS

// Get questions
app.get('/api/questions', async (req, res) => {
  try {
    const questionsFile = path.join(NOTES_BASE_DIR, 'questions', 'questions.json');

    if (await fs.pathExists(questionsFile)) {
      const questions = await fs.readJson(questionsFile);
      res.json(questions);
    } else {
      res.json({ questions: [], folders: [] });
    }
  } catch (error) {
    console.error('Error loading questions:', error);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

// Save questions
app.post('/api/questions', async (req, res) => {
  try {
    const data = req.body;
    const questionsDir = path.join(NOTES_BASE_DIR, 'questions');
    const questionsFile = path.join(questionsDir, 'questions.json');

    await fs.ensureDir(questionsDir);
    await fs.writeJson(questionsFile, data, { spaces: 2 });

    console.log(`[SERVER] Saved questions: ${data.questions?.length || 0} questions, ${data.folders?.length || 0} folders`);

    res.json({ success: true, message: 'Questions saved successfully' });
  } catch (error) {
    console.error('Error saving questions:', error);
    res.status(500).json({ error: 'Failed to save questions' });
  }
});

// STATISTICS ENDPOINTS
app.get('/api/stats', async (req, res) => {
  try {
    const statsFile = path.join(NOTES_BASE_DIR, 'settings', 'stats.json');
    if (await fs.pathExists(statsFile)) {
      const stats = await fs.readJson(statsFile);
      res.json(stats);
    } else {
      res.json({ correct: 0, incorrect: 0, omitted: 0, total: 0, totalTime: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.post('/api/stats', async (req, res) => {
  try {
    const { type, timeSpent = 0 } = req.body; // type: 'correct', 'incorrect', 'omitted'
    const statsDir = path.join(NOTES_BASE_DIR, 'settings');
    const statsFile = path.join(statsDir, 'stats.json');

    await fs.ensureDir(statsDir);
    let stats = { correct: 0, incorrect: 0, omitted: 0, total: 0, totalTime: 0 };

    if (await fs.pathExists(statsFile)) {
      stats = await fs.readJson(statsFile);
    }

    // Initialize missing fields if loading old stats
    if (stats.omitted === undefined) stats.omitted = 0;
    if (stats.totalTime === undefined) stats.totalTime = 0;

    stats.total++;
    stats.totalTime += timeSpent;

    if (type === 'correct') stats.correct++;
    else if (type === 'incorrect') stats.incorrect++;
    else if (type === 'omitted') stats.omitted++;
    // Legacy support for boolean isCorrect
    else if (req.body.isCorrect === true) stats.correct++;
    else if (req.body.isCorrect === false) stats.incorrect++;

    await fs.writeJson(statsFile, stats, { spaces: 2 });
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// AI LEARNING DATA ENDPOINT
app.get('/api/ai/learning-data', async (req, res) => {
  try {
    const questionsFile = path.join(NOTES_BASE_DIR, 'questions', 'questions.json');
    const statsFile = path.join(NOTES_BASE_DIR, 'settings', 'stats.json');

    let examples = [];
    let stats = { correct: 0, incorrect: 0, total: 0 };

    // 1. Get high-quality examples from saved questions
    if (await fs.pathExists(questionsFile)) {
      const data = await fs.readJson(questionsFile);
      if (data.questions && Array.isArray(data.questions)) {
        // Pick 3 random complete questions
        examples = data.questions
          .filter(q => q.text && q.options && q.options.length >= 2)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
      }
    }

    // 2. Get user performance stats
    if (await fs.pathExists(statsFile)) {
      stats = await fs.readJson(statsFile);
    }

    res.json({ examples, stats });
  } catch (error) {
    console.error('Error fetching learning data:', error);
    res.status(500).json({ error: 'Failed to load learning data' });
  }
});

// AI CHAT ENDPOINT (OpenRouter Proxy)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, max_tokens = 200, model } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;
    if (!API_KEY) {
      console.error('[AI] ERROR: OPENROUTER_API_KEY missing in .env');
      return res.status(500).json({
        error: 'AI API key not configured',
        details: 'The server is missing the OPENROUTER_API_KEY in the .env file. Please check server/.env'
      });
    }

    // Default to Trinity if no model specified
    const modelToUse = model || 'arcee-ai/trinity-large-preview:free';
    console.log(`[AI] Using model: ${modelToUse}`);
    console.log(`[AI] Request size: ${JSON.stringify(messages).length} chars, max_tokens: ${max_tokens}`);

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: modelToUse,
      messages: messages,
      max_tokens: max_tokens
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "Notes App Local"
      },
      timeout: 120000 // 2 minute timeout for slow models
    });

    console.log(`[AI] Response received from ${modelToUse}`);
    res.json(response.data);
  } catch (error) {
    console.error('AI Proxy Error:', {
      model: req.body.model,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    // Return detailed error to frontend
    res.status(error.response?.status || 500).json({
      error: 'Failed to get response from AI',
      details: error.response?.data || error.message,
      model: req.body.model,
      errorType: error.code // ECONNABORTED = timeout, etc.
    });
  }
});

// IMAGE UPLOAD ENDPOINT
app.post('/api/upload', async (req, res) => {
  try {
    const { image, name } = req.body; // Expecting base64 string and filename
    if (!image || !name) {
      return res.status(400).json({ error: 'Missing image data or name' });
    }

    // Strip header if present (e.g., "data:image/png;base64,")
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const imagesDir = path.join(NOTES_BASE_DIR, 'images');
    await fs.ensureDir(imagesDir);

    // Generate unique name if needed to avoid overwriting
    const ext = path.extname(name) || '.png';
    const baseName = path.basename(name, ext);
    let finalName = name;
    let counter = 1;

    while (await fs.pathExists(path.join(imagesDir, finalName))) {
      finalName = `${baseName}_${counter++}${ext}`;
    }

    const filePath = path.join(imagesDir, finalName);
    await fs.writeFile(filePath, buffer);

    console.log(`[SERVER] Uploaded image: ${finalName}`);

    res.json({
      success: true,
      url: `/api/images/${finalName}`,
      filename: finalName
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});


// Start server
// Start server
const serverInstance = app.listen(PORT, '0.0.0.0', () => {
  console.log('==================================================');
  console.log(`[${new Date().toLocaleTimeString()}] NOTES SERVER UPDATED (v3.0 AI mode integration)`);
  console.log(`Running on http://0.0.0.0:${PORT} (Accessible on your local network)`);
  console.log(`Storage: ${NOTES_BASE_DIR}`);
  if (process.env.OPENROUTER_API_KEY) {
    console.log(`[OK] AI PROXY CONNECTED (Key: ${process.env.OPENROUTER_API_KEY.substring(0, 8)}...)`);
  } else {
    console.warn(`[WARNING] AI PROXY DISABLED (OPENROUTER_API_KEY missing in .env)`);
  }
  console.log('==================================================');
  console.log('Available endpoints:');
  console.log('  GET  /api/health - Health check');
  console.log('  POST /api/ai/chat - AI Chat Proxy (OpenRouter)');
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

// Handle server errors
serverInstance.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use!`);
    console.error(`Please close any existing command prompt windows running the server.`);
    console.error(`If you cannot find the window, restart your computer or kill the 'node' process.\n`);
  } else {
    console.error('\n[ERROR] Failed to start server:', err);
  }
  process.exit(1);
});

module.exports = app;
