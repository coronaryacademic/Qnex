export default class DungeonBase {
  constructor() {
    this.el = {};
    this.state = {
      questions: [],
      currentIndex: 0,
      answers: new Map(), // id -> { isCorrect: boolean, selectedId: string, submitted: boolean }
      selectedOption: null, // Temporary selection before submit
      sidebarCollapsed: false,
      toolbarVisible: true,
      toolbarPosition: 'floating', // 'floating', 'top', 'bottom', 'left', 'right'
      unsavedChanges: false
    };
  }

  init() {
    this.el.container = document.getElementById("dungeonBase");
    
    // Layout Migration / Enforcement
    if (this.el.container) {
        // 1. Remove obsolete Right Panel if present
        const oldRightPanel = this.el.container.querySelector('.dungeon-right-panel');
        if (oldRightPanel) {
            oldRightPanel.remove();
        }

        // 2. Ensure Sidebar & Main exist (Basic reset if totally missing)
        if (!this.el.container.querySelector('.dungeon-sidebar')) {
            this.el.container.innerHTML = `
              <!-- Topbar -->
              <div id="dungeonTopbar" class="dungeon-topbar">
                <div class="dungeon-topbar-left">
                  <button id="dungeonSidebarToggle" class="dungeon-topbar-btn" title="Toggle Sidebar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                  </button>
                  <div id="dungeonQuestionTitle" class="dungeon-question-title">Untitled Question</div>
                </div>
                <div class="dungeon-topbar-center">
                  <span id="dungeonSaveStatus" class="dungeon-save-status saved" style="margin-right: 12px;">Saved</span>
                  <div id="dungeonSearchWrapper" class="dungeon-search-wrapper">
                      <button id="dungeonSearchToggle" class="dungeon-search-toggle" title="Search">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </button>
                      <input type="text" id="dungeonSearchInput" class="dungeon-search-input" placeholder="Search...">
                  </div>
                </div>
                <div class="dungeon-topbar-right">
                  <button id="dungeonToolbarOptions" class="dungeon-topbar-btn" title="Toolbar Options">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="4" y1="6" x2="20" y2="6"></line>
                      <line x1="4" y1="12" x2="20" y2="12"></line>
                      <line x1="4" y1="18" x2="20" y2="18"></line>
                    </svg>
                  </button>
                  <button id="dungeonCloseBtn" class="dungeon-topbar-btn" title="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Toolbar Options Menu -->
              <div id="dungeonToolbarMenu" class="dungeon-toolbar-menu hidden">
                <div class="dungeon-toolbar-menu-section">
                  <div class="dungeon-toolbar-menu-label">Visibility</div>
                  <button id="dungeonToolbarToggle" data-action="toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>Toggle Toolbar</span>
                  </button>
                </div>
                <div class="dungeon-toolbar-menu-divider"></div>
                <div class="dungeon-toolbar-menu-section">
                  <div class="dungeon-toolbar-menu-label">Position</div>
                  <button data-position="floating">Floating</button>
                  <button data-position="top">Top</button>
                  <button data-position="bottom">Bottom</button>
                  <button data-position="left">Left</button>
                  <button data-position="right">Right</button>
                </div>
              </div>
              
              <div id="dungeonSidebar" class="dungeon-sidebar">
                <!-- Stats will be added at bottom by JS -->
              </div>
              <div class="dungeon-main">
                  <div class="dungeon-scroll-wrapper">
                      <div id="dungeonMainContent" class="dungeon-question-container"></div>
                  </div>
              </div>
              
              <!-- Footer (Bottom Header) -->
              <div id="dungeonFooter" class="dungeon-footer">
                  <div class="dungeon-footer-left">
                      <div class="dungeon-stat-item" title="Time Elapsed">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span id="dungeonTimer" style="font-weight: 600; color: var(--text-muted); font-variant-numeric: tabular-nums;">00:00</span>
                      </div>
                  </div>
                  <div class="dungeon-footer-center">
                      <div class="dungeon-stat-item" title="Correct Answers">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <span id="dungeonStatCorrect">0</span>
                      </div>
                      <div class="dungeon-stat-item" title="Incorrect Answers">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          <span id="dungeonStatWrong">0</span>
                      </div>
                  </div>
                  <div class="dungeon-footer-right">
                      <button id="dungeonRevealBtn" class="dungeon-reveal-btn" title="Reveal Answer">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M9 18h6"></path>
                              <path d="M10 22h4"></path>
                              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"></path>
                          </svg>
                      </button>
                  </div>
              </div>
            `;
        }

        // 3. Ensure Toolbar exists
        if (!this.el.container.querySelector('#dungeonToolbar')) {
             const toolbarHTML = `
                <div id="dungeonToolbar" class="dungeon-toolbar horizontal">
                    <div id="dungeonToolPrev" class="dungeon-tool-btn" title="Previous Question">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="star" title="Star Question">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="note" title="Add Note">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="submit" title="Submit Answer">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="highlight" title="Highlight Mode">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3z"></path><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l3-3 3 3L24 10z"></path></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="clear" title="Clear Highlights">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path><path d="M22 21H7"></path><path d="m5 11 9 9"></path></svg>
                    </div>
                    <div id="dungeonToolNext" class="dungeon-tool-btn" title="Next Question">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </div>
             `;
             this.el.container.insertAdjacentHTML('beforeend', toolbarHTML);
        }
    }

    this.el.sidebar = document.getElementById("dungeonSidebar");
    this.el.main = document.getElementById("dungeonMainContent");
    // prevBtn and nextBtn removed as they are dynamic now

    if (!this.el.container) {
      console.error("DungeonBase container not found in DOM");
      return;
    }

    // Initialize Sidebar Resizer
    this.initResizer();
    this.initToolbar();
    this.initTopbar();
    this.initFooter(); // New footer init

    this.bindEvents();
  }

  initFooter() {
      // Bind Reveal Button
      const revealBtn = document.getElementById('dungeonRevealBtn');
      if (revealBtn) {
          revealBtn.onclick = () => this.toggleReveal();
      }
  }

  initToolbar() {
      const toolbar = document.getElementById("dungeonToolbar");
      if (!toolbar) return;

      // Add tooltip for interaction hints
      toolbar.title = "Drag to move, Double-click to rotate";

      // 1. Initial Position (Restored or Centered)
      const restoreOrCenterToolbar = async () => {
          let savedMode = localStorage.getItem('dungeonToolbarPosition');
          
          // Try backend persistence
          if (window.Storage && window.Storage.loadSettings) {
              try {
                  const settings = await window.Storage.loadSettings();
                  if (settings.dungeonToolbarPosition) {
                      savedMode = settings.dungeonToolbarPosition;
                      // Sync to local
                      localStorage.setItem('dungeonToolbarPosition', savedMode);
                  }
              } catch(e) {
                  console.warn("Dungeon: Failed to load backend settings for toolbar", e);
              }
          }
          
          if (savedMode && savedMode !== 'floating') {
             this.setToolbarPosition(savedMode);
             toolbar.classList.add('visible');
             return;
          }

          // Floating mode logic
          const savedPos = localStorage.getItem("dungeonToolbarPos");
          if (savedPos) {
              try {
                  const pos = JSON.parse(savedPos);
                  toolbar.style.left = pos.left;
                  toolbar.style.top = pos.top;
                  if (pos.vertical) toolbar.classList.add('vertical');
              } catch(e) {}
          } else {
             // Fallback (Default) -> Top
             this.setToolbarPosition('top');
          }
          
          // Ensure visible class is added after positioning
          toolbar.classList.add('visible');
      };
      setTimeout(() => {
          restoreOrCenterToolbar();
          // Add visible class after positioning
          toolbar.classList.add('visible');
      }, 0);

      // 2. Drag Logic (only for floating mode)
      let isDragging = false;
      let startX, startY, startLeft, startTop;

      const onMouseDown = (e) => {
          // Don't allow dragging if toolbar is docked
          if (toolbar.classList.contains('docked-top') || 
              toolbar.classList.contains('docked-bottom') || 
              toolbar.classList.contains('docked-left') || 
              toolbar.classList.contains('docked-right')) {
              return;
          }
          
          if (e.target.closest('.dungeon-tool-btn')) return; 
          if (e.button !== 0) return; 

          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          
          const rect = toolbar.getBoundingClientRect();
          startLeft = rect.left;
          startTop = rect.top;

          toolbar.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
          
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          
          let newLeft = startLeft + dx;
          let newTop = startTop + dy;

          // Constraints
          const sidebar = document.getElementById('dungeonSidebar');
          const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
          const w = window.innerWidth;
          const h = window.innerHeight;
          const rect = toolbar.getBoundingClientRect();
          const tw = rect.width;
          const th = rect.height;

          if (newLeft < sidebarWidth) newLeft = sidebarWidth;
          if (newLeft + tw > w) newLeft = w - tw;
          if (newTop < 0) newTop = 0;
          if (newTop + th > h) newTop = h - th;
          
          toolbar.style.left = newLeft + 'px';
          toolbar.style.top = newTop + 'px';
      };

      const onMouseUp = () => {
          isDragging = false;
          toolbar.style.cursor = 'grab';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          // Save Position
          const state = {
              left: toolbar.style.left,
              top: toolbar.style.top,
              vertical: toolbar.classList.contains('vertical')
          };
          localStorage.setItem("dungeonToolbarPos", JSON.stringify(state));
      };

      toolbar.addEventListener('mousedown', onMouseDown);

      // 3. Rotation Logic (only for floating mode)
      toolbar.addEventListener('dblclick', (e) => {
          // Don't allow rotation if toolbar is docked
          if (toolbar.classList.contains('docked-top') || 
              toolbar.classList.contains('docked-bottom') || 
              toolbar.classList.contains('docked-left') || 
              toolbar.classList.contains('docked-right')) {
              return;
          }
          
          if (e.target.closest('.dungeon-tool-btn')) return;
          toolbar.classList.toggle('vertical');
          
          // Update highlight SVG based on orientation
          this.updateHighlightSVG(toolbar);
          
          // Save state after rotate
           const state = {
              left: toolbar.style.left,
              top: toolbar.style.top,
              vertical: toolbar.classList.contains('vertical')
          };
          localStorage.setItem("dungeonToolbarPos", JSON.stringify(state));
      });

      // Bind Nav Buttons
      const btnPrev = document.getElementById("dungeonToolPrev");
      const btnNext = document.getElementById("dungeonToolNext");
      if (btnPrev) btnPrev.onclick = () => this.navPrev();
      if (btnNext) btnNext.onclick = () => this.navNext();
      
      // Bind Tools
      const starBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="star"]');
      if (starBtn) starBtn.onclick = () => this.toggleStar();

      const highlightBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="highlight"]');
      if (highlightBtn) highlightBtn.onclick = () => this.toggleHighlightMode();

      const submitBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="submit"]');
      if (submitBtn) submitBtn.onclick = () => this.handleSubmit();

      const noteBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="note"]');
      if (noteBtn) noteBtn.onclick = () => this.addNote();

      const clearBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="clear"]');
      if (clearBtn) clearBtn.onclick = () => this.clearHighlights();
      
      // Set initial highlight SVG based on orientation
      this.updateHighlightSVG(toolbar);
  }

  initTopbar() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('dungeonSidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.onclick = () => this.toggleSidebar();
    }

    // Toolbar Options Menu
    const toolbarOptionsBtn = document.getElementById('dungeonToolbarOptions');
    const toolbarMenu = document.getElementById('dungeonToolbarMenu');
    
    if (toolbarOptionsBtn && toolbarMenu) {
      toolbarOptionsBtn.onclick = (e) => {
        e.stopPropagation();
        toolbarMenu.classList.toggle('hidden');
      };

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!toolbarMenu.contains(e.target) && e.target !== toolbarOptionsBtn) {
          toolbarMenu.classList.add('hidden');
        }
      });

      // Toolbar Toggle button
      const toolbarToggle = document.getElementById('dungeonToolbarToggle');
      if (toolbarToggle) {
        toolbarToggle.onclick = (e) => {
          e.stopPropagation();
          this.toggleToolbar();
          // Update button text
          const span = toolbarToggle.querySelector('span');
          if (span) {
            span.textContent = this.state.toolbarVisible ? 'Hide Toolbar' : 'Show Toolbar';
          }
        };
      }

      // Position buttons
      toolbarMenu.querySelectorAll('button[data-position]').forEach(btn => {
        btn.onclick = () => {
          const position = btn.dataset.position;
          this.setToolbarPosition(position);
          toolbarMenu.classList.add('hidden');
        };
      });

      // Bind Search
      const searchWrapper = document.getElementById('dungeonSearchWrapper');
      const searchToggle = document.getElementById('dungeonSearchToggle');
      const searchInput = document.getElementById('dungeonSearchInput');

      if (searchToggle && searchWrapper && searchInput) {
          searchToggle.onclick = (e) => {
              e.stopPropagation();
              searchWrapper.classList.toggle('active');
              if (searchWrapper.classList.contains('active')) {
                  searchInput.focus();
              }
          };
          
          searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
          
          // Click outside to close
          document.addEventListener('click', (e) => {
             if (!searchWrapper.contains(e.target) && searchWrapper.classList.contains('active')) {
                 if (!searchInput.value) { 
                     searchWrapper.classList.remove('active');
                 }
             } 
          });
      }
    }

    // Load saved states
    const savedSidebarState = localStorage.getItem('dungeonSidebarCollapsed');
    if (savedSidebarState === 'true') {
      this.toggleSidebar();
    }

    const savedToolbarVisible = localStorage.getItem('dungeonToolbarVisible');
    if (savedToolbarVisible === 'false') {
      this.state.toolbarVisible = false;
      this.updateToolbarVisibility();
    }


  }

  toggleSidebar() {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    const sidebar = document.getElementById('dungeonSidebar');
    const main = document.querySelector('.dungeon-main');
    const toolbar = document.getElementById('dungeonToolbar');
    
    if (sidebar) {
      sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
    }
    
    if (main) {
      main.classList.toggle('sidebar-collapsed', this.state.sidebarCollapsed);
      // Update inline style to ensure it works with resizer
      if (this.state.sidebarCollapsed) {
          main.style.left = '0';
          if (this.state.toolbarPosition === 'left' && toolbar) {
              toolbar.style.left = '0';
          }
      } else {
          // Expanding - restore positions
          const w = sidebar ? sidebar.offsetWidth : 0;
          if (w > 0) {
              if (this.state.toolbarPosition === 'left') {
                  main.style.left = (w + 50) + 'px';
                  if (toolbar) toolbar.style.left = w + 'px';
              } else {
                  main.style.left = w + 'px';
              }
          } else {
             // Fallback if offsetWidth is 0 (shouldn't happen if expanding)
             // Clear inline to let CSS take over or previous logic
             main.style.left = '';
          }

      }
    }

    localStorage.setItem('dungeonSidebarCollapsed', this.state.sidebarCollapsed);
  }

  toggleToolbar() {
    this.state.toolbarVisible = !this.state.toolbarVisible;
    this.updateToolbarVisibility();
    localStorage.setItem('dungeonToolbarVisible', this.state.toolbarVisible);
  }

  updateToolbarVisibility() {
    const toolbar = document.getElementById('dungeonToolbar');
    if (toolbar) {
      if (this.state.toolbarVisible) {
        toolbar.style.display = 'flex';
        // Trigger reflow for animation
        toolbar.offsetHeight;
        toolbar.classList.add('visible');
      } else {
        toolbar.classList.remove('visible');
        setTimeout(() => {
          toolbar.style.display = 'none';
        }, 300); // Match animation duration
      }
    }
    
    // Update toggle button text
    const toggleBtn = document.getElementById('dungeonToolbarToggle');
    if (toggleBtn) {
      const span = toggleBtn.querySelector('span');
      if (span) {
        span.textContent = this.state.toolbarVisible ? 'Hide Toolbar' : 'Show Toolbar';
      }
    }
  }

  setToolbarPosition(position) {
    this.state.toolbarPosition = position;
    const toolbar = document.getElementById('dungeonToolbar');
    if (!toolbar) return;

    const sidebar = document.getElementById('dungeonSidebar');
    // Robust width calculation: prefer style width (if resized), fallback to offset, default to 80
    let sidebarWidth = 80;
    if (sidebar && !this.state.sidebarCollapsed) {
        if (sidebar.style.width) {
            sidebarWidth = parseInt(sidebar.style.width, 10);
        } else if (sidebar.offsetWidth > 0) {
            sidebarWidth = sidebar.offsetWidth;
        }
    } else if (this.state.sidebarCollapsed) {
        sidebarWidth = 0;
    }
    
    // Remove all position classes
    toolbar.classList.remove('docked-top', 'docked-bottom', 'docked-left', 'docked-right', 'vertical');
    toolbar.style.left = '';
    toolbar.style.top = '';
    toolbar.style.right = '';
    toolbar.style.bottom = '';
    toolbar.style.cursor = ''; // Reset cursor

    const topbar = document.getElementById('dungeonTopbar');
    const topbarHeight = (topbar && topbar.offsetHeight) || 60;

    const toolbarHeight = 50; // Default toolbar height
    
    // Get main content area for adding padding classes
    const main = document.querySelector('.dungeon-main');
    if (main) {
      main.classList.remove('toolbar-docked-top', 'toolbar-docked-bottom');
    }

    // Reset sidebar positioning
    if (sidebar) {
      sidebar.style.top = '';
      sidebar.style.bottom = '';
    }

    switch(position) {
      case 'top':
        toolbar.classList.add('docked-top');
        toolbar.style.top = topbarHeight + 'px';
        toolbar.style.left = '0'; // Start from left edge, above sidebar
        toolbar.style.right = '0';
        toolbar.style.cursor = 'default'; // Not draggable
        
        // Push sidebar down below toolbar
        if (sidebar) {
          sidebar.style.top = (topbarHeight + toolbarHeight) + 'px';
        }
        if (main) {
          main.classList.add('toolbar-docked-top');
          main.style.top = (topbarHeight + toolbarHeight) + 'px';
        }
        break;
      case 'bottom':
        const footerHeight = 40;
        toolbar.classList.add('docked-bottom');
        toolbar.style.bottom = footerHeight + 'px'; // Sit above footer
        toolbar.style.top = 'auto'; 
        toolbar.style.left = '0'; 
        toolbar.style.right = '0';
        toolbar.style.cursor = 'default'; 
        
        // Push sidebar up above toolbar + footer
        if (sidebar) {
          sidebar.style.bottom = (toolbarHeight + footerHeight) + 'px';
        }
        if (main) {
          main.classList.add('toolbar-docked-bottom');
          main.style.bottom = (toolbarHeight + footerHeight) + 'px';
        }
        break;
      case 'left':
        toolbar.classList.add('docked-left', 'vertical');
        toolbar.style.left = sidebarWidth + 'px';
        toolbar.style.top = topbarHeight + 'px';
        toolbar.style.bottom = '0';
        toolbar.style.cursor = 'default'; // Not draggable
        
        // Reset sidebar to default
        if (sidebar) {
          sidebar.style.top = topbarHeight + 'px';
          sidebar.style.bottom = '0';
        }
        if (main) {
          main.style.top = topbarHeight + 'px';
          main.style.bottom = '0';
          // Push main content right to make room for toolbar (50px)
          const contentLeft = sidebarWidth + 50;
          main.style.left = contentLeft + 'px';
        }
        break;
      case 'right':
        toolbar.classList.add('docked-right', 'vertical');
        toolbar.style.left = 'auto'; // Explicitly override any previous or default left value
        toolbar.style.right = '0';
        toolbar.style.top = topbarHeight + 'px';
        toolbar.style.bottom = '0';
        toolbar.style.cursor = 'default'; // Not draggable
        
        // Reset sidebar to default
        if (sidebar) {
          sidebar.style.top = topbarHeight + 'px';
          sidebar.style.bottom = '0';
        }
        if (main) {
          main.style.top = topbarHeight + 'px';
          main.style.bottom = '0';
        }
        break;
      case 'floating':
      default:
        toolbar.style.cursor = 'grab'; // Draggable
        
        // Reset sidebar and main to default
        if (sidebar) {
          sidebar.style.top = topbarHeight + 'px';
          sidebar.style.bottom = '0';
        }
        if (main) {
          main.style.top = topbarHeight + 'px';
          main.style.bottom = '0';
        }
        
        // Restore saved position or center
        const savedPos = localStorage.getItem('dungeonToolbarPos');
        if (savedPos) {
          try {
            const pos = JSON.parse(savedPos);
            toolbar.style.left = pos.left;
            toolbar.style.top = pos.top;
            if (pos.vertical) toolbar.classList.add('vertical');
          } catch(e) {}
        } else {
          const w = window.innerWidth;
          const tw = toolbar.offsetWidth || 300;
          toolbar.style.left = (w / 2 - tw / 2) + 'px';
          toolbar.style.top = (topbarHeight + 40) + 'px';
        }
        break;
    }

    this.updateHighlightSVG(toolbar);
    localStorage.setItem('dungeonToolbarPosition', position);
    
    // Persist to backend
    (async () => {
        if (window.Storage && window.Storage.loadSettings && window.Storage.saveSettings) {
            try {
                const current = await window.Storage.loadSettings();
                // Only save if changed
                if (current.dungeonToolbarPosition !== position) {
                    current.dungeonToolbarPosition = position;
                    await window.Storage.saveSettings(current);
                }
            } catch(e) {
                console.error("Dungeon: Failed to save toolbar position to backend", e);
            }
        }
    })();
  }

  updateStats() {
    // Stats are now in sidebar, updated during renderSidebar()
    // This method kept for compatibility but does nothing
  }

  updateSaveStatus(status = 'saved') {
    const saveStatusEl = document.getElementById('dungeonSaveStatus');
    if (!saveStatusEl) return;

    if (this.saveStatusTimeout) {
        clearTimeout(this.saveStatusTimeout);
        this.saveStatusTimeout = null;
    }

    saveStatusEl.style.opacity = '1';
    saveStatusEl.className = 'dungeon-save-status ' + status;
    
    switch(status) {
      case 'saving':
        saveStatusEl.textContent = 'Saving...';
        break;
      case 'unsaved':
        saveStatusEl.textContent = 'Unsaved';
        this.state.unsavedChanges = true;
        break;
      case 'saved':
      default:
        saveStatusEl.textContent = 'Saved';
        this.state.unsavedChanges = false;
        this.saveStatusTimeout = setTimeout(() => {
            saveStatusEl.style.opacity = '0';
        }, 2000);
        break;
    }
  }

  updateQuestionTitle() {
    const q = this.state.questions[this.state.currentIndex];
    const titleEl = document.getElementById('dungeonQuestionTitle');
    if (titleEl && q) {
      titleEl.textContent = q.title || 'Untitled Question';
    }
  }

  updateHighlightSVG(toolbar) {
      const highlightBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="highlight"]');
      if (!highlightBtn) return;
      
      const isVertical = toolbar.classList.contains('vertical');
      const svgPath = highlightBtn.querySelector('svg path:nth-child(2)');
      
      if (svgPath) {
          if (isVertical) {
              // Vertical orientation - slightly different end point
              svgPath.setAttribute('d', 'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l3-3 3 3L23 10z');
          } else {
              // Horizontal orientation - original path
              svgPath.setAttribute('d', 'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l3-3 3 3L24 10z');
          }
      }
  }

  toggleHighlightMode() {
      this.state.highlightMode = !this.state.highlightMode;
      this.renderToolbarState();
  }

  toggleStar() {
      const q = this.state.questions[this.state.currentIndex];
      if (!q) return;
      q.isStarred = !q.isStarred;
      this.renderToolbarState();
      this.renderSidebar(); // Update indicator
      this.updateSaveStatus('unsaved');
      this.saveQuestionsToBackend();
  }

  handleHighlight(e) {
      if (!this.state.highlightMode) return;
      
      const selection = window.getSelection();
      if (selection.toString().length > 0) {
          const range = selection.getRangeAt(0);
          
          // Ensure we are selecting inside the context box
          if (!e.currentTarget.contains(range.commonAncestorContainer)) return;

          const span = document.createElement("span");
          span.className = "highlight";
          try {
              range.surroundContents(span);
              selection.removeAllRanges();
              
              // Persist: Update question text in state
              const q = this.state.questions[this.state.currentIndex];
              q.text = e.currentTarget.innerHTML; // Save modified HTML
              this.updateSaveStatus('unsaved');
              this.saveQuestionsToBackend();

              // Auto-disable highlight? No, keep active as requested ("highlights yellow by defult after releasing...").
              // User said: "make pressing on it to active that autohighligh the text highlights yellow by defult after releasing the highlight"
              // This implies the mode stays on.
          } catch(err) {
              console.warn("Highlight failed (crossing tags?)", err);
          }
      }
  }

  saveQuestionsToBackend() {
      // Placeholder for persistence
      this.updateSaveStatus('saving');
      
      // Optimistically dispatch event
      const event = new CustomEvent('dungeon-questions-update', { detail: this.state.questions });
      window.dispatchEvent(event);
      
      // Try generic storage if available
      if (window.electronAPI && window.electronAPI.saveQuestions) {
          window.electronAPI.saveQuestions(JSON.parse(JSON.stringify(this.state.questions))); // Deep copy
          setTimeout(() => this.updateSaveStatus('saved'), 500);
      } else {
          // console.log("Backend save not integrated. Changes are in-memory.");
          setTimeout(() => this.updateSaveStatus('saved'), 500);
      }
  }

  renderToolbarState() {
      const toolbar = document.getElementById("dungeonToolbar");
      if (!toolbar) return;

      const q = this.state.questions[this.state.currentIndex];
      
      // Star
      const starBtn = toolbar.querySelector('[data-tool="star"]');
      if (starBtn && q) {
          if (q.isStarred) starBtn.classList.add('active');
          else starBtn.classList.remove('active');
      }

      // Highlight
      const highlightBtn = toolbar.querySelector('[data-tool="highlight"]');
      if (highlightBtn) {
          if (this.state.highlightMode) highlightBtn.classList.add('active');
          else highlightBtn.classList.remove('active');
      }
  }

  addNote() {
      const q = this.state.questions[this.state.currentIndex];
      if (!q) return;
      
      const note = prompt("Add a note for this question:", q.note || "");
      if (note !== null) {
          q.note = note;
          this.updateSaveStatus('unsaved');
          this.saveQuestionsToBackend();
      }
  }

  toggleReveal() {
      const q = this.state.questions[this.state.currentIndex];
      // If already submitted, reveal does nothing or maybe just ignores (user sees answer anyway)
      // If not submitted, we show answer but mark as "revealed" (maybe count as wrong?)
      // User said: "button 'light bulb' to show the answer if the user didnt know it or gave up"
      
      const answer = this.state.answers.get(q.id);
      if (answer && answer.submitted) return; // Already done
      
      this.state.revealed = true; // Set flag
      
      // Visual feedback
      const revealBtn = document.getElementById('dungeonRevealBtn');
      if (revealBtn) revealBtn.classList.add('active');
      
      // Highlight correct answer in UI
      const options = document.querySelectorAll('.dungeon-radio-option');
      options.forEach(opt => {
          if (opt.dataset.value === q.correctAnswer) {
              opt.classList.add('correct-answer'); // Reuse correct style? Or distinctive?
              // Let's use a distinctive style if needed, but correct-answer is green.
              // Maybe we should style it yellow?
              opt.style.background = 'rgba(251, 191, 36, 0.1)';
              opt.style.borderColor = '#fbbf24';
          }
      });
      
      // Stop timer? Usually giving up stops timer? 
      // Let's keep timer running until they actually submit or move on? 
      // "gave up" usually implies done.
      // Let's stop timer.
      this.stopTimer();
  }

  startTimer() {
      this.stopTimer(); // Clear existing
      this.timerStart = Date.now();
      const timerEl = document.getElementById('dungeonTimer');
      if (!timerEl) return;
      
      this.updateTimerDisplay(0);
      
      this.timerInterval = setInterval(() => {
          const elapsed = Date.now() - this.timerStart;
          this.updateTimerDisplay(elapsed);
      }, 1000);
  }

  stopTimer() {
      if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
      }
  }

  updateTimerDisplay(ms) {
      const timerEl = document.getElementById('dungeonTimer');
      if (!timerEl) return;
      
      const totalSeconds = Math.floor(ms / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  updateFooterStats() {
      // Calculate stats
      let correct = 0;
      let wrong = 0;
      
      this.state.answers.forEach(a => {
          if (a.submitted) {
              if (a.isCorrect) correct++;
              else wrong++;
          }
      });
      
      const correctEl = document.getElementById('dungeonStatCorrect');
      const wrongEl = document.getElementById('dungeonStatWrong');
      
      if (correctEl) correctEl.textContent = correct;
      if (wrongEl) wrongEl.textContent = wrong;
  }
  
  clearHighlights() {
      const q = this.state.questions[this.state.currentIndex];
      if (!q) return;
      
      if (confirm("Clear all highlights from this question?")) {
          // Remove all highlight spans from the text
          if (q.text) {
              q.text = q.text.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');
              this.renderQuestion(); // Re-render to show changes
              this.updateSaveStatus('unsaved');
              this.saveQuestionsToBackend();
          }
      }
  }
  


  initResizer() {
      // Safety check
      if (!this.el.sidebar) return;

      // Load saved width
      const savedWidth = localStorage.getItem("dungeonSidebarWidth");
      if (savedWidth) {
          this.el.sidebar.style.width = savedWidth + "px";
      }

      // Create handle if not exists
      if (!this.el.sidebar.querySelector('.dungeon-resizer-handle')) {
          const handle = document.createElement('div');
          handle.className = 'dungeon-resizer-handle';
          // Make grip area wider but keep visual invisible (or slight hint)
          handle.style.cssText = "position: absolute; right: -4px; top: 0; width: 10px; height: 100%; cursor: col-resize; z-index: 99; background: transparent;";
          
          handle.addEventListener('mousedown', (e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = this.el.sidebar.offsetWidth;
              document.body.style.cursor = "col-resize"; // Force cursor on body during drag
              
              // Disable transitions during drag for responsiveness
              this.el.sidebar.style.transition = 'none';
              const main = document.querySelector('.dungeon-main');
              if (main) main.style.transition = 'none';
              const toolbar = document.getElementById('dungeonToolbar');
              if (toolbar) toolbar.style.transition = 'none';

              const onMouseMove = (ev) => {
                  const newWidth = startWidth + (ev.clientX - startX);
                  if (newWidth >= 50 && newWidth <= 300) {
                      this.el.sidebar.style.width = newWidth + 'px';
                      
                      // Update Main Content Position
                      if (main) {
                          if (this.state.toolbarPosition === 'left') {
                              main.style.left = (newWidth + 50) + 'px';
                          } else {
                              main.style.left = newWidth + 'px';
                          }
                      }

                      // Update Toolbar Position if docked left
                      if (this.state.toolbarPosition === 'left' && toolbar) {
                          toolbar.style.left = newWidth + 'px';
                      }
                  }
              };
              
              const onMouseUp = () => {
                  localStorage.setItem("dungeonSidebarWidth", parseInt(this.el.sidebar.style.width)); // Save
                  document.body.style.cursor = ""; // Reset cursor
                  
                  // Re-enable transitions
                  this.el.sidebar.style.transition = '';
                  if (main) main.style.transition = '';
                  if (toolbar) toolbar.style.transition = '';

                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
              };
              
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
          });
          
          this.el.sidebar.appendChild(handle);
      }
  }

  // Helper to sync main content with sidebar on load/toggle
  updateMainPosition() {
      const sidebar = document.getElementById('dungeonSidebar');
      const main = document.querySelector('.dungeon-main');
      if (sidebar && main) {
          if (this.state.sidebarCollapsed) {
              main.style.left = '0';
          } else {
              main.style.left = sidebar.offsetWidth + 'px';
          }
      }
  }

  bindEvents() {
    // Close button
    const closeBtn = document.getElementById("dungeonCloseBtn");
    if (closeBtn) closeBtn.onclick = () => this.close();

    // Keyboard nav
    document.addEventListener("keydown", (e) => {
      if (this.el.container.classList.contains("hidden")) return;
      
      if (e.key === "ArrowRight") this.navNext();
      if (e.key === "ArrowLeft") this.navPrev();
      if (e.key === "Escape") this.close();
    });
  }

  open(questions) {
    if (!questions || questions.length === 0) {
      alert("No questions to play!");
      return;
    }
    
    this.state.questions = [...questions];
    this.state.currentIndex = 0;
    this.state.answers.clear();
    this.state.selectedOption = null;
    
    this.el.container.classList.remove("hidden");
    this.render();
  }

  close() {
    this.el.container.classList.add("hidden");
    this.stopTimer();
  }

  render() {
    // 1. Sidebar
    this.renderSidebar();
    
    // 2. Main Question
    this.renderQuestion();
    
    // 3. Update topbar and footer
    this.updateQuestionTitle();
    this.updateStats(); // Keeps old hook just in case
    this.updateFooterStats(); // New Stats
    
    // Reset Reveal Btn
    const revealBtn = document.getElementById('dungeonRevealBtn');
    if (revealBtn) revealBtn.classList.remove('active');
    
    // Start Timer
    this.startTimer();
    
    // 3. Nav Buttons State (Toolbar)
    const prev = document.getElementById("dungeonToolPrev");
    const next = document.getElementById("dungeonToolNext");
    
    if (prev) {
        if (this.state.currentIndex === 0) {
            prev.style.opacity = "0.3";
            prev.style.pointerEvents = "none";
        } else {
            prev.style.opacity = "1";
            prev.style.pointerEvents = "auto";
        }
    }
    if (next) {
        if (this.state.currentIndex === this.state.questions.length - 1) {
            next.style.opacity = "0.3";
            next.style.pointerEvents = "none";
        } else {
            next.style.opacity = "1";
            next.style.pointerEvents = "auto";
        }
    }
  }

  handleSearch(query) {
      this.state.searchQuery = query;
      this.renderSidebar();
  }

  renderSidebar() {
    // Clear sidebar but preserve resizer handle
    const handle = this.el.sidebar.querySelector('.dungeon-resizer-handle');
    
    this.el.sidebar.innerHTML = "";

    this.el.sidebar.innerHTML = "";

    // Create scrollable container for questions
    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'dungeon-sidebar-questions';

    this.state.questions.forEach((q, index) => {
      // Filter logic
      if (this.state.searchQuery) {
          const query = this.state.searchQuery.toLowerCase();
          const textMatch = (q.text || "").toLowerCase().includes(query);
          const optionMatch = q.options && q.options.some(o => o.text && o.text.toLowerCase().includes(query));
          // If no match, skip this question
          if (!textMatch && !optionMatch && !(q.title||"").toLowerCase().includes(query)) {
              return;
          }
      }

      const box = document.createElement("div");
      box.className = "dungeon-q-box";
      
      if (index === this.state.currentIndex) {
        box.classList.add("active");
      }

      // Check Status
      const answer = this.state.answers.get(q.id);
      let content = `<span class="q-number" style="font-size: 0.9rem;">${index + 1}</span>`;
      
      if (answer && answer.submitted) {
          if (answer.isCorrect) {
              box.classList.add("correct");
          } else {
              box.classList.add("wrong");
          }
      }

      box.title = q.title || `Question ${index + 1}`; // Tooltip
      box.innerHTML = `<span class="dungeon-box-status">${content}</span>`;
      
      // Star Indicator
      if (q.isStarred) {
          const star = document.createElement('div');
          star.className = 'dungeon-starred-indicator';
          box.appendChild(star);
          box.style.position = 'relative'; // Ensure relative for abs star
      }
      
      box.onclick = () => {
        this.saveCurrentSelection(); // If they selected something but didn't submit, save it? Or discard? Let's just switch.
        this.state.currentIndex = index;
        this.state.selectedOption = null; // Reset temp selection on switch
        // Restore temp selection if we want persistence of drafts? simpler to reset.
        this.render();
      };
      
      questionsContainer.appendChild(box);
    });

    // Add questions container to sidebar
    this.el.sidebar.appendChild(questionsContainer);

    // Re-append handle at the end so it's on top
    if (handle) {
      this.el.sidebar.appendChild(handle);
    } else {
      this.initResizer(); // Fallback if handle wasn't there
    }
  }

  saveCurrentSelection() {
     // Optional: Persist unsubmitted selection? 
     // For now, let's keep it simple: switching questions clears unsubmitted selection.
     // To improve, we can store it in a separate map.
  }

  renderQuestion() {
    const q = this.state.questions[this.state.currentIndex];
    const answer = this.state.answers.get(q.id);
    const isSubmitted = answer && answer.submitted;

    let html = `
      
      <!-- Context Box (Image/Code) - Placeholder if empty -->
      <!-- Context Box (Image/Code) -->
      <!-- Context Box (Image/Code) -->
      <div class="dungeon-context-box" onmouseup="window.DungeonBase.handleHighlight(event)">
             ${q.text || q.body || q.content || "No question details."}
      </div>

      <div class="dungeon-options-list">
    `;

    const options = q.options || [];
    const currentSel = this.state.selectedOption; // Valid only if not submitted
    const submittedSel = isSubmitted ? answer.selectedId : null;

    options.forEach(opt => {
        let classes = "dungeon-radio-option";
        // Logic for styling
        if (isSubmitted) {
            // Submitted state
            if (String(opt.id) === String(submittedSel)) {
                 classes += " selected"; // Visual selected
                 if (answer.isCorrect) classes += " correct-answer";
                 else classes += " wrong-answer";
            }
            if (opt.isCorrect && !answer.isCorrect) {
                 classes += " correct-answer"; // Show missed correct answer
            }
        } else {
            // Interactive state
            if (String(opt.id) === String(currentSel)) classes += " selected";
        }

        html += `
          <div class="${classes}" onclick="window.DungeonBase.handleSelectOption('${opt.id}')">
              <div class="dungeon-radio-circle"></div>
              <div class="dungeon-radio-text">${opt.text || "Option"}</div>
          </div>
        `;
    });

    html += `</div>`; // End options

    html += `</div>`; // End actions row

    this.renderToolbarState(); // Sync toolbar with current question state

    if (isSubmitted) {
        html += `
           <div class="dungeon-explanation">
               <h3>${answer.isCorrect ? "Correct!" : "Incorrect"}</h3>
               <p>${q.explanation || "No explanation provided."}</p>
           </div>
        `;
    }

    this.el.main.innerHTML = html;
  }

  handleSelectOption(optionId) {
      const q = this.state.questions[this.state.currentIndex];
      const answer = this.state.answers.get(q.id);
      
      if (answer && answer.submitted) return; // Locked

      this.state.selectedOption = optionId;
      this.renderQuestion();
  }

  handleSubmit() {
      const q = this.state.questions[this.state.currentIndex];
      if (!this.state.selectedOption) {
          alert("Please select an option.");
          return;
      }

      const selectedOpt = q.options.find(o => String(o.id) === String(this.state.selectedOption));
      const isCorrect = selectedOpt && selectedOpt.isCorrect;

      this.state.answers.set(q.id, {
          submitted: true,
          selectedId: this.state.selectedOption,
          isCorrect: isCorrect
      });

      this.updateSaveStatus('unsaved');
      this.saveQuestionsToBackend();
      this.stopTimer();
      this.render(); // Update sidebar and content
  }

  navNext() {
    if (this.state.currentIndex < this.state.questions.length - 1) {
      this.state.currentIndex++;
      this.state.selectedOption = null;
      this.render();
    }
  }

  navPrev() {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
      this.state.selectedOption = null;
      this.render();
    }
  }
}
