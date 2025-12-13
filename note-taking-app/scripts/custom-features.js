// Custom Features for Note-Taking App

// Global UI elements
let topbar, sidebar, footer;

// Show loading spinner on startup
window.addEventListener("load", () => {
  const loader = document.getElementById("appLoader");
  if (loader) {
    setTimeout(() => {
      loader.classList.add("hidden");
      console.log("✓ App loaded");
    }, 500);
  }
});

// Fullscreen functionality
let isFullscreen = false;
let currentFontSize = 16;

// Theme management
const themes = [
  { name: "Dark", class: "" }, // Default (no class needed for :root)
  { name: "Light", class: "theme-light" },
  { name: "Classic", class: "theme-classic" },
];
let currentThemeIndex = 0;

// Workspace management
let workspaces = [];
let currentWorkspaceId = null;
let currentLayout = "centered"; // or "full"

// Electron-based file saving (saves directly to D:\MyNotes folder)
let isElectronApp = false;
let dataDirectory = null;

// Auto-recovery system
const AUTO_BACKUP_INTERVAL = 60000; // Backup every 60 seconds
let autoBackupTimer = null;

// Initialize custom features when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme carousel
  initializeThemeCarousel();
  // Initialize font size
  updateAllFontSizes(currentFontSize);

  // Monitor split mode changes and update body class
  observeSplitMode();

  // Fix fullscreen resizer to respect padding
  fixFullscreenResizer();

  // Add fullscreen keyboard shortcut (F12)
  document.addEventListener("keydown", (e) => {
    if (e.key === "F12") {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // Set up mutation observer to handle dynamically created editors
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Element node
          setupEditorFeatures(node);
        }
      });
    });
  });

  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial setup for existing elements
  setupAllEditors();

  // Setup close app button
  const closeAppBtn = document.getElementById("closeAppBtn");
  if (closeAppBtn) {
    closeAppBtn.addEventListener("click", handleCloseApp);
  }

  // Initialize auto-recovery system
  initializeAutoRecovery();

  // Check if running in Electron
  if (window.electronAPI && window.electronAPI.isElectron) {
    isElectronApp = true;
    console.log("✓ Running in Electron - using backend file system");

    // Set data directory for display
    dataDirectory = "D:\\MyNotes";
    console.log("✓ Data directory:", dataDirectory);
    updateFileNameDisplay("Save location: " + dataDirectory);

    // Auto-save disabled - only manual Ctrl+S saves
    console.log("ℹ Auto-save disabled - use Ctrl+S to save");
  } else {
    console.log("⚠ Not running in Electron - file saving disabled");
  }

  // Setup global Ctrl+S handler
  setupGlobalCtrlS();

  // Initialize workspace system
  initializeWorkspaces();

  // Initialize layout toggle
  initializeLayoutToggle();

  // Load and apply saved theme
  loadSavedTheme();

  // Setup safe refresh button
  setupSafeRefresh();

  // Setup workspace bar toggle
  setupWorkspaceBarToggle();

  // Setup browser feature
  setupBrowserFeature();

  // Setup browser drag-to-split
  setupBrowserDragToSplit();
});

// Toggle fullscreen mode
function toggleFullscreen() {
  isFullscreen = !isFullscreen;
  const sidebar = document.getElementById("sidebar");
  if (isFullscreen) {
    document.body.classList.add("fullscreen");
    // Reset sidebar to 280px when entering fullscreen
    if (sidebar) {
      sidebar.style.width = "280px";
    }
    createHoverZones();
  } else {
    document.body.classList.remove("fullscreen");
    removeHoverZones();
  }
}

// Observe split mode changes and sync body class
function observeSplitMode() {
  // Initial check
  if (window.state && window.state.splitMode) {
    document.body.classList.add("split-mode");
  }

  // Poll for split mode changes (since there's no event system)
  setInterval(() => {
    if (window.state) {
      if (
        window.state.splitMode &&
        !document.body.classList.contains("split-mode")
      ) {
        document.body.classList.add("split-mode");
      } else if (
        !window.state.splitMode &&
        document.body.classList.contains("split-mode")
      ) {
        document.body.classList.remove("split-mode");
      }
    }
  }, 100);
}

// Fix fullscreen resizer to respect padding
function fixFullscreenResizer() {
  // Wait a bit for the resizer to be initialized by app.js
  setTimeout(() => {
    const resizer = document.querySelector(".resizer");
    if (!resizer) return;

    resizer.addEventListener(
      "mousedown",
      (e) => {
        // Only override behavior in fullscreen mode
        if (!document.body.classList.contains("fullscreen")) return;

        e.stopPropagation();
        e.preventDefault();

        const workspace = document.querySelector(".workspace");
        if (!workspace) return;

        let dragging = true;
        const startX = e.clientX;
        const rect = workspace.getBoundingClientRect();
        // Account for 8px padding on each side
        const totalWidth = rect.width - 16;
        const startColumns =
          window.getComputedStyle(workspace).gridTemplateColumns;
        const cols = startColumns.split(" ");
        const leftStart = parseFloat(cols[0]);
        const rightStart = parseFloat(cols[2]);
        const currentRatio = leftStart / (leftStart + rightStart);

        const onMove = (e) => {
          if (!dragging) return;

          const dx = e.clientX - startX;
          const newLeft = totalWidth * currentRatio + dx;
          const newRight = totalWidth - newLeft - 4;

          // Minimum widths
          let leftPx = Math.max(200, newLeft);
          let rightPx = Math.max(200, newRight);

          // Adjust if total exceeds available space
          const total = leftPx + rightPx + 4;
          if (total > totalWidth) {
            const ratio = totalWidth / total;
            leftPx *= ratio;
            rightPx *= ratio;
          }

          workspace.style.gridTemplateColumns = `${leftPx}px 4px ${rightPx}px`;
        };

        const onUp = () => {
          dragging = false;
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      },
      true
    ); // Use capture to intercept before app.js handler
  }, 500);
}

// Create hover zones for fullscreen mode
function createHoverZones() {
  // Create hover zones for header and sidebar
  const headerZone = document.createElement("div");
  headerZone.className = "header-hover-zone";
  document.body.appendChild(headerZone);

  const sidebarZone = document.createElement("div");
  sidebarZone.className = "sidebar-hover-zone";
  document.body.appendChild(sidebarZone);

  // Footer zone disabled
  // const footerZone = document.createElement("div");
  // footerZone.className = "footer-hover-zone";
  // document.body.appendChild(footerZone);

  const header = document.querySelector(".topbar");
  const sidebar = document.querySelector(".sidebar");
  // const footer = document.querySelector(".workspace-footer");

  // Header hover
  headerZone.addEventListener("mouseenter", () => {
    if (header) header.classList.add("visible");
  });

  header?.addEventListener("mouseleave", () => {
    setTimeout(() => {
      if (!header.matches(":hover")) {
        header.classList.remove("visible");
      }
    }, 300);
  });

  // Sidebar hover - FORCE SHOW even if collapsed
  sidebarZone.addEventListener("mouseenter", () => {
    if (sidebar) {
      // Temporarily remove collapsed class to allow hover
      const wasCollapsed = sidebar.classList.contains("collapsed");
      if (wasCollapsed) {
        sidebar.dataset.wasCollapsed = "true";
        sidebar.classList.remove("collapsed");
      }
      sidebar.classList.add("visible");
    }
  });

  sidebar?.addEventListener("mouseleave", () => {
    setTimeout(() => {
      if (!sidebar.matches(":hover")) {
        sidebar.classList.remove("visible");
        // Restore collapsed state if it was collapsed
        if (sidebar.dataset.wasCollapsed === "true") {
          sidebar.classList.add("collapsed");
          delete sidebar.dataset.wasCollapsed;
        }
      }
    }, 300);
  });

  // Footer hover is now handled by setupWorkspaceFooterHover() globally - DISABLED

  // Keep panels open when interacting with them
  document.addEventListener("click", (e) => {
    if (topbar && topbar.contains(e.target)) {
      showHeader();
    }
    // Sidebar visibility is handled by hover zones
    // Footer disabled
    // if (footer && footer.contains(e.target)) {
    //   showFooter();
    // }
  });
}

// Remove hover zones when exiting fullscreen
function removeHoverZones() {
  const headerZone = document.querySelector(".header-hover-zone");
  const sidebarZone = document.querySelector(".sidebar-hover-zone");
  const footerZone = document.querySelector(".footer-hover-zone");
  if (headerZone) headerZone.remove();
  if (sidebarZone) sidebarZone.remove();
  if (footerZone) footerZone.remove();

  const header = document.querySelector(".topbar");
  const sidebar = document.querySelector(".sidebar");
  if (header) header.classList.remove("visible");
  if (sidebar) sidebar.classList.remove("visible");
}

// Setup features for all existing editors
function setupAllEditors() {
  document.querySelectorAll(".editor").forEach((editor) => {
    setupEditorFeatures(editor);
  });
}

// Setup features for a specific editor or its container
function setupEditorFeatures(container) {
  // Find editors within the container
  const editors =
    container.classList && container.classList.contains("editor")
      ? [container]
      : container.querySelectorAll
      ? container.querySelectorAll(".editor")
      : [];

  editors.forEach((editor) => {
    // Set up editor tools menu
    const editorToolsMenu = editor.querySelector(".editor-tools-menu");
    const editorToolsBtn = editor.querySelector(".editor-tools-btn");
    if (
      editorToolsMenu &&
      editorToolsBtn &&
      !editorToolsBtn.hasAttribute("data-tools-handled")
    ) {
      editorToolsBtn.setAttribute("data-tools-handled", "true");

      editorToolsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        editorToolsMenu.classList.toggle("open");
      });

      // Close menu when clicking outside
      document.addEventListener("click", (e) => {
        if (!editorToolsMenu.contains(e.target)) {
          editorToolsMenu.classList.remove("open");
        }
      });

      // Handle tools menu actions
      const duplicateBtn = editorToolsMenu.querySelector(
        ".editor-duplicate-btn"
      );
      if (duplicateBtn) {
        duplicateBtn.addEventListener("click", () => {
          document.getElementById("duplicateBtn")?.click();
          editorToolsMenu.classList.remove("open");
        });
      }

      const deleteBtn = editorToolsMenu.querySelector(".editor-delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          editorToolsMenu.classList.remove("open");

          // Trigger the actual delete button with a proper click event
          setTimeout(() => {
            const btn = document.getElementById("deleteBtn");
            if (btn) {
              // Create and dispatch a proper mouse event
              const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              btn.dispatchEvent(clickEvent);
            }
          }, 50);
        });
      }

      const trashBtn = editorToolsMenu.querySelector(".editor-trash-btn");
      if (trashBtn) {
        trashBtn.addEventListener("click", () => {
          document.getElementById("trashBtn")?.click();
          editorToolsMenu.classList.remove("open");
        });
      }

      const exportNotesBtn = editorToolsMenu.querySelector(
        ".editor-export-notes-btn"
      );
      if (exportNotesBtn) {
        exportNotesBtn.addEventListener("click", () => {
          document.getElementById("exportBtn")?.click();
          editorToolsMenu.classList.remove("open");
        });
      }

      const importBtn = editorToolsMenu.querySelector(".editor-import-btn");
      if (importBtn) {
        importBtn.addEventListener("click", () => {
          document.getElementById("importBtn")?.click();
          editorToolsMenu.classList.remove("open");
        });
      }

      const exportHtmlBtn = editorToolsMenu.querySelector(
        ".editor-export-html-btn"
      );
      if (exportHtmlBtn) {
        exportHtmlBtn.addEventListener("click", () => {
          document.getElementById("exportHtmlBtn")?.click();
          editorToolsMenu.classList.remove("open");
        });
      }

      const exportPdfBtn = editorToolsMenu.querySelector(
        ".editor-export-pdf-btn"
      );
      if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", () => {
          document.getElementById("exportPdfBtn")?.click();
          editorToolsMenu.classList.remove("open");
        });
      }
    }

    // Set up editor menu (three-dot menu)
    const editorMenu = editor.querySelector(".editor-menu");
    const editorMenuBtn = editor.querySelector(".editor-menu-btn");
    if (
      editorMenu &&
      editorMenuBtn &&
      !editorMenuBtn.hasAttribute("data-menu-handled")
    ) {
      editorMenuBtn.setAttribute("data-menu-handled", "true");

      editorMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        // Close main settings menu if open
        const settingsMenu = document.getElementById("settingsMenu");
        if (settingsMenu) {
          settingsMenu.classList.remove("open");
        }

        // Close toolbar options menu if open
        const toolbarOptionsMenu = document.getElementById("toolbarOptionsMenu");
        if (toolbarOptionsMenu) {
          toolbarOptionsMenu.classList.add("hidden");
        }


        editorMenu.classList.toggle("open");

        // Position the menu correctly
        if (editorMenu.classList.contains("open")) {
          const editorMenuList = editorMenu.querySelector(".editor-menu-list");
          if (editorMenuList) {
            // Check if we're inside a windowed note
            const windowContainer = editorMenuBtn.closest(".window");

            if (windowContainer) {
              // Inside a window - use absolute positioning relative to window
              editorMenuList.style.position = "absolute";
              editorMenuList.style.top = "calc(100% + 4px)";
              editorMenuList.style.right = "0";
              editorMenuList.style.left = "auto";
              editorMenuList.style.zIndex = "1500";
            } else {
              // In main panes - use fixed positioning
              const btnRect = editorMenuBtn.getBoundingClientRect();
              editorMenuList.style.position = "fixed";
              editorMenuList.style.top = btnRect.bottom + 4 + "px";
              editorMenuList.style.right =
                window.innerWidth - btnRect.right + "px";
              editorMenuList.style.left = "auto";
              editorMenuList.style.zIndex = "1500";
            }
          }
        }
      });

      // Close menu when clicking outside
      document.addEventListener("click", (e) => {
        if (!editorMenu.contains(e.target)) {
          editorMenu.classList.remove("open");
        }
      });

      // Prevent menu from closing when clicking inside
      editorMenu.addEventListener("click", (e) => {
        // Only stop propagation for font controls and menu items
        if (
          e.target.closest(".font-controls-menu") ||
          e.target.closest(".menu-item")
        ) {
          e.stopPropagation();
        }
      });

      // Set up font size controls in menu
      const contentEditable = editor.querySelector(".content.editable");
      const fontSizeLabel = editorMenu.querySelector(".font-size-label");
      const fontDecreaseBtn = editorMenu.querySelector(
        '[data-action="font-decrease"]'
      );
      const fontIncreaseBtn = editorMenu.querySelector(
        '[data-action="font-increase"]'
      );
      const fontFamilySelect = editorMenu.querySelector(".font-family-select");

      let editorFontSize = 16;

      if (fontDecreaseBtn && contentEditable) {
        fontDecreaseBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          editorFontSize = Math.max(12, editorFontSize - 2);
          contentEditable.style.fontSize = editorFontSize + "px";
          if (fontSizeLabel) fontSizeLabel.textContent = editorFontSize + "px";
        });
      }

      // Set up font family selector
      if (fontFamilySelect && contentEditable) {
        // Initialize dropdown to match current font if possible
        const currentFont = window.getComputedStyle(contentEditable).fontFamily;
        let matchedOption = null;
        Array.from(fontFamilySelect.options).forEach((opt) => {
          if (
            currentFont &&
            currentFont.indexOf(
              opt.value.split(",")[0].replace(/['\"]+/g, "")
            ) !== -1
          ) {
            matchedOption = opt;
          }
        });
        if (matchedOption) {
          fontFamilySelect.value = matchedOption.value;
        }

        fontFamilySelect.addEventListener("change", (e) => {
          e.stopPropagation();
          const value = fontFamilySelect.value;
          if (value) {
            contentEditable.style.fontFamily = value;
          } else {
            contentEditable.style.fontFamily = "";
          }
        });

        // Allow cycling fonts with left/right arrow keys
        fontFamilySelect.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();

          const dir = e.key === "ArrowRight" ? 1 : -1;
          const options = fontFamilySelect.options;
          if (!options || options.length === 0) return;

          let idx = fontFamilySelect.selectedIndex;
          if (idx < 0) idx = 0;
          const next = Math.min(options.length - 1, Math.max(0, idx + dir));
          if (next === idx) return;

          fontFamilySelect.selectedIndex = next;
          // Trigger the change handler so the font updates immediately
          const changeEvent = new Event("change", { bubbles: true });
          fontFamilySelect.dispatchEvent(changeEvent);
        });
      }

      if (fontIncreaseBtn && contentEditable) {
        fontIncreaseBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          editorFontSize = Math.min(32, editorFontSize + 2);
          contentEditable.style.fontSize = editorFontSize + "px";
          if (fontSizeLabel) fontSizeLabel.textContent = editorFontSize + "px";
        });
      }

      // Set up layout toggle in menu
      const layoutToggleBtn = editorMenu.querySelector(
        '[data-action="toggle-layout"]'
      );
      const layoutLabel = editorMenu.querySelector(".layout-label");
      const layoutSvg = layoutToggleBtn
        ? layoutToggleBtn.querySelector("svg")
        : null;

      if (layoutToggleBtn && contentEditable) {
        // Check current layout state
        let isFullWidth = contentEditable.classList.contains("layout-full");

        // Function to update the SVG icon based on current state
        const updateLayoutIcon = () => {
          if (layoutSvg) {
            if (isFullWidth) {
              // Full-width icon - single wide rectangle
              layoutSvg.innerHTML = `
                <rect x="2" y="6" width="20" height="12" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"></rect>
                <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2"></line>
              `;
            } else {
              // Centered icon - narrow centered rectangle
              layoutSvg.innerHTML = `
                <rect x="6" y="4" width="12" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"></rect>
                <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="2"></line>
                <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"></line>
              `;
            }
          }
        };

        // Initialize the icon
        updateLayoutIcon();

        layoutToggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          isFullWidth = !isFullWidth;

          if (isFullWidth) {
            contentEditable.classList.add("layout-full");
            contentEditable.classList.remove("layout-centered");
          } else {
            contentEditable.classList.remove("layout-full");
            contentEditable.classList.add("layout-centered");
          }

          // Update both label and icon
          if (layoutLabel) {
            layoutLabel.textContent = isFullWidth
              ? "Full-width Layout"
              : "Centered Layout";
          }
          updateLayoutIcon();
          
          // Save layout preference to note
          const noteId = editor.dataset.noteId;
          if (noteId && window.state && window.state.notes) {
            const note = window.state.notes.find(n => n.id === noteId);
            if (note) {
              note.layoutMode = isFullWidth ? "full" : "centered";
              if (window.saveNotes) window.saveNotes();
            }
          }

          console.log("✓ Layout toggled:", isFullWidth ? "full" : "centered");
        });
      }

      // Set up duplicate button in editor menu
      const duplicateBtn = editorMenu.querySelector(".editor-duplicate-btn");
      if (duplicateBtn) {
        duplicateBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          // Trigger the actual duplicate button
          const mainDuplicateBtn = document.getElementById("duplicateBtn");
          if (mainDuplicateBtn) {
            mainDuplicateBtn.click();
          }
          editorMenu.classList.remove("open");
          console.log("✓ Duplicate button clicked from editor menu");
        });
      }
      
      // Highlight palette and auto-highlight toggle moved to global toolbar
      // See initGlobalToolbarFeatures()

      // Set up lock note button in editor menu
      const lockBtn = editorMenu.querySelector('[data-action="lock-note"]');
      const lockLabel = editorMenu.querySelector(".lock-label");
      if (lockBtn) {
        // Function to update lock button UI based on current state
        const updateLockUI = () => {
          const contentEditable = editor.querySelector(".content.editable");
          if (contentEditable) {
            const isLocked =
              contentEditable.getAttribute("contenteditable") === "false";
            const svg = lockBtn.querySelector("svg");

            if (isLocked) {
              // Currently locked - show unlock option with OPEN lock icon
              svg.innerHTML = `
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
              `;
              if (lockLabel) lockLabel.textContent = "Unlock Note (Ctrl+L)";
            } else {
              // Currently unlocked - show lock option with CLOSED lock icon
              svg.innerHTML = `
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              `;
              if (lockLabel) lockLabel.textContent = "Lock Note (Ctrl+L)";
            }
          }
        };

        // Initial UI update
        updateLockUI();

        lockBtn.addEventListener("click", (e) => {
          e.stopPropagation();

          console.log("Lock button clicked");

          // Use the existing toggleNoteLock function
          if (typeof window.toggleNoteLock === "function") {
            console.log("Calling toggleNoteLock");
            window.toggleNoteLock();

            // Update UI after a short delay to ensure state has changed
            setTimeout(() => {
              console.log("Updating lock UI");
              updateLockUI();
            }, 100);
          } else {
            console.error("toggleNoteLock function not found on window");
          }

          // Keep menu open - don't close it
        });

        // Update UI when menu opens to reflect current state
        const editorMenuBtn = editor.querySelector(".editor-menu-btn");
        if (editorMenuBtn) {
          editorMenuBtn.addEventListener("click", () => {
            setTimeout(() => {
              updateLockUI();
            }, 10);
          });
        }
      }

      // Close menu when opening in window
      const openWindowBtn = editorMenu.querySelector(
        '[data-action="open-window"]'
      );
      if (openWindowBtn) {
        openWindowBtn.addEventListener("click", () => {
          editorMenu.classList.remove("open");
        });
      }
    }

    // Set up fullscreen button
    const fullscreenBtn = editor.querySelector('[data-action="fullscreen"]');
    if (fullscreenBtn && !fullscreenBtn.hasAttribute("data-custom-handled")) {
      fullscreenBtn.setAttribute("data-custom-handled", "true");
      fullscreenBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFullscreen();
      });
    }

    // Auto-close parentheses
    const contentEditable = editor.querySelector(".content.editable");
    if (contentEditable) {
      contentEditable.addEventListener("keydown", (e) => {
        if (e.key === "(") {
          e.preventDefault();
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textNode = document.createTextNode("()");
            range.deleteContents();
            range.insertNode(textNode);
          }
        }
      });

      // Mouse wheel zoom for font size (Ctrl + Scroll)
      contentEditable.addEventListener(
        "wheel",
        (e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const currentSize = parseInt(
              window.getComputedStyle(contentEditable).fontSize
            );
            const delta = e.deltaY > 0 ? -2 : 2;
            const newSize = Math.max(10, Math.min(32, currentSize + delta));
            contentEditable.style.fontSize = newSize + "px";

            // Update the font size label in the menu
            const editorMenu = editor.querySelector(".editor-menu");
            if (editorMenu) {
              const fontSizeLabel = editorMenu.querySelector(".font-size-label");
              if (fontSizeLabel) {
                fontSizeLabel.textContent = newSize + "px";
              }
            }
            
            // Save to note object
            const noteId = editor.dataset.noteId;
            if (noteId && window.state && window.state.notes) {
              const note = window.state.notes.find(n => n.id === noteId);
              if (note) {
                note.fontSize = newSize;
                if (window.saveNotes) window.saveNotes();
              }
            }
          }
        },
        { passive: false }
      );
    }
  });
}

function loadCustomSearchPage(iframe, browserMessage) {
  console.log("🌐 Loading browser interface");

  // Create a simple HTML page with just a message
  const customHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        :root {
          --bg: #2e2e2e;
          --panel: #3a3a3a;
          --text: #e5e7eb;
          --text-muted: #9ca3af;
          --border: #4b5563;
          --accent: #3b82f6;
        }
        
        body {
          background-color: var(--bg);
          color: var(--text);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          text-align: center;
        }
        
        .message {
          max-width: 500px;
          padding: 40px;
          background: var(--panel);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
          font-size: 24px;
          margin-bottom: 16px;
          color: var(--text);
        }
        
        p {
          color: var(--text-muted);
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="message">
        <h1>Browser Ready</h1>
        <p>Use the search bar above to browse the web. Your searches will open in a new tab.</p>
      </div>
    </body>
    </html>
  `;

  iframe.srcdoc = customHTML;
  iframe.style.display = "block";
  browserMessage.style.display = "none";
}

function openBrowserTab(pane = "left") {
  console.log("🌐 Opening browser window");

  // Get the browser template
  const template = document.getElementById("browser-template");
  if (!template) {
    console.error("Browser template not found");
    return;
  }

  // Clone the template
  const browserElement = template.content
    .cloneNode(true)
    .querySelector(".browser-container");

  // Generate unique ID for browser window
  const browserId = "browser_" + Date.now();
  browserElement.dataset.browserId = browserId;

  // Create windowed browser instead of tab
  createBrowserWindow(browserId, browserElement);
}

function createBrowserWindow(browserId, browserElement) {
  console.log("🪟 Creating browser window:", browserId);

  // Create window element
  const windowEl = document.createElement("div");
  windowEl.className = "window";
  windowEl.dataset.windowId = browserId;
  windowEl.style.width = "800px";
  windowEl.style.height = "600px";
  windowEl.style.left = "100px";
  windowEl.style.top = "100px";

  // Create window header using existing window structure
  const header = document.createElement("div");
  header.className = "window-title";
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
      <span>Browser</span>
    </div>
    <div class="window-controls">
      <button class="window-minimize" title="Minimize">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button class="window-close" title="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  // Create window content
  const content = document.createElement("div");
  content.className = "window-content";
  content.appendChild(browserElement);

  // Assemble window
  windowEl.appendChild(header);
  windowEl.appendChild(content);

  // Add to workspace
  const workspace = document.querySelector(".workspace");
  workspace.appendChild(windowEl);

  // Set up browser controls
  setupBrowserControls(browserElement);

  // Load custom search page
  const iframe = browserElement.querySelector(".browser-frame");
  const browserMessage = browserElement.querySelector(".browser-message");
  loadCustomSearchPage(iframe, browserMessage);

  // Set up window controls
  const minimizeBtn = header.querySelector(".window-minimize");
  const closeBtn = header.querySelector(".window-close");

  minimizeBtn.addEventListener("click", () => {
    // Create dock item
    windowEl.classList.add("hidden");
    const dock = document.getElementById("dock");
    const dockItem = document.createElement("div");
    dockItem.className = "dock-item";
    dockItem.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
      Browser
    `;
    dockItem.title = "Restore Browser";
    dockItem.addEventListener("click", () => {
      windowEl.classList.remove("hidden");
      dockItem.remove();
      // Bring to front
      windowEl.style.zIndex = Date.now();
    });
    dock.appendChild(dockItem);
  });

  closeBtn.addEventListener("click", () => {
    windowEl.remove();
  });

  // Make window draggable
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  header.addEventListener("mousedown", (e) => {
    if (e.target.closest(".window-controls")) return;
    isDragging = true;
    dragOffset.x = e.clientX - windowEl.offsetLeft;
    dragOffset.y = e.clientY - windowEl.offsetTop;
    windowEl.style.zIndex = Date.now();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    windowEl.style.left = e.clientX - dragOffset.x + "px";
    windowEl.style.top = e.clientY - dragOffset.y + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Bring to front
  windowEl.style.zIndex = Date.now();
}

function setupBrowserControls(browserElement) {
  const iframe = browserElement.querySelector(".browser-frame");
  const urlBar = browserElement.querySelector(".browser-url-bar");
  const toolbar = browserElement.querySelector(".browser-toolbar");
  const browserMessage = browserElement.querySelector(".browser-message");

  // Set default placeholder for URL bar
  if (urlBar) {
    urlBar.placeholder = "Search with Google or enter URL";
  }
  const browserContent = browserElement.querySelector(".browser-content");

  // Handle URL submission
  function handleUrlSubmit() {
    let url = urlBar.value.trim();

    // If empty, load the search page
    if (!url) {
      loadCustomSearchPage(iframe, browserMessage);
      return;
    }

    // Add https:// if missing and doesn't start with http:// or https://
    if (!url.match(/^https?:\/\//i)) {
      // If it looks like a domain (contains a dot and no spaces), add https://
      if (url.includes(".") && !url.includes(" ")) {
        url = "https://" + url;
      } else {
        // Otherwise, it's a search query - use Google
        url = "https://www.google.com/search?q=" + encodeURIComponent(url);
      }
    }

    // Open URL in a new tab
    window.open(url, "_blank");

    // Reset the URL bar
    urlBar.value = "";
    loadCustomSearchPage(iframe, browserMessage);
  }

  // Navigate to URL
  const navigateToUrl = () => {
    handleUrlSubmit();
    iframe.onerror = () => {
      iframe.style.display = "none";
      browserMessage.style.display = "flex";
      browserMessage.querySelector("h3").textContent = "Cannot Display Site";
      browserMessage.querySelector("p").textContent =
        "This site blocks embedding. Click the external link icon to open in your browser.";
    };
  };

  // Open in external browser
  const openExternal = () => {
    const url = urlBar.value.trim() || browserElement.currentUrl;
    if (url) {
      window.open(url, "_blank");
    }
  };

  // Back button (disabled for iframe)
  toolbar
    .querySelector('[data-action="back"]')
    .addEventListener("click", () => {
      console.log("Back navigation not supported in iframe mode");
    });

  // Forward button (disabled for iframe)
  toolbar
    .querySelector('[data-action="forward"]')
    .addEventListener("click", () => {
      console.log("Forward navigation not supported in iframe mode");
    });

  // Refresh button
  toolbar
    .querySelector('[data-action="refresh"]')
    .addEventListener("click", () => {
      if (iframe.style.display !== "none") {
        iframe.src = iframe.src;
      }
    });

  // External browser button
  toolbar
    .querySelector('[data-action="open-external"]')
    .addEventListener("click", openExternal);

  // Go button
  toolbar
    .querySelector('[data-action="go"]')
    .addEventListener("click", navigateToUrl);

  // Enter key
  urlBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      navigateToUrl();
    }
  });
}

function switchToBrowserTab(browserId, pane) {
  console.log("🔄 Switching to browser tab:", browserId, "in pane:", pane);

  const paneElement = document.querySelector(`.pane[data-pane="${pane}"]`);
  if (!paneElement) {
    console.error("Pane not found:", pane);
    return;
  }

  const tabsContainer = paneElement.querySelector(".tabs");
  const paneContent = paneElement.querySelector(".pane-content");

  // Remove active class from all tabs in this pane
  tabsContainer.querySelectorAll(".tab").forEach((t) => {
    t.classList.remove("active");
  });

  // Add active class to this tab
  const tab = tabsContainer.querySelector(`[data-browser-id="${browserId}"]`);
  if (tab) {
    tab.classList.add("active");
    console.log("✅ Tab activated");
  } else {
    console.error("Tab not found:", browserId);
  }

  // Hide all editors and browsers in this pane
  paneContent
    .querySelectorAll(".editor, .browser-container")
    .forEach((child) => {
      child.style.display = "none";
    });

  // Show this browser
  const browserElement = paneContent.querySelector(
    `[data-browser-id="${browserId}"]`
  );
  if (browserElement) {
    browserElement.style.display = "flex";
    console.log("✅ Browser displayed");
  } else {
    console.error("Browser element not found:", browserId);
  }
}

function closeBrowserTab(browserId, pane) {
  const paneElement = document.querySelector(`.pane[data-pane="${pane}"]`);
  const tabsContainer = paneElement.querySelector(".tabs");
  const paneContent = paneElement.querySelector(".pane-content");

  // Remove tab
  const tab = tabsContainer.querySelector(`[data-browser-id="${browserId}"]`);
  if (tab) {
    tab.remove();
  }

  // Remove browser element
  const browserElement = paneContent.querySelector(
    `[data-browser-id="${browserId}"]`
  );
  if (browserElement) {
    browserElement.remove();
  }

  // If there are other tabs, switch to the last one
  const remainingTabs = tabsContainer.querySelectorAll(".tab");
  if (remainingTabs.length > 0) {
    const lastTab = remainingTabs[remainingTabs.length - 1];
    if (lastTab.dataset.browserId) {
      switchToBrowserTab(lastTab.dataset.browserId, pane);
    } else if (lastTab.dataset.noteId) {
      // Switch to note tab (call app.js function if available)
      if (window.openInPane) {
        const noteId = lastTab.dataset.noteId;
        window.openInPane(noteId, pane);
      }
    }
  }
}

function showBrowserContextMenu(e, browserId, pane, tab) {
  // Remove any existing context menu
  const existingMenu = document.querySelector(".browser-context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  // Create context menu
  const menu = document.createElement("div");
  menu.className = "browser-context-menu ctx-menu";
  menu.style.position = "fixed";
  menu.style.left = e.clientX + "px";
  menu.style.top = e.clientY + "px";
  menu.style.zIndex = "10000";

  const isPinned = tab.classList.contains("pinned");

  menu.innerHTML = `
    <div class="ctx-section">
      <button data-cmd="pin-browser">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 17v5"></path>
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>
        </svg>
        ${isPinned ? "Unpin Browser" : "Pin Browser"}
      </button>
      <button data-cmd="close-browser">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Close Browser
      </button>
    </div>
  `;

  document.body.appendChild(menu);

  // Handle menu clicks
  menu.addEventListener("click", (evt) => {
    const cmd = evt.target.closest("button")?.dataset.cmd;
    if (cmd === "pin-browser") {
      toggleBrowserPin(browserId, pane, tab);
    } else if (cmd === "close-browser") {
      closeBrowserTab(browserId, pane);
    }
    menu.remove();
  });

  // Close menu on outside click
  setTimeout(() => {
    document.addEventListener("click", () => menu.remove(), { once: true });
  }, 0);
}

function toggleBrowserPin(browserId, pane, tab) {
  const isPinned = tab.classList.contains("pinned");
  const pinIcon = tab.querySelector(".pin-icon");

  if (isPinned) {
    // Unpin
    tab.classList.remove("pinned");
    if (pinIcon) pinIcon.style.display = "none";
  } else {
    // Pin
    tab.classList.add("pinned");
    if (pinIcon) pinIcon.style.display = "inline-block";
  }
}

// Setup drag-to-split for browser tabs
function setupBrowserDragToSplit() {
  const rightPane = document.querySelector('.pane[data-pane="right"]');
  const leftPane = document.querySelector('.pane[data-pane="left"]');
  if (!rightPane || !leftPane) return;

  let isDraggingBrowser = false;
  let draggedBrowserId = null;

  // Listen to dragstart on document to track browser drags
  document.addEventListener(
    "dragstart",
    (e) => {
      const tab = e.target.closest(".tab[data-browser-id]");
      if (tab) {
        isDraggingBrowser = true;
        draggedBrowserId = tab.dataset.browserId;
        console.log("🖱️ Dragging browser tab:", draggedBrowserId);
      }
    },
    true
  );

  document.addEventListener(
    "dragend",
    () => {
      isDraggingBrowser = false;
      draggedBrowserId = null;
      rightPane.classList.remove("drag-over");
      leftPane.classList.remove("drag-over");
    },
    true
  );

  // Right pane drop zone
  rightPane.addEventListener("dragover", (e) => {
    if (isDraggingBrowser) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      rightPane.classList.add("drag-over");
    }
  });

  rightPane.addEventListener("dragleave", (e) => {
    if (!rightPane.contains(e.relatedTarget)) {
      rightPane.classList.remove("drag-over");
    }
  });

  rightPane.addEventListener("drop", (e) => {
    if (isDraggingBrowser && draggedBrowserId) {
      e.preventDefault();
      e.stopPropagation();
      rightPane.classList.remove("drag-over");

      console.log("📥 Dropping browser in right pane:", draggedBrowserId);

      const browserId = draggedBrowserId;
      const sourceTab = document.querySelector(
        `[data-browser-id="${browserId}"]`
      );
      const sourceBrowser = document.querySelector(
        `.pane-content [data-browser-id="${browserId}"]`
      );

      if (sourceTab && sourceBrowser) {
        // Enable split mode if not already
        if (window.enableSplit) {
          window.enableSplit();
        }

        // Move tab and browser to right pane
        const rightTabs = rightPane.querySelector(".tabs");
        const rightContent = rightPane.querySelector(".pane-content");

        rightTabs.appendChild(sourceTab);
        rightContent.appendChild(sourceBrowser);

        // Switch to this browser in right pane
        switchToBrowserTab(browserId, "right");
        console.log("✅ Browser moved to right pane");
      }
    }
  });

  // Left pane drop zone (for moving back)
  leftPane.addEventListener("dragover", (e) => {
    if (isDraggingBrowser) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      leftPane.classList.add("drag-over");
    }
  });

  leftPane.addEventListener("dragleave", (e) => {
    if (!leftPane.contains(e.relatedTarget)) {
      leftPane.classList.remove("drag-over");
    }
  });

  leftPane.addEventListener("drop", (e) => {
    if (isDraggingBrowser && draggedBrowserId) {
      e.preventDefault();
      e.stopPropagation();
      leftPane.classList.remove("drag-over");

      const browserId = draggedBrowserId;
      const sourceTab = document.querySelector(
        `[data-browser-id="${browserId}"]`
      );
      const sourceBrowser = document.querySelector(
        `.pane-content [data-browser-id="${browserId}"]`
      );

      if (sourceTab && sourceBrowser) {
        const leftTabs = leftPane.querySelector(".tabs");
        const leftContent = leftPane.querySelector(".pane-content");

        leftTabs.appendChild(sourceTab);
        leftContent.appendChild(sourceBrowser);

        switchToBrowserTab(browserId, "left");
      }
    }
  });
}

// Initialize theme carousel with arrow navigation
async function initializeThemeCarousel() {
  const themeCarousel = document.querySelector(".theme-carousel");
  if (!themeCarousel) return;

  const prevBtn = themeCarousel.querySelector(".theme-prev");
  const nextBtn = themeCarousel.querySelector(".theme-next");
  const themeNameEl = themeCarousel.querySelector(".theme-name");

  if (!prevBtn || !nextBtn || !themeNameEl) return;

  // Function to detect current theme from body class or state
  function detectCurrentTheme() {
    // First try to get from window.state.settings (most reliable)
    if (window.state && window.state.settings && window.state.settings.theme) {
      const savedTheme = window.state.settings.theme.toLowerCase();
      const foundIndex = themes.findIndex(
        (t) => t.name.toLowerCase() === savedTheme
      );
      if (foundIndex !== -1) {
        return foundIndex;
      }
    }
    
    // Fallback: detect from body class
    if (document.body.classList.contains("theme-classic")) {
      return themes.findIndex((t) => t.class === "theme-classic");
    } else if (document.body.classList.contains("theme-light")) {
      return themes.findIndex((t) => t.class === "theme-light");
    }
    
    // Default to dark (index 0)
    return 0;
  }

  // Initial sync with current theme
  currentThemeIndex = detectCurrentTheme();
  updateThemeDisplay();

  // Re-sync when settings panel is opened (settings button click)
  const settingsBtn = document.getElementById("settingsBtn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      // Re-detect the current theme when settings opens
      currentThemeIndex = detectCurrentTheme();
      updateThemeDisplay();
    });
  }

  prevBtn.addEventListener("click", () => {
    currentThemeIndex = (currentThemeIndex - 1 + themes.length) % themes.length;
    applyCurrentTheme();
    updateThemeDisplay();
  });

  nextBtn.addEventListener("click", () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyCurrentTheme();
    updateThemeDisplay();
  });

  function updateThemeDisplay() {
    const themeNameEl = themeCarousel.querySelector(".theme-name");
    if (themeNameEl) {
      const theme = themes[currentThemeIndex];
      themeNameEl.textContent = theme.name;
    }
  }

  async function applyCurrentTheme() {
    const theme = themes[currentThemeIndex];
    const themeName = theme.name.toLowerCase();
    const themeClass = theme.class;

    // Remove all theme classes
    document.body.classList.remove("theme-light", "theme-classic");

    // Apply new theme (dark is default, no class needed)
    if (themeClass) {
      document.body.classList.add(themeClass);
    }

    // Save theme to file system if available
    if (window.fileSystemService && window.state && window.state.settings) {
      try {
        window.state.settings.theme = themeName;
        await window.fileSystemService.saveSettings(window.state.settings);
        console.log("✓ Theme saved to file system:", themeName);
      } catch (error) {
        console.warn("Failed to save theme to file system:", error);
      }
    }
    console.log("✓ Theme applied:", themeName);
  }
}

// Load saved theme on startup
async function loadSavedTheme() {
  let savedTheme = "dark";

  // Try to get theme from file system service if available
  if (window.fileSystemService) {
    try {
      const response = await window.fileSystemService.makeRequest("/settings");
      const settings = response || {};
      savedTheme = settings.theme || "dark";
    } catch (error) {
      console.log("Using default theme (dark) - file system not available");
      savedTheme = "dark";
    }
  }

  currentThemeIndex = themes.indexOf(savedTheme);
  if (currentThemeIndex === -1) currentThemeIndex = 0;

  // Don't apply theme here - let the main app handle it
  console.log("✓ Theme detected:", savedTheme);
}

// Update font sizes for all editors
function updateAllFontSizes(size) {
  document.querySelectorAll(".editor .content.editable").forEach((content) => {
    content.style.fontSize = size + "px";
  });
}

// Setup global Ctrl+S handler
function setupGlobalCtrlS() {
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      console.log("Ctrl+S pressed - auto-save triggered");
      // The actual save is handled by app.js
    }
  });
}

// Initialize auto-recovery system
function initializeAutoRecovery() {
  console.log("✓ Auto-recovery system initialized");
  // Auto-backup every 60 seconds
  autoBackupTimer = setInterval(() => {
    try {
      const notesData = localStorage.getItem("notes.offline.v1");
      if (notesData) {
        localStorage.setItem("notes.backup.v1", notesData);
        console.log("✓ Auto-backup completed");
      }
    } catch (err) {
      console.error("Auto-backup failed:", err);
    }
  }, AUTO_BACKUP_INTERVAL);
}

// Handle close app button
function handleCloseApp() {
  if (window.electronAPI && window.electronAPI.closeApp) {
    window.electronAPI.closeApp();
  } else {
    window.close();
  }
}

// Update file name display
function updateFileNameDisplay(text) {
  const display = document.getElementById("fileNameDisplay");
  if (display) {
    display.textContent = text;
  }
}

// Initialize workspaces
function initializeWorkspaces() {
  // Load workspaces from localStorage
  const saved = localStorage.getItem("notes.workspaces");
  if (saved) {
    try {
      workspaces = JSON.parse(saved);
    } catch (e) {
      workspaces = [];
    }
  }

  // Set current workspace
  if (workspaces.length > 0) {
    currentWorkspaceId = workspaces[0].id;
  }

  console.log("✓ Workspaces initialized");
}

// Initialize layout toggle
function initializeLayoutToggle() {
  const layoutToggle = document.getElementById("layoutToggle");
  if (layoutToggle) {
    layoutToggle.addEventListener("click", () => {
      currentLayout = currentLayout === "centered" ? "full" : "centered";
      document.body.classList.toggle("layout-full", currentLayout === "full");
      console.log("✓ Layout toggled:", currentLayout);
    });
  }
}

// Setup safe refresh button
function setupSafeRefresh() {
  const refreshBtn = document.getElementById("safeRefreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      location.reload();
    });
  }
}

// Setup workspace bar toggle
function setupWorkspaceBarToggle() {
  const toggleBtn = document.getElementById("workspaceBarToggle");
  const workspaceBar = document.querySelector(".workspace-footer");

  if (toggleBtn && workspaceBar) {
    toggleBtn.addEventListener("click", () => {
      workspaceBar.classList.toggle("collapsed");
    });
  }
}

// Setup browser feature
function setupBrowserFeature() {
  // Use event delegation since browser buttons are in dynamically created note editors
  document.addEventListener("click", (e) => {
    const browserBtn = e.target.closest('[data-action="open-browser"]');
    if (browserBtn) {
      e.preventDefault();
      e.stopPropagation();

      // Determine which pane the button is in
      const pane = browserBtn.closest(".pane");
      const paneName = pane ? pane.dataset.pane : "left";

      openBrowserTab(paneName);
      console.log("🌐 Browser button clicked, opening in pane:", paneName);
    }
  });

  console.log("✓ Browser feature initialized (event delegation)");
}

// Initialize global toolbar features (Highlight colors & Auto-highlight)
function initGlobalToolbarFeatures() {
  const container = document.querySelector(".toolbar-highlight-section");
  const dropdownBtn = document.getElementById("highlightDropdownBtn");
  const dropdownMenu = document.querySelector(".toolbar-highlight-section .dropdown-menu");
  
  if (container && dropdownBtn) {
    // Toggle dropdown
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = container.classList.contains("open");
      
      // Close all other open menus
      document.querySelectorAll(".open").forEach(el => {
        if (el !== container) el.classList.remove("open");
      });
      
      container.classList.toggle("open", !isOpen);
      dropdownBtn.classList.toggle("active", !isOpen);
    });
    
    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        container.classList.remove("open");
        dropdownBtn.classList.remove("active");
      }
    });
  }

  // Highlight palette
  const toolbarPalette = document.querySelector(".toolbar-highlight-section .palette");
  if (toolbarPalette) {
    const buttons = toolbarPalette.querySelectorAll("button[data-color]");
    
    // Set up click handlers
    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (window.state) {
          window.state.currentHighlightColor = btn.dataset.color;
          
          // Update active UI
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          
          console.log("🎨 Highlight color set to:", btn.dataset.color);
        }
      });
    });

    // Set initial active state from global state or default
    const updatePaletteState = () => {
      if (window.state && window.state.currentHighlightColor) {
        buttons.forEach((b) => {
          if (b.dataset.color === window.state.currentHighlightColor) {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });
      } else {
        // Default to first one if no state
        const firstBtn = buttons[0];
        if (firstBtn) {
          firstBtn.classList.add("active");
          if (window.state) window.state.currentHighlightColor = firstBtn.dataset.color;
        }
      }
    };
    
    updatePaletteState();
    setTimeout(updatePaletteState, 500);
  }

  // Auto-highlight toggle
  const autoHlToggle = document.querySelector(".toolbar-highlight-section .editor-auto-hl-toggle");
  if (autoHlToggle) {
    const updateToggleUI = () => {
      if (window.state) {
        if (window.state.autoHighlight) {
          autoHlToggle.classList.add("active");
          const label = autoHlToggle.querySelector(".auto-hl-label");
          if (label) label.textContent = "Auto Highlight: ON";
        } else {
          autoHlToggle.classList.remove("active");
          const label = autoHlToggle.querySelector(".auto-hl-label");
          if (label) label.textContent = "Auto Highlight: OFF";
        }
      }
    };

    autoHlToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.state) {
        window.state.autoHighlight = !window.state.autoHighlight;
        updateToggleUI();
        console.log("✨ Auto-highlight toggled:", window.state.autoHighlight ? "ON" : "OFF");
      }
    });
    
    updateToggleUI();
    setTimeout(updateToggleUI, 500);
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initGlobalToolbarFeatures);

// Expose to window for manual re-init if needed
window.initGlobalToolbarFeatures = initGlobalToolbarFeatures;
