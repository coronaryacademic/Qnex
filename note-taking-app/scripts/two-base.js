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
    currentEditor: null, // Current BlockEditor instance
    currentEditorElement: null, // Current editable content element
    currentSaveFunction: null, // Current note's save function
    toolbarPosition: 'top', // Toolbar position: 'top', 'right', 'bottom', 'left'
    toolbarAlignment: 'center', // Toolbar alignment: 'left', 'center', 'right'
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
    toolbarOptionsBtn: null,
    toolbarOptionsMenu: null,
    noteToolbarSection: null,
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
    el.toolbarOptionsBtn = document.getElementById('toolbarOptionsBtn');
    el.toolbarOptionsMenu = document.getElementById('toolbarOptionsMenu');
    el.noteToolbarSection = document.querySelector('.note-toolbar-section');
  }

  // Module-level state reference
  let state = null;
  let getIcon = null;
  let escapeHtml = null;

  // ===================================
  // MAIN BASE: Workspace Functions
  // ===================================

  function renderWorkspaceSplit(folderId = null) {
    TwoBaseState.currentFolder = folderId;
    TwoBaseState.currentBase = 'main';
    
    // Show workspace, hide note base and empty state
    if (el.workspaceSplit) el.workspaceSplit.style.display = 'flex';
    if (el.noteBase) el.noteBase.classList.add('hidden');
    
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.classList.add('hidden');
    
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
          <div class="workspace-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--muted); opacity: 0.5;">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
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
    item.dataset.itemType = 'folder';
    
    // Check if selected
    if (TwoBaseState.selectedItems.includes(folder.id)) {
      item.classList.add('selected');
    }
    
    const icon = getIcon('folder');
    
    item.innerHTML = `
      <div class="workspace-item-icon">${icon}</div>
      <div class="workspace-item-title">${escapeHtml(folder.name)}</div>
      <div class="workspace-item-meta">Folder</div>
    `;
    
    // Click handler - only multi-select button enables multi-selection
    item.addEventListener('click', (e) => {
      if (TwoBaseState.multiSelectMode) {
        // Multi-select mode: toggle selection
        e.stopPropagation();
        toggleItemSelection(folder.id, 'folder');
      } else {
        // Normal mode: navigate to folder
        navigateToFolder(folder.id);
      }
    });
    
    // Right-click context menu
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showWorkspaceContextMenu(e, folder.id, 'folder');
    });
    
    // Drag and drop support
    item.draggable = true;
    
    item.addEventListener('dragstart', (e) => {
      // If this item is part of multi-selection, drag all selected items
      if (TwoBaseState.selectedItems.includes(folder.id) && TwoBaseState.selectedItems.length > 1) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/multi-drag', 'true');
        e.dataTransfer.setData('text/item-ids', JSON.stringify(TwoBaseState.selectedItems));
        item.classList.add('dragging');
      } else {
        // Single item drag
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/folder-id', folder.id);
        item.classList.add('dragging');
      }
    });
    
    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging');
    });
    
    // Make folder a drop zone
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      item.classList.add('drag-over');
    });
    
    item.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      item.classList.remove('drag-over');
    });
    
    item.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.classList.remove('drag-over');
      
      // Check if multi-drag
      const isMultiDrag = e.dataTransfer.types.includes('text/multi-drag');
      
      if (isMultiDrag) {
        // Handle multi-item drop
        const itemIds = JSON.parse(e.dataTransfer.getData('text/item-ids'));
        
        for (const id of itemIds) {
          // Check if it's a note
          const note = state.notes.find(n => n.id === id);
          if (note) {
            note.folderId = folder.id;
            note.updatedAt = new Date().toISOString();
          } else {
            // Check if it's a folder
            const draggedFolder = state.folders.find(f => f.id === id);
            if (draggedFolder && draggedFolder.id !== folder.id) {
              // Prevent circular nesting
              let parent = folder;
              let isCircular = false;
              while (parent) {
                if (parent.id === draggedFolder.id) {
                  isCircular = true;
                  break;
                }
                parent = state.folders.find(f => f.id === parent.parentId);
              }
              
              if (!isCircular) {
                draggedFolder.parentId = folder.id;
              }
            }
          }
        }
        
        // Clear selection after move
        TwoBaseState.selectedItems = [];
        if (window.state && window.state.selectedItems) {
          window.state.selectedItems.clear();
        }
        
        // Save to backend
        if (typeof window.saveNotes === 'function') {
          window.saveNotes();
        }
        if (typeof window.saveFolders === 'function') {
          window.saveFolders();
        }
      } else {
        // Handle single item drop
        const noteId = e.dataTransfer.getData('text/note-id');
        const folderId = e.dataTransfer.getData('text/folder-id');
        
        if (noteId) {
          const note = state.notes.find(n => n.id === noteId);
          if (note) {
            note.folderId = folder.id;
            note.updatedAt = new Date().toISOString();
            
            // Save to backend
            if (typeof window.saveNotes === 'function') {
              window.saveNotes();
            }
          }
        } else if (folderId && folderId !== folder.id) {
          const draggedFolder = state.folders.find(f => f.id === folderId);
          if (draggedFolder) {
            // Prevent circular nesting
            let parent = folder;
            let isCircular = false;
            while (parent) {
              if (parent.id === draggedFolder.id) {
                isCircular = true;
                break;
              }
              parent = state.folders.find(f => f.id === parent.parentId);
            }
            
            if (!isCircular) {
              draggedFolder.parentId = folder.id;
              
              // Save to backend
              if (typeof window.saveFolders === 'function') {
                window.saveFolders();
              }
            }
          }
        }
      }
      
      // Refresh view
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    });
    
    return item;
  }

  function createNoteItem(note) {
    const item = document.createElement('div');
    item.className = 'workspace-item note';
    item.dataset.noteId = note.id;
    item.dataset.itemType = 'note';
    
    // Check if selected
    if (TwoBaseState.selectedItems.includes(note.id)) {
      item.classList.add('selected');
    }
    
    const icon = getIcon(note.icon || 'default');
    const date = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : '';
    
    item.innerHTML = `
      <div class="workspace-item-icon">${icon}</div>
      <div class="workspace-item-title">${escapeHtml(note.title || 'Untitled')}</div>
      <div class="workspace-item-meta">${date}</div>
    `;
    
    // Click handler - only multi-select button enables multi-selection
    item.addEventListener('click', (e) => {
      if (TwoBaseState.multiSelectMode) {
        // Multi-select mode: toggle selection
        e.stopPropagation();
        toggleItemSelection(note.id, 'note');
      } else {
        // Normal mode: open note
        openNoteFromWorkspace(note.id);
      }
    });
    
    // Right-click context menu
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showWorkspaceContextMenu(e, note.id, 'note');
    });
    
    // Drag and drop support
    item.draggable = true;
    
    item.addEventListener('dragstart', (e) => {
      // If this item is part of multi-selection, drag all selected items
      if (TwoBaseState.selectedItems.includes(note.id) && TwoBaseState.selectedItems.length > 1) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/multi-drag', 'true');
        e.dataTransfer.setData('text/item-ids', JSON.stringify(TwoBaseState.selectedItems));
        item.classList.add('dragging');
      } else {
        // Single item drag
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/note-id', note.id);
        item.classList.add('dragging');
      }
    });
    
    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging');
    });
    
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

  function toggleItemSelection(itemId, itemType) {
    const index = TwoBaseState.selectedItems.indexOf(itemId);
    
    if (index > -1) {
      // Deselect
      TwoBaseState.selectedItems.splice(index, 1);
      if (window.state && window.state.selectedItems) {
        window.state.selectedItems.delete(itemId);
      }
    } else {
      // Select
      TwoBaseState.selectedItems.push(itemId);
      if (window.state && window.state.selectedItems) {
        window.state.selectedItems.add(itemId);
      }
    }
    
    // Re-render to update visual state
    if (TwoBaseState.currentFolder) {
      renderFolderContents(TwoBaseState.currentFolder);
    } else {
      renderRootView();
    }
  }

  function showWorkspaceContextMenu(event, itemId, itemType) {
    // Use the global showContextMenu from app.js
    console.log('[BASE LAYER] showWorkspaceContextMenu called:', { itemId, itemType, selectedCount: TwoBaseState.selectedItems.length });
    if (typeof window.showContextMenu !== 'function') {
      console.error('[BASE LAYER] showContextMenu not available');
      return;
    }
    
    // Check for multi-selection
    if (TwoBaseState.selectedItems.length > 1 && TwoBaseState.selectedItems.includes(itemId)) {
      // Show multi-select context menu
      window.showContextMenu(
        event.clientX,
        event.clientY,
        {
          onDeleteNotes: async () => {
            console.log('[BASE LAYER] Multi-delete triggered, items:', TwoBaseState.selectedItems);
            const count = TwoBaseState.selectedItems.length;
            
            showDeleteConfirmation(count, async () => {
              console.log('[BASE LAYER] User confirmed delete');
              
              // Delete all selected items (notes and folders)
              for (const id of TwoBaseState.selectedItems) {
                // Try to find in notes first
                const noteIdx = state.notes.findIndex(n => n.id === id);
                if (noteIdx >= 0) {
                  const [deletedNote] = state.notes.splice(noteIdx, 1);
                  const trashItem = {
                  ...deletedNote,
                  deletedAt: new Date().toISOString()
                };
                state.trash.push(trashItem);
                
                // Delete from backend
                if (typeof window.Storage !== 'undefined' && window.Storage.useFileSystem) {
                  try {
                    if (typeof window.fileSystemService !== 'undefined') {
                      await window.fileSystemService.deleteNoteFromCollection(id);
                    }
                  } catch (error) {
                    console.error("Error deleting note from backend:", id, error);
                  }
                }
                
                // Close tabs
                if (typeof window.closeTab === 'function') {
                  window.closeTab("left", id);
                  window.closeTab("right", id);
                }
              } else {
                // Try to find in folders
                const folderIdx = state.folders.findIndex(f => f.id === id);
                if (folderIdx >= 0) {
                  const folder = state.folders[folderIdx];
                  const notesInFolder = state.notes.filter(n => n.folderId === id);
                  
                  // Remove folder
                  state.folders.splice(folderIdx, 1);
                  
                  // Move folder to trash with its notes
                  const trashItem = {
                    ...folder,
                    type: 'folder',
                    notes: notesInFolder,
                    deletedAt: new Date().toISOString()
                  };
                  state.trash.push(trashItem);
                  
                  // Remove notes in folder
                  state.notes = state.notes.filter(n => n.folderId !== id);
                  
                  // Delete from backend
                  if (typeof window.Storage !== 'undefined' && window.Storage.useFileSystem) {
                    try {
                      if (typeof window.fileSystemService !== 'undefined') {
                        await window.fileSystemService.deleteFolderFromCollection(id);
                      }
                    } catch (error) {
                      console.error("Error deleting folder from backend:", id, error);
                    }
                  }
                }
              }
            }
            
            // Clear selection
            TwoBaseState.selectedItems = [];
            if (window.state && window.state.selectedItems) {
              window.state.selectedItems.clear();
            }
            
            // Save changes to backend
            if (typeof window.saveNotes === 'function') {
              window.saveNotes();
            }
            if (typeof window.saveFolders === 'function') {
              window.saveFolders();
            }
            if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveTrash === 'function') {
              window.Storage.saveTrash(state.trash);
            }
            
            // Refresh view and sidebar
            if (typeof window.renderSidebar === 'function') {
              window.renderSidebar();
            }
            if (TwoBaseState.currentFolder === 'uncategorized') {
              renderUncategorizedNotes();
            } else {
              renderWorkspaceSplit(TwoBaseState.currentFolder);
            }
            }); // Close showDeleteConfirmation callback
          },
          onExportNotes: async () => {
             // Use app.js handler if available, or implement basic export
             console.log('Exporting selected notes...');
          }
        },
        "multi-note"
      );
      return;
    }
    
    if (itemType === 'note') {
      const note = state.notes.find(n => n.id === itemId);
      if (!note) return;
      
      // Show note context menu
      window.showContextMenu(
        event.clientX,
        event.clientY,
        {
          onOpenWindow: () => {
            if (typeof window.openWindow === 'function') {
              window.openWindow(itemId);
            }
          },
          onRenameNote: async () => {
            if (typeof window.modalPrompt !== 'function') return;
            const name = await window.modalPrompt('Rename Note', 'Title', note.title || '');
            if (name == null) return;
            note.title = name;
            note.updatedAt = new Date().toISOString();
            if (typeof window.saveNotes === 'function') {
              window.saveNotes();
            }
            // Re-render workspace
            renderWorkspaceSplit(TwoBaseState.currentFolder);
          },
          onChangeNoteIcon: async () => {
            if (typeof window.modalIconPicker !== 'function') return;
            const current = note.icon || 'default';
            const chosen = await window.modalIconPicker(current);
            if (!chosen) return;
            note.icon = chosen;
            note.updatedAt = new Date().toISOString();
            if (typeof window.saveNotes === 'function') {
              window.saveNotes();
            }
            renderWorkspaceSplit(TwoBaseState.currentFolder);
          },
          onDeleteNote: async () => {
            console.log('[BASE LAYER] Single note delete triggered for:', itemId);
            
            showDeleteConfirmation(1, async () => {
              console.log('[BASE LAYER] User confirmed delete');
              
              const idx = state.notes.findIndex(n => n.id === itemId);
              if (idx >= 0) {
                const [deletedNote] = state.notes.splice(idx, 1);
                const trashItem = {
                  ...deletedNote,
                  deletedAt: new Date().toISOString()
                };
                state.trash.push(trashItem);
                
                // Delete from backend
                if (typeof window.Storage !== 'undefined' && window.Storage.useFileSystem) {
                try {
                  if (typeof window.fileSystemService !== 'undefined') {
                    await window.fileSystemService.deleteNoteFromCollection(itemId);
                  }
                } catch (error) {
                  console.error("Error deleting note from backend:", itemId, error);
                }
              }
              
              // Save changes
              if (typeof window.saveNotes === 'function') {
                window.saveNotes();
              }
              if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveTrash === 'function') {
                window.Storage.saveTrash(state.trash);
              }
              
              // Re-render workspace and sidebar
              if (typeof window.renderSidebar === 'function') {
                window.renderSidebar();
              }
              renderWorkspaceSplit(TwoBaseState.currentFolder);
            }
            }); // Close showDeleteConfirmation callback
          }
        },
        "note"
      );
    } else if (itemType === 'folder') {
      const folder = state.folders.find(f => f.id === itemId);
      if (!folder) return;
      
      const handlers = {};
      
      handlers.onNewSubfolder = async () => {
        if (typeof window.modalPrompt !== 'function') return;
        const name = await window.modalPrompt('New Subfolder', 'Folder name');
        if (!name) return;
        const f = { 
          id: typeof window.uid === 'function' ? window.uid() : Date.now().toString(), 
          name, 
          parentId: itemId 
        };
        state.folders.push(f);
        if (typeof window.saveFolders === 'function') {
          window.saveFolders();
        }
        renderWorkspaceSplit(TwoBaseState.currentFolder);
      };
      
      handlers.onRenameFolder = async () => {
        if (typeof window.modalPrompt !== 'function') return;
        const name = await window.modalPrompt('Rename Folder', 'Folder name', folder.name);
        if (!name) return;
        folder.name = name;
        if (typeof window.saveFolders === 'function') {
          window.saveFolders();
        }
        renderWorkspaceSplit(TwoBaseState.currentFolder);
      };
      
      handlers.onChangeFolderIcon = async () => {
        if (typeof window.modalIconPicker !== 'function') return;
        const current = folder.icon || 'default';
        const chosen = await window.modalIconPicker(current);
        if (!chosen) return;
        folder.icon = chosen;
        if (typeof window.saveFolders === 'function') {
          window.saveFolders();
        }
        renderWorkspaceSplit(TwoBaseState.currentFolder);
      };
      
      if (folder.parentId) {
        handlers.onMoveToRoot = async () => {
          folder.parentId = null;
          if (typeof window.saveFolders === 'function') {
            window.saveFolders();
          }
          renderWorkspaceSplit(TwoBaseState.currentFolder);
        };
      }
      
      handlers.onDeleteFolder = async () => {
        if (typeof window.modalConfirm !== 'function') return;
        
        // Get notes in folder
        const notesInFolder = state.notes.filter(n => n.folderId === itemId);
        const noteCount = notesInFolder.length;
        
        const ok = await window.modalConfirm(
          `Delete folder "${folder.name}"?${noteCount > 0 ? `\n\n${noteCount} note${noteCount !== 1 ? 's' : ''} inside will be moved to trash.` : ''}\n\nYou can restore from trash later.`
        );
        if (!ok) return;
        
        // Remove notes
        state.notes = state.notes.filter(n => n.folderId !== itemId);
        
        // Move folder to trash
        const ix = state.folders.findIndex(f => f.id === itemId);
        if (ix >= 0) {
          const [deletedFolder] = state.folders.splice(ix, 1);
          const trashItem = {
            ...deletedFolder,
            type: 'folder',
            notes: notesInFolder,
            deletedAt: new Date().toISOString()
          };
          state.trash.push(trashItem);
        }
        
        if (typeof window.saveFolders === 'function') {
          window.saveFolders();
        }
        if (typeof window.saveNotes === 'function') {
          window.saveNotes();
        }
        if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveTrash === 'function') {
          window.Storage.saveTrash(state.trash);
        }
        
        // Refresh sidebar and workspace
        if (typeof window.renderSidebar === 'function') {
          window.renderSidebar();
        }
        renderWorkspaceSplit(TwoBaseState.currentFolder);
      };
      
      window.showContextMenu(event.clientX, event.clientY, handlers, 'folder');
    }
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
    
    // Save session state
    saveTwoBaseSession();
  }

  function renderNoteTabs() {
    el.noteTabs.innerHTML = '';
    
    TwoBaseState.openNotes.forEach((noteId, index) => {
      const note = state.notes.find(n => n.id === noteId);
      if (!note) return;
      
      const tab = document.createElement('div');
      tab.className = 'note-tab' + (noteId === TwoBaseState.activeNote ? ' active' : '');
      tab.dataset.noteId = noteId;
      tab.dataset.index = index;
      tab.draggable = true;
      
      tab.innerHTML = `
        <span class="note-tab-title">${escapeHtml(note.title || 'Untitled')}</span>
        <span class="note-tab-close">×</span>
      `;
      
      // Click handler
      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('note-tab-close')) {
          closeNoteTab(noteId);
        } else {
          switchActiveNote(noteId);
        }
      });
      
      // Drag and drop handlers
      tab.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/note-tab-id', noteId);
        tab.classList.add('dragging');
      });
      
      tab.addEventListener('dragend', (e) => {
        tab.classList.remove('dragging');
        document.querySelectorAll('.note-tab').forEach(t => t.classList.remove('drag-over'));
      });
      
      tab.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const draggingTab = document.querySelector('.note-tab.dragging');
        if (draggingTab && draggingTab !== tab) {
          tab.classList.add('drag-over');
        }
      });
      
      tab.addEventListener('dragleave', (e) => {
        tab.classList.remove('drag-over');
      });
      
      tab.addEventListener('drop', (e) => {
        e.preventDefault();
        tab.classList.remove('drag-over');
        
        const draggedNoteId = e.dataTransfer.getData('text/note-tab-id');
        if (draggedNoteId && draggedNoteId !== noteId) {
          reorderTabs(draggedNoteId, noteId);
        }
      });
      
      // Right-click context menu
      tab.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showTabContextMenu(e, noteId);
      });
      
      el.noteTabs.appendChild(tab);
    });
  }
  
  function reorderTabs(draggedNoteId, targetNoteId) {
    const draggedIndex = TwoBaseState.openNotes.indexOf(draggedNoteId);
    const targetIndex = TwoBaseState.openNotes.indexOf(targetNoteId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged note from array
    TwoBaseState.openNotes.splice(draggedIndex, 1);
    
    // Insert at new position
    const newTargetIndex = TwoBaseState.openNotes.indexOf(targetNoteId);
    TwoBaseState.openNotes.splice(newTargetIndex, 0, draggedNoteId);
    
    // Re-render tabs
    renderNoteTabs();
    
    // Save session state
    saveTwoBaseSession();
  }
  
  function showTabContextMenu(event, noteId) {
    // Remove any existing context menu
    const existingMenu = document.querySelector('.tab-context-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'tab-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    
    const note = state.notes.find(n => n.id === noteId);
    const noteTitle = note ? (note.title || 'Untitled') : 'Untitled';
    
    menu.innerHTML = `
      <div class="context-menu-item" data-action="close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span>Close Tab</span>
      </div>
      <div class="context-menu-item" data-action="close-others">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="6" width="8" height="12" rx="1"></rect>
          <rect x="14" y="6" width="8" height="12" rx="1"></rect>
          <line x1="5" y1="10" x2="7" y2="12"></line>
          <line x1="7" y1="10" x2="5" y2="12"></line>
          <line x1="17" y1="10" x2="19" y2="12"></line>
          <line x1="19" y1="10" x2="17" y2="12"></line>
        </svg>
        <span>Close Other Tabs</span>
      </div>
      <div class="context-menu-item" data-action="close-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
        <span>Close All Tabs</span>
      </div>
    `;
    
    // Add click handlers
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.context-menu-item');
      if (!item) return;
      
      const action = item.dataset.action;
      
      if (action === 'close') {
        closeNoteTab(noteId);
      } else if (action === 'close-others') {
        const otherNotes = TwoBaseState.openNotes.filter(id => id !== noteId);
        otherNotes.forEach(id => closeNoteTab(id));
      } else if (action === 'close-all') {
        const allNotes = [...TwoBaseState.openNotes];
        allNotes.forEach(id => closeNoteTab(id));
      }
      
      menu.remove();
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
    
    document.body.appendChild(menu);
  }
  
  function saveTwoBaseSession() {
    // Create a serializable version of the state
    const sessionState = {
      activeNote: TwoBaseState.activeNote,
      openNotes: TwoBaseState.openNotes,
      currentBase: TwoBaseState.currentBase,
      currentFolder: TwoBaseState.currentFolder,
      toolbarPosition: TwoBaseState.toolbarPosition,
      toolbarAlignment: TwoBaseState.toolbarAlignment
    };
    
    // Save to settings
    if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveSettings === 'function') {
      window.Storage.saveSettings({ ...state.settings, twoBaseSession: sessionState });
    }
  }
  
  function restoreTwoBaseSession() {
    if (!state || !state.settings || !state.settings.twoBaseSession) return;
    
    const savedSession = state.settings.twoBaseSession;
    
    // Restore state
    if (savedSession.openNotes && Array.isArray(savedSession.openNotes)) {
      TwoBaseState.openNotes = savedSession.openNotes;
    }
    
    if (savedSession.activeNote) {
      TwoBaseState.activeNote = savedSession.activeNote;
    }
    
    if (savedSession.currentFolder) {
      TwoBaseState.currentFolder = savedSession.currentFolder;
    }
    
    // Restore toolbar preferences
    if (savedSession.toolbarPosition) {
      TwoBaseState.toolbarPosition = savedSession.toolbarPosition;
      setToolbarPosition(savedSession.toolbarPosition);
    }
    
    if (savedSession.toolbarAlignment) {
      TwoBaseState.toolbarAlignment = savedSession.toolbarAlignment;
      setToolbarAlignment(savedSession.toolbarAlignment);
    }
    
    // Restore view based on saved state
    if (savedSession.currentBase === 'home') {
      // Show welcome page
      TwoBaseState.currentBase = 'home';
      if (el.workspaceSplit) el.workspaceSplit.style.display = 'none';
      if (el.noteBase) el.noteBase.classList.add('hidden');
      const emptyState = document.getElementById('empty-state');
      if (emptyState) emptyState.classList.remove('hidden');
    } else if (savedSession.currentBase === 'note' && TwoBaseState.openNotes.length > 0) {
      // Show note editor
      switchToNoteBase();
      renderNoteTabs();
      if (TwoBaseState.activeNote) {
        renderNoteEditor(TwoBaseState.activeNote);
      }
    } else {
      // Show workspace
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  function renderNoteEditor(noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    // Clear pane content
    const paneContent = el.notePaneLeft.querySelector('.note-pane-content');
    paneContent.innerHTML = '';
    
    // buildEditor returns a DOM node with the editor, so we need to append it
    if (typeof window.buildEditor === 'function') {
      const editorNode = window.buildEditor(note);
      paneContent.appendChild(editorNode);
      
      // Store reference to the BlockEditor instance for toolbar use
      const blockEditor = editorNode._blockEditor;
      const saveFunction = editorNode._saveNote;
      
      if (blockEditor) {
        // Store the editor instance globally for toolbar access
        TwoBaseState.currentEditor = blockEditor;
        TwoBaseState.currentEditorElement = editorNode.querySelector('.content.editable');
        TwoBaseState.currentSaveFunction = saveFunction;
        
        // Make sure the editor is visible and functional
        setTimeout(() => {
          if (TwoBaseState.currentEditor) {
            TwoBaseState.currentEditor.focus();
          }
        }, 100);
      }
    }
    
    // Add click listener to pane content to focus editor when clicking empty space
    paneContent.addEventListener('click', (e) => {
      if (e.target === paneContent && TwoBaseState.currentEditor) {
        TwoBaseState.currentEditor.focus();
      }
    });
    
    // Add Ctrl+S keyboard shortcut for saving
    paneContent.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (TwoBaseState.currentSaveFunction) {
          TwoBaseState.currentSaveFunction();
        }
      }
    });
    
    // Populate toolbar in note header
    populateNoteToolbar();
  }
  
  function populateNoteToolbar() {
    const toolbar = document.getElementById('noteToolbar');
    if (!toolbar) return;
    
    toolbar.innerHTML = `
      <button class="icon-btn" data-action="bold" title="Bold (Ctrl+B)" onmousedown="event.preventDefault()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        </svg>
      </button>
      <button class="icon-btn" data-action="italic" title="Italic (Ctrl+I)" onmousedown="event.preventDefault()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="4" x2="10" y2="4"></line>
          <line x1="14" y1="20" x2="5" y2="20"></line>
          <line x1="15" y1="4" x2="9" y2="20"></line>
        </svg>
      </button>
      <button class="icon-btn" data-action="underline" title="Underline (Ctrl+U)" onmousedown="event.preventDefault()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
          <line x1="4" y1="21" x2="20" y2="21"></line>
        </svg>
      </button>
      <div style="width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem;"></div>
      
      <!-- Highlight Color Picker -->
      <div class="color-picker-container" style="position: relative; display: inline-block;">
        <button class="icon-btn" id="highlightBtn" title="Highlight Color" onmousedown="event.preventDefault()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            <line x1="3" y1="22" x2="21" y2="22"></line>
          </svg>
        </button>
        <div id="highlightMenu" class="color-palette hidden" style="position: absolute; top: 100%; left: 0; background: var(--panel); border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 120px;">
          <button class="color-swatch" data-color="#ffff00" title="Yellow" style="background: #ffff00; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer;"></button>
          <button class="color-swatch" data-color="#00ff00" title="Green" style="background: #00ff00; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer;"></button>
          <button class="color-swatch" data-color="#00ffff" title="Blue" style="background: #00ffff; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer;"></button>
          <button class="color-swatch" data-color="#ff00ff" title="Pink" style="background: #ff00ff; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer;"></button>
          <button class="color-swatch" data-color="#ff0000" title="Red" style="background: #ff0000; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer;"></button>
          <button class="color-swatch" data-color="#ff8000" title="Orange" style="background: #ff8000; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer;"></button>
          <button class="color-swatch" data-color="#8000ff" title="Purple" style="background: #8000ff; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer;"></button>
          <button class="color-swatch" data-color="#cccccc" title="Gray" style="background: #cccccc; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer;"></button>
          <button class="color-swatch" data-color="transparent" title="No Highlight" style="background: white; width: 20px; height: 20px; border-radius: 3px; border: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; grid-column: span 4; width: 100%;">
            <span style="font-size: 10px; color: black;">None</span>
          </button>
        </div>
      </div>

      <div style="width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem;"></div>
      <button class="icon-btn" data-action="h1" title="Heading 1" onmousedown="event.preventDefault()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12h8"></path>
          <path d="M4 18V6"></path>
          <path d="M12 18V6"></path>
          <path d="M17 12h4"></path>
          <path d="M19 6v12"></path>
        </svg>
      </button>
      <button class="icon-btn" data-action="h2" title="Heading 2" onmousedown="event.preventDefault()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12h8"></path>
          <path d="M4 18V6"></path>
          <path d="M12 18V6"></path>
          <path d="M20 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"></path>
        </svg>
      </button>
      <div style="width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem;"></div>
      <button class="icon-btn" data-action="ul" title="Bullet List" onmousedown="event.preventDefault()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
      <button class="icon-btn" data-action="ol" title="Numbered List" onmousedown="event.preventDefault()">
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
      <button class="icon-btn" data-action="table" title="Insert Table" onmousedown="event.preventDefault()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
          <line x1="12" y1="3" x2="12" y2="21"></line>
        </svg>
      </button>
    `;
    
    // Highlight menu toggle
    const highlightBtn = document.getElementById('highlightBtn');
    const highlightMenu = document.getElementById('highlightMenu');
    
    if (highlightBtn && highlightMenu) {
      highlightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        highlightMenu.classList.toggle('hidden');
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!highlightMenu.contains(e.target) && e.target !== highlightBtn) {
          highlightMenu.classList.add('hidden');
        }
      });
      
      // Color selection
      highlightMenu.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (!swatch) return;
        
        e.stopPropagation();
        const color = swatch.dataset.color;
        
        // Apply highlight
        document.execCommand('hiliteColor', false, color);
        highlightMenu.classList.add('hidden');
        
        // Trigger change
        if (TwoBaseState.currentEditor && typeof TwoBaseState.currentEditor.triggerChange === 'function') {
          TwoBaseState.currentEditor.triggerChange();
        }
      });
    }
    
    // Add click handlers for toolbar buttons
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const contentElement = TwoBaseState.currentEditorElement;
      
      if (!contentElement) {
        console.warn('No active editor element found');
        return;
      }
      
      // Ensure focus is on the editor before executing command
      // This is crucial for the commands to work on the selection
      if (document.activeElement !== contentElement) {
        // If we lost focus, we might have lost selection. 
        // Ideally, we should have saved selection on blur, but for now let's try to focus.
        // contentElement.focus(); 
        // Note: focusing might clear selection if not handled carefully.
        // Since we used onmousedown=preventDefault, focus should still be in editor.
      }
      
      // Execute formatting commands
      if (action === 'bold') {
        document.execCommand('bold');
      } else if (action === 'italic') {
        document.execCommand('italic');
      } else if (action === 'underline') {
        document.execCommand('underline');
      } else if (action === 'h1') {
        document.execCommand('formatBlock', false, 'h1');
      } else if (action === 'h2') {
        document.execCommand('formatBlock', false, 'h2');
      } else if (action === 'ul') {
        document.execCommand('insertUnorderedList');
      } else if (action === 'ol') {
        document.execCommand('insertOrderedList');
      } else if (action === 'table') {
        // Insert a simple table structure
        const tableHTML = `
          <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
            <tr>
              <td style="border: 1px solid var(--border); padding: 0.5rem;">Cell 1</td>
              <td style="border: 1px solid var(--border); padding: 0.5rem;">Cell 2</td>
            </tr>
            <tr>
              <td style="border: 1px solid var(--border); padding: 0.5rem;">Cell 3</td>
              <td style="border: 1px solid var(--border); padding: 0.5rem;">Cell 4</td>
            </tr>
          </table>
        `;
        document.execCommand('insertHTML', false, tableHTML);
      }
      
      // Trigger change event if BlockEditor is available
      if (TwoBaseState.currentEditor && typeof TwoBaseState.currentEditor.triggerChange === 'function') {
        setTimeout(() => {
          TwoBaseState.currentEditor.triggerChange();
        }, 10);
      }
    });
  }

  function switchActiveNote(noteId) {
    TwoBaseState.activeNote = noteId;
    renderNoteTabs();
    renderNoteEditor(noteId);
    saveTwoBaseSession();
  }

  function closeNoteTab(noteId) {
    const index = TwoBaseState.openNotes.indexOf(noteId);
    if (index > -1) {
      TwoBaseState.openNotes.splice(index, 1);
    }
    
    // If this was the active note, switch to another or go back to main
    if (TwoBaseState.activeNote === noteId) {
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
    
    // Save session state
    saveTwoBaseSession();
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
  // Toolbar Options
  // ===================================

  function setupToolbarOptions() {
    if (!el.toolbarOptionsBtn || !el.toolbarOptionsMenu) return;
    
    // Toggle menu visibility
    el.toolbarOptionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      el.toolbarOptionsMenu.classList.toggle('hidden');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!el.toolbarOptionsMenu.contains(e.target) && e.target !== el.toolbarOptionsBtn) {
        el.toolbarOptionsMenu.classList.add('hidden');
      }
    });
    
    // Position buttons
    const positionBtns = el.toolbarOptionsMenu.querySelectorAll('.toolbar-position-btn');
    positionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const position = btn.dataset.position;
        setToolbarPosition(position);
        
        // Update active state
        positionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Alignment buttons
    const alignBtns = el.toolbarOptionsMenu.querySelectorAll('.toolbar-align-btn');
    alignBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const alignment = btn.dataset.align;
        setToolbarAlignment(alignment);
        
        // Update active state
        alignBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Load saved preferences
    loadToolbarPreferences();
  }
  
  function setToolbarPosition(position) {
    // Remove all position classes
    el.noteBase.classList.remove('toolbar-position-top', 'toolbar-position-right', 'toolbar-position-bottom', 'toolbar-position-left');
    
    // Add new position class (except for 'top' which is default)
    if (position !== 'top') {
      el.noteBase.classList.add(`toolbar-position-${position}`);
    }
    
    // Update state
    TwoBaseState.toolbarPosition = position;
    
    // Save to settings
    saveToolbarPreferences();
  }
  
  function setToolbarAlignment(alignment) {
    // Remove all alignment classes
    el.noteToolbarSection.classList.remove('toolbar-align-left', 'toolbar-align-center', 'toolbar-align-right');
    
    // Add new alignment class
    el.noteToolbarSection.classList.add(`toolbar-align-${alignment}`);
    
    // Update state
    TwoBaseState.toolbarAlignment = alignment;
    
    // Save to settings
    saveToolbarPreferences();
  }
  
  function loadToolbarPreferences() {
    if (!state || !state.settings) return;
    
    // Load position
    const savedPosition = state.settings.toolbarPosition || 'top';
    TwoBaseState.toolbarPosition = savedPosition;
    setToolbarPosition(savedPosition);
    
    // Load alignment
    const savedAlignment = state.settings.toolbarAlignment || 'center';
    TwoBaseState.toolbarAlignment = savedAlignment;
    setToolbarAlignment(savedAlignment);
    
    // Update active states in menu
    const positionBtn = el.toolbarOptionsMenu.querySelector(`[data-position="${savedPosition}"]`);
    if (positionBtn) {
      el.toolbarOptionsMenu.querySelectorAll('.toolbar-position-btn').forEach(b => b.classList.remove('active'));
      positionBtn.classList.add('active');
    }
    
    const alignBtn = el.toolbarOptionsMenu.querySelector(`[data-align="${savedAlignment}"]`);
    if (alignBtn) {
      el.toolbarOptionsMenu.querySelectorAll('.toolbar-align-btn').forEach(b => b.classList.remove('active'));
      alignBtn.classList.add('active');
    }
  }
  
  function saveToolbarPreferences() {
    if (!state || !state.settings) return;
    
    state.settings.toolbarPosition = TwoBaseState.toolbarPosition;
    state.settings.toolbarAlignment = TwoBaseState.toolbarAlignment;
    
    if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveSettings === 'function') {
      window.Storage.saveSettings(state.settings).then(() => {
        console.log('Toolbar preferences saved');
      }).catch(err => {
        console.error('Failed to save toolbar preferences:', err);
      });
    }
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
    
    // Clean up any old modal elements that might be lingering in the DOM
    const cleanupOldModals = () => {
      const oldModals = document.querySelectorAll('.modal-overlay, .modal');
      oldModals.forEach(modal => {
        if (modal.parentElement) {
          modal.remove();
        }
      });
    };
    cleanupOldModals();
    // Run cleanup periodically to catch any dynamically created old modals
    setInterval(cleanupOldModals, 1000);
    
    // New Toolbar Events
    setupToolbarControls();
    
    // Sidebar toggle button
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const sidebar = document.getElementById('sidebar');
    if (toggleSidebarBtn && sidebar) {
      toggleSidebarBtn.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
          // Expand sidebar
          const sidebarWidth = (state.settings && state.settings.sidebarWidth) || 280;
          sidebar.style.width = sidebarWidth + 'px';
          sidebar.classList.remove('collapsed');
          sidebar.classList.remove('narrow');
          if (state.settings) {
            state.settings.sidebarCollapsed = false;
          }
          toggleSidebarBtn.title = 'Hide sidebar';
        } else {
          // Collapse sidebar
          sidebar.style.width = ''; // Remove inline width to let CSS class take over
          sidebar.classList.add('collapsed');
          sidebar.classList.remove('narrow');
          if (state.settings) {
            state.settings.sidebarCollapsed = true;
          }
          toggleSidebarBtn.title = 'Show sidebar';
        }
        
        // Save settings
        if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveSettings === 'function' && state.settings) {
          window.Storage.saveSettings(state.settings);
        }
      });
    }
    
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
    // Keyboard shortcuts
    document.addEventListener('keydown', async (e) => {
      // Escape to go back to main base
      if (e.key === 'Escape' && TwoBaseState.currentBase === 'note') {
        switchToMainBase();
      }
      
      // Delete selected items - DISABLED: Now handled by unified Delete handler below (line 3029)
      // This prevents duplicate delete modals from appearing
      /*
      if (e.key === 'Delete' && TwoBaseState.selectedItems.length > 0) {
        // Don't delete if typing in input or editor
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
          return;
        }
        
        const count = TwoBaseState.selectedItems.length;
        showDeleteConfirmation(count, async () => {
          // ... delete logic moved to unified handler ...
        });
      }
      */
    });
    
    // Setup toolbar options
    setupToolbarOptions();
  }

  // ===================================
  // Sidebar Sections Functionality
  // ===================================

  function setupSidebarSections() {
    // Populate notebooks and folders sections
    populateNotebooksSection();
    populateFoldersSection();
    
    // Setup collapse/expand functionality
    setupSectionToggle();
  }
  
  function setupSectionToggle() {
    const sectionHeaders = document.querySelectorAll('.sidebar-section-header-text');
    
    sectionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const section = header.closest('.sidebar-section');
        section.classList.toggle('collapsed');
        
        // Save collapsed state to localStorage
        const sectionName = header.dataset.section;
        if (sectionName) {
          const isCollapsed = section.classList.contains('collapsed');
          localStorage.setItem(`sidebar-section-${sectionName}-collapsed`, isCollapsed);
        }
      });
    });
    
    // Restore collapsed states from localStorage
    sectionHeaders.forEach(header => {
      const sectionName = header.dataset.section;
      if (sectionName) {
        const isCollapsed = localStorage.getItem(`sidebar-section-${sectionName}-collapsed`) === 'true';
        if (isCollapsed) {
          const section = header.closest('.sidebar-section');
          section.classList.add('collapsed');
        }
      }
    });
  }

  function populateNotebooksSection() {
    const notebooksContent = document.getElementById('notebooksContent');
    if (!notebooksContent || !window.state) return;

    // Get the empty state message
    const emptyState = notebooksContent.querySelector('.sidebar-empty-state');
    
    // Clear all notebook items (but keep the empty state element)
    const items = notebooksContent.querySelectorAll('.sidebar-item');
    items.forEach(item => item.remove());

    // Show/hide empty state based on notes count
    if (window.state.notes.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }

    // Add each note as a notebook item
    window.state.notes.forEach(note => {
      const noteBtn = createNotebookButton(note);
      notebooksContent.appendChild(noteBtn);
    });
    
    // Add click-to-deselect on empty space
    notebooksContent.addEventListener('click', (e) => {
      if (e.target === notebooksContent) {
        // Clicked on empty space - deselect all
        document.querySelectorAll('#notebooksContent .sidebar-item.selected').forEach(item => {
          item.classList.remove('selected');
        });
      }
    });
    
    // Add right-click context menu for multi-selected items
    notebooksContent.addEventListener('contextmenu', (e) => {
      // Get selected items from both NOTEBOOKS and FOLDERS (synced selections)
      const selectedNotebooks = document.querySelectorAll('#notebooksContent .sidebar-item.selected');
      const selectedFolderNotes = document.querySelectorAll('.folder-note-item.selected');
      
      // Combine and deduplicate note IDs
      const allSelectedElements = [...selectedNotebooks, ...selectedFolderNotes];
      const noteIds = [...new Set(allSelectedElements.map(item => item.dataset.noteId).filter(id => id))];
      
      if (noteIds.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        
        const handlers = {
          onDeleteNotes: () => {
            showDeleteConfirmation(noteIds.length, () => {
              noteIds.forEach(noteId => {
                const noteIndex = window.state.notes.findIndex(n => n.id === noteId);
                if (noteIndex !== -1) {
                  const deletedNote = window.state.notes.splice(noteIndex, 1)[0];
                  
                  // Move to trash
                  if (window.state.trash) {
                    window.state.trash.push({
                      ...deletedNote,
                      deletedAt: new Date().toISOString()
                    });
                  }
                  
                  // Delete from backend
                  if (typeof window.Storage !== 'undefined' && window.Storage.useFileSystem) {
                    try {
                      if (typeof window.fileSystemService !== 'undefined') {
                        window.fileSystemService.deleteNoteFromCollection(noteId);
                      }
                    } catch (error) {
                      console.error("Error deleting note from backend:", noteId, error);
                    }
                  }
                }
              });
              
              // Save to backend
              if (typeof window.saveNotes === 'function') {
                window.saveNotes();
              }
              if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveTrash === 'function') {
                window.Storage.saveTrash(window.state.trash);
              }
              
              refreshSidebar();
              if (typeof renderWorkspaceSplit === 'function') {
                renderWorkspaceSplit(TwoBaseState.currentFolder);
              }
            });
          },
          onExportNotes: () => {
            // Use existing export functionality
            if (typeof window.exportNotes === 'function') {
              const notesToExport = window.state.notes.filter(n => noteIds.includes(n.id));
              window.exportNotes(notesToExport);
            }
          }
        };
        
        if (typeof window.showContextMenu === 'function') {
          window.showContextMenu(e.clientX, e.clientY, handlers, 'multi-note');
        }
      }
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
    
    // Click handler with Ctrl+click multi-select support
    btn.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        // Multi-select mode
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('selected');
        
        // Sync selection with folder section (for ALL notes, not just uncategorized)
        const folderNoteItem = document.querySelector(`.folder-note-item[data-note-id="${note.id}"]`);
        if (folderNoteItem) {
          if (btn.classList.contains('selected')) {
            folderNoteItem.classList.add('selected');
          } else {
            folderNoteItem.classList.remove('selected');
          }
        }
      } else {
        // Check if clicking on already selected item - if so, deselect all
        const selectedItems = document.querySelectorAll('#notebooksContent .sidebar-item.selected');
        if (selectedItems.length > 0) {
          selectedItems.forEach(item => item.classList.remove('selected'));
          // Also deselect in folders section
          document.querySelectorAll('.folder-note-item.selected').forEach(item => {
            item.classList.remove('selected');
          });
        }
        // Single select - open note
        openNoteFromSidebar(note.id);
      }
    });
    
    // Right-click context menu
    btn.addEventListener('contextmenu', (e) => {
      // Get selected items from both NOTEBOOKS and FOLDERS (synced selections)
      const selectedNotebooks = document.querySelectorAll('#notebooksContent .sidebar-item.selected');
      const selectedFolderNotes = document.querySelectorAll('.folder-note-item.selected');
      
      // Combine and deduplicate note IDs
      const allSelectedElements = [...selectedNotebooks, ...selectedFolderNotes];
      const noteIds = [...new Set(allSelectedElements.map(item => item.dataset.noteId).filter(id => id))];
      
      // If this button is selected and there are selections, show multi-select menu
      if (btn.classList.contains('selected') && noteIds.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        
        const handlers = {
          onDeleteNotes: () => {
            showDeleteConfirmation(noteIds.length, () => {
              noteIds.forEach(noteId => {
                const noteIndex = window.state.notes.findIndex(n => n.id === noteId);
                if (noteIndex !== -1) {
                  const deletedNote = window.state.notes.splice(noteIndex, 1)[0];
                  
                  // Move to trash
                  if (window.state.trash) {
                    window.state.trash.push({
                      ...deletedNote,
                      deletedAt: new Date().toISOString()
                    });
                  }
                  
                  // Delete from backend
                  if (typeof window.Storage !== 'undefined' && window.Storage.useFileSystem) {
                    try {
                      if (typeof window.fileSystemService !== 'undefined') {
                        window.fileSystemService.deleteNoteFromCollection(noteId);
                      }
                    } catch (error) {
                      console.error("Error deleting note from backend:", noteId, error);
                    }
                  }
                }
              });
              
              // Save to backend
              if (typeof window.saveNotes === 'function') {
                window.saveNotes();
              }
              if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveTrash === 'function') {
                window.Storage.saveTrash(window.state.trash);
              }
              
              refreshSidebar();
              if (typeof renderWorkspaceSplit === 'function') {
                renderWorkspaceSplit(TwoBaseState.currentFolder);
              }
            });
          },
          onExportNotes: () => {
            if (typeof window.exportNotes === 'function') {
              const notesToExport = window.state.notes.filter(n => noteIds.includes(n.id));
              window.exportNotes(notesToExport);
            }
          }
        };
        
        if (typeof window.showContextMenu === 'function') {
          window.showContextMenu(e.clientX, e.clientY, handlers, 'multi-note');
        }
      }
      // Otherwise, let the default single-note context menu from app.js handle it
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
    // Open note in note base (no active state - that's for multi-selection only)
    openNoteFromWorkspace(noteId);
  }

  // Helper function to calculate folder item count (notes + direct subfolders)
  function calculateFolderItemCount(folderId) {
    // Handle Uncategorized folder special case
    if (folderId === 'uncategorized') {
      return window.state.notes.filter(n => !n.folderId).length;
    }

    // Count direct notes in this folder
    const directNotes = window.state.notes.filter(n => n.folderId === folderId).length;
    
    // Count direct subfolders (not recursive, just immediate children)
    const directSubfolders = window.state.folders.filter(f => f.parentId === folderId).length;
    
    // Total = direct notes + direct subfolders
    return directNotes + directSubfolders;
  }

  function populateFoldersSection() {
    const foldersContent = document.getElementById('foldersContent');
    if (!foldersContent || !window.state) return;

    foldersContent.innerHTML = '';

    // Add "Uncategorized" folder with expandable note list
    const uncategorizedNotes = window.state.notes.filter(n => !n.folderId);
    const uncategorizedFolder = createExpandableFolderItem({
      id: 'uncategorized',
      name: 'Uncategorized',
      isSpecial: true
    }, uncategorizedNotes, 0);
    foldersContent.appendChild(uncategorizedFolder);

    // Add all root-level custom folders with their notes and subfolders
    const rootFolders = window.state.folders.filter(f => !f.parentId);
    rootFolders.forEach(folder => {
      const folderElement = renderFolderWithSubfolders(folder, 0);
      foldersContent.appendChild(folderElement);
    });
    
    // Setup simple root drop zone
    setupRootDropZone(foldersContent);
    
    // Add click-to-deselect on empty space
    foldersContent.addEventListener('click', (e) => {
      if (e.target === foldersContent) {
        // Clicked on empty space - deselect all folder notes
        document.querySelectorAll('.folder-note-item.selected').forEach(item => {
          item.classList.remove('selected');
        });
      }
    });
    
    // Update base layer to reflect sidebar changes
    if (typeof renderWorkspaceSplit === 'function' && TwoBaseState) {
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  function renderFolderWithSubfolders(folder, depth) {
    const folderNotes = window.state.notes.filter(n => n.folderId === folder.id);
    const container = createExpandableFolderItem(folder, folderNotes, depth);
    
    // Get subfolders
    const subfolders = window.state.folders.filter(f => f.parentId === folder.id);
    
    if (subfolders.length > 0) {
      // Create a container for subfolders within the notes list
      const notesList = container.querySelector('.folder-notes-list');
      
      subfolders.forEach(subfolder => {
        const subfolderElement = renderFolderWithSubfolders(subfolder, depth + 1);
        notesList.appendChild(subfolderElement);
      });
    }
    
    return container;
  }

  function createExpandableFolderItem(folder, notes, depth = 0) {
    const container = document.createElement('div');
    container.className = 'folder-tree-item';
    container.dataset.folderId = folder.id;
    // container.style.marginLeft = (depth * 12) + 'px'; // Indent based on depth - REMOVED for right alignment
    
    // Check if folder should be expanded (from backend settings or localStorage)
    let isExpanded = false;
    if (window.state && window.state.settings && window.state.settings.foldersExpanded) {
      isExpanded = window.state.settings.foldersExpanded[folder.id] === true;
    } else {
      // Fallback to localStorage
      isExpanded = localStorage.getItem(`folder-expanded-${folder.id}`) === 'true';
    }
    if (isExpanded) {
      container.classList.add('expanded');
    }

    // Folder header (clickable to expand/collapse)
    const header = document.createElement('div');
    header.className = 'folder-header';
    header.style.paddingLeft = (30 + depth * 12) + 'px';
    // Set data-folder-id for context menu detection (app.js looks for this)
    header.dataset.folderId = folder.id;
    
    // Chevron icon - using same SVG as section headers
    const chevron = document.createElement('div');
    chevron.className = 'folder-chevron';
    chevron.innerHTML = '<svg class="section-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    
    // Folder icon
    const folderIconDiv = document.createElement('div');
    folderIconDiv.className = 'folder-icon';
    folderIconDiv.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
    
    // Folder name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'folder-name';
    nameSpan.textContent = folder.name;
    
    // Note count badge - show total items (notes + subfolders)
    const countBadge = document.createElement('span');
    countBadge.className = 'item-count';
    countBadge.textContent = calculateFolderItemCount(folder.id);
    
    // Assemble header: [Icon] [Name] [Count] ......... [Chevron]
    header.appendChild(folderIconDiv);
    header.appendChild(nameSpan);
    header.appendChild(countBadge);
    header.appendChild(chevron);
    
    // Chevron click - ONLY toggle expansion
    chevron.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent any default behavior
      toggleFolderExpansion(folder.id, container);
    });
    
    // Header click (except chevron) - open workspace preview
    header.addEventListener('click', (e) => {
      // Don't do anything if clicking on chevron
      if (e.target.closest('.folder-chevron')) {
        e.stopPropagation();
        return;
      }
      
      // Don't toggle if clicking on a note inside
      if (e.target.closest('.folder-note-item')) return;
      
      // Navigate to this folder in the workspace (base layer preview)
      if (folder.id === 'uncategorized') {
        renderWorkspaceSplit(null);
      } else {
        renderWorkspaceSplit(folder.id);
      }
    });
    
    // Right-click context menu for folders
    header.addEventListener('contextmenu', (e) => {
      // Don't show menu for uncategorized
      if (folder.id === 'uncategorized') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // Allow event to bubble to document so app.js can handle it
      // app.js has the global context menu handler
    });
    
    // Drag-and-drop on folder header
    setupFolderDropZone(header, folder.id);
    
    // Make folder draggable (except uncategorized)
    if (folder.id !== 'uncategorized') {
      header.draggable = true;
      
      header.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/folder-id', folder.id);
        header.classList.add('dragging');
      });
      
      header.addEventListener('dragend', () => {
        header.classList.remove('dragging');
      });
    }
    
    // Notes list (expandable)
    const notesList = document.createElement('div');
    notesList.className = 'folder-notes-list';
    
    if (notes.length > 0) {
      notes.forEach(note => {
        const noteItem = createFolderNoteItem(note, folder.id, depth + 1);
        notesList.appendChild(noteItem);
      });
    } else {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'folder-empty-message';
      emptyMsg.textContent = 'No notes in this folder';
      notesList.appendChild(emptyMsg);
    }
    
    container.appendChild(header);
    container.appendChild(notesList);
    
    return container;
  }

  function createFolderNoteItem(note, folderId, depth = 1) {
    const item = document.createElement('div');
    item.className = 'folder-note-item';
    item.dataset.noteId = note.id;
    item.style.paddingLeft = (30 + depth * 12) + 'px';
    item.draggable = true;
    
    // Note icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'note-icon';
    iconDiv.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
    
    // Note title
    const title = document.createElement('span');
    title.className = 'note-title';
    title.textContent = note.title || 'Untitled';
    
    item.appendChild(iconDiv);
    item.appendChild(title);
    
    // Click to open note (or select if Ctrl is held)
    item.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+click: toggle selection instead of opening
        e.stopPropagation();
        const index = state.selectedItems.has(note.id) ? 
          (state.selectedItems.delete(note.id), -1) : 
          (state.selectedItems.add(note.id), 1);
        
        // Toggle visual selection
        item.classList.toggle('selected');
        
        // Sync selection with notebooks section (for ALL notes, not just uncategorized)
        const notebookBtn = document.querySelector(`#notebooksContent .sidebar-item[data-note-id="${note.id}"]`);
        if (notebookBtn) {
          if (item.classList.contains('selected')) {
            notebookBtn.classList.add('selected');
          } else {
            notebookBtn.classList.remove('selected');
          }
        }
      } else {
        // Normal click: open note
        openNoteFromSidebar(note.id);
      }
    });
    
    // Right-click context menu for multi-selection
    item.addEventListener('contextmenu', (e) => {
      // Get selected items from both NOTEBOOKS and FOLDERS (synced selections)
      const selectedNotebooks = document.querySelectorAll('#notebooksContent .sidebar-item.selected');
      const selectedFolderNotes = document.querySelectorAll('.folder-note-item.selected');
      
      // Combine and deduplicate note IDs
      const allSelectedElements = [...selectedNotebooks, ...selectedFolderNotes];
      const noteIds = [...new Set(allSelectedElements.map(el => el.dataset.noteId).filter(id => id))];
      
      // If this item is selected and there are selections, show multi-select menu
      if (item.classList.contains('selected') && noteIds.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        
        const handlers = {
          onDeleteNotes: () => {
            showDeleteConfirmation(noteIds.length, () => {
              noteIds.forEach(noteId => {
                const noteIndex = window.state.notes.findIndex(n => n.id === noteId);
                if (noteIndex !== -1) {
                  const deletedNote = window.state.notes.splice(noteIndex, 1)[0];
                  
                  // Move to trash
                  if (window.state.trash) {
                    window.state.trash.push({
                      ...deletedNote,
                      deletedAt: new Date().toISOString()
                    });
                  }
                  
                  // Delete from backend
                  if (typeof window.Storage !== 'undefined' && window.Storage.useFileSystem) {
                    try {
                      if (typeof window.fileSystemService !== 'undefined') {
                        window.fileSystemService.deleteNoteFromCollection(noteId);
                      }
                    } catch (error) {
                      console.error("Error deleting note from backend:", noteId, error);
                    }
                  }
                }
              });
              
              // Save to backend
              if (typeof window.saveNotes === 'function') {
                window.saveNotes();
              }
              if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveTrash === 'function') {
                window.Storage.saveTrash(window.state.trash);
              }
              
              refreshSidebar();
              if (typeof renderWorkspaceSplit === 'function') {
                renderWorkspaceSplit(TwoBaseState.currentFolder);
              }
            });
          },
          onExportNotes: () => {
            if (typeof window.exportNotes === 'function') {
              const notesToExport = window.state.notes.filter(n => noteIds.includes(n.id));
              window.exportNotes(notesToExport);
            }
          }
        };
        
        if (typeof window.showContextMenu === 'function') {
          window.showContextMenu(e.clientX, e.clientY, handlers, 'multi-note');
        }
      }
      // Otherwise, let the default single-note context menu from app.js handle it
    });
    
    // Drag handlers - support dragging multiple selected items
    item.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      
      // If this note is selected and there are multiple selections, drag all
      if (state.selectedItems.has(note.id) && state.selectedItems.size > 1) {
        // Drag all selected notes
        const selectedIds = Array.from(state.selectedItems);
        e.dataTransfer.setData('text/note-ids', JSON.stringify(selectedIds));
        e.dataTransfer.setData('text/multi-drag', 'true');
        
        // Add dragging class to all selected items
        document.querySelectorAll('.folder-note-item.selected').forEach(el => {
          el.classList.add('dragging');
        });
      } else {
        // Drag single note
        e.dataTransfer.setData('text/note-id', note.id);
        item.classList.add('dragging');
      }
    });
    
    item.addEventListener('dragend', () => {
      // Remove dragging class from all items
      item.classList.remove('dragging');
      document.querySelectorAll('.folder-note-item.dragging').forEach(el => {
        el.classList.remove('dragging');
      });
    });
    
    return item;
  }

  function toggleFolderExpansion(folderId, container) {
    const isExpanded = container.classList.toggle('expanded');
    
    console.log(`Toggling folder ${folderId}: ${isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
    
    // Save state to localStorage for immediate persistence
    localStorage.setItem(`folder-expanded-${folderId}`, isExpanded);
    
    // Save to backend settings
    if (window.state && window.state.settings) {
      if (!window.state.settings.foldersExpanded) {
        window.state.settings.foldersExpanded = {};
      }
      window.state.settings.foldersExpanded[folderId] = isExpanded;
      
      // Save settings to backend
      if (typeof window.Storage !== 'undefined' && window.Storage.saveSettings) {
        window.Storage.saveSettings(window.state.settings).catch(err => {
          console.error('Failed to save folder expansion state:', err);
        });
      }
    }
  }

  function setupFolderDropZone(element, folderId) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      
      const hasNote = e.dataTransfer.types.includes('text/note-id');
      const hasFolder = e.dataTransfer.types.includes('text/folder-id');
      
      if (!hasNote && !hasFolder) return;
      
      // For folders, allow reordering
      if (hasFolder) {
        const rect = element.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        
        // Clear previous states
        element.classList.remove('drag-over', 'drop-before', 'drop-after');
        element.style.background = '';
        element.style.borderTop = '';
        element.style.borderBottom = '';
        
        // Top 30% = insert before
        if (y < height * 0.3) {
          element.classList.add('drop-before');
          element.style.borderTop = '2px solid var(--accent)';
        }
        // Bottom 30% = insert after
        else if (y > height * 0.7) {
          element.classList.add('drop-after');
          element.style.borderBottom = '2px solid var(--accent)';
        }
        // Middle = nest inside
        else {
          element.classList.add('drag-over');
          element.style.background = 'rgba(34, 197, 94, 0.1)';
        }
      } else {
        // Notes just nest inside
        element.classList.add('drag-over');
        element.style.background = 'rgba(34, 197, 94, 0.1)';
      }
    });
    
    element.addEventListener('dragleave', (e) => {
      if (!element.contains(e.relatedTarget)) {
        element.classList.remove('drag-over', 'drop-before', 'drop-after');
        element.style.background = '';
        element.style.borderTop = '';
        element.style.borderBottom = '';
      }
    });
    
    element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isBefore = element.classList.contains('drop-before');
      const isAfter = element.classList.contains('drop-after');
      const isInside = element.classList.contains('drag-over');
      
      element.classList.remove('drag-over', 'drop-before', 'drop-after');
      element.style.background = '';
      element.style.borderTop = '';
      element.style.borderBottom = '';
      
      const isMultiDrag = e.dataTransfer.getData('text/multi-drag') === 'true';
      const draggedNoteId = e.dataTransfer.getData('text/note-id');
      const draggedFolderId = e.dataTransfer.getData('text/folder-id');
      
      if (isMultiDrag) {
        const noteIdsJson = e.dataTransfer.getData('text/note-ids');
        if (noteIdsJson) {
          try {
            const noteIds = JSON.parse(noteIdsJson);
            const targetFolderId = folderId === 'uncategorized' ? null : folderId;
            
            noteIds.forEach(noteId => {
              const note = state.notes.find(n => n.id === noteId);
              if (note) {
                note.folderId = targetFolderId;
                note.updatedAt = new Date().toISOString();
              }
            });
            
            if (typeof window.saveNotes === 'function') {
              window.saveNotes();
            }
            renderSidebar();
          } catch (error) {
            console.error('Error parsing multi-drag note IDs:', error);
          }
        }
      } else if (draggedNoteId) {
        const targetFolderId = folderId === 'uncategorized' ? null : folderId;
        const note = state.notes.find(n => n.id === draggedNoteId);
        if (note) {
          note.folderId = targetFolderId;
          note.updatedAt = new Date().toISOString();
          
          if (typeof window.saveNotes === 'function') {
            window.saveNotes();
          }
          renderSidebar();
        }
      } else if (draggedFolderId) {
        if (draggedFolderId === folderId) return;
        
        if (isInside) {
          // Nest inside
          const targetFolderId = folderId === 'uncategorized' ? null : folderId;
          moveFolderToFolder(draggedFolderId, targetFolderId);
        } else if (isBefore || isAfter) {
          // Reorder as sibling
          const draggedFolder = window.state.folders.find(f => f.id === draggedFolderId);
          const targetFolder = window.state.folders.find(f => f.id === folderId);
          
          if (!draggedFolder || !targetFolder) return;
          
          // Set same parent
          const targetParentId = targetFolder.parentId || null;
          draggedFolder.parentId = targetParentId;
          
          // Reorder in array
          const draggedIndex = window.state.folders.indexOf(draggedFolder);
          const targetIndex = window.state.folders.indexOf(targetFolder);
          
          // Remove from current position
          window.state.folders.splice(draggedIndex, 1);
          
          // Insert at new position
          const newTargetIndex = window.state.folders.indexOf(targetFolder);
          const insertIndex = isAfter ? newTargetIndex + 1 : newTargetIndex;
          window.state.folders.splice(insertIndex, 0, draggedFolder);
          
          // Save changes
          if (typeof window.saveFolders === 'function') {
            window.saveFolders();
          }
          
          populateFoldersSection();
        }
      }
    });
  }

  function moveFolderToFolder(folderId, targetParentId) {
    const folder = window.state.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    // Prevent circular dependency (dropping parent into child)
    if (targetParentId) {
      let current = window.state.folders.find(f => f.id === targetParentId);
      while (current) {
        if (current.id === folderId) {
          console.warn('Cannot move folder into its own child');
          return;
        }
        current = window.state.folders.find(f => f.id === current.parentId);
      }
    }
    
    // Update folder's parent
    folder.parentId = targetParentId;
    
    // Save changes
    if (typeof window.saveFolders === 'function') {
      window.saveFolders();
    }
    
    // Refresh both sections instantly
    populateFoldersSection();
    
    // Show feedback
    console.log(`Moved folder "${folder.name}"`);
  }

  function setupRootDropZone(foldersContent) {
    // Create invisible drop zone
    const dropZone = document.createElement('div');
    dropZone.className = 'root-drop-zone';
    dropZone.style.cssText = 'min-height: 40px; margin: 8px; display: none; background: rgba(59, 130, 246, 0.03);';
    foldersContent.appendChild(dropZone);
    
    // Show/hide drop zone when dragging folders
    foldersContent.addEventListener('dragover', (e) => {
      const hasFolder = e.dataTransfer.types.includes('text/folder-id');
      if (!hasFolder) return;
      
      // Check if over a folder
      const overFolder = e.target.closest('.folder-header');
      if (!overFolder) {
        e.preventDefault();
        dropZone.style.display = 'block';
      } else {
        dropZone.style.display = 'none';
      }
    });
    
    foldersContent.addEventListener('dragleave', (e) => {
      if (!foldersContent.contains(e.relatedTarget)) {
        dropZone.style.display = 'none';
      }
    });
    
    // Handle drop on the zone
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const draggedFolderId = e.dataTransfer.getData('text/folder-id');
      if (draggedFolderId) {
        moveFolderToFolder(draggedFolderId, null); // null = root level
      }
      
      dropZone.style.display = 'none';
    });
    
    // Hide on drag end
    document.addEventListener('dragend', () => {
      dropZone.style.display = 'none';
    });
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
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
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
    
    // Save to backend settings
    if (window.state && window.state.settings) {
      window.state.settings.workspaceViewMode = newView;
      
      // Save settings to backend
      if (typeof window.Storage !== 'undefined' && window.Storage.saveSettings) {
        window.Storage.saveSettings(window.state.settings).catch(err => {
          console.error('Failed to save view mode:', err);
        });
      }
    }

    // Re-render current view with new layout
    if (TwoBaseState.currentFolder === 'uncategorized') {
      renderUncategorizedNotes();
    } else {
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  // ===================================
  // Toolbar Controls Functionality
  // ===================================

  function setupToolbarControls() {
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        // Open sidebar if closed
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('collapsed')) {
          // Trigger the toggle button to ensure state is consistent
          const toggleBtn = document.getElementById('toggleSidebarBtn');
          if (toggleBtn) {
            toggleBtn.click();
          } else {
            sidebar.classList.remove('collapsed');
          }
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 100); // Small delay to allow sidebar transition
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

  function openNoteInNoteBase(noteId) {
    // Switch to note base
    switchToNoteBase();
    
    // Check if note is already open
    if (!TwoBaseState.openNotes.includes(noteId)) {
      TwoBaseState.openNotes.push(noteId);
    }
    
    // Set as active
    TwoBaseState.activeNote = noteId;
    
    // Render tabs and editor
    renderNoteTabs();
    renderNoteEditor(noteId);
    
    // Save session
    saveTwoBaseSession();
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
    
    // Assign global references to module-level variables
    state = window.state;
    getIcon = window.getIcon;
    escapeHtml = window.escapeHtml;
    
    console.log('Two-Base: Initializing...');
    initElements();
    
    // Home button - show welcome pane
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      // Add our handler first with capture phase to run before app.js
      homeBtn.addEventListener('click', (e) => {
        e.stopImmediatePropagation(); // Prevent app.js handler from running
        
        // Clear app.js state to prevent errors
        if (window.state) {
          window.state.left = { tabs: [], active: null };
          window.state.right = { tabs: [], active: null };
        }
        
        // Reset TwoBase state
        TwoBaseState.currentFolder = null;
        TwoBaseState.currentBase = 'home';
        
        // Hide workspace and note base
        if (el.workspaceSplit) el.workspaceSplit.style.display = 'none';
        if (el.noteBase) el.noteBase.classList.add('hidden');
        
        // Show empty state (welcome pane)
        const emptyState = document.getElementById('empty-state');
        if (emptyState) emptyState.classList.remove('hidden');
        
        // Save session state so it persists on refresh
        saveTwoBaseSession();
      }, true); // Use capture phase
    }
    
    if (!el.workspaceSplit || !el.noteBase) {
      console.error('Two-Base: Required DOM elements not found');
      return;
    }
    
    setupEventListeners();
    
    // Load saved view mode from backend settings
    if (window.state && window.state.settings && window.state.settings.workspaceViewMode) {
      const savedViewMode = window.state.settings.workspaceViewMode;
      TwoBaseState.viewMode = savedViewMode;
      
      // Update the view toggle button to reflect saved state
      const viewToggleBtn = document.getElementById('viewToggleBtn');
      if (viewToggleBtn) {
        viewToggleBtn.dataset.view = savedViewMode;
        viewToggleBtn.title = savedViewMode === 'grid' ? 'Grid view' : 'List view';
        
        // Update icon to match saved view mode
        const svg = viewToggleBtn.querySelector('svg');
        if (svg && savedViewMode === 'list') {
          svg.innerHTML = `
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          `;
        }
      }
    }
    
    // Restore previous session (open tabs and view state)
    // This will handle showing the correct view (main base, note base, or welcome)
    restoreTwoBaseSession();
    
    console.log('Two-Base: Initialized successfully');
  }
  
  // Function to refresh workspace - called by app.js after renderSidebar
  function refreshWorkspace() {
    if (TwoBaseState && typeof renderWorkspaceSplit === 'function') {
      renderWorkspaceSplit(TwoBaseState.currentFolder);
    }
  }

  
  // Function to refresh sidebar sections - called by app.js after note/folder changes
  function refreshSidebar() {
    populateNotebooksSection();
    populateFoldersSection();
  }

  // Custom delete confirmation dialog
  function showDeleteConfirmation(count, onConfirm) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = 'background: var(--panel); border-radius: 12px; padding: 24px; min-width: 300px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);';
    
    // Title
    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0 0 12px 0; color: var(--text); font-size: 18px;';
    title.textContent = 'Delete Notes';
    
    // Message
    const message = document.createElement('p');
    message.style.cssText = 'margin: 0 0 20px 0; color: var(--muted); font-size: 14px;';
    message.textContent = `Delete ${count} selected note${count > 1 ? 's' : ''}?`;
    
    // Buttons container
    const buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 6px; background: var(--panel-2); color: var(--text); cursor: pointer; font-size: 14px;';
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 6px; background: #ef4444; color: white; cursor: pointer; font-size: 14px; font-weight: 500;';
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(deleteBtn);
    
    dialog.appendChild(title);
    dialog.appendChild(message);
    dialog.appendChild(buttons);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Focus delete button
    deleteBtn.focus();
    
    // Event handlers
    const close = () => document.body.removeChild(overlay);
    
    cancelBtn.addEventListener('click', close);
    deleteBtn.addEventListener('click', () => {
      close();
      onConfirm();
    });
    
    // Keyboard support
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        close();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });
    
    // Click overlay to cancel
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  // Add keyboard handler for Delete key to work with selected items
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete') {
      // Check for selected items in notebooks
      const selectedNotebooks = document.querySelectorAll('#notebooksContent .sidebar-item.selected');
      // Check for selected items in folders
      const selectedFolderNotes = document.querySelectorAll('.folder-note-item.selected');
      
      const allSelected = [...selectedNotebooks, ...selectedFolderNotes];
      
      if (allSelected.length > 0) {
        e.preventDefault();
        e.stopPropagation(); // Prevent other Delete handlers from firing
        
        // Get unique note IDs (deduplicate in case same note selected in both sections)
        const noteIds = [...new Set(allSelected.map(el => el.dataset.noteId).filter(id => id))];
        
        if (noteIds.length === 0) return;
        
        showDeleteConfirmation(noteIds.length, () => {
          // Delete all selected notes
          noteIds.forEach(noteId => {
            const noteIndex = window.state.notes.findIndex(n => n.id === noteId);
            if (noteIndex !== -1) {
              const deletedNote = window.state.notes.splice(noteIndex, 1)[0];
              
              // Move to trash
              if (window.state.trash) {
                window.state.trash.push({
                  ...deletedNote,
                  deletedAt: new Date().toISOString()
                });
              }
              
              // Delete from backend
              if (typeof window.Storage !== 'undefined' && window.Storage.useFileSystem) {
                try {
                  if (typeof window.fileSystemService !== 'undefined') {
                    window.fileSystemService.deleteNoteFromCollection(noteId);
                  }
                } catch (error) {
                  console.error("Error deleting note from backend:", noteId, error);
                }
              }
            }
          });
          
          // Save to backend
          if (typeof window.saveNotes === 'function') {
            window.saveNotes();
          }
          if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveTrash === 'function') {
            window.Storage.saveTrash(window.state.trash);
          }
          
          // Refresh UI
          refreshSidebar();
          if (typeof renderWorkspaceSplit === 'function') {
            renderWorkspaceSplit(TwoBaseState.currentFolder);
          }
        });
      }
    }
  });

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
    refreshSidebar,  // Export sidebar refresh function
    showDeleteConfirmation,  // Export custom delete dialog
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
