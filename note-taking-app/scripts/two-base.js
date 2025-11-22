// Two-Base Architecture: Main Base (Workspace) and Note Base (Editor)
// This module handles the navigation between browsing (workspace) and editing (note base)

(function() {
  'use strict';

  // State management for two-base system
  window.TwoBaseState = {
    currentBase: 'main', // 'main' or 'note'
    currentFolder: null, // Currently browsing folder ID
    breadcrumb: [], // Navigation path [{ id, name }]
    openNotes: [], // Note IDs open in Note Base
    activeNote: null, // Currently active note ID in Note Base
    splitView: false, // Whether split view is active
    leftPaneNote: null, // Note ID in left pane
    rightPaneNote: null, // Note ID in right pane
    viewMode: 'grid', // 'grid' or 'list'
    sortOrder: 'asc', // 'asc' or 'desc'
    multiSelectMode: false, // Whether multi-select is enabled
    selectedItems: [], // Selected item IDs in multi-select mode
  };

  // DOM Elements
  const el = {
    // Main Base
    workspaceSplit: null,
    workspaceContent: null,
    breadcrumbBack: null,
    breadcrumbPath: null,
    viewOptionsBtn: null,
    
    // Note Base
    noteBase: null,
    backToMain: null,
    noteTabs: null,
    noteEditors: null,
    splitNoteBtn: null,
    notePaneLeft: null,
    notePaneRight: null,
    noteResizer: null,
  };

  // Initialize DOM elements
  function initElements() {
    el.workspaceSplit = document.getElementById('workspaceSplit');
    el.workspaceContent = document.getElementById('workspaceContent');
    el.breadcrumbBack = document.getElementById('breadcrumbBack');
    el.breadcrumbPath = document.getElementById('breadcrumbPath');
    el.viewOptionsBtn = document.getElementById('viewOptionsBtn');
    
    el.noteBase = document.getElementById('noteBase');
    el.backToMain = document.getElementById('backToMain');
    el.noteTabs = document.getElementById('noteTabs');
    el.noteEditors = document.getElementById('noteEditors');
    el.splitNoteBtn = document.getElementById('splitNoteBtn');
    el.notePaneLeft = document.getElementById('notePane-left');
    el.notePaneRight = document.getElementById('notePane-right');
    el.noteResizer = document.getElementById('noteResizer');
  }

  // ===================================
  // MAIN BASE: Workspace Functions
  // ===================================

  function renderWorkspaceSplit(folderId = null) {
    TwoBaseState.currentFolder = folderId;
    
    // Update breadcrumb
    renderBreadcrumb();
    
    // Render folder contents or root view
    if (folderId) {
      renderFolderContents(folderId);
    } else {
      renderRootView();
    }
  }

  function renderBreadcrumb() {
    const { currentFolder } = TwoBaseState;
    
    if (!currentFolder) {
      el.breadcrumbPath.textContent = 'All Notes';
      el.breadcrumbBack.style.display = 'none';
      
      // Update sidebar header
      const sidebarHeader = document.querySelector('.sidebar-header .muted');
      if (sidebarHeader) {
        sidebarHeader.textContent = 'All Notes';
      }
    } else {
      const folder = state.folders.find(f => f.id === currentFolder);
      const folderName = folder ? folder.name : 'Unknown Folder';
      el.breadcrumbPath.textContent = folderName;
      el.breadcrumbBack.style.display = 'flex';
      
      // Update sidebar header
      const sidebarHeader = document.querySelector('.sidebar-header .muted');
      if (sidebarHeader) {
        sidebarHeader.textContent = folderName;
      }
    }
  }

  function renderRootView() {
    const grid = document.createElement('div');
    grid.className = TwoBaseState.viewMode === 'list' ? 'workspace-list' : 'workspace-grid';
    
    // Get root folders (no parent)
    let rootFolders = state.folders.filter(f => !f.parentId);
    
    // Get notes without folder
    let rootNotes = state.notes.filter(n => !n.folderId);
    
    // Apply sorting
    if (TwoBaseState.sortOrder === 'asc') {
      rootFolders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      rootNotes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      rootFolders.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      rootNotes.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    }
    
    // Render folders first
    rootFolders.forEach(folder => {
      grid.appendChild(createFolderItem(folder));
    });
    
    // Then render notes
    rootNotes.forEach(note => {
      grid.appendChild(createNoteItem(note));
    });
    
    el.workspaceContent.innerHTML = '';
    
    if (rootFolders.length === 0 && rootNotes.length === 0) {
      el.workspaceContent.innerHTML = `
        <div class="workspace-empty">
          <div class="workspace-empty-icon">📝</div>
          <div class="workspace-empty-text">No notes or folders yet</div>
        </div>
      `;
    } else {
      el.workspaceContent.appendChild(grid);
    }
  }

  function renderFolderContents(folderId) {
    const grid = document.createElement('div');
    grid.className = TwoBaseState.viewMode === 'list' ? 'workspace-list' : 'workspace-grid';
    
    // Get subfolders
    let subfolders = state.folders.filter(f => f.parentId === folderId);
    
    // Get notes in this folder
    let folderNotes = state.notes.filter(n => n.folderId === folderId);
    
    // Apply sorting
    if (TwoBaseState.sortOrder === 'asc') {
      subfolders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      folderNotes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      subfolders.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      folderNotes.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    }
    
    // Render subfolders first
    subfolders.forEach(folder => {
      grid.appendChild(createFolderItem(folder));
    });
    
    // Then render notes
    folderNotes.forEach(note => {
      grid.appendChild(createNoteItem(note));
    });
    
    el.workspaceContent.innerHTML = '';
    
    if (subfolders.length === 0 && folderNotes.length === 0) {
      el.workspaceContent.innerHTML = `
        <div class="workspace-empty">
          <div class="workspace-empty-icon">📁</div>
          <div class="workspace-empty-text">This folder is empty</div>
        </div>
      `;
    } else {
      el.workspaceContent.appendChild(grid);
    }
  }

  function createFolderItem(folder) {
    const item = document.createElement('div');
    item.className = 'workspace-item folder';
    item.dataset.folderId = folder.id;
    
    const icon = getIcon('folder');
    
    item.innerHTML = `
      <div class="workspace-item-icon">${icon}</div>
      <div class="workspace-item-title">${escapeHtml(folder.name)}</div>
      <div class="workspace-item-meta">Folder</div>
    `;
    
    item.addEventListener('click', () => navigateToFolder(folder.id));
    
    return item;
  }

  function createNoteItem(note) {
    const item = document.createElement('div');
    item.className = 'workspace-item note';
    item.dataset.noteId = note.id;
    
    const icon = getIcon('default');
    const date = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : '';
    
    item.innerHTML = `
      <div class="workspace-item-icon">${icon}</div>
      <div class="workspace-item-title">${escapeHtml(note.title || 'Untitled')}</div>
      <div class="workspace-item-meta">${date}</div>
    `;
    
    item.addEventListener('click', () => openNoteFromWorkspace(note.id));
    
    return item;
  }

  function navigateToFolder(folderId) {
    renderWorkspaceSplit(folderId);
  }

  function navigateBack() {
    const currentFolder = state.folders.find(f => f.id === TwoBaseState.currentFolder);
    const parentId = currentFolder ? currentFolder.parentId : null;
    renderWorkspaceSplit(parentId);
  }

  function openNoteFromWorkspace(noteId) {
    switchToNoteBase();
    openNoteInNoteBase(noteId);
  }

  // ===================================
  // NOTE BASE: Editor Functions
  // ===================================

  function switchToNoteBase() {
    TwoBaseState.currentBase = 'note';
    el.workspaceSplit.style.display = 'none';
    el.noteBase.classList.remove('hidden');
  }

  function switchToMainBase() {
    TwoBaseState.currentBase = 'main';
    el.noteBase.classList.add('hidden');
    el.workspaceSplit.style.display = 'flex';
    
    // Refresh workspace in case notes were edited
    renderWorkspaceSplit(TwoBaseState.currentFolder);
  }

  function openNoteInNoteBase(noteId) {
    // Check if note is already open
    const existingIndex = TwoBaseState.openNotes.indexOf(noteId);
    if (existingIndex !== -1) {
      // Just activate the existing tab
      switchActiveNote(noteId);
      return;
    }
    
    // Add to open notes
    TwoBaseState.openNotes.push(noteId);
    TwoBaseState.activeNote = noteId;
    
    // Render tabs and editor
    renderNoteTabs();
    renderNoteEditor(noteId);
  }

  function renderNoteTabs() {
    el.noteTabs.innerHTML = '';
    
    TwoBaseState.openNotes.forEach(noteId => {
      const note = state.notes.find(n => n.id === noteId);
      if (!note) return;
      
      const tab = document.createElement('div');
      tab.className = 'note-tab' + (noteId === TwoBaseState.activeNote ? ' active' : '');
      tab.dataset.noteId = noteId;
      
      tab.innerHTML = `
        <span class="note-tab-title">${escapeHtml(note.title || 'Untitled')}</span>
        <span class="note-tab-close">×</span>
      `;
      
      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('note-tab-close')) {
          closeNoteTab(noteId);
        } else {
          switchActiveNote(noteId);
        }
      });
      
      el.noteTabs.appendChild(tab);
    });
  }

  function renderNoteEditor(noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    // Clear pane content
    const paneContent = el.notePaneLeft.querySelector('.note-pane-content');
    paneContent.innerHTML = '';
    
    // buildEditor returns a DOM node, so we need to append it
    if (typeof window.buildEditor === 'function') {
      const editorNode = window.buildEditor(note);
      paneContent.appendChild(editorNode);
    }
    
    // Populate toolbar in note header
    populateNoteToolbar();
  }
  
  function populateNoteToolbar() {
    const toolbar = document.getElementById('noteToolbar');
    if (!toolbar) return;
    
    toolbar.innerHTML = `
      <button class="icon-btn" data-action="bold" title="Bold (Ctrl+B)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        </svg>
      </button>
      <button class="icon-btn" data-action="italic" title="Italic (Ctrl+I)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="4" x2="10" y2="4"></line>
          <line x1="14" y1="20" x2="5" y2="20"></line>
          <line x1="15" y1="4" x2="9" y2="20"></line>
        </svg>
      </button>
      <button class="icon-btn" data-action="underline" title="Underline (Ctrl+U)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
          <line x1="4" y1="21" x2="20" y2="21"></line>
        </svg>
      </button>
      <div style="width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem;"></div>
      <button class="icon-btn" data-action="h1" title="Heading 1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12h8"></path>
          <path d="M4 18V6"></path>
          <path d="M12 18V6"></path>
          <path d="M17 12h4"></path>
          <path d="M19 6v12"></path>
        </svg>
      </button>
      <button class="icon-btn" data-action="h2" title="Heading 2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12h8"></path>
          <path d="M4 18V6"></path>
          <path d="M12 18V6"></path>
          <path d="M20 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"></path>
        </svg>
      </button>
      <div style="width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem;"></div>
      <button class="icon-btn" data-action="ul" title="Bullet List">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
      <button class="icon-btn" data-action="ol" title="Numbered List">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="10" y1="6" x2="21" y2="6"></line>
          <line x1="10" y1="12" x2="21" y2="12"></line>
          <line x1="10" y1="18" x2="21" y2="18"></line>
          <path d="M4 6h1v4"></path>
          <path d="M4 10h2"></path>
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
        </svg>
      </button>
      <div style="width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem;"></div>
      <button class="icon-btn" data-action="table" title="Insert Table">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
          <line x1="12" y1="3" x2="12" y2="21"></line>
        </svg>
      </button>
    `;
    
    // Add click handlers
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const content = el.notePaneLeft.querySelector('.content.editable');
      if (!content) return;
      
      content.focus();
      
      if (action === 'bold') document.execCommand('bold');
      else if (action === 'italic') document.execCommand('italic');
      else if (action === 'underline') document.execCommand('underline');
      else if (action === 'h1') document.execCommand('formatBlock', false, 'h1');
      else if (action === 'h2') document.execCommand('formatBlock', false, 'h2');
      else if (action === 'ul') document.execCommand('insertUnorderedList');
      else if (action === 'ol') document.execCommand('insertOrderedList');
      else if (action === 'table') {
        if (typeof insertTablePlaceholder === 'function') {
          insertTablePlaceholder();
        }
      }
    });
  }

  function switchActiveNote(noteId) {
    TwoBaseState.activeNote = noteId;
    renderNoteTabs();
    renderNoteEditor(noteId);
  }

  function closeNoteTab(noteId) {
    const index = TwoBaseState.openNotes.indexOf(noteId);
    if (index > -1) {
      TwoBaseState.openNotes.splice(index, 1);
    }
    
    // If this was the active note, switch to another or go back to main
    if (noteId === TwoBaseState.activeNote) {
      if (TwoBaseState.openNotes.length > 0) {
        // Switch to the previous tab or first tab
        const newActiveIndex = Math.max(0, index - 1);
        switchActiveNote(TwoBaseState.openNotes[newActiveIndex]);
      } else {
        // No more notes open, go back to main base
        switchToMainBase();
      }
    } else {
      // Just update tabs
      renderNoteTabs();
    }
  }

  function toggleSplitView() {
    TwoBaseState.splitView = !TwoBaseState.splitView;
    
    if (TwoBaseState.splitView) {
      el.notePaneRight.classList.remove('hidden');
      el.noteResizer.classList.remove('hidden');
      el.splitNoteBtn.classList.add('active');
    } else {
      el.notePaneRight.classList.add('hidden');
      el.noteResizer.classList.add('hidden');
      el.splitNoteBtn.classList.remove('active');
    }
  }

  // ===================================
  // View Options & Context Menu
  // ===================================

  let viewOptionsMenu = null;

  function showViewOptions(e) {
    e.stopPropagation();
    
    // Close existing menu if open
    if (viewOptionsMenu && document.body.contains(viewOptionsMenu)) {
      viewOptionsMenu.remove();
      viewOptionsMenu = null;
      return;
    }
    
    // Create menu
    viewOptionsMenu = document.createElement('div');
    viewOptionsMenu.className = 'view-options-menu';
    viewOptionsMenu.innerHTML = `
      <div class="view-options-section">
        <div class="view-options-label">View Mode</div>
        <button class="view-option-btn active" data-view="grid">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
          </svg>
          Grid
        </button>
        <button class="view-option-btn" data-view="list">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          List
        </button>
      </div>
      <div class="view-options-divider"></div>
      <div class="view-options-section">
        <div class="view-options-label">Show</div>
        <button class="view-option-btn active" data-filter="all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          All Items
        </button>
        <button class="view-option-btn" data-filter="folders">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Folders Only
        </button>
        <button class="view-option-btn" data-filter="notes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Notes Only
        </button>
      </div>
    `;
    
    // Position menu below button
    const rect = el.viewOptionsBtn.getBoundingClientRect();
    viewOptionsMenu.style.position = 'absolute';
    viewOptionsMenu.style.top = (rect.bottom + 5) + 'px';
    viewOptionsMenu.style.right = '1rem';
    
    document.body.appendChild(viewOptionsMenu);
    
    // Add click handlers
    viewOptionsMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('.view-option-btn');
      if (!btn) return;
      
      // Toggle active state within section
      const section = btn.closest('.view-options-section');
      section.querySelectorAll('.view-option-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Handle view mode change
      if (btn.dataset.view) {
        console.log('View mode:', btn.dataset.view);
        // TODO: Implement grid/list view toggle
      }
      
      // Handle filter change
      if (btn.dataset.filter) {
        console.log('Filter:', btn.dataset.filter);
        // TODO: Implement filtering
      }
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', closeViewOptions);
    }, 0);
  }
  
  function closeViewOptions() {
    if (viewOptionsMenu) {
      viewOptionsMenu.remove();
      viewOptionsMenu = null;
      document.removeEventListener('click', closeViewOptions);
    }
  }

  function handleWorkspaceContextMenu(e) {
    const item = e.target.closest('.workspace-item');
    if (!item) return;
    
    e.preventDefault();
    
    const isFolder = item.classList.contains('folder');
    const id = isFolder ? item.dataset.folderId : item.dataset.noteId;
    
    // TODO: Show context menu with options like:
    // - Open (for notes)
    // - Rename
    // - Delete
    // - Move to folder
    console.log(`Context menu for ${isFolder ? 'folder' : 'note'}: ${id}`);
  }

  // ===================================
  // Event Listeners
  // ===================================

  function setupEventListeners() {
    // Main Base events
    if (el.breadcrumbBack) {
      el.breadcrumbBack.addEventListener('click', navigateBack);
    }
    
    if (el.viewOptionsBtn) {
      el.viewOptionsBtn.addEventListener('click', showViewOptions);
    }
    
    // Right-click context menu on workspace items
    if (el.workspaceContent) {
      el.workspaceContent.addEventListener('contextmenu', handleWorkspaceContextMenu);
    }
    
    // Note Base events
    if (el.backToMain) {
      el.backToMain.addEventListener('click', switchToMainBase);
    }
    
    if (el.splitNoteBtn) {
      el.splitNoteBtn.addEventListener('click', toggleSplitView);
    }
    
    // New Sidebar Section Events
    setupSidebarSections();
    
    // New Toolbar Events
    setupToolbarControls();
    
    // Home button - navigate to main workspace view
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        // If in note base, go back to main base
        if (TwoBaseState.currentBase === 'note') {
          switchToMainBase();
        }
        // Always reset to root view (all folders and notes)
        TwoBaseState.currentFolder = null;
        renderWorkspaceSplit(null);
        
        // Clear active states in sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
          item.classList.remove('active');
        });
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to go back to main base
      if (e.key === 'Escape' && TwoBaseState.currentBase === 'note') {
        switchToMainBase();
      }
    });
  }

  // ===================================
  // Sidebar Sections Functionality
  // ===================================

  function setupSidebarSections() {
    // Populate notebooks and folders sections
    populateNotebooksSection();
    populateFoldersSection();
  }

  function populateNotebooksSection() {
    const notebooksContent = document.getElementById('notebooksContent');
    if (!notebooksContent || !window.state) return;

    notebooksContent.innerHTML = '';

    // Add each note as a notebook item
    window.state.notes.forEach(note => {
      const noteBtn = createNotebookButton(note);
      notebooksContent.appendChild(noteBtn);
    });
  }

  function createNotebookButton(note) {
    const btn = document.createElement('button');
    btn.className = 'sidebar-item';
    btn.dataset.noteId = note.id;
    btn.draggable = true;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span>${window.escapeHtml ? window.escapeHtml(note.title || 'Untitled') : (note.title || 'Untitled')}</span>
    `;
    
    // Click handler
    btn.addEventListener('click', () => {
      openNoteFromSidebar(note.id);
    });
    
    // Drag handlers
    btn.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/note-id', note.id);
      btn.classList.add('dragging');
    });
    
    btn.addEventListener('dragend', () => {
      btn.classList.remove('dragging');
      removeDropIndicator();
    });
    
    // Drop zone handlers
    btn.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const draggedId = e.dataTransfer.types.includes('text/note-id');
      if (!draggedId) return;
      
      showDropIndicator(btn, e);
    });
    
    btn.addEventListener('dragleave', () => {
      // Only remove if not hovering over a child
      setTimeout(() => {
        if (!btn.matches(':hover')) {
          removeDropIndicator();
        }
      }, 10);
    });
    
    btn.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/note-id');
      if (!draggedId || draggedId === note.id) return;
      
      handleNoteDrop(draggedId, note.id, e);
      removeDropIndicator();
    });
    
    return btn;
  }

  // Drop indicator management
  let dropIndicator = null;

  function showDropIndicator(targetBtn, e) {
    if (!dropIndicator) {
      dropIndicator = document.createElement('div');
      dropIndicator.className = 'drop-indicator-line';
      dropIndicator.style.cssText = 'height: 2px; background: var(--accent); margin: 2px 8px; border-radius: 1px; pointer-events: none;';
    }
    
    const rect = targetBtn.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const insertBefore = e.clientY < midpoint;
    
    if (insertBefore) {
      targetBtn.parentNode.insertBefore(dropIndicator, targetBtn);
    } else {
      targetBtn.parentNode.insertBefore(dropIndicator, targetBtn.nextSibling);
    }
  }

  function removeDropIndicator() {
    if (dropIndicator && dropIndicator.parentNode) {
      dropIndicator.remove();
    }
  }

  function handleNoteDrop(draggedId, targetId, e) {
    const draggedNote = window.state.notes.find(n => n.id === draggedId);
    const targetNote = window.state.notes.find(n => n.id === targetId);
    
    if (!draggedNote || !targetNote) return;
    
    // Determine if we should insert before or after target
    const rect = e.target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const insertBefore = e.clientY < midpoint;
    
    // Remove dragged note from array
    const draggedIndex = window.state.notes.indexOf(draggedNote);
    window.state.notes.splice(draggedIndex, 1);
    
    // Find new position for target
    const targetIndex = window.state.notes.indexOf(targetNote);
    const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
    
    // Insert at new position
    window.state.notes.splice(insertIndex, 0, draggedNote);
    
    // Save and refresh
    if (typeof window.saveNotes === 'function') {
      window.saveNotes();
    }
    populateNotebooksSection();
  }

  function openNoteFromSidebar(noteId) {
    // Set active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-note-id="${noteId}"]`)?.classList.add('active');

    // Open note in note base
    openNoteFromWorkspace(noteId);
  }

  function populateFoldersSection() {
    const foldersContent = document.getElementById('foldersContent');
    if (!foldersContent || !window.state) return;

    foldersContent.innerHTML = '';

    // Add "Uncategorized" folder
    const uncategorizedCount = window.state.notes.filter(n => !n.folderId).length;
    const uncategorizedBtn = document.createElement('button');
    uncategorizedBtn.className = 'sidebar-item';
    uncategorizedBtn.dataset.folderId = '';
    uncategorizedBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>Uncategorized</span>
      <span class="item-count">${uncategorizedCount}</span>
    `;
    
    // Click handler
    uncategorizedBtn.addEventListener('click', () => {
      showUncategorized();
    });
    
    // Drag handlers - allow notes to be dropped to remove from folders
    uncategorizedBtn.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const draggedId = e.dataTransfer.types.includes('text/note-id');
      if (!draggedId) return;
      
      uncategorizedBtn.classList.add('drag-over');
    });
    
    uncategorizedBtn.addEventListener('dragleave', () => {
      uncategorizedBtn.classList.remove('drag-over');
    });
    
    uncategorizedBtn.addEventListener('drop', (e) => {
      e.preventDefault();
      uncategorizedBtn.classList.remove('drag-over');
      
      const draggedNoteId = e.dataTransfer.getData('text/note-id');
      if (!draggedNoteId) return;
      
      moveNoteToFolder(draggedNoteId, null);
    });
    
    foldersContent.appendChild(uncategorizedBtn);

    // Add all folders
    const rootFolders = window.state.folders.filter(f => !f.parentId);
    rootFolders.forEach(folder => {
      const folderBtn = createFolderButton(folder);
      foldersContent.appendChild(folderBtn);
    });
  }

  function createFolderButton(folder) {
    const notesInFolder = window.state.notes.filter(n => n.folderId === folder.id).length;
    const btn = document.createElement('button');
    btn.className = 'sidebar-item';
    btn.dataset.folderId = folder.id;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>${window.escapeHtml ? window.escapeHtml(folder.name) : folder.name}</span>
      <span class="item-count">${notesInFolder}</span>
    `;
    
    // Click handler
    btn.addEventListener('click', () => {
      navigateToFolderFromSidebar(folder.id);
    });
    
    // Drag over handler - allow notes to be dropped
    btn.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const draggedId = e.dataTransfer.types.includes('text/note-id');
      if (!draggedId) return;
      
      btn.classList.add('drag-over');
    });
    
    btn.addEventListener('dragleave', () => {
      btn.classList.remove('drag-over');
    });
    
    // Drop handler - move note to this folder
    btn.addEventListener('drop', (e) => {
      e.preventDefault();
      btn.classList.remove('drag-over');
      
      const draggedNoteId = e.dataTransfer.getData('text/note-id');
      if (!draggedNoteId) return;
      
      moveNoteToFolder(draggedNoteId, folder.id);
    });
    
    return btn;
  }

  function moveNoteToFolder(noteId, folderId) {
    const note = window.state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    // Update note's folder
    note.folderId = folderId;
    
    // Save changes
    if (typeof window.saveNotes === 'function') {
      window.saveNotes();
    }
    
    // Refresh both sections
    populateNotebooksSection();
    populateFoldersSection();
    
    // Show feedback
    console.log(`Moved note "${note.title}" to folder`);
  }

  function showUncategorized() {
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector('[data-folder-id=""]')?.classList.add('active');

    // Show uncategorized notes
    TwoBaseState.currentFolder = 'uncategorized';
    renderUncategorizedNotes();
  }

  function renderUncategorizedNotes() {
    const grid = document.createElement('div');
    grid.className = TwoBaseState.viewMode === 'list' ? 'workspace-list' : 'workspace-grid';

    let uncategorizedNotes = window.state.notes.filter(n => !n.folderId);

    // Apply sorting
    if (TwoBaseState.sortOrder === 'asc') {
      uncategorizedNotes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      uncategorizedNotes.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    }

    uncategorizedNotes.forEach(note => {
      grid.appendChild(createNoteItem(note));
    });

    el.workspaceContent.innerHTML = '';
    el.breadcrumbPath.textContent = 'Uncategorized';
    el.breadcrumbBack.style.display = 'flex';

    if (uncategorizedNotes.length === 0) {
      el.workspaceContent.innerHTML = `
        <div class="workspace-empty">
          <div class="workspace-empty-icon">📝</div>
          <div class="workspace-empty-text">No uncategorized notes</div>
        </div>
      `;
    } else {
      el.workspaceContent.appendChild(grid);
    }
  }

  function navigateToFolderFromSidebar(folderId) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-folder-id="${folderId}"]`)?.classList.add('active');

    renderWorkspaceSplit(folderId);
  }

  // ===================================
  // Toolbar Controls Functionality
  // ===================================

  function setupToolbarControls() {
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
        }
      });
    }

    // Multi-selection button
    const multiSelectBtn = document.getElementById('multiSelectBtn');
    if (multiSelectBtn) {
      multiSelectBtn.addEventListener('click', toggleMultiSelect);
    }

    // Sort button
    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) {
      sortBtn.addEventListener('click', toggleSort);
    }

    // View toggle button (grid/list)
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    if (viewToggleBtn) {
      viewToggleBtn.addEventListener('click', toggleViewMode);
    }

    // Open notes drawer button (replaces view options)
    const openNotesDrawerBtn = document.getElementById('openNotesDrawerBtn');
    if (openNotesDrawerBtn) {
      openNotesDrawerBtn.addEventListener('click', openNotesDrawer);
    }
  }

  function openNotesDrawer() {
    // Switch to note base
    switchToNoteBase();
    
    // If there are open notes, show them, otherwise do nothing (note base will show empty state)
    if (TwoBaseState.openNotes.length > 0) {
      // The note base will automatically show the last active note
      renderNoteTabs();
      if (TwoBaseState.activeNote) {
        renderNoteEditor(TwoBaseState.activeNote);
      }
    }
  }

  function toggleMultiSelect() {
    const multiSelectBtn = document.getElementById('multiSelectBtn');
    const isActive = multiSelectBtn.classList.toggle('active');

    if (isActive) {
      // Enable multi-select mode
      TwoBaseState.multiSelectMode = true;
      TwoBaseState.selectedItems = [];
      renderWorkspaceWithCheckboxes();
    } else {
      // Disable multi-select mode
      TwoBaseState.multiSelectMode = false;
      TwoBaseState.selectedItems = [];
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  function renderWorkspaceWithCheckboxes() {
    // Re-render current view with checkboxes
    if (TwoBaseState.currentFolder === 'uncategorized') {
      renderUncategorizedNotes();
    } else {
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  function toggleSort() {
    const sortBtn = document.getElementById('sortBtn');
    const currentSort = sortBtn.dataset.sort || 'asc';
    const newSort = currentSort === 'asc' ? 'desc' : 'asc';

    sortBtn.dataset.sort = newSort;
    sortBtn.title = newSort === 'asc' ? 'Sort A-Z' : 'Sort Z-A';

    // Update icon rotation
    const svg = sortBtn.querySelector('svg');
    if (svg) {
      svg.style.transform = newSort === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)';
    }

    TwoBaseState.sortOrder = newSort;

    // Re-render current view with new sort
    if (TwoBaseState.currentFolder === 'uncategorized') {
      renderUncategorizedNotes();
    } else {
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  function toggleViewMode() {
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    const currentView = viewToggleBtn.dataset.view || 'grid';
    const newView = currentView === 'grid' ? 'list' : 'grid';

    viewToggleBtn.dataset.view = newView;
    viewToggleBtn.title = newView === 'grid' ? 'Grid view' : 'List view';

    // Update icon
    const svg = viewToggleBtn.querySelector('svg');
    if (svg) {
      if (newView === 'list') {
        svg.innerHTML = `
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        `;
      } else {
        svg.innerHTML = `
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
        `;
      }
    }

    TwoBaseState.viewMode = newView;

    // Re-render current view with new layout
    if (TwoBaseState.currentFolder === 'uncategorized') {
      renderUncategorizedNotes();
    } else {
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  // ===================================
  // Initialization
  // ===================================

  function init() {
    // Wait for dependencies from app.js
    if (typeof window.state === 'undefined' || 
        typeof window.getIcon === 'undefined' || 
        typeof window.escapeHtml === 'undefined') {
      console.log('Two-Base: Waiting for app.js dependencies...');
      setTimeout(init, 100);
      return;
    }
    
    // Use global references
    const state = window.state;
    const getIcon = window.getIcon;
    const escapeHtml = window.escapeHtml;
    
    console.log('Two-Base: Initializing...');
    initElements();
    
    if (!el.workspaceSplit || !el.noteBase) {
      console.error('Two-Base: Required DOM elements not found');
      return;
    }
    
    setupEventListeners();
    
    // Start with main base showing root view
    renderWorkspaceSplit();
    
    console.log('Two-Base: Initialized successfully');
  }
  
  // Function to refresh workspace - called by app.js after renderSidebar
  function refreshWorkspace() {
    if (TwoBaseState && typeof renderWorkspaceSplit === 'function') {
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  // Export functions to global scope
  window.TwoBase = {
    init,
    renderWorkspaceSplit,
    openNoteFromWorkspace,
    switchToNoteBase,
    switchToMainBase,
    openNoteInNoteBase,
    closeNoteTab,
    refreshWorkspace,
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
