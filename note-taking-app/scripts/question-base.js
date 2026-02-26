

// Question Layer Module
console.log('[QuestionBase] Script loaded!');
const QuestionBase = {
    state: {
        questions: [],
        folders: [],
        activeQuestionId: null,
        activeContext: null, // Track where selection happened (e.g. 'All Questions', 'folder-123')
        editingFolderId: null,
        editingQuestionId: null,
        expandedFolders: new Set(), // Set of folder IDs
        selectedItems: new Set(), // Set of selected question IDs for multi-select
        collapsedSections: new Set(), // Set of collapsed section names
        sessionCreatorVisible: false,
        recentSessions: [],
        recentSessionsView: 'list', // 'grid' or 'list'
        recentSessionsSort: 'newest', // 'newest', 'oldest', 'name', 'questions'
        recentSessionsSearch: '', // Real-time search query
        lastActiveTab: 'main', // Track last active tab for back navigation
        deletedSessionBlocks: [], // Stack for restoring deleted questions in session creator
        aiMode: false,
        uploadedMediaContent: null, // Store uploaded PDF/media content for AI context
        selectedTagSubjects: [],
        selectedTagSystems: [],
        selectedTagMajors: [],
        selectedTagMinors: [],
        ctPreviewExpanded: false,
    },

    el: {
        base: null,
        sidebar: null,
        content: null,
        list: null,
        editor: null,
        emptyState: null,
        titleInput: null,
        textInput: null,
        explanationInput: null,
        optionsContainer: null,
        addOptionBtn: null,
        saveBtn: null,
        newBtn: null,
        backBtn: null,
        openBtn: null,
        floatBtn: null,
        resizer: null,
        searchInput: null,
        clearSearchBtn: null,
        ctxMenu: null, // Custom context menu
        // Session Creator
        sessionCreator: null,
        sessionInput: null,
        createSessionBtn: null,
        addSessionQBtn: null,
        clearSessionBtn: null,
        cancelSessionBtn: null,
        startSessionBtn: null,
    },

    init() {
        console.log("Initializing Question Base...");
        this.createBase(); // Ensure DOM exists
        this.cacheElements();

        // Ensure title input is disabled initially
        if (this.el.titleInput) {
            this.el.titleInput.disabled = true;
        }

        this.bindEvents();
        this.initResizer();
        this.loadSidebarWidth();
        this.loadCollapsedSections(); // Load BEFORE data so state is ready for renderSidebar
        this.loadExpandedFolders();
        this.loadRecentSessions();
        this.loadData(true); // Suppress warning on initial load while waiting for Storage

        // If Storage wasn't ready initially, reload once it becomes available
        if (typeof window.Storage === 'undefined' || typeof window.Storage.loadQuestions !== 'function') {
            console.log('[QuestionBase] Waiting for Storage to become available...');
            const checkStorage = setInterval(() => {
                if (typeof window.Storage !== 'undefined' && typeof window.Storage.loadQuestions === 'function') {
                    clearInterval(checkStorage);
                    console.log('[QuestionBase] Storage now available! Reloading from backend...');
                    this.loadData();
                }
            }, 100);

            // Stop checking after 10 seconds
            setTimeout(() => clearInterval(checkStorage), 10000);
        }

        // Global click to close context menu
        document.addEventListener("mousedown", (e) => {
            if (this.el.ctxMenu && !this.el.ctxMenu.classList.contains("hidden")) {
                // Ignore if clicking inside menu
                if (this.el.ctxMenu.contains(e.target)) return;

                // Only close on left-click elsewhere
                if (e.button === 0) {
                    console.log("[QuestionBase] Closing context menu due to outside mousedown on:", e.target);
                    // Add a small delay to avoid race conditions with other handlers
                    setTimeout(() => this.hideContextMenu(), 10);
                }
            }
        });
    },

    cacheElements() {
        this.el.base = document.getElementById("questionBase");
        this.el.sidebar = document.getElementById("questionSidebar");
        this.el.content = document.getElementById("questionContent");
        this.el.list = document.getElementById("questionList");
        this.el.editor = document.getElementById("questionEditor");
        this.el.emptyState = document.getElementById("questionEmptyState");

        this.el.titleInput = document.getElementById("questionTitleInput");
        this.el.textInput = document.getElementById("questionTextInput");
        this.el.explanationInput = document.getElementById("questionExplanation");
        this.el.optionsContainer = document.getElementById("optionsContainer");

        this.el.addOptionBtn = document.getElementById("addOptionBtn");

        // Toggle Btn
        this.el.toggleSidebarBtn = document.getElementById("toggleQuestionSidebarBtn");

        this.el.saveBtn = document.getElementById("saveQuestionBtn");
        this.el.newBtn = document.getElementById("questionActionBtn");
        this.el.backBtn = document.getElementById("backToMainFromQuestions");
        this.el.backBtnHeader = document.getElementById("backToMainFromQuestionsHeader");
        this.el.openBtn = document.getElementById("openQuestionsBtn");
        this.el.floatBtn = document.getElementById("openQuestionsFloatBtn");
        if (this.el.floatBtn) {
            this.state.originalFloatBtnHtml = this.el.floatBtn.innerHTML;
        }
        this.el.resizer = document.getElementById("questionSidebarResizer");
        this.el.searchInput = document.getElementById("questionSearchInput");
        this.el.clearSearchBtn = document.getElementById("clearQuestionSearch");
        // If sidebar was just created, trashBtn needs to be found
        if (!this.el.trashBtn && this.el.sidebar) {
            this.el.trashBtn = this.el.sidebar.querySelector(".editor-trash-btn");
        }

        // create context menu element
        this.createContextMenu();

        // Session Creator Elements
        this.el.sessionCreator = document.getElementById("sessionCreator");
        this.el.sessionInput = document.getElementById("sessionInput");
        this.el.createSessionBtn = document.getElementById("createSessionBtn");
        this.el.addSessionQBtn = document.getElementById("addSessionQBtn");
        this.el.clearSessionBtn = document.getElementById("clearSessionBtn");
        this.el.restoreSessionQBtn = document.getElementById("restoreSessionQBtn");
        this.el.cancelSessionBtn = document.getElementById("cancelSessionBtn");
        this.el.startSessionBtn = document.getElementById("startSessionBtn");
        this.el.toggleAiModeBtn = document.getElementById("toggleAiModeBtn");
        this.el.fillAiBtn = document.getElementById("fillAiBtn");
        this.el.uploadMediaBtn = document.getElementById("uploadMediaBtn");
        this.el.uploadedFileStatus = document.getElementById("uploadedFileStatus");
        this.el.uploadedFileName = document.getElementById("uploadedFileName");
        this.el.viewAiPromptBtn = document.getElementById("viewAiPromptBtn");
        this.el.aiPromptModal = document.getElementById("aiPromptModal");

        // Model Selector
        this.el.aiModelSelector = document.getElementById("aiModelSelector");
        if (this.el.aiModelSelector) {
            const savedModel = localStorage.getItem('notesApp_aiModel');
            if (savedModel) {
                this.el.aiModelSelector.value = savedModel;
            }
            this.el.aiModelSelector.addEventListener('change', (e) => {
                localStorage.setItem('notesApp_aiModel', e.target.value);
            });
        }

        // Recent Sessions Toolbar
        this.el.sessionsSearchInput = document.getElementById("sessionsSearchInput");
        this.el.sessionsSortSelect = document.getElementById("sessionsSortSelect");
        this.el.viewListBtn = document.getElementById("viewListBtn");
        this.el.viewGridBtn = document.getElementById("viewGridBtn");
        this.el.recentSessionsList = document.getElementById("recentSessionsList");
        this.el.openRecentSessionsBtn = document.getElementById("openRecentSessionsBtn");

        // Statistics Elements
        this.el.statTotalQuestions = document.getElementById("stat-total-questions");
        this.el.statTotalFolders = document.getElementById("stat-total-folders");
        this.el.statTotalSessions = document.getElementById("stat-total-sessions");
        this.el.statCorrect = document.getElementById("stat-correct");
        this.el.statIncorrect = document.getElementById("stat-incorrect");
        this.el.statOmitted = document.getElementById("stat-omitted");
        this.el.statAccuracy = document.getElementById("stat-accuracy");
        this.el.statSuspended = document.getElementById("stat-suspended");
        this.el.statTotalTime = document.getElementById("stat-total-time");
        this.el.syncStatsBtn = document.getElementById("syncStatsBtn");
        
        // New Dashboard Elements
        this.el.donutCorrect = document.getElementById("donutCorrect");
        this.el.donutUsed = document.getElementById("donutUsed");
        this.el.statUsedPct = document.getElementById("stat-used-pct");
        this.el.statUsedQ = document.getElementById("stat-used-q");
        this.el.statUnusedQ = document.getElementById("stat-unused-q");
        this.el.statC2I = document.getElementById("stat-c2i");
        this.el.statI2C = document.getElementById("stat-i2c");
        this.el.statI2I = document.getElementById("stat-i2i");

        // Statistics Elements
        this.el.statAvgTime = document.getElementById("stat-avg-time");

        // Tag Dropdowns (Subject / System / Major)
        this.el.tagBtnSubject  = document.getElementById('tagBtnSubject');
        this.el.tagMenuSubject = document.getElementById('tagMenuSubject');
        this.el.tagBadgeSubject = document.getElementById('tagBadgeSubject');
        this.el.tagBtnSystem   = document.getElementById('tagBtnSystem');
        this.el.tagMenuSystem  = document.getElementById('tagMenuSystem');
        this.el.tagBadgeSystem = document.getElementById('tagBadgeSystem');
        this.el.tagBtnMajor    = document.getElementById('tagBtnMajor');
        this.el.tagMenuMajor   = document.getElementById('tagMenuMajor');
        this.el.tagBadgeMajor  = document.getElementById('tagBadgeMajor');
        this.el.tagBtnMinor   = document.getElementById('tagBtnMinor');
        this.el.tagMenuMinor  = document.getElementById('tagMenuMinor');
        this.el.tagBadgeMinor = document.getElementById('tagBadgeMinor');
        this.initTagDropdowns();

        if (this.el.syncStatsBtn) {
            this.el.syncStatsBtn.onclick = () => this.renderStatistics(true);
        }

        this.toggleSessionControls(false); // Ensure hidden on init
    },

    createBase() {
        if (document.getElementById("questionBase")) return; // Already exists

        // Inject styles if needed (assuming link is present, otherwise simple styles here)

        const base = document.createElement("div");
        base.id = "questionBase";
        base.className = "question-base hidden";

        // Sidebar
        const sidebar = document.createElement("div");
        sidebar.id = "questionSidebar";
        sidebar.className = "sidebar question-sidebar";
        sidebar.style.display = "flex";
        sidebar.style.flexDirection = "column";

        // Search Bar
        const searchDiv = document.createElement("div");
        searchDiv.className = "sidebar-search";
        searchDiv.innerHTML = `
      <div class="search-container">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="questionSearchInput" placeholder="Search questions...">
        <button class="editor-trash-btn" title="Trash">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <polyline points="3 6 5 6 21 6"></polyline>
             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
        sidebar.appendChild(searchDiv);

        // List
        const list = document.createElement("div");
        list.id = "questionList";
        list.className = "sidebar-content";
        sidebar.appendChild(list);

        // Resizer
        const resizer = document.createElement("div");
        resizer.id = "questionSidebarResizer";
        resizer.className = "sidebar-resizer";
        sidebar.appendChild(resizer);

        base.appendChild(sidebar);

        // Content
        const content = document.createElement("div");
        content.id = "questionContent";
        content.className = "question-content";

        // Editor + Empty State HTML structure
        content.innerHTML = `
        <div id="questionEmptyState" class="question-empty-state">
           <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <circle cx="12" cy="12" r="10"></circle>
             <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
             <line x1="12" y1="17" x2="12.01" y2="17"></line>
           </svg>
           <h3>Select a Question</h3>
           <p>Choose a question from the sidebar or likely invalid create a new one to get started.</p>
        </div>
        <div id="questionEditor" class="question-editor hidden">
           <div class="editor-header">
              <input type="text" id="questionTitleInput" class="question-title-input" placeholder="Question Title (optional)" disabled>
              <div class="editor-actions">
                 <button id="saveQuestionBtn" class="primary-btn" disabled>Save</button>
              </div>
           </div>
           <div class="editor-body">
               <div id="questionTextInput" class="question-text-input" contenteditable="true"></div>
               <div class="editor-section">
                   <label>Explanation</label>
                   <textarea id="questionExplanation" placeholder="Add explanation..."></textarea>
               </div>
               <div class="editor-section">
                   <div id="optionsContainer"></div>
                   <button id="addOptionBtn" class="secondary-btn">+ Add Option</button>
               </div>
           </div>
        </div>
        </div>
    `;
        base.appendChild(content);

        // Action Button (Floating +)
        const fab = document.createElement("button");
        fab.id = "questionActionBtn";
        fab.className = "floating-action-btn";
        fab.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
        base.appendChild(fab);


        document.body.appendChild(base);

        // Note: Toggle Button and other global buttons are assumed to be in the main app toolbar
    },



    bindEvents() {
        // Sidebar Toggle
        if (this.el.toggleSidebarBtn) {
            this.el.toggleSidebarBtn.addEventListener("click", () => this.toggleSidebar());
        }

        // Question Navigation
        if (this.el.openBtn) this.el.openBtn.addEventListener("click", () => this.open());
        if (this.el.floatBtn) {
            this.el.floatBtn.addEventListener("click", () => {
                if (this.el.base.classList.contains("hidden")) {
                    this.open();
                } else {
                    this.close();
                }
            });
        }
        if (this.el.backBtn) this.el.backBtn.addEventListener("click", () => this.close());
        if (this.el.backBtnHeader) this.el.backBtnHeader.addEventListener("click", () => this.close());

        // Question Actions
        if (this.el.newBtn) {
            // Change to show menu or just create question? 
            // User asked for folders, so maybe New Folder option too. 
            // For now, Left Click = New Question, Right Click or Long Press = Menu? 
            // Or simpler: New Question button, and a separate "New Folder" button in sidebar header?
            // Let's keep it simple: Click creates Question.
            this.el.newBtn.addEventListener("click", (e) => {
                // Check if shift click for folder
                if (e.shiftKey) {
                    this.createNewFolder();
                } else {
                    this.createNewQuestion();
                }
            });
            this.el.newBtn.title = "New Question (Shift+Click for New Folder)";
        }

        if (this.el.toggleAiModeBtn) {
            this.el.toggleAiModeBtn.onclick = () => this.toggleAiMode();
        }
        if (this.el.fillAiBtn) {
            this.el.fillAiBtn.onclick = () => this.fillWithAI();
        }
        if (this.el.uploadMediaBtn) {
            this.el.uploadMediaBtn.onclick = () => this.uploadMedia();
        }
        if (this.el.viewAiPromptBtn) {
            this.el.viewAiPromptBtn.onclick = () => this.viewAiPrompt();
        }

        // Modal close listeners
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.onclick = () => {
                if (this.el.aiPromptModal) this.el.aiPromptModal.style.display = 'none';
            };
        });

        if (this.el.saveBtn) this.el.saveBtn.addEventListener("click", () => this.saveCurrentQuestion());

        // Auto-save title on change
        if (this.el.titleInput) {
            this.el.titleInput.addEventListener("input", () => {
                if (this.activeQuestionId) {
                    const q = this.state.questions.find(q => q.id === this.activeQuestionId);
                    if (q) {
                        q.title = this.el.titleInput.value;
                        this.saveData();
                    }
                }
            });
            // Removed unconditional enable
            // this.el.titleInput.disabled = false; 
        }

        if (this.el.addOptionBtn) this.el.addOptionBtn.addEventListener("click", () => this.addOptionUI());

        // Play Button (Dungeon Layer)
        const playBtn = document.getElementById("playQuestionsBtn");
        if (playBtn) {
            playBtn.addEventListener("click", () => {
                if (this.state.questions.length === 0) {
                    alert("No questions to play!");
                    return;
                }
                if (typeof window.DungeonBase !== 'undefined') {
                    window.DungeonBase.open(this.state.questions);
                }
            });
        }

        // Trash
        if (this.el.trashBtn) {
            this.el.trashBtn.addEventListener("click", () => this.showTrashModal());
        }

        // Search
        if (this.el.searchInput) this.el.searchInput.addEventListener("input", () => this.renderSidebar());
        if (this.el.clearSearchBtn) {
            this.el.clearSearchBtn.addEventListener("click", () => {
                this.el.searchInput.value = "";
                this.renderSidebar();
            });
        }

        // Context Menu for Sidebar (Handles list items + empty space)
        this.el.sidebar.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent main app context menu

            const item = e.target.closest(".question-item, .q-folder-header");
            const targetId = item ? item.dataset.id : null;

            console.log("[QuestionBase] Sidebar ContextMenu Triggered on:", e.target, "Item:", item);

            // Visual Highlight Synchronization
            document.querySelectorAll(".question-item.context-active, .q-folder-header.context-active").forEach(el => el.classList.remove("context-active"));
            if (item) {
                item.classList.add("context-active");

                // If it's a question, also ensure it's selected in state
                if (item.classList.contains("question-item")) {
                    this.state.selectedItems.clear();
                    this.state.selectedItems.add(targetId);
                    item.classList.add("selected");
                }
            }

            // Check if clicking specific item type
            let type = 'empty';
            let context = null;
            if (item) {
                if (item.classList.contains("q-folder-header")) type = 'folder';
                else {
                    type = 'question';
                    context = item.getAttribute("data-context");
                }
            }

            this.showContextMenu(e.clientX, e.clientY, targetId, type, context);
        });

        // Context Menu for Empty State
        if (this.el.emptyState) {
            this.el.emptyState.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Treat as empty space click
                this.showContextMenu(e.clientX, e.clientY, null, 'empty');
            });
        }

        // Context Menu for Editor (Global options or specific if handled)
        if (this.el.editor) {
            this.el.editor.addEventListener("contextmenu", (e) => {
                // Ignore if clicking on inputs/contenteditable (to allow native menu for text)
                if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu(e.clientX, e.clientY, null, 'global');
            });
        }

        // Delete key handler for multi-selection
        document.addEventListener("keydown", (e) => {
            // Only handle if question base is visible
            if (!this.el.base || this.el.base.classList.contains("hidden")) return;

            // Ctrl+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.state.sessionCreatorVisible) {
                    this.saveTextEditorChanges();
                } else if (this.activeQuestionId) {
                    this.saveCurrentQuestion();
                }
            }

            if (e.key === "Delete" && this.state.selectedItems.size > 0) {
                e.preventDefault();
                this.deleteSelectedItems();
            }
        });


        // Session Creator Events
        if (this.el.createSessionBtn) {
            this.el.createSessionBtn.addEventListener("click", () => this.openSessionCreator());
        }
        if (this.el.cancelSessionBtn) {
            this.el.cancelSessionBtn.addEventListener("click", () => this.closeSessionCreator(true));
        }
        if (this.el.addSessionQBtn) {
            this.el.addSessionQBtn.addEventListener("click", () => this.addSessionQuestionTemplate());
        }
        if (this.el.clearSessionBtn) {
            this.el.clearSessionBtn.addEventListener("click", () => {
                this.removeLastSessionQuestion();
            });
        }
        if (this.el.restoreSessionQBtn) {
            this.el.restoreSessionQBtn.addEventListener("click", () => {
                this.restoreLastSessionQuestion();
            });
        }
        if (this.el.startSessionBtn) {
            this.el.startSessionBtn.addEventListener("click", () => this.startSession());
        }



        // Recent Sessions Toolbar Events
        if (this.el.sessionsSearchInput) {
            this.el.sessionsSearchInput.addEventListener("input", (e) => {
                this.state.recentSessionsSearch = e.target.value;
                this.renderRecentSessions();
            });
        }
        if (this.el.sessionsSortSelect) {
            this.el.sessionsSortSelect.addEventListener("change", (e) => {
                this.state.recentSessionsSort = e.target.value;
                this.renderRecentSessions();
            });
        }
        if (this.el.viewListBtn) {
            this.el.viewListBtn.addEventListener("click", () => {
                this.state.recentSessionsView = 'list';
                this.updateViewToggleUI();
                this.renderRecentSessions();
            });
        }
        if (this.el.viewGridBtn) {
            this.el.viewGridBtn.addEventListener("click", () => {
                this.state.recentSessionsView = 'grid';
                this.updateViewToggleUI();
                this.renderRecentSessions();
            });
        }
        if (this.el.sessionInput) {
            this.el.sessionInput.addEventListener("paste", (e) => this.handlePaste(e));
        }

        // Tab Navigation
        const tabButtons = document.querySelectorAll('.qbank-tab');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Mode buttons in Create Test tab
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mode-btn')) {
                const modeBtn = e.target.closest('.mode-btn');
                const parent = modeBtn.parentElement;
                parent.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                modeBtn.classList.add('active');
            }
        });
    },

    initResizer() {
        if (!this.el.resizer || !this.el.sidebar) return;
        let isResizing = false;
        let startX, startWidth;

        this.el.resizer.addEventListener("mousedown", (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = parseInt(document.defaultView.getComputedStyle(this.el.sidebar).width, 10);
            this.el.sidebar.classList.add("resizing");
            document.body.style.cursor = "col-resize";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isResizing) return;
            const newWidth = startWidth + (e.clientX - startX);
            if (newWidth > 230 && newWidth < 900) {
                this.el.sidebar.style.width = `${newWidth}px`;
                const baseSidebar = document.getElementById("sidebar");
                if (baseSidebar) baseSidebar.style.width = `${newWidth}px`;
            }
        });

        document.addEventListener("mouseup", () => {
            if (isResizing) {
                isResizing = false;
                this.el.sidebar.classList.remove("resizing");
                document.body.style.cursor = "default";
                this.saveSidebarWidth();
                if (typeof window.updateSidebarWidth === "function") {
                    window.updateSidebarWidth(parseInt(this.el.sidebar.style.width));
                }
            }
        });
    },

    loadSidebarWidth() {
        const width = localStorage.getItem("app-question-sidebar-width");
        if (width) this.el.sidebar.style.width = width;
    },

    saveSidebarWidth() {
        if (this.el.sidebar) localStorage.setItem("app-question-sidebar-width", this.el.sidebar.style.width);
    },

    loadCollapsedSections() {
        const stored = localStorage.getItem("app-question-collapsed-sections-v2");
        if (stored) {
            try {
                const arr = JSON.parse(stored);
                this.state.collapsedSections = new Set(arr);
            } catch (e) {
                this.state.collapsedSections = new Set();
            }
        }
    },

    saveCollapsedSections() {
        const arr = [...this.state.collapsedSections];
        localStorage.setItem("app-question-collapsed-sections-v2", JSON.stringify(arr));
    },

    loadExpandedFolders() {
        const stored = localStorage.getItem("app-question-expanded-folders-v2");
        if (stored) {
            try {
                const arr = JSON.parse(stored);
                this.state.expandedFolders = new Set(arr);
            } catch (e) { }
        }
    },

    saveExpandedFolders() {
        const arr = [...this.state.expandedFolders];
        localStorage.setItem("app-question-expanded-folders-v2", JSON.stringify(arr));
    },

    setSectionCollapsed(sectionName, isCollapsed) {
        if (isCollapsed) {
            this.state.collapsedSections.add(sectionName);
        } else {
            this.state.collapsedSections.delete(sectionName);
        }
        this.saveCollapsedSections();
        this.renderSidebar();
    },

    async loadRecentSessions() {
        try {
            // Primary: load from server backend (dynamic port)
            const sessions = await window.fileSystemService.makeRequest('/sessions');
            if (sessions) {
                this.state.recentSessions = sessions;
                // Keep localStorage in sync
                localStorage.setItem("active-recall-recent-sessions", JSON.stringify(this.state.recentSessions));
            }
        } catch (e) {
            console.warn('[QuestionBase] Failed to load sessions from server, falling back to localStorage:', e);
            // Fallback: localStorage
            const stored = localStorage.getItem("active-recall-recent-sessions");
            if (stored) {
                try {
                    this.state.recentSessions = JSON.parse(stored);
                    // Migrate legacy localStorage data up to server
                    this.saveRecentSessions();
                } catch (parseErr) {
                    this.state.recentSessions = [];
                }
            } else {
                this.state.recentSessions = [];
            }
        }
        this.renderRecentSessions();
    },


    getServerUrl(endpoint) {
        // Use the active discovered port from fileSystemService if available
        let base = 'http://localhost:3001/api';
        if (window.fileSystemService && window.fileSystemService.baseUrl) {
            base = window.fileSystemService.baseUrl;
        }
        return `${base}${endpoint}`;
    },

    saveRecentSessions() {
        localStorage.setItem("active-recall-recent-sessions", JSON.stringify(this.state.recentSessions));
        
        // Save to server as source of truth
        window.fileSystemService.makeRequest('/sessions', {
            method: 'POST',
            body: JSON.stringify(this.state.recentSessions)
        }).catch(err => console.warn('[QuestionBase] Failed to save sessions to server:', err));
    },

    async loadData(suppressWarning = false) {
        console.log('[QuestionBase] loadData() called');
        
        let serverData = null;
        let electronData = null;
        let localData = null;

        // 1. Try Live Server
        try {
            const data = await window.fileSystemService.makeRequest('/questions');
            if (data) {
                serverData = data;
                console.log('[QuestionBase] Server has', serverData.questions?.length || 0, 'questions');
            }
        } catch (e) {
            console.log('[QuestionBase] Server questions unreachable:', e.message);
        }

        // 2. Try window.Storage (Electron)
        if (typeof window.Storage !== 'undefined' && typeof window.Storage.loadQuestions === 'function') {
            try {
                electronData = await window.Storage.loadQuestions();
                console.log('[QuestionBase] Electron Storage has', electronData.questions?.length || 0, 'questions');
            } catch (error) {
                console.warn('[QuestionBase] failed loadQuestions:', error);
            }
        }

        // 3. Try localStorage (Browser)
        try {
            const stored = localStorage.getItem("app-questions");
            if (stored) {
                localData = JSON.parse(stored);
                console.log('[QuestionBase] localStorage has', (Array.isArray(localData) ? localData.length : localData.questions?.length) || 0, 'questions');
            }
        } catch (e) {}

        // --- INTELLIGENT MERGE / PICK ---
        // We want to use the one with the MOST questions if we're in a "lost data" situation
        let bestData = serverData;
        
        const getCount = (d) => {
            if (!d) return -1;
            if (Array.isArray(d)) return d.length;
            return (d.questions || []).length;
        };

        const serverCount = getCount(serverData);
        const electronCount = getCount(electronData);
        const localCount = getCount(localData);

        if (electronCount > serverCount) {
            console.log('[QuestionBase] Electron data is more complete. Using Electron.');
            bestData = electronData;
        }
        
        const currentBestCount = getCount(bestData);
        if (localCount > currentBestCount) {
            console.log('[QuestionBase] localStorage is more complete. Using local.');
            bestData = localData;
        }

        // Apply Data
        if (bestData) {
            if (Array.isArray(bestData)) {
                this.state.questions = bestData;
                this.state.folders = [];
            } else {
                this.state.questions = bestData.questions || [];
                this.state.folders = bestData.folders || [];
            }

            // AUTO-MIGRATE: If we picked non-server data, push it to the server immediately
            if (bestData !== serverData) {
                console.log('[QuestionBase] 🚀 Migrating best data to server...');
                this.saveData(); 
            }
        } else {
            this.state.questions = [];
            this.state.folders = [];
        }

        // Auto-assign QNX Numeric IDs
        let migratedCount = 0;
        this.state.questions.forEach(q => {
            // Migrate if: no ID, or old "SP-" format, or contains a dash "-" (transitioning to pure dashless)
            const needsMigration = !q.spId || 
                                 q.spId.startsWith("SP-") || 
                                 (q.spId.startsWith("QNX-") && q.spId.includes("-", 4)); 
            if (needsMigration) {
                const oldId = q.spId;
                q.spId = this.generateNumericId(q);
                if (oldId) console.log(`[ID] Re-migrating ${oldId} -> ${q.spId} (dashless)`);
                migratedCount++;
            }
        });

        if (migratedCount > 0) {
            console.log(`[QuestionBase] Migrated ${migratedCount} questions to Dashless Numeric QNX IDs.`);
            this.saveData();
        }

        this.renderSidebar();
    },

    generateNumericId(q) {
        const opts = this.CT_TAG_OPTIONS || {};
        const tags = q.tags || {};
        
        // Helper to get index + 1
        const getIdx = (cat, val) => {
            if (!val || !opts[cat]) return "";
            const idx = opts[cat].indexOf(val);
            return idx !== -1 ? (idx + 1).toString() : "";
        };

        // Get first tag for each category (using user "true number" logic)
        const sub = getIdx('subject', (tags.subject || [])[0]);
        const sys = getIdx('system',  (tags.system  || [])[0]);
        const maj = getIdx('major',   (tags.major   || [])[0]);
        const min = getIdx('minor',   (tags.minor   || [])[0]);

        // salt is always a 4-digit number
        const salt = Math.floor(1000 + Math.random() * 9000);
        
        const finalId = `QNX-${sub}${sys}${maj}${min}${salt}`;
        // Debug log to help demystify the numeric structure for the user
        console.log(`[ID Detail] ${finalId} Breakdown: Subj(${sub || 'none'}), Sys(${sys || 'none'}), Maj(${maj || 'none'}), Min(${min || 'none'}), Salt(${salt})`);
        return finalId;
    },

    async generateAISessionTitle(questions) {
        if (!questions || questions.length === 0) return null;

        try {
            // Aggregate unique tags and titles for context
            const subjects = new Set();
            const systems = new Set();
            const majors = new Set();
            const sampleTitles = [];

            questions.slice(0, 10).forEach(q => {
                if (q.tags?.subject) q.tags.subject.forEach(s => subjects.add(s));
                if (q.tags?.system) q.tags.system.forEach(s => systems.add(s));
                if (q.tags?.major) q.tags.major.forEach(m => majors.add(m));
                if (q.title) sampleTitles.push(q.title);
            });

            const context = {
                subjects: Array.from(subjects),
                systems: Array.from(systems),
                majors: Array.from(majors),
                sampleTitles: sampleTitles.slice(0, 5)
            };

            const systemPrompt = "You are a medical education assistant. Your task is to generate a short, professional, and descriptive title (3-5 words) for a set of study questions based on the provided technical context (subjects, systems, and question titles). Do NOT use generic words like 'Session' or 'Quiz'. Just provide the title text.";
            const userPrompt = `Context details:
Subjects: ${context.subjects.join(', ') || 'N/A'}
Systems: ${context.systems.join(', ') || 'N/A'}
Major Categories: ${context.majors.join(', ') || 'N/A'}
Sample Question Titles: ${context.sampleTitles.join('; ')}

Generate a professional title for this study session.`;

            const data = await window.fileSystemService.makeRequest('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 50
                })
            });

            if (data?.choices?.[0]?.message?.content) {
                let title = data.choices[0].message.content.trim();
                // Strip quotes if AI included them
                title = title.replace(/^["']|["']$/g, '');
                return title;
            }
        } catch (error) {
            console.error("[QuestionBase] AI Session Title generation failed:", error);
        }
        return null;
    },


    loadQuestionsLegacy() {
        const stored = localStorage.getItem("app-questions");
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (Array.isArray(data)) {
                    this.state.questions = data;
                } else {
                    this.state.questions = data.questions || [];
                    this.state.folders = data.folders || [];
                }
            } catch (e) { this.state.questions = []; }
        }
    },

    saveData() {
        const data = {
            questions: this.state.questions,
            folders: this.state.folders
        };

        // 1. Local Persistence (Browser Cache)
        localStorage.setItem("app-questions", JSON.stringify(data));

        // 2. Electron Persistence (File System)
        if (typeof window.Storage !== 'undefined' && window.Storage.saveQuestions) {
            window.Storage.saveQuestions(data);
        }

        // 3. Server Persistence (Source of Truth)
        window.fileSystemService.makeRequest('/questions', {
            method: 'POST',
            body: JSON.stringify(data)
        }).catch(err => console.warn('[QuestionBase] Server save failed:', err));

        this.renderSidebar();
    },

    open() {
        this.el.base.classList.remove("hidden");

        // Ensure correct view state
        if (this.activeQuestionId) {
            // If we have an active question (e.g. from persistence if implemented later), make sure editor is shown
            const q = this.state.questions.find(q => q.id === this.activeQuestionId);
            if (q) this.loadQuestionIntoEditor(q);
            else this.closeQuestion();
        } else {
            // Default to Home/Empty State
            this.closeQuestion();
        }

        // Update Floating Button to "Back to Notes"
        if (this.el.floatBtn) {
            this.el.floatBtn.style.zIndex = "2000"; // Ensure on top of question layer
            this.el.floatBtn.title = "Back to Notes";
            this.el.floatBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;
        }

        // Sync FROM main sidebar - but respect saved settings
        const mainSidebar = document.getElementById("sidebar");
        if (mainSidebar) {
            const mainCollapsed = mainSidebar.classList.contains("collapsed");

            // Apply the main sidebar's state to question sidebar
            if (mainCollapsed) {
                this.el.sidebar.classList.add("collapsed");
            } else {
                this.el.sidebar.classList.remove("collapsed");
            }
        }
    },

    close() {
        this.el.base.classList.add("hidden");
        this.toggleSessionControls(false); // Hide controls when closing QuestionBase
        // Revert Floating Button to "Questions"
        if (this.el.floatBtn) {
            this.el.floatBtn.style.zIndex = ""; // Revert to CSS default
            this.el.floatBtn.title = "Open Questions";
            // Restore original icon
            if (this.state.originalFloatBtnHtml) {
                this.el.floatBtn.innerHTML = this.state.originalFloatBtnHtml;
            }
        }
    },

    switchTab(tabName) {
        // If Manual Session is active, close it (don't restore old tab as we are switching)
        if (this.state.sessionCreatorVisible) {
            this.closeSessionCreator(false);
        }

        this.state.lastActiveTab = tabName;

        // Update tab button states
        document.querySelectorAll('.qbank-tab').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.dataset.tabContent === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Hide question title input when on tabs
        if (this.el.titleInput) {
            this.el.titleInput.style.display = 'none';
        }

        // Toggle dashboard-active class on emptyState for proper scrolling/layout
        if (this.el.emptyState) {
            if (tabName === 'statistics' || tabName === 'recent-sessions' || tabName === 'create-test') {
                this.el.emptyState.classList.add('dashboard-active');
            } else {
                this.el.emptyState.classList.remove('dashboard-active');
            }
        }

        // Special handling for recent sessions tab
        if (tabName === 'recent-sessions') {
            this.renderRecentSessions();
        }

        // Special handling for statistics tab
        if (tabName === 'statistics') {
            this.renderStatistics();
        }

        // Special handling for create-test tab
        if (tabName === 'create-test') {
            if (!this._ctInitialized) {
                this.initCreateTestDashboard();
                this._ctInitialized = true;
            } else {
                this.renderCTPreview();
            }
        }
    },


    // ── Create Test Dashboard ─────────────────────────────────────────────────

    CT_TAG_OPTIONS: {
        subject: ['Pathology', 'Pharmacology', 'Anatomy', 'Physiology', 'Microbiology', 'Immunology', 'Biochemistry', 'Genetics', 'Epidemiology', 'Biostatistics', 'Embryology'],
        system:  ['Cardiology', 'Pulmonology', 'Nephrology', 'Gastroenterology', 'Neurology', 'Hematology', 'Endocrinology', 'Rheumatology', 'Infectious Disease', 'Dermatology', 'Musculoskeletal', 'Reproductive', 'Renal'],
        major:   ['Internal Medicine', 'Surgery', 'Pediatrics', 'OB/GYN', 'Psychiatry', 'Family Medicine', 'Emergency Medicine'],
        minor:   ['Orthopedics', 'Anesthesia', 'Neurosurgery', 'Cardiothoracic Surgery', 'Vascular Surgery', 'Urology', 'ENT', 'Plastic Surgery', 'Intensive Care', 'Radiology', 'Palliative Care'],
    },

    _ctSel: { subject: new Set(), system: new Set(), major: new Set(), minor: new Set() },

    initCreateTestDashboard() {
        const TAG_OPTIONS = this.CT_TAG_OPTIONS;
        const categories = [
            { key: 'subject', btnId: 'ctBtnSubject', badgeId: 'ctBadgeSubject' },
            { key: 'system',  btnId: 'ctBtnSystem',  badgeId: 'ctBadgeSystem' },
            { key: 'major',   btnId: 'ctBtnMajor',   badgeId: 'ctBadgeMajor' },
            { key: 'minor',   btnId: 'ctBtnMinor',   badgeId: 'ctBadgeMinor' }
        ];

        const dropdownMap = {};

        categories.forEach(({ key, btnId, badgeId }) => {
            const btn = document.getElementById(btnId);
            const badge = document.getElementById(badgeId);
            if (!btn) return;

            // Create floating dropdown element once per category
            const menu = document.createElement('div');
            menu.className = 'ct-dropdown hidden';
            menu.dataset.cat = key;
            document.body.appendChild(menu);
            dropdownMap[key] = menu;

            // Initial state sync (if re-initializing)
            const count = this._ctSel[key].size;
            if (badge) badge.textContent = count > 0 ? count : '';
            btn.classList.toggle('ct-cat-active', count > 0);

            // Update function for menu content
            const updateMenu = () => {
                menu.innerHTML = '';
                TAG_OPTIONS[key].forEach(tag => {
                    const count = this.state.questions.filter(q => (q.tags?.[key] || []).includes(tag)).length;
                    const item = document.createElement('label');
                    item.className = 'ct-dropdown-item' + (count === 0 ? ' count-zero' : '');
                    
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = this._ctSel[key].has(tag);
                    cb.addEventListener('change', () => {
                        if (cb.checked) this._ctSel[key].add(tag);
                        else this._ctSel[key].delete(tag);
                        
                        const selCount = this._ctSel[key].size;
                        if (badge) badge.textContent = selCount > 0 ? selCount : '';
                        btn.classList.toggle('ct-cat-active', selCount > 0);
                        this._ctUpdateClearBtn();
                        this.renderCTPreview();
                    });

                    const label = document.createElement('span');
                    label.textContent = tag;

                    const countBadge = document.createElement('span');
                    countBadge.className = 'ct-dropdown-count';
                    countBadge.textContent = count;

                    item.appendChild(cb);
                    item.appendChild(label);
                    item.appendChild(countBadge);
                    menu.appendChild(item);
                });
            };

            // Toggle logic
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = menu.classList.contains('hidden');
                
                // Close all others
                Object.values(dropdownMap).forEach(m => m.classList.add('hidden'));
                document.querySelectorAll('.ct-cat-btn').forEach(b => b.classList.remove('ct-cat-open'));

                if (isHidden) {
                    updateMenu();
                    const rect = btn.getBoundingClientRect();
                    menu.style.top  = (rect.bottom + 8) + 'px';
                    menu.style.left = rect.left + 'px';
                    menu.classList.remove('hidden');
                    btn.classList.add('ct-cat-open');
                }
            });

            menu.addEventListener('click', e => e.stopPropagation());
        });

        // Close all menus on outside click
        document.addEventListener('click', () => {
            Object.values(dropdownMap).forEach(m => m.classList.add('hidden'));
            document.querySelectorAll('.ct-cat-btn').forEach(b => b.classList.remove('ct-cat-open'));
        });

        // Clear button
        document.getElementById('ctClearTags')?.addEventListener('click', () => {
            Object.keys(this._ctSel).forEach(k => this._ctSel[k].clear());
            document.querySelectorAll('.ct-cat-badge').forEach(b => b.textContent = '');
            document.querySelectorAll('.ct-cat-btn').forEach(b => b.classList.remove('ct-cat-active'));
            this._ctUpdateClearBtn();
            this.state.ctPreviewExpanded = false;
            this.renderCTPreview();
        });

        // Toggle groups (timer, tutor, shuffle)
        document.querySelectorAll('.ct-toggle-group').forEach(group => {
            group.querySelectorAll('.ct-toggle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    group.querySelectorAll('.ct-toggle-btn').forEach(b => b.classList.remove('ct-toggle-active'));
                    btn.classList.add('ct-toggle-active');
                    this.renderCTPreview(); // update summary
                });
            });
        });

        // Range ↔ number input sync
        const numIn = document.getElementById('ctQcount');
        if (numIn) {
            numIn.addEventListener('input', () => {
                this.renderCTPreview();
            });
        }

        // Start button
        document.getElementById('ctStartSessionBtn')?.addEventListener('click', () => {
            this.startTestFromTags();
        });

        // Auto-tag button
        document.getElementById('ctAutoTagBtn')?.addEventListener('click', () => this.autoTagAll());

        // ID Search Input
        const idIn = document.getElementById('ctIdSearch');
        const idClear = document.getElementById('ctIdSearchClear');
        if (idIn) {
            idIn.addEventListener('input', () => {
                const val = idIn.value.trim();
                if (idClear) idClear.style.display = val ? 'flex' : 'none';
                this.renderCTPreview();
            });
        }
        if (idClear) {
            idClear.addEventListener('click', () => {
                idIn.value = '';
                idClear.style.display = 'none';
                this.renderCTPreview();
            });
        }

        // Initial render
        this.renderCTPreview();
    },

    updateCreateTestSelection(key, tag, isAdded) {
        if (isAdded) this._ctSel[key].add(tag);
        else this._ctSel[key].delete(tag);
        
        // Reset expanded state when filters change
        this.state.ctPreviewExpanded = false;

        this.renderCTPreview();
    },

    _ctUpdateClearBtn() {
        const anyActive = Object.values(this._ctSel).some(s => s.size > 0);
        const btn = document.getElementById('ctClearTags');
        if (btn) btn.style.display = anyActive ? 'inline-flex' : 'none';
    },

    _ctGetFiltered() {
        const { subject, system, major, minor } = this._ctSel;
        
        // ID-based selection check
        const idInput = document.getElementById('ctIdSearch');
        const idQuery = idInput ? idInput.value.trim().toUpperCase() : '';
        if (idQuery) {
            // Support multiple IDs (union of results)
            const queryTerms = idQuery.split(/[\s,]+/)
                .filter(term => term.trim().length > 0)
                .map(term => term.replace('QNX-', '').replace(/-/g, ''));

            return this.state.questions.filter(q => {
                const qNumericPart = (q.spId || '').replace('QNX-', '').replace(/-/g, '').toUpperCase();
                // Return true if the question ID starts with ANY of the query terms (prefix matching)
                return queryTerms.some(term => qNumericPart.startsWith(term));
            });
        }

        const noFilter = subject.size === 0 && system.size === 0 && major.size === 0 && minor.size === 0;
        return this.state.questions.filter(q => {
            const tags = q.tags || {};
            // Only include questions that have at least one tag
            const hasAnyTag = Object.values(tags).flat().length > 0;
            if (!hasAnyTag) return false;
            if (noFilter) return true; // all tagged questions when no filter active
            const ok = (sel, key) => sel.size === 0 || (tags[key] || []).some(t => sel.has(t));
            return ok(subject,'subject') && ok(system,'system') && ok(major,'major') && ok(minor,'minor');
        });
    },

    renderCTPreview() {
        const filtered = this._ctGetFiltered();
        const totalTagged = this.state.questions.filter(q => Object.values(q.tags || {}).flat().length > 0).length;

        // Desired count
        const numIn = document.getElementById('ctQcount');
        const maxEl = document.getElementById('ctMaxTotal');
        
        let val = parseInt(numIn?.value) || 10;
        const maxQuestions = Math.max(1, filtered.length);
        
        if (val > maxQuestions) val = maxQuestions;
        if (val < 1) val = 1;

        if (numIn) numIn.value = val;
        if (maxEl) maxEl.textContent = maxQuestions;
        
        const desired = val;

        // Stats
        const elTotal    = document.getElementById('ctMatchTotal');
        const elFiltered = document.getElementById('ctMatchFiltered');
        const elSelected = document.getElementById('ctMatchSelected');
        const elHint     = document.getElementById('ctQcountHint');
        if (elTotal)    elTotal.textContent    = totalTagged || '—';
        if (elFiltered) elFiltered.textContent = filtered.length;
        if (elSelected) elSelected.textContent = desired;
        if (elHint)     elHint.textContent     = `${desired} of ${filtered.length} available`;

        // Update ID Status Indicator
        const statusEl = document.getElementById('ctIdStatus');
        const idIn = document.getElementById('ctIdSearch');
        if (statusEl) {
            statusEl.innerHTML = '';
            const idQuery = idIn ? idIn.value.trim() : '';
            if (idQuery) {
                const terms = idQuery.split(/[\s,]+/).filter(t => t.trim().length > 0);
                const allQIds = this.state.questions.map(q => (q.spId || '').replace('QNX-', '').replace(/-/g, '').toUpperCase());
                
                const validTerms = [];
                const invalidTerms = [];

                terms.forEach(term => {
                    const clean = term.replace('QNX-', '').replace(/-/g, '').toUpperCase();
                    if (allQIds.includes(clean)) {
                        validTerms.push(term);
                    } else {
                        invalidTerms.push(term);
                    }
                });

                if (validTerms.length > 0) {
                    const span = document.createElement('span');
                    span.className = 'ct-id-valid';
                    span.textContent = `${validTerms.length} valid ID${validTerms.length > 1 ? 's' : ''} found`;
                    statusEl.appendChild(span);
                }
                
                if (invalidTerms.length > 0) {
                    const span = document.createElement('span');
                    span.className = 'ct-id-invalid';
                    span.textContent = `${invalidTerms.length} invalid ID${invalidTerms.length > 1 ? 's' : ''} found: ${invalidTerms.join(', ')}`;
                    statusEl.appendChild(span);
                } else if (validTerms.length === 0 && terms.length > 0) {
                    const span = document.createElement('span');
                    span.className = 'ct-id-invalid';
                    span.textContent = `0 valid ID found`;
                    statusEl.appendChild(span);
                }
            }
        }

        // Preview list
        const list = document.getElementById('ctPreviewList');
        if (!list) return;
        list.innerHTML = '';

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ct-preview-empty';
            const noFilter = Object.values(this._ctSel).every(s => s.size === 0);
            empty.innerHTML = noFilter
                ? `<div>${totalTagged === 0 ? 'No questions have tags yet — use <strong>Auto-Tag All</strong>' : 'All tagged questions will be included'}</div>`
                : `<div>No questions match your tag selection</div>`;
            list.appendChild(empty);
        } else {
            // Respect expansion state
            const showLimit = this.state.ctPreviewExpanded ? filtered.length : desired;
            const preview = filtered.slice(0, showLimit);

            preview.forEach(q => {
                const item = document.createElement('div');
                item.className = 'ct-preview-item';
                // Pick a display tag
                const allTags = [...(q.tags?.system || []), ...(q.tags?.subject || [])];
                const tagLabel = allTags[0] || '';
                const displayId = (q.spId || '').replace('QNX-', '').replace(/-/g, '');
                item.innerHTML = `
                    <div class="ct-preview-title-row">
                        <span class="ct-preview-spid">${displayId || '????'}</span>
                        <span class="ct-preview-title">${q.title || 'Untitled'}</span>
                    </div>
                    ${tagLabel ? `<span class="ct-item-tag">${tagLabel}</span>` : ''}
                `;
                list.appendChild(item);
            });

            if (filtered.length > desired) {
                const more = document.createElement('div');
                more.className = 'ct-preview-more';
                if (!this.state.ctPreviewExpanded) {
                    more.textContent = `+ ${filtered.length - desired} more not shown — Click to expand`;
                } else {
                    more.textContent = `Show less`;
                    more.classList.add('expanded');
                }
                
                more.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.state.ctPreviewExpanded = !this.state.ctPreviewExpanded;
                    this.renderCTPreview();
                });

                list.appendChild(more);
            }
        }

        // Show/hide start zone
        const startZone = document.getElementById('ctStartZone');
        const summary   = document.getElementById('ctStartSummary');
        if (startZone) startZone.style.display = filtered.length > 0 ? 'flex' : 'none';
        if (summary && filtered.length > 0) {
            const timerBtn  = document.querySelector('#ctTimerGroup .ct-toggle-active');
            const tutorBtn  = document.querySelector('#ctTutorGroup .ct-toggle-active');
            const shuffleBtn= document.querySelector('#ctShuffleGroup .ct-toggle-active');
            const timerVal  = timerBtn?.dataset.val || 'none';
            const tutorVal  = tutorBtn?.dataset.val || 'on';
            const shuffleVal= shuffleBtn?.dataset.val || 'off';
            const timerStr  = timerVal === 'none' ? 'No timer' : `${timerVal}s per question`;
            summary.innerHTML = `<strong>${desired}</strong> questions · ${timerStr} · Tutor mode ${tutorVal} · Shuffle ${shuffleVal}`;
        }
    },

    async startTestFromTags() {
        const filtered = this._ctGetFiltered();
        if (filtered.length === 0) { alert('No questions match your selection.'); return; }

        const desired   = Math.min(filtered.length, Math.max(1, parseInt(document.getElementById('ctQcount')?.value) || 10));
        const shuffleEl = document.querySelector('#ctShuffleGroup .ct-toggle-active');
        const tutorEl   = document.querySelector('#ctTutorGroup .ct-toggle-active');
        const timerEl   = document.querySelector('#ctTimerGroup .ct-toggle-active');
        const doShuffle = shuffleEl?.dataset.val === 'on';
        const tutor     = tutorEl?.dataset.val !== 'off';
        const timerSecs = parseInt(timerEl?.dataset.val) || 0;

        let pool = [...filtered];
        if (doShuffle) {
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
        }
        const questions = pool.slice(0, desired).map(q => ({
            ...q, submittedAnswer: undefined, revealed: false, crossedOutOptionIds: [],
            _tutorMode: tutor, _timerSecs: timerSecs
        }));

        // Build title
        const activeTags = [
            ...this._ctSel.system, ...this._ctSel.major,
            ...this._ctSel.subject, ...this._ctSel.minor
        ].slice(0, 3);
        const titlePart  = activeTags.length > 0 ? activeTags.join(' + ') : 'Tagged Questions';
        const folderName = `${titlePart} — ${new Date().toLocaleDateString()}`;

        // Save session record
        const session = {
            id: 'ct-' + Date.now(),
            title: folderName,
            date: new Date().toISOString(),
            count: questions.length,
            folderId: null,
            questions
        };
        this.state.recentSessions.unshift(session);
        this.saveRecentSessions();

        if (typeof window.DungeonBase !== 'undefined') {
            window.DungeonBase.open(questions);
        } else {
            alert('Dungeon mode is not loaded.');
        }
    },

    async autoTagAll() {
        const btn = document.getElementById('ctAutoTagBtn');
        const oldHtml = btn.innerHTML;
        const oldTitle = btn.title;

        // UI Feedback: Phase 1
        btn.innerHTML = `<span style="font-size:11px; font-weight:600; white-space:nowrap; padding: 0 4px; color:var(--muted); line-height:1;">Phase 1: Checking...</span>`;
        btn.disabled = true;

        try {
            const questions = this.state.questions;
            if (questions.length === 0) {
                btn.innerHTML = '<span style="font-size:11px; color:var(--muted);">No Qs...</span>';
                setTimeout(() => { btn.innerHTML = oldHtml; btn.disabled = false; }, 2000);
                return;
            }

            // Phase 1: Local Filter for untagged questions
            const untaggedQuestions = questions.filter(q => {
                const tags = q.tags || {};
                const hasSubject = Array.isArray(tags.subject) && tags.subject.length > 0;
                const hasSystem = Array.isArray(tags.system) && tags.system.length > 0;
                const hasMajor = Array.isArray(tags.major) && tags.major.length > 0;
                return !hasSubject && !hasSystem && !hasMajor;
            });

            if (untaggedQuestions.length === 0) {
                btn.innerHTML = '<span style="font-size:13px; color:var(--muted);">All Tagged!</span>';
                setTimeout(() => {
                    btn.innerHTML = oldHtml;
                    btn.disabled = false;
                }, 2000);
                return;
            }

            // Phase 2: AI Classification for untagged only
            const model = localStorage.getItem('notesApp_aiModel') || "arcee-ai/trinity-large-preview:free";
            const tagOptions = JSON.stringify(this.CT_TAG_OPTIONS);
            
            const batchSize = 5;
            let totalUpdated = 0;

            for (let i = 0; i < untaggedQuestions.length; i += batchSize) {
                const batch = untaggedQuestions.slice(i, i + batchSize);
                const progress = Math.round(((i + batch.length) / untaggedQuestions.length) * 100);
                btn.innerHTML = `<span style="font-size:11px; font-weight:600; white-space:nowrap; padding: 0 4px; color:var(--muted); line-height:1;">Phase 2: ${progress}%...</span>`;

                const batchContext = batch.map(q => ({
                    id: q.id,
                    title: q.title,
                    text: q.text,
                    explanation: q.explanation
                }));

                const systemPrompt = `You are a medical expert specializing in question classification.
Tag each question accurately based on this taxonomy:
${tagOptions}

Rules:
1. Provide tags for 'subject', 'system', and 'major'. 'minor' is optional.
2. Use ONLY the exact strings provided in the taxonomy above.
3. Return results in STRICT JSON: an array of objects [{"id": "...", "tags": {"subject": [], "system": [], "major": [], "minor": []}}]`;

                const response = await window.fileSystemService.makeRequest('/ai/chat', {
                    method: 'POST',
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Classify these untagged medical questions:\n${JSON.stringify(batchContext)}` }
                        ],
                        model: model,
                        max_tokens: 1500
                    })
                });

                if (response?.choices?.[0]?.message?.content) {
                    try {
                        const content = response.choices[0].message.content;
                        const jsonStr = content.includes('```') ? content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)[1] : content;
                        const results = JSON.parse(jsonStr);

                        results.forEach(res => {
                            const q = questions.find(item => item.id === res.id);
                            if (q) {
                                q.tags = res.tags;
                                totalUpdated++;
                            }
                        });
                    } catch (parseErr) {
                        console.error("[AutoTag] Batch parse error:", parseErr);
                    }
                }
            }

            // Persistence: Save to hard drive backend server
            this.saveData();
            this.initCreateTestDashboard();
            
            btn.innerHTML = `<span style="font-size:11px; color:var(--muted); font-weight:bold;">Tagged ${totalUpdated}...</span>`;
            setTimeout(() => {
                btn.innerHTML = oldHtml;
                btn.disabled = false;
                btn.title = oldTitle;
            }, 3000);

        } catch (error) {
            console.error("[AutoTag] AI Error:", error);
            btn.innerHTML = '<span style="font-size:11px; color:var(--red);">Error...</span>';
            setTimeout(() => { btn.innerHTML = oldHtml; btn.disabled = false; }, 3000);
        }
    },

    // ── Tag Dropdown System ───────────────────────────────────────────────────
    initTagDropdowns() {
        // Defer to ensure DOM is fully rendered before querying elements
        setTimeout(() => {
            const TAG_OPTIONS = this.CT_TAG_OPTIONS;

            const configs = [
                { key: 'subject', btnId: 'tagBtnSubject', badgeId: 'tagBadgeSubject', stateKey: 'selectedTagSubjects' },
                { key: 'system',  btnId: 'tagBtnSystem',  badgeId: 'tagBadgeSystem',  stateKey: 'selectedTagSystems' },
                { key: 'major',   btnId: 'tagBtnMajor',   badgeId: 'tagBadgeMajor',   stateKey: 'selectedTagMajors' },
                { key: 'minor',   btnId: 'tagBtnMinor',   badgeId: 'tagBadgeMinor',   stateKey: 'selectedTagMinors' },
            ];

            // Menus appended to body to avoid overflow:hidden clipping
            const menuMap = {};

            configs.forEach(({ key, btnId, badgeId, stateKey }) => {
                // Look up fresh from DOM — avoids stale this.el.* cache
                const btn   = document.getElementById(btnId);
                const badge = document.getElementById(badgeId);
                if (!btn) {
                    console.warn('[Tags] Button not found in DOM:', btnId);
                    return;
                }

                // Create & attach menu to body
                const menu = document.createElement('div');
                menu.className = 'tag-drop-menu hidden';
                menu.dataset.tagKey = key;
                document.body.appendChild(menu);
                menuMap[key] = menu;

                // Build checkbox items
                TAG_OPTIONS[key].forEach(option => {
                    const item = document.createElement('label');
                    item.className = 'tag-drop-item';
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.value = option;
                    cb.addEventListener('change', () => {
                        if (cb.checked) {
                            if (!this.state[stateKey].includes(option)) this.state[stateKey].push(option);
                        } else {
                            this.state[stateKey] = this.state[stateKey].filter(v => v !== option);
                        }
                        const count = this.state[stateKey].length;
                        if (badge) badge.textContent = count > 0 ? count : '';
                        btn.classList.toggle('has-selection', count > 0);
                    });
                    item.appendChild(cb);
                    item.appendChild(document.createTextNode(' ' + option));
                    menu.appendChild(item);
                });

                // Toggle on button click — position below button with fixed
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = !menu.classList.contains('hidden');
                    Object.values(menuMap).forEach(m => m.classList.add('hidden'));
                    if (!isOpen) {
                        const rect = btn.getBoundingClientRect();
                        menu.style.top  = (rect.bottom + 6) + 'px';
                        menu.style.left = rect.left + 'px';
                        menu.classList.remove('hidden');
                    }
                });

                // Prevent outside-click from firing inside menu
                menu.addEventListener('click', e => e.stopPropagation());
            });

            // Close all on any outside click
            document.addEventListener('click', () => {
                Object.values(menuMap).forEach(m => m.classList.add('hidden'));
            });
        }, 0);
    },

    clearSessionTags() {
        // Reset state
        this.state.selectedTagSubjects = [];
        this.state.selectedTagSystems  = [];
        this.state.selectedTagMajors   = [];
        this.state.selectedTagMinors   = [];

        // Update UI
        ['Subject', 'System', 'Major', 'Minor'].forEach(key => {
            const badge = document.getElementById(`tagBadge${key}`);
            const btn   = document.getElementById(`tagBtn${key}`);
            if (badge) badge.textContent = '';
            if (btn) btn.classList.remove('has-selection');
        });

        // Uncheck all checkboxes in session tag menus
        document.querySelectorAll('.tag-drop-menu input[type="checkbox"]').forEach(cb => cb.checked = false);
    },

    async toggleSidebar() {
        this.el.sidebar.classList.toggle("collapsed");
        const isCollapsed = this.el.sidebar.classList.contains("collapsed");

        // Sync TO main sidebar
        const mainSidebar = document.getElementById("sidebar");
        const mainToggle = document.getElementById("toggleSidebarBtn");
        if (mainSidebar && mainToggle) {
            const mainCollapsed = mainSidebar.classList.contains("collapsed");
            // Only click if states differ to align them
            if (mainCollapsed !== isCollapsed) {
                mainToggle.click();
            }
        }

        // Save sidebar state to backend settings
        if (typeof window.state !== 'undefined' && window.state.settings) {
            window.state.settings.sidebarCollapsed = isCollapsed;
            if (typeof window.Storage !== 'undefined' && typeof window.Storage.saveSettings === 'function') {
                window.Storage.saveSettings(window.state.settings);
            }
        }
    },

    async createNewFolder(parentId = null) {
        let name;
        if (typeof window.modalPrompt === 'function') {
            name = await window.modalPrompt(parentId ? "New Subfolder" : "New Folder", "Folder Name");
        } else {
            name = prompt("Folder Name:");
        }
        if (!name) return;
        const newFolder = {
            id: "fq-" + Date.now(),
            title: name,
            parentId: parentId // support nesting
        };
        this.state.folders.push(newFolder);
        this.saveData();
    },

    createNewQuestion() {
        const id = 'q_' + Date.now();
        const newQ = {
            id,
            title: "Untitled Question",
            text: "",
            options: [
                { id: 'opt1', text: "Option A", isCorrect: true },
                { id: 'opt2', text: "Option B", isCorrect: false }
            ],
            explanation: "",
            starred: false,
            folderId: null,
            createdAt: new Date().toISOString()
        };

        this.state.questions.push(newQ);
        this.saveData();
        this.renderSidebar();

        // Open directly in text editor
        this.openSessionCreator(null, id);
    },

    // Unified Editor Routing
    openSessionCreator(folderId = null, targetQuestionId = null) {
        // Implementation remains in the dedicated section below (around line 1864)
    },

    saveTextEditorChanges() {
        // Implementation remains in the dedicated section below (around line 1904)
    },

    closeQuestion() {
        if (this.state.sessionCreatorVisible) {
            this.closeSessionCreator(true);
            return;
        }

        this.activeQuestionId = null;
        this.el.editor.classList.add("hidden");
        this.el.emptyState.classList.remove("hidden");

        // Hide session-specific UI
        this.state.sessionCreatorVisible = false;
        if (this.el.sessionCreator) this.el.sessionCreator.classList.add("hidden");
        if (this.el.recentSessionsContainer) this.el.recentSessionsContainer.classList.add("hidden");

        const emptyStateContent = this.el.emptyState.querySelector('.empty-state-content');
        if (emptyStateContent) emptyStateContent.classList.remove('hidden'); // Show default empty msg

        // Reset Header -> HOME
        this.updateHeaderUI('HOME');

        this.el.saveBtn.disabled = true;
        this.el.saveBtn.style.display = "none";



        this.renderSidebar();
    },

    saveCurrentQuestion() {
        if (!this.activeQuestionId) return;

        const qIndex = this.state.questions.findIndex(q => q.id === this.activeQuestionId);
        if (qIndex === -1) return;

        const q = this.state.questions[qIndex];
        q.title = this.el.titleInput.value || "Untitled Question";
        q.text = this.el.textInput.innerHTML;
        q.explanation = this.el.explanationInput.value;

        // Gather options
        const optionItems = this.el.optionsContainer.querySelectorAll(".option-item");
        const newOptions = [];
        optionItems.forEach(item => {
            const radio = item.querySelector("input[type='radio']");
            const input = item.querySelector("input[type='text']");
            // preserve ID if possible, else gen new
            const id = (item.dataset.oid || (Date.now() + Math.random())).toString();
            newOptions.push({
                id: id,
                text: input.value,
                isCorrect: radio.checked
            });
        });
        q.options = newOptions;
        q.updatedAt = new Date().toISOString();

        this.saveData(); // Persist and re-render sidebar

        // Visual feedback with icon change
        const originalHTML = this.el.saveBtn.innerHTML;
        this.el.saveBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
        this.el.saveBtn.style.color = "var(--success)";
        setTimeout(() => {
            this.el.saveBtn.innerHTML = originalHTML;
            this.el.saveBtn.style.color = "";
        }, 1500);
    },

    loadQuestionIntoEditor(q) {
        this.activeQuestionId = q.id;
        this.el.emptyState.style.display = "none";
        this.el.editor.classList.remove("hidden");

        // Update Header -> EDITOR
        this.updateHeaderUI('EDITOR');

        if (this.el.titleInput) {
            this.el.titleInput.value = q.title || ""; // Ensure value is set
        }
        this.el.textInput.innerHTML = q.text || "";
        this.el.explanationInput.value = q.explanation || "";

        // Enable save/play buttons
        if (this.el.saveBtn) {
            this.el.saveBtn.disabled = false;
            this.el.saveBtn.style.display = "";
        }


        // Clear and rebuild options
        this.el.optionsContainer.innerHTML = '<label>Answer Options</label>';
        (q.options || []).forEach(opt => this.addOptionUI(opt.text, opt.isCorrect, opt.id));

        // Highlight
        this.renderSidebar(); // re-render to update active class
    },

    addOptionUI(text = "", isCorrect = false, id = null) {
        const div = document.createElement("div");
        div.className = `option-item ${isCorrect ? "correct" : ""}`;
        if (id) div.dataset.oid = id;

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "correct-option";
        radio.className = "option-radio";
        radio.checked = isCorrect;
        radio.addEventListener("change", () => {
            const all = this.el.optionsContainer.querySelectorAll(".option-item");
            all.forEach(el => el.classList.remove("correct"));
            if (radio.checked) div.classList.add("correct");
        });

        const input = document.createElement("input");
        input.type = "text";
        input.className = "option-input";
        input.placeholder = "Enter option text...";
        input.value = text;

        const delBtn = document.createElement("button");
        delBtn.className = "option-delete-btn";
        delBtn.innerHTML = "×";
        delBtn.title = "Remove option";
        delBtn.onclick = () => div.remove();

        div.appendChild(radio);
        div.appendChild(input);
        div.appendChild(delBtn);

        this.el.optionsContainer.appendChild(div);
    },

    // RENDER SIDEBAR with Sections
    renderSidebar() {
        this.el.list.innerHTML = "";
        const query = this.el.searchInput ? this.el.searchInput.value.toLowerCase().trim() : "";

        // Helper to check match
        const matches = (q) => {
            if (!query) return true;
            const titleMatch = (q.title || "").toLowerCase().includes(query);
            const textMatch = (q.text || "").toLowerCase().includes(query);
            const optionsMatch = (q.options || []).some(opt => (opt.text || "").toLowerCase().includes(query));
            return titleMatch || textMatch || optionsMatch;
        };

        if (query) {
            // Search View - Flat Results
            const results = this.state.questions.filter(q => matches(q));
            if (results.length > 0) {
                this.renderSection("Search Results", results, "search");
            } else {
                this.el.list.innerHTML = '<div class="sidebar-empty-state">No matching questions</div>';
            }
            return;
        }

        // Default View: 3 Persistent Sections

        // 1. All Questions (Truly ALL questions)
        const allQuestions = this.state.questions;
        this.renderSection("All Questions", allQuestions, "list", "No questions");

        // 2. Starred
        const starred = this.state.questions.filter(q => q.starred);
        this.renderSection("Starred", starred, "star", "No starred questions");

        // 3. Folders
        this.renderFoldersSection();
    },

    renderFoldersSection() {
        const section = document.createElement("div");
        const isCollapsed = this.state.collapsedSections.has("Folders");
        section.className = `sidebar-section ${isCollapsed ? "collapsed" : ""}`;

        const header = document.createElement("div");
        header.className = "sidebar-section-header-text";
        header.innerHTML = `
        <svg class="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Folders</span>
        <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
     `;
        header.onclick = () => {
            section.classList.toggle("collapsed");
            const isCollapsed = section.classList.contains("collapsed");

            if (isCollapsed) {
                this.state.collapsedSections.add("Folders");
            } else {
                this.state.collapsedSections.delete("Folders");
            }
            this.saveCollapsedSections();

            console.log(`[QuestionBase] Syncing 'Folders' to collapsed=${isCollapsed}`);
            // Sync with TwoBase
            if (window.TwoBase && typeof window.TwoBase.setSectionCollapsed === "function") {
                window.TwoBase.setSectionCollapsed("Folders", isCollapsed);
            } else {
                console.warn("[QuestionBase] TwoBase.setSectionCollapsed not found");
            }
        };

        const content = document.createElement("div");
        content.className = "sidebar-section-content";

        const folders = this.state.folders.filter(f => !f.parentId);
        if (folders.length === 0) {
            content.innerHTML = '<div class="section-empty-text">No folders</div>';
        } else {
            folders.forEach(folder => {
                const folderQs = this.state.questions.filter(q => q.folderId === folder.id);
                this.renderFolderItem(folder, folderQs, content);
            });
        }

        section.appendChild(header);
        section.appendChild(content);
        this.el.list.appendChild(section);
    },

    renderSection(title, questions, iconType, emptyMsg = null) {
        const section = document.createElement("div");
        const isCollapsed = this.state.collapsedSections.has(title);
        section.className = `sidebar-section ${isCollapsed ? "collapsed" : ""}`;

        const header = document.createElement("div");
        header.className = "sidebar-section-header-text";

        let icon = "";
        if (iconType === "star") {
            icon = `<svg class="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        } else if (iconType === "list") {
            // Use Notebook/Page with lines icon for "All Questions"
            icon = `<svg class="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="8" y1="7" x2="16" y2="7"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
        } else if (iconType === "search") {
            icon = `<svg class="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        } else {
            icon = `<svg class="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        }

        header.innerHTML = `
          ${icon}
          <span>${title}</span>
          <svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
      `;
        header.onclick = (e) => {
            e.stopPropagation();
            section.classList.toggle("collapsed");
            const isCollapsed = section.classList.contains("collapsed");

            // Save collapsed state
            if (isCollapsed) {
                this.state.collapsedSections.add(title);
            } else {
                this.state.collapsedSections.delete(title);
            }
            this.saveCollapsedSections();

            console.log(`[QuestionBase] Syncing '${title}' to collapsed=${isCollapsed}`);

            // Sync with TwoBase (Delegate mapping to TwoBase)
            if (window.TwoBase && typeof window.TwoBase.setSectionCollapsed === "function") {
                // Add small delay to ensure UI threads are clear
                setTimeout(() => {
                    window.TwoBase.setSectionCollapsed(title, isCollapsed);
                }, 10);
            } else {
                console.warn("[QuestionBase] TwoBase.setSectionCollapsed not found");
            }
        };

        const content = document.createElement("div");
        content.className = "sidebar-section-content";

        if (questions.length === 0 && emptyMsg) {
            content.innerHTML = `<div class="section-empty-text">${emptyMsg}</div>`;
        } else {
            questions.forEach(q => this.renderQuestionItem(q, content, title));
        }

        section.appendChild(header);
        section.appendChild(content);
        this.el.list.appendChild(section);
    },

    renderFolderItem(folder, questions, container) {
        const isExpanded = this.state.expandedFolders.has(folder.id);
        const folderEl = document.createElement("div");
        folderEl.className = "q-folder";
        folderEl.innerHTML = `
        <div class="q-folder-header" data-id="${folder.id}">
             <!-- Chevron removed as requested -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="folder-title">${folder.title}</span>
            <span class="folder-count">${questions.length}</span>
        </div>
        <div class="q-folder-content ${isExpanded ? '' : 'hidden'}"></div>
      `;

        const header = folderEl.querySelector(".q-folder-header");
        const content = folderEl.querySelector(".q-folder-content");

        // Click Handling: Single Click (Editor) vs Double Click (Toggle)
        header.onclick = (e) => {
            e.stopPropagation();

            // Increment click count or use timer to distinguish
            // We use e.detail to see how many clicks happened in quick succession
            if (e.detail === 1) {
                // Single click - open session editor after a short delay
                // This delay allows a double click to cancel this action
                header._clickTimer = setTimeout(() => {
                    this.openSessionCreator(folder.id);
                }, 200);
            }
        };

        header.ondblclick = (e) => {
            e.stopPropagation();
            // Cancel the single click action
            if (header._clickTimer) {
                clearTimeout(header._clickTimer);
                header._clickTimer = null;
            }

            // Toggle Expand/Collapse
            if (isExpanded) {
                this.state.expandedFolders.delete(folder.id);
            } else {
                this.state.expandedFolders.add(folder.id);
            }
            this.saveExpandedFolders();
            this.renderSidebar();
        };

        if (isExpanded) {
            // Render Questions (First)
            questions.forEach(q => this.renderQuestionItem(q, content, 'folder-' + folder.id));

            // Render Subfolders (Second)
            const subFolders = this.state.folders.filter(f => f.parentId === folder.id);
            subFolders.forEach(sub => {
                const subQs = this.state.questions.filter(q => q.folderId === sub.id);
                this.renderFolderItem(sub, subQs, content);
            });
        }

        container.appendChild(folderEl);

        // Folder Drop Zone
        folderEl.ondragover = (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
        };
        folderEl.ondragleave = (e) => {
            e.currentTarget.classList.remove('drag-over');
        };
        folderEl.ondrop = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('drag-over');

            try {
                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                if (data.type === 'question' && data.id) {
                    const q = this.state.questions.find(q => q.id === data.id);
                    if (q && q.folderId !== folder.id) {
                        q.folderId = folder.id;
                        this.saveData();
                        // Expand folder
                        this.state.expandedFolders.add(folder.id);
                        this.renderSidebar();
                    }
                }
            } catch (err) { console.error("Drop failed", err); }
        };
    },

    renderQuestionItem(q, container, context = null) {
        const el = document.createElement("div");
        const isSelected = this.state.selectedItems.has(q.id);
        const isActive = q.id === this.activeQuestionId && (this.state.activeContext === context);
        el.className = `question-item ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`;
        el.dataset.id = q.id;
        if (context) el.setAttribute("data-context", context);

        // Simple Click Handler (No Multi-select)
        el.onclick = (e) => {
            // Single click - clear selection and open
            this.state.selectedItems.clear();
            this.state.selectedItems.add(q.id);
            this.state.activeContext = context;

            // Universal Text Editor: Always open session editor
            this.openSessionCreator(q.folderId, q.id);
            this.renderSidebar();
        };

        el.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${q.starred ? "gold" : "none"}" stroke="${q.starred ? "gold" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${q.starred
                ? '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'
                : '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>'}
        </svg>
        <div class="question-item-title">${(q.title && q.title.trim() !== "") ? q.title : "Untitled Question"}</div>
      `;

        // Match Base Layer Note Styles (adding sidebar-item class and structure tweaks)
        el.className = `question-item sidebar-item ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`;
        el.draggable = true;

        // Drag & Drop
        el.ondragstart = (e) => {
            e.dataTransfer.setData("application/json", JSON.stringify({ id: q.id, type: 'question' }));
            el.classList.add('dragging');
        };
        el.ondragend = () => el.classList.remove('dragging');

        container.appendChild(el);
    },

    createContextMenu() {
        const existing = document.getElementById("questionCtxMenu");
        if (existing) existing.remove();

        const menu = document.createElement("div");
        menu.id = "questionCtxMenu";
        menu.className = "ctx-menu hidden";
        menu.style.zIndex = "9999";
        document.body.appendChild(menu);
        this.el.ctxMenu = menu;

        menu.addEventListener("click", (e) => {
            const btn = e.target.closest(".ctx-btn");
            if (!btn) return;
            e.stopPropagation(); // Stop propagation to prevent immediate closing issues if nested
            const action = btn.dataset.action;
            const targetId = this.el.ctxMenu.dataset.targetId;
            const type = this.el.ctxMenu.dataset.targetType;
            console.log("Context Action Triggered:", action, targetId, type); // Debug
            this.handleContextAction(action, targetId, type);
            this.hideContextMenu();
        });
    },

    showContextMenu(x, y, id, type, context = null) {
        const isMultiSelect = this.state.selectedItems.size > 1 && (type === 'question' && this.state.selectedItems.has(id));
        const isFolder = type === 'folder';
        const isEmptySpace = type === 'empty' || type === 'global';

        // Highlight
        const allItems = this.el.list.querySelectorAll(".question-item, .q-folder-header");
        allItems.forEach(el => el.classList.remove("context-active"));

        if (!isEmptySpace && !isMultiSelect) {
            let targetEl;
            if (isFolder) {
                targetEl = this.el.list.querySelector(`.q-folder-header[data-id="${id}"]`);
            } else {
                const candidates = this.el.list.querySelectorAll(`.question-item[data-id="${id}"]`);
                if (context) {
                    targetEl = Array.from(candidates).find(el => el.getAttribute("data-context") === String(context));
                } else {
                    targetEl = candidates[0];
                }
            }
            if (targetEl) targetEl.classList.add("context-active");
        }

        this.el.ctxMenu.dataset.targetId = id || '';
        this.el.ctxMenu.dataset.targetType = type;

        // Build Menu
        let html = '';

        if (isEmptySpace) {
            html = `
            <div class="ctx-section">
                <button class="ctx-btn" data-action="refresh">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    Refresh
                </button>
            </div>

            <div class="ctx-section">
                <button class="ctx-btn" data-action="new-question">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New Question
                </button>
                <button class="ctx-btn" data-action="new-folder">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                    New Folder
                </button>
            </div>
          `;
        } else if (isFolder) {
            html = `
            <div class="ctx-section">
                <button class="ctx-btn" data-action="new-sub-question">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New Question Here
                </button>
                <button class="ctx-btn" data-action="new-sub-folder">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                    New Subfolder
                </button>
            </div>
            <div class="ctx-section">
                <button class="ctx-btn" data-action="rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Rename
                </button>
                <button class="ctx-btn" data-action="edit-session">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit as Session
                </button>
            </div>
            <div class="ctx-section">
                <button class="ctx-btn delete-btn" data-action="delete" style="color: var(--danger, #ef4444);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete
                </button>
            </div>
         `;
        } else if (isMultiSelect) {
            html = `
            <div class="ctx-section">
                <button class="ctx-btn delete-btn" data-action="delete-selected" style="color: var(--danger, #ef4444);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete ${this.state.selectedItems.size} items
                </button>
            </div>
         `;
        } else {
            // Single Question
            const q = this.state.questions.find(q => q.id === id);
            const isStarred = q && q.starred;
            html = `
            <div class="ctx-section">
                <button class="ctx-btn" data-action="rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Rename
                </button>
                <button class="ctx-btn" data-action="star">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${isStarred ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    ${isStarred ? "Unstar" : "Star"}
                </button>
            </div>
          `;

            if (isStarred) {
                html += `
             <div class="ctx-section">
                 <button class="ctx-btn" data-action="unstar-all">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                      Unstar All
                 </button>
                 <button class="ctx-btn" data-action="unstar-others">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      Unstar Others
                 </button>
             </div>
             `;
            }

            html += `
            <div class="ctx-section">
                <button class="ctx-btn delete-btn" data-action="delete" style="color: var(--danger, #ef4444);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete
                </button>
            </div>
         `;
        }

        this.el.ctxMenu.innerHTML = html;
        this.el.ctxMenu.style.top = `${y}px`;
        this.el.ctxMenu.style.left = `${x}px`;
        this.el.ctxMenu.style.zIndex = "100000"; // Ensure it's above everything else
        this.el.ctxMenu.style.display = "grid"; // Explicit display

        // Ensure menu is visible and correctly positioned
        this.el.ctxMenu.classList.remove("hidden");
        console.log(`[QuestionBase] Attempting to show menu at X:${x}, Y:${y}. Type:${type}, ID:${id}`);

        // Handle off-screen menu with slightly more padding
        requestAnimationFrame(() => {
            const rect = this.el.ctxMenu.getBoundingClientRect();
            console.log(`[QuestionBase] Menu rendered rect:`, rect);

            if (rect.right > window.innerWidth) {
                this.el.ctxMenu.style.left = `${window.innerWidth - rect.width - 15}px`;
            }
            if (rect.bottom > window.innerHeight) {
                this.el.ctxMenu.style.top = `${window.innerHeight - rect.height - 15}px`;
            }
        });
    },

    hideContextMenu() {
        if (this.el.ctxMenu) this.el.ctxMenu.classList.add("hidden");
        const allItems = this.el.list.querySelectorAll(".question-item, .q-folder-header");
        allItems.forEach(el => el.classList.remove("context-active"));
    },


    resetEditor() {
        this.activeQuestionId = null;
        this.el.editor.classList.add("hidden");
        this.el.emptyState.style.display = "flex";
        if (this.el.titleInput) {
            this.el.titleInput.value = "";
            this.el.titleInput.disabled = true;
            this.el.titleInput.placeholder = "Select a question or create new";
        }
        if (this.el.saveBtn) this.el.saveBtn.disabled = true;
    },

    async deleteSelectedItems() {
        const selectedIds = [...this.state.selectedItems];
        if (selectedIds.length === 0) return;

        const deleteItems = async () => {
            try {
                const trash = await window.Storage.loadTrash();

                selectedIds.forEach(id => {
                    const qIndex = this.state.questions.findIndex(q => q.id === id);
                    if (qIndex !== -1) {
                        const q = this.state.questions[qIndex];
                        trash.push({ ...q, type: 'question', deletedAt: new Date().toISOString() });
                        this.state.questions.splice(qIndex, 1);
                        if (this.activeQuestionId === id) this.resetEditor();
                    }
                });

                await window.Storage.saveTrash(trash);
            } catch (e) {
                console.warn("Failed to sync to trash", e);
            }

            this.state.selectedItems.clear();
            this.saveData();
            this.syncEditorDeletion(selectedIds);
            if (typeof window.updateTrashButton === "function") window.updateTrashButton();
        };

        if (typeof window.TwoBase?.showDeleteConfirmation === "function") {
            window.TwoBase.showDeleteConfirmation(selectedIds.length, deleteItems);
        } else {
            if (confirm(`Delete ${selectedIds.length} selected question(s)?`)) await deleteItems();
        }
    },

    async handleContextAction(action, id, type) {
        if (action === 'delete-selected') {
            return this.deleteSelectedItems();
        }
        if (action === 'new-question') {
            return this.createNewQuestion();
        }
        if (action === 'new-folder') {
            return this.createNewFolder();
        }
        if (action === 'refresh') {
            console.log("Reloading App...");
            window.location.reload();
            return;
        }

        if (type === 'question') {
            const qIndex = this.state.questions.findIndex(q => q.id === id);
            if (qIndex === -1) return;
            const q = this.state.questions[qIndex];

            if (action === 'delete') {
                const deleteQuestion = async () => {
                    try {
                        const trash = await window.Storage.loadTrash();
                        trash.push({ ...q, type: 'question', deletedAt: new Date().toISOString() });
                        await window.Storage.saveTrash(trash);
                    } catch (e) { }

                    this.state.questions.splice(qIndex, 1);
                    if (this.activeQuestionId === id) this.resetEditor();
                    this.saveData();
                    this.syncEditorDeletion([id]);
                    if (typeof window.updateTrashButton === "function") window.updateTrashButton();
                };

                if (typeof window.TwoBase?.showDeleteConfirmation === "function") {
                    window.TwoBase.showDeleteConfirmation(1, deleteQuestion);
                } else {
                    if (confirm("Delete this question?")) await deleteQuestion();
                }
            } else if (action === 'rename') {
                let newTitle;
                if (typeof window.modalPrompt === 'function') {
                    newTitle = await window.modalPrompt("Rename Question", "Question Title", q.title);
                } else {
                    newTitle = prompt("Rename question:", q.title);
                }
                if (newTitle) {
                    q.title = newTitle;
                    if (this.activeQuestionId === id) {
                        this.el.titleInput.value = newTitle;
                    }
                    this.saveData();
                }
            } else if (action === 'star') {
                q.starred = !q.starred;
                this.saveData();
            } else if (action === 'unstar-all') {
                this.state.questions.forEach(item => item.starred = false);
                this.saveData();
            } else if (action === 'unstar-others') {
                this.state.questions.forEach(item => {
                    if (item.id !== id) item.starred = false;
                });
                this.saveData();
            }
        } else if (type === 'folder') {
            const fIndex = this.state.folders.findIndex(f => f.id === id);
            if (fIndex === -1) return;
            const folder = this.state.folders[fIndex];

            if (action === 'delete') {
                const questionsInFolder = this.state.questions.filter(q => q.folderId === id);
                const count = questionsInFolder.length + 1;

                const deleteFolder = async () => {
                    try {
                        const trash = await window.Storage.loadTrash();
                        questionsInFolder.forEach(q => {
                            trash.push({ ...q, type: 'question', deletedAt: new Date().toISOString() });
                        });
                        trash.push({ ...folder, type: 'folder', deletedAt: new Date().toISOString() });
                        await window.Storage.saveTrash(trash);
                    } catch (e) {
                        console.warn("Failed to sync to trash", e);
                    }

                    this.deleteFolder(id); // Call the new robust deleteFolder method
                    if (typeof window.updateTrashButton === "function") window.updateTrashButton();
                };

                if (typeof window.TwoBase?.showDeleteConfirmation === "function") {
                    window.TwoBase.showDeleteConfirmation(count, deleteFolder);
                } else {
                    if (confirm(`Delete folder "${folder.title}" and its ${questionsInFolder.length} question(s)?`)) await deleteFolder();
                }
            } else if (action === 'rename') {
                this.renameFolder(id);
            } else if (action === 'edit-session') {
                this.editSessionFromFolder(id);
            } else if (action === 'new-sub-question') {
                this.createNewQuestion(id);
            } else if (action === 'new-sub-folder') {
                this.createNewFolder(id);
            }
        }
    },

    async showTrashModal() {
        // Create Modal DOM using user provided structure (matching search-results-modal)
        const overlay = document.createElement("div");
        overlay.className = "trash-modal-overlay";
        overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 99999; opacity: 0; transition: opacity 0.2s;";

        const content = document.createElement("div");
        content.className = "trash-modal-content"; // Custom class to avoid conflicts
        // Add inline styles to ensure it looks right even if class is missing some props
        content.style.cssText = "position: relative; margin: auto; background: var(--panel, #ffffff); border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); width: 600px; max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; transform: scale(0.95); transition: transform 0.2s;";

        // Header
        const header = document.createElement("div");
        header.className = "search-results-header";
        header.style.cssText = "padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border);";

        // We'll update the innerHTML later with count

        // Load Trash Data
        let trashItems = [];
        try {
            const allTrash = await window.Storage.loadTrash();
            // Filter for questions and question folders
            trashItems = allTrash.filter(t => t.type === 'question' || (t.type === 'folder' && t.id && String(t.id).startsWith('fq-')));
        } catch (e) {
            console.error("Failed to load trash", e);
        }

        const close = () => {
            overlay.style.opacity = "0";
            content.style.transform = "scale(0.95)";
            setTimeout(() => overlay.remove(), 200);
        };

        const renderList = () => {
            // Update Header
            header.innerHTML = `
            <h2 style="font-size: 1.1rem; font-weight: 600; color: var(--text); margin: 0;">Trash (${trashItems.length} items)</h2>
            <div class="trash-actions" style="display: flex; gap: 8px; align-items: center;">
              <button class="empty-all-btn trash-btn danger">Empty All</button>
              <button class="close-modal-btn" style="background: none; border: none; color: var(--muted); cursor: pointer; padding: 4px; display: flex;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          `;

            // Bind Header Events
            header.querySelector('.close-modal-btn').onclick = close;
            const emptyBtn = header.querySelector('.empty-all-btn');
            if (trashItems.length === 0) emptyBtn.style.display = 'none';
            else {
                emptyBtn.style.display = 'block';
                emptyBtn.onclick = async () => {
                    if (confirm("Are you sure you want to permanently delete all items in trash?")) {
                        const allTrash = await window.Storage.loadTrash();
                        const keep = allTrash.filter(t => !(t.type === 'question' || (t.type === 'folder' && t.id && String(t.id).startsWith('fq-'))));
                        await window.Storage.saveTrash(keep);
                        trashItems = [];
                        renderList();
                        if (typeof window.updateTrashButton === "function") window.updateTrashButton();
                    }
                };
            }

            // List Body
            const body = document.createElement("div");
            body.className = "search-results-list";
            body.id = "trashList";
            body.style.cssText = "flex: 1; overflow-y: auto; padding: 0;";

            if (trashItems.length === 0) {
                body.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--muted); text-align: center;">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.5;">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <div style="font-size: 15px; font-weight: 500;">Trash is empty</div>
              </div>`;
            } else {
                trashItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

                trashItems.forEach(item => {
                    const row = document.createElement("div");
                    row.className = "search-result-item trash-result-item";
                    row.style.cssText = "padding: 12px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px; transition: background 0.2s;";
                    row.onmouseenter = () => row.style.background = "var(--hover, rgba(0,0,0,0.02))";
                    row.onmouseleave = () => row.style.background = "transparent";

                    const title = item.title || "Untitled";
                    const dateStr = item.deletedAt ? new Date(item.deletedAt).toLocaleString() : 'Unknown';
                    const typeLabel = item.type === 'folder' ? 'Folder' : 'Question';

                    row.innerHTML = `
                     <div style="flex: 1; min-width: 0;">
                        <div class="search-result-title" style="cursor: default; font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</div>
                        <div class="search-result-meta" style="font-size: 12px; color: var(--muted); margin-top: 2px;">${typeLabel} • Deleted: ${dateStr}</div>
                     </div>
                     <div class="trash-item-actions-inline" style="display: flex; gap: 8px;">
                        <button class="restore-btn-inline trash-btn">Restore</button>
                        <button class="delete-forever-btn-inline trash-btn danger">Delete Forever</button>
                     </div>
                   `;

                    // Bind Row Actions
                    const restoreBtn = row.querySelector('.restore-btn-inline');
                    restoreBtn.onclick = async () => {
                        if (item.type === 'folder') {
                            this.state.folders.push(item);
                        } else {
                            this.state.questions.push(item);
                        }
                        const allTrash = await window.Storage.loadTrash();
                        const newTrash = allTrash.filter(t => t.id !== item.id);
                        await window.Storage.saveTrash(newTrash);
                        trashItems = newTrash.filter(t => t.type === 'question' || (t.type === 'folder' && t.id && String(t.id).startsWith('fq-')));
                        this.saveData();
                        renderList();
                        if (typeof window.updateTrashButton === "function") window.updateTrashButton();
                    };

                    const delForeverBtn = row.querySelector('.delete-forever-btn-inline');
                    delForeverBtn.onclick = async () => {
                        const allTrash = await window.Storage.loadTrash();
                        const newTrash = allTrash.filter(t => t.id !== item.id);
                        await window.Storage.saveTrash(newTrash);
                        trashItems = newTrash.filter(t => t.type === 'question' || (t.type === 'folder' && t.id && String(t.id).startsWith('fq-')));
                        renderList();
                        if (typeof window.updateTrashButton === "function") window.updateTrashButton();
                    };

                    body.appendChild(row);
                });
            }

            content.innerHTML = '';
            content.appendChild(header);
            content.appendChild(body);
        };

        renderList();

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = "1";
            content.style.transform = "scale(1)";
        });

        header.querySelector('.close-modal-btn').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    },

    // --- Session Creator Logic ---

    toggleSessionControls(show) {
        if (this.el.sessionControls) {
            this.el.sessionControls.forEach(btn => {
                btn.style.display = show ? '' : 'none';
            });
        }
    },

    generateSessionText(questions) {
        return questions.map(q => {
            let text = `<div class="question-block" data-q-id="${q.id}">`;
            text += `Question title: ${q.title}\n`;
            text += `Question context: ${q.text ? q.text.replace(/<br>/g, "\n") : ""}\n`;

            text += `Question options:\n`;
            const options = q.options || [];
            // Ensure at least 4 placeholders if none exist? Or just map what exists.
            // Let's map what exists and ensure they have letters.
            options.forEach((opt, idx) => {
                const letter = String.fromCharCode(65 + idx); // A, B, C, D...
                text += `  ${opt.isCorrect ? '*' : ''}(${letter}) ${opt.text}\n`;
            });

            text += `Question explanation: ${q.explanation || ""}\n`;
            text += `</div>`;
            return text;
        }).join("\n");
    },

    openSessionCreator(folderId = null, targetQuestionId = null) {
        // Deselect all tabs
        document.querySelectorAll('.qbank-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        this.state.sessionCreatorVisible = true;
        this.el.emptyState.classList.add("hidden");
        this.el.editor.classList.add("hidden");
        this.el.sessionCreator.classList.remove("hidden");
        if (this.el.createSessionBtn) this.el.createSessionBtn.classList.add('active'); // Active state UI

        // Update Header -> CREATOR
        this.updateHeaderUI('CREATOR');

        // Reset state
        this.state.editingFolderId = folderId;
        this.state.editingQuestionId = (folderId) ? null : targetQuestionId;

        if (folderId) {
            // Folder Mode: Load all questions in folder
            const folder = this.state.folders.find(f => f.id === folderId);
            const questions = this.state.questions.filter(q => q.folderId === folderId);

            if (folder) {
                this.el.sessionInput.innerHTML = this.generateSessionText(questions);
                if (targetQuestionId) {
                    setTimeout(() => this.scrollToQuestion(targetQuestionId), 50);
                }
            }
        } else if (targetQuestionId) {
            // Standalone Question Mode
            const q = this.state.questions.find(q => q.id === targetQuestionId);
            if (q) {
                this.el.sessionInput.innerHTML = this.generateSessionText([q]);
            }
        } else {
            // New/Empty Mode
            if (!this.el.sessionInput.textContent.trim()) {
                this.addSessionQuestionTemplate();
            }
        }

        this.el.sessionInput.focus();
    },

    saveTextEditorChanges() {
        const text = this.el.sessionInput.innerText || this.el.sessionInput.textContent;
        const parsedQuestions = this.parseSessionText(text);

        if (this.state.editingFolderId) {
            // Update all questions in folder
            const folderId = this.state.editingFolderId;
            const oldQuestions = this.state.questions.filter(q => q.folderId === folderId);
            
            // 1. Remove old questions for this folder from the master list
            this.state.questions = this.state.questions.filter(q => q.folderId !== folderId);
            
            // 2. Add parsed questions with folderId, PRESERVING metadata if it matches
            parsedQuestions.forEach((newQ, idx) => {
                newQ.folderId = folderId;
                
                // Match by index or title if possible
                const oldQ = oldQuestions[idx];
                if (oldQ && (oldQ.title === newQ.title || oldQ.text === newQ.text)) {
                    // Preserve metadata
                    if (oldQ.submittedAnswer) newQ.submittedAnswer = oldQ.submittedAnswer;
                    if (oldQ.timerElapsed) newQ.timerElapsed = oldQ.timerElapsed;
                    if (oldQ.id) newQ.id = oldQ.id;
                }
                
                this.state.questions.push(newQ);
            });
        } else if (this.state.editingQuestionId) {
            // Update single standalone question
            const qId = this.state.editingQuestionId;
            const index = this.state.questions.findIndex(q => q.id === qId);
            if (index !== -1 && parsedQuestions.length > 0) {
                // Update properties but preserve certain metadata if needed
                const updatedQ = parsedQuestions[0];
                updatedQ.id = qId;
                updatedQ.folderId = null;
                this.state.questions[index] = updatedQ;
            }
        }

        // Permanent Backend Save
        this.saveData();
        this.renderSidebar();

        // Optional: Visual feedback
        const saveBtn = document.getElementById('saveSessionBtn');
        if (saveBtn) {
            const originalHTML = saveBtn.innerHTML;
            saveBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            setTimeout(() => saveBtn.innerHTML = originalHTML, 1000);
        }
    },

    async handlePaste(e) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                e.preventDefault();
                const file = item.getAsFile();

                // Convert to base64
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64Data = event.target.result;
                    const tempName = `img_${Date.now()}.png`;

                    try {
                        const result = await window.Storage.uploadImageToServer(tempName, base64Data);
                        if (result && result.success) {
                            // Insert placeholder [img:filename]
                            this.insertTextAtCursor(`[img:${result.filename}]`);
                        }
                    } catch (err) {
                        console.error("Paste upload failed:", err);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    },

    insertTextAtCursor(text) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        selection.deleteFromDocument();
        const range = selection.getRangeAt(0);
        range.insertNode(document.createTextNode(text));

        // Move cursor to end of inserted text
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    },

    syncEditorDeletion(qIds = [], folderIds = []) {
        if (!this.state.sessionCreatorVisible) return;

        // 1. Folder deletion
        if (this.state.editingFolderId && folderIds.includes(this.state.editingFolderId)) {
            this.closeSessionCreator();
            return;
        }

        // 2. Single question deletion
        if (this.state.editingQuestionId && qIds.includes(this.state.editingQuestionId)) {
            this.closeSessionCreator();
            return;
        }

        // 3. Question inside currently editing folder deletion
        if (this.state.editingFolderId) {
            // Refresh current folder content
            this.openSessionCreator(this.state.editingFolderId);
        }
    },

    scrollToQuestion(id) {
        if (!id) return;

        console.log(`[QuestionBase] Attempting to scroll to question: ${id}`);

        // ULTIMATE CLEAR: Remove highlight from EVERY element in the DOM to be sure
        document.querySelectorAll('.highlight-yellow, .highlight-yellow-flash').forEach(el => {
            el.classList.remove('highlight-yellow');
            el.classList.remove('highlight-yellow-flash');
        });

        const editor = this.el.sessionInput;
        if (!editor) return;

        // Reset sidebar selection visual (Sync)
        this.renderSidebar();

        // Slightly longer timeout to ensure contenteditable has rendered the innerHTML
        setTimeout(() => {
            const block = editor.querySelector(`[data-q-id="${id}"]`);
            if (block) {
                console.log(`[QuestionBase] ✅ Found block for ${id}, highlighting and scrolling...`);
                block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                block.classList.add('highlight-yellow');
                block.classList.add('highlight-yellow-flash');

                // Make highlight temporary
                setTimeout(() => {
                    block.classList.remove('highlight-yellow');
                    block.classList.remove('highlight-yellow-flash');
                }, 3000);
            } else {
                console.warn(`[QuestionBase] ❌ Could NOT find block for question ID: ${id}`);
                // Attempt global search as fallback
                const fallback = document.querySelector(`[data-q-id="${id}"]`);
                if (fallback) {
                    console.log(`[QuestionBase] Found block via global search for ${id}`);
                    fallback.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    fallback.classList.add('highlight-yellow');
                }
            }
        }, 200);
    },

    closeSessionCreator(restoreTab = false) {
        this.state.sessionCreatorVisible = false;
        this.el.sessionCreator.classList.add("hidden");
        if (this.el.createSessionBtn) this.el.createSessionBtn.classList.remove('active');
        
        // Clean up tags
        this.clearSessionTags();

        if (restoreTab) {
            const tab = this.state.lastActiveTab || 'main';
            this.switchTab(tab);
            this.el.emptyState.classList.remove("hidden");
            this.updateHeaderUI('HOME');
            return;
        }

        if (this.activeQuestionId) {
            this.el.editor.classList.remove("hidden");
            this.toggleSessionControls(false); // Hide controls when editor is open
            this.updateHeaderUI('EDITOR');
        } else {
            this.el.emptyState.classList.remove("hidden"); // valid as it's the parent
            // Re-evaluate what to show inside (empty msg or sessions)
            // this.renderRecentSessions(); // Handled by switchTab logic or default view
            this.updateHeaderUI('HOME');
        }
    },

    addSessionQuestionTemplate() {
        const template = `Question title: Untitled Question
Question context: 
Question options:
  (A) 
  (B) 
  (C) 
  (D) 
Question explanation: 

`;
        const input = this.el.sessionInput;
        const currentVal = input.innerText || "";
        // Add newline if needed
        const prefix = (currentVal.trim() && !currentVal.endsWith("\n\n")) ? "\n\n" : "";

        input.innerText += prefix + template;

        // Scroll to bottom
        input.scrollTop = input.scrollHeight;
        input.focus();
    },

    removeLastSessionQuestion() {
        const input = this.el.sessionInput;
        const text = input.innerText;
        const lastIdx = text.lastIndexOf("Question title:");

        if (lastIdx !== -1) {
            // Save the block to history before removing
            const removedBlock = text.substring(lastIdx);
            this.state.deletedSessionBlocks.push(removedBlock);

            // Remove everything from the last "Question title:" onwards
            input.innerText = text.substring(0, lastIdx).trimEnd() + "\n\n";
            input.scrollTop = input.scrollHeight;
        } else {
            // If none found, just clear all (but save if not empty)
            if (text.trim()) {
                this.state.deletedSessionBlocks.push(text);
            }
            input.innerText = "";
        }
    },

    restoreLastSessionQuestion() {
        if (this.state.deletedSessionBlocks.length === 0) return;

        const lastBlock = this.state.deletedSessionBlocks.pop();
        const input = this.el.sessionInput;
        const currentVal = input.innerText || "";

        // Add newline if needed
        const prefix = (currentVal.trim() && !currentVal.endsWith("\n\n")) ? "\n\n" : "";

        input.innerText = currentVal.trimEnd() + prefix + lastBlock;

        // Scroll to bottom
        input.scrollTop = input.scrollHeight;
        input.focus();
    },

    parseSessionText(text) {
        // Simple parser based on user format
        // Split by "Question title:" but keep it (lookahead? or just simple split and map)

        // Normalize line endings
        text = text.replace(/\r\n/g, "\n");

        const chunks = text.split(/Question title:/g);
        const questions = [];

        // Skip first empty chunk if text starts with "Question title:"
        for (let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i].trim();
            if (!chunk) continue;

            // Re-add the title label effectively by processing the chunk
            // Structure expected:
            // [Title Text]
            // Question context: [Context Text]
            // Question options: [Options Text]
            // Question explanation: [Explanation Text]

            const q = {
                id: Date.now().toString() + "-" + Math.random().toString(36).substr(2, 5),
                title: "Untitled",
                text: "",
                options: [],
                explanation: "",
                starred: false,
                createdAt: new Date().toISOString()
            };

            // Parse Title (First line(s) until "Question context:" or end)
            // But wait, the split removed "Question title:". So the start of chunk is the title.

            // Regex to find parts
            // This is loose parsing
            const contextIdx = chunk.indexOf("Question context:");
            const optionsIdx = chunk.indexOf("Question options:");
            const explIdx = chunk.indexOf("Question explanation:");

            let titleEnd = chunk.length;
            if (contextIdx !== -1) titleEnd = Math.min(titleEnd, contextIdx);
            else if (optionsIdx !== -1) titleEnd = Math.min(titleEnd, optionsIdx); // Fallback if context missing

            q.title = chunk.substring(0, titleEnd).trim() || "Untitled Question";

            // Context
            if (contextIdx !== -1) {
                let contextEnd = chunk.length;
                if (optionsIdx !== -1) contextEnd = Math.min(contextEnd, optionsIdx);
                else if (explIdx !== -1) contextEnd = Math.min(contextEnd, explIdx);

                let contextText = chunk.substring(contextIdx + "Question context:".length, contextEnd).trim();

                // Handle Images: Convert [img:filename.png] to <img src="...">
                contextText = contextText.replace(/\[img:([^\]]+)\]/g, (match, filename) => {
                    return `<div class="question-image-container"><img src="/api/images/${filename}" class="question-image" alt="Question Image"></div>`;
                });

                q.text = contextText.replace(/\n/g, "<br>");
            }

            // Options
            if (optionsIdx !== -1) {
                let optionsEnd = chunk.length;
                if (explIdx !== -1) optionsEnd = Math.min(optionsEnd, explIdx);

                const optionsBlock = chunk.substring(optionsIdx + "Question options:".length, optionsEnd).trim();
                const optionLines = optionsBlock.split("\n");

                optionLines.forEach((line, idx) => {
                    line = line.trim();
                    if (!line) return;

                    const isCorrect = line.startsWith("*");
                    if (isCorrect) line = line.substring(1).trim();

                    // Strip prefixes like "(A)", "A.", "1.", "(1)"
                    line = line.replace(/^(\([A-Za-z0-9]+\)|[A-Za-z0-9]+\.)\s*/, "");

                    // Let's keep the text as is but maybe strip leading "A. " if user wants?
                    // User prompt: "A.", "*B." etc. So we should strip standard prefixes if we want clean text, 
                    // or just keep them. Let's keep them active for now, but `isCorrect` logic is handled.

                    q.options.push({
                        id: (Date.now() + idx).toString() + Math.random().toString().substr(2, 4),
                        text: line,
                        isCorrect: isCorrect
                    });
                });
            }

            // Explanation
            if (explIdx !== -1) {
                q.explanation = chunk.substring(explIdx + "Question explanation:".length).trim();
            }

            // Validation
            if (q.options.length > 0) {
                questions.push(q);
            }

            if (questions.length >= 100) break;
        }

        return questions;
    },

    async startSession() {
        const text = this.el.sessionInput.innerText || this.el.sessionInput.textContent;
        if (!text.trim()) {
            alert("Please add some questions first.");
            return;
        }

        const questions = this.parseSessionText(text);
        if (questions.length === 0) {
            alert("No valid questions found. Please check the format.");
            return;
        }

        // Apply selected Tags to these questions
        const sessionTags = {
            subject: [...this.state.selectedTagSubjects],
            system:  [...this.state.selectedTagSystems],
            major:   [...this.state.selectedTagMajors],
            minor:   [...this.state.selectedTagMinors]
        };

        questions.forEach(q => {
            q.tags = { ...sessionTags };
            if (!q.spId) q.spId = this.generateNumericId(q);
        });

        const hasCorrect = questions.every(q => q.options.some(o => o.isCorrect));
        if (!hasCorrect) {
            if (!confirm("Some questions do not have a correct answer marked (with *). Continue anyway?")) {
                return;
            }
        }

        // Check if updating existing session
        if (this.state.editingFolderId) {
            // Updating existing folder
            const folderIndex = this.state.folders.findIndex(f => f.id === this.state.editingFolderId);
            if (folderIndex !== -1) {
                // Keep folder ID, maybe update title if we parse it differently? 
                // For now keep title or update date?
                // Let's keep it simple: clear old questions from this folder, add new ones
                const folderId = this.state.editingFolderId;

                // Remove old questions linked to this folder
                this.state.questions = this.state.questions.filter(q => q.folderId !== folderId);

                // Add new questions
                questions.forEach(q => q.folderId = folderId);
                this.state.questions.push(...questions);

                // Update Recent Session Entry if exists
                const sessionIndex = this.state.recentSessions.findIndex(s => s.folderId === folderId);
                if (sessionIndex !== -1) {
                    this.state.recentSessions[sessionIndex].date = new Date().toISOString();
                    this.state.recentSessions[sessionIndex].count = questions.length;
                    // Move to top
                    const s = this.state.recentSessions.splice(sessionIndex, 1)[0];
                    this.state.recentSessions.unshift(s);
                    this.saveRecentSessions();
                }

                await this.saveData();
                this.renderRecentSessions();

                // Open Dungeon
                if (typeof window.DungeonBase !== 'undefined') {
                    window.DungeonBase.open(questions);
                }
                return;
            }
        }

        // New Session Creation
        // Create a new folder for this session
        let folderName = "Session " + new Date().toLocaleString();
        
        // Attempt AI naming
        try {
            const aiTitle = await this.generateAISessionTitle(questions);
            if (aiTitle) {
                folderName = aiTitle;
            }
        } catch (e) {
            console.warn("[QuestionBase] AI Title failed, staying with default date name.");
        }

        // logic from createNewFolder but returning the object
        const newFolder = {
            id: "fq-" + Date.now(),
            title: folderName,
            parentId: null
        };

        // Link questions to this folder
        questions.forEach(q => q.folderId = newFolder.id);

        // Save to state
        this.state.folders.push(newFolder);
        this.state.questions.push(...questions);

        await this.saveData();

        // Save session locally
        const session = {
            id: newFolder.id, // Use folder ID as session ID
            title: folderName,
            date: new Date().toISOString(),
            count: questions.length,
            folderId: newFolder.id,
            questions: questions // Store questions directly for now as backup/resume without full load
        };
        this.state.recentSessions.unshift(session); // Add to the beginning
        this.saveRecentSessions();
        this.renderRecentSessions();

        // Switch to Dungeon (Play) Mode with these questions
        if (typeof window.DungeonBase !== 'undefined') {
            window.DungeonBase.open(questions);
        } else {
            alert("Dungeon Mode is not loaded.");
        }

        // Hide session creator and clear tags
        this.clearSessionTags();
        this.closeSessionCreator();

        // Also expand the new folder in sidebar so user sees it when they return
        this.state.expandedFolders.add(newFolder.id);
        this.saveExpandedFolders();
        this.renderSidebar();
    },

    renderRecentSessions() {
        const list = this.el.recentSessionsList;
        if (!list) return;

        list.innerHTML = "";
        
        // Update View Class
        if (this.state.recentSessionsView === 'grid') {
            list.classList.add('grid-view');
        } else {
            list.classList.remove('grid-view');
        }

        // 1. Filter by Search
        let filtered = [...this.state.recentSessions];
        if (this.state.recentSessionsSearch) {
            const query = this.state.recentSessionsSearch.toLowerCase();
            filtered = filtered.filter(s => 
                (s.title && s.title.toLowerCase().includes(query)) ||
                (new Date(s.date).toLocaleDateString().includes(query))
            );
        }

        if (filtered.length === 0) {
            const msg = this.state.recentSessionsSearch ? "No sessions match your search." : "No recent sessions found. Start a new session to see it here!";
            list.innerHTML = `
                <div class="empty-state-content" style="grid-column: 1/-1; height: 100%; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; width: 100%;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1.5rem; opacity: 0.3;">
                        <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                    </svg>
                    <p style="color: var(--muted); font-size: 1.1rem; max-width: 400px; margin: 0 auto; line-height: 1.6; text-align: center;">${msg}</p>
                </div>
            `;
            return;
        }

        // 2. Sort
        const sorted = filtered.sort((a, b) => {
            if (this.state.recentSessionsSort === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
            if (this.state.recentSessionsSort === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
            if (this.state.recentSessionsSort === "name") return (a.title || "").localeCompare(b.title || "");
            if (this.state.recentSessionsSort === "questions") return (b.questions?.length || 0) - (a.questions?.length || 0);
            return 0;
        });

        sorted.forEach(session => {
            const card = document.createElement("div");
            card.className = "session-row";
            card.innerHTML = `
                <div class="session-title" title="${session.title || "Untitled Session"}">${session.title || "Untitled Session"}</div>
                
                <div class="session-stats">
                    ${new Date(session.date).toLocaleDateString()} • ${session.questions?.length || 0} Questions
                </div>

                <div class="session-actions">
                    <button class="resume-session-btn" title="Resume Session">Resume</button>
                    <button class="standard-tool-btn reset-btn" title="Reset Session Progress">Reset</button>
                    <button class="standard-tool-btn edit-btn" title="Edit Session">Edit</button>
                    <button class="standard-tool-btn delete-btn danger" title="Delete Session">Delete</button>
                </div>
            `;

            // Action Binding - Absolute Simplicity
            card.querySelector(".resume-session-btn").onclick = () => this.resumeSession(session.id);
            card.querySelector(".reset-btn").onclick = (e) => {
                e.stopPropagation();
                this.resetSession(session.id);
            };
            card.querySelector(".delete-btn").onclick = (e) => {
                e.stopPropagation();
                this.deleteSession(session.id, e);
            };
            card.querySelector(".edit-btn").onclick = (e) => {
                e.stopPropagation();
                if (session.folderId) {
                    this.editSessionFromFolder(session.folderId);
                } else {
                    alert("No question data found.");
                }
            };

            list.appendChild(card);
        });
    },

    async renderStatistics(forceSync = false) {
        if (!this.el.statTotalQuestions) return;

        if (forceSync && this.el.syncStatsBtn) {
            const originalHtml = this.el.syncStatsBtn.innerHTML;
            this.el.syncStatsBtn.innerHTML = "Syncing...";
            this.el.syncStatsBtn.disabled = true;
            try {
                await window.fileSystemService.makeRequest('/stats/sync');
                await this.loadData();
            } catch(e) {}
            setTimeout(() => {
                if (this.el.syncStatsBtn) {
                    this.el.syncStatsBtn.innerHTML = originalHtml;
                    this.el.syncStatsBtn.disabled = false;
                }
            }, 1000);
        }

        try {
            // 1. Get live session counts
            const sessions = await window.fileSystemService.makeRequest('/sessions');
            if (sessions) {
                this.state.recentSessions = sessions;
                localStorage.setItem("active-recall-recent-sessions", JSON.stringify(sessions));
            }
        } catch (e) {}

        try {
            // 2. Fetch performance stats
            const stats = await window.fileSystemService.makeRequest('/stats');
            if (stats) {
                // --- Your Score ---
                const correct = stats.correct || 0;
                const incorrect = stats.incorrect || 0;
                const omitted = stats.omitted || 0;
                const totalAttempted = correct + incorrect;
                const accuracy = totalAttempted > 0 ? Math.min(100, Math.round((correct / totalAttempted) * 100)) : 0;

                if (this.el.statCorrect) this.el.statCorrect.textContent = correct;
                if (this.el.statIncorrect) this.el.statIncorrect.textContent = incorrect;
                if (this.el.statOmitted) this.el.statOmitted.textContent = omitted;
                if (this.el.statAccuracy) this.el.statAccuracy.textContent = accuracy + "%";

                // Donut 1: Accuracy
                if (this.el.donutCorrect) {
                  const circumference = 314; // 2 * PI * 50
                  this.el.donutCorrect.style.strokeDasharray = `${(accuracy / 100) * circumference} ${circumference}`;
                }

                // --- QBank Usage ---
                const totalQ = this.state.questions.length;
                let usedQ = correct + incorrect + omitted; // Simplified: anything with an attempt
                if (usedQ > totalQ) usedQ = totalQ; // Clamp to real total
                
                const unusedQ = Math.max(0, totalQ - usedQ);
                const usedPct = totalQ > 0 ? Math.min(100, Math.round((usedQ / totalQ) * 100)) : 0;

                if (this.el.statTotalQuestions) this.el.statTotalQuestions.textContent = totalQ;
                if (this.el.statUsedQ) this.el.statUsedQ.textContent = usedQ;
                if (this.el.statUnusedQ) this.el.statUnusedQ.textContent = unusedQ;
                if (this.el.statUsedPct) this.el.statUsedPct.textContent = usedPct + "%";

                // Donut 2: Usage
                if (this.el.donutUsed) {
                  const circumference = 314;
                  this.el.donutUsed.style.strokeDasharray = `${(usedPct / 100) * circumference} ${circumference}`;
                }

                // --- Test Activity ---
                const sessionFolderIds = new Set(this.state.recentSessions.map(s => s.folderId));
                const userFolders = this.state.folders.filter(f => !sessionFolderIds.has(f.id)).length;
                
                if (this.el.statTotalFolders) this.el.statTotalFolders.textContent = userFolders;
                if (this.el.statTotalSessions) this.el.statTotalSessions.textContent = this.state.recentSessions.length;
                if (this.el.statSuspended) this.el.statSuspended.textContent = "0";

                // --- Answer Changes ---
                if (this.el.statC2I) this.el.statC2I.textContent = stats.changesC2I || "0";
                if (this.el.statI2C) this.el.statI2C.textContent = stats.changesI2C || "0";
                if (this.el.statI2I) this.el.statI2I.textContent = stats.changesI2I || "0";

                // --- Performance ---
                const totalTime = stats.totalTime || 0;
                const avgTime = totalAttempted > 0 ? Math.round(totalTime / totalAttempted) : 0;
                if (this.el.statAvgTime) this.el.statAvgTime.textContent = avgTime + "s";
            }
        } catch (error) {
            console.error('[QuestionBase] Failed to fetch statistics:', error);
        }
    },

    updateViewToggleUI() {
        if (!this.el.viewListBtn || !this.el.viewGridBtn) return;
        
        if (this.state.recentSessionsView === 'grid') {
            this.el.viewGridBtn.classList.add('active');
            this.el.viewListBtn.classList.remove('active');
        } else {
            this.el.viewListBtn.classList.add('active');
            this.el.viewGridBtn.classList.remove('active');
        }
    },

    openRecentSessionsView() {
        // Clear active question/session
        this.activeQuestionId = null;
        this.state.sessionCreatorVisible = false;

        // Hide specific views
        if (this.el.editor) this.el.editor.classList.add("hidden");
        if (this.el.sessionCreator) this.el.sessionCreator.classList.add("hidden");

        // Show base empty state container (which holds the recent sessions list)
        if (this.el.emptyState) this.el.emptyState.classList.remove("hidden");

        // Update Header
        this.updateHeaderUI('SESSIONS');

        // Force render recent sessions
        this.renderRecentSessions();
    },

    deleteSession(id, event) {
        if (event) event.stopPropagation();

        if (confirm("Delete this session record and its folder?")) {
            const session = this.state.recentSessions.find(s => s.id === id);

            // Delete from recent sessions list
            this.state.recentSessions = this.state.recentSessions.filter(s => s.id !== id);
            this.saveRecentSessions();
            this.renderRecentSessions();

            // Delete associated folder if it exists
            if (session && session.folderId) {
                this.deleteFolder(session.folderId);
            }
        }
    },

    resumeSession(id) {
        const session = this.state.recentSessions.find(s => s.id === id);
        if (!session) return;

        // PRIORITIZE MASTER STATE: Load questions from the folderId first
        // This ensures answers saved to the backend are loaded correctly.
        let questionsToOpen = [];
        if (session.folderId) {
            questionsToOpen = this.state.questions.filter(q => q.folderId === session.folderId);
        }

        // Fallback to cached session questions if folder search failed
        if (!questionsToOpen.length) {
            questionsToOpen = session.questions || [];
        }

        if (questionsToOpen.length === 0) {
            alert("No questions found for this session.");
            return;
        }

        if (typeof window.DungeonBase !== 'undefined') {
            window.DungeonBase.open(questionsToOpen);
        }
    },

    resetSession(id) {
        const session = this.state.recentSessions.find(s => s.id === id);
        if (!session) return;

        if (!confirm(`Are you sure you want to reset all question statuses in "${session.title || 'this session'}"? This cannot be undone.`)) {
            return;
        }

        // 1. Find folder
        if (session.folderId) {
            // Reset all questions in this folder
            this.state.questions.forEach(q => {
                if (q.folderId === session.folderId) {
                    delete q.submittedAnswer;
                    delete q.timerElapsed;
                }
            });
        }

        // 2. Persist
        this.saveData();

        // 3. Open session normally (now empty)
        this.resumeSession(id);
    },



    deleteFolder(id) {
        if (!id) return;

        // Find folder
        const folderIndex = this.state.folders.findIndex(f => f.id === id);
        if (folderIndex === -1) return;

        // Find all questions in this folder
        const questionsToDelete = this.state.questions.filter(q => q.folderId === id);

        // Remove questions
        this.state.questions = this.state.questions.filter(q => q.folderId !== id);

        // Remove folder
        this.state.folders.splice(folderIndex, 1);

        // Also remove from recent sessions if exists
        this.state.recentSessions = this.state.recentSessions.filter(s => s.folderId !== id);
        this.saveRecentSessions();
        this.renderRecentSessions();

        this.saveData();
        this.renderSidebar();

        // If active question was in this folder, clear main view
        if (this.state.activeQuestionId && questionsToDelete.find(q => q.id === this.state.activeQuestionId)) {
            this.el.emptyState.classList.remove("hidden");
            this.el.editor.classList.add("hidden");
            this.state.activeQuestionId = null;
        }

        // Sync editor
        this.syncEditorDeletion([], [id]);
    },

    renameFolder(id) {
        const folder = this.state.folders.find(f => f.id === id);
        if (!folder) return;

        const newName = prompt("Enter new folder name:", folder.title);
        if (newName && newName.trim() !== "") {
            folder.title = newName.trim();
            this.saveData();
            this.renderSidebar();

            // Update session name if linked
            const session = this.state.recentSessions.find(s => s.folderId === id);
            if (session) {
                session.title = folder.title;
                this.saveRecentSessions();
                this.renderRecentSessions();
            }
        }
    },

    editSessionFromFolder(folderId) {
        const folder = this.state.folders.find(f => f.id === folderId);
        if (!folder) return;

        const questions = this.state.questions.filter(q => q.folderId === folderId);
        if (questions.length === 0) {
            alert("No questions in this folder to edit.");
            return;
        }

        if (confirm("This will overwrite current text in Session Creator. Continue?")) {
            const text = this.reverseParseQuestions(questions);
            this.el.sessionInput.innerText = text;
            this.openSessionCreator();
        }
    },

    reverseParseQuestions(questions) {
        return questions.map(q => {
            let block = `Question title:\n${q.title}\n\n`;

            // Context (convert <br> back to newlines if needed, though usually regex handles it)
            // Stored text might have <br> or be plain.
            let context = q.text || "";
            context = context.replace(/<br\s*\/?>/gi, "\n");
            if (context) {
                block += `Question context:\n${context}\n\n`;
            }

            block += `Question options:\n`;
            ['A', 'B', 'C', 'D'].forEach((letter, i) => {
                const opt = q.options[i];
                if (opt) {
                    const prefix = opt.isCorrect ? "*" : "";
                    block += `  ${prefix}(${letter}) ${opt.text}\n`;
                }
            });
            // Handle if more options than 4?
            if (q.options.length > 4) {
                for (let i = 4; i < q.options.length; i++) {
                    const opt = q.options[i];
                    const prefix = opt.isCorrect ? "*" : "";
                    block += `  ${prefix}(${i + 1}) ${opt.text}\n`;
                }
            }

            if (q.explanation) {
                block += `\nQuestion explanation:\n${q.explanation}\n`;
            }

            return block;
        }).join("\n\n" + "-".repeat(20) + "\n\n"); // Separator optional but good for reading
    },

    // Unified Header State Management
    updateHeaderUI(state) {
        // States: 'HOME', 'SESSIONS', 'EDITOR', 'CREATOR'

        // Default Defaults
        let showBack = false;
        let showRecentBtn = true;
        let showControls = false;
        let titleText = "";
        let isTitleDisabled = true;
        let titlePlaceholder = "Select a question or create new";

        switch (state) {
            case 'HOME':
                showBack = false;
                showRecentBtn = true;
                showControls = false;
                titleText = "";
                titlePlaceholder = "Select a question or create new";
                break;
            case 'SESSIONS':
                showBack = true;
                showRecentBtn = false; // Hidden when in sessions view
                showControls = true;
                titleText = "Recent Sessions";
                titlePlaceholder = "";
                break;
            case 'EDITOR':
                showBack = true; // Returns to Home
                showRecentBtn = true;
                showControls = false;
                // Title is handled by editor logic usually, but we ensure controls are off
                isTitleDisabled = false;
                titlePlaceholder = "Question Title";
                break;
            case 'CREATOR':
                showBack = true;
                showRecentBtn = true;
                showControls = false;
                titleText = "Create Session";
                titlePlaceholder = "";
                break;
        }

        // Apply
        if (this.el.backToEmptyStateBtn) this.el.backToEmptyStateBtn.style.display = showBack ? 'flex' : 'none';
        if (this.el.openRecentSessionsBtn) this.el.openRecentSessionsBtn.style.display = showRecentBtn ? 'flex' : 'none';
        this.toggleSessionControls(showControls);

        if (state !== 'EDITOR') {
            // For editor, title is managed specifically with data
            if (this.el.titleInput) {
                this.el.titleInput.value = titleText;
                this.el.titleInput.disabled = isTitleDisabled;
                this.el.titleInput.placeholder = titlePlaceholder;
            }
        }
    },

    toggleAiMode() {
        this.state.aiMode = !this.state.aiMode;

        // Update Buttons
        if (this.el.toggleAiModeBtn) {
            this.el.toggleAiModeBtn.classList.toggle('active', this.state.aiMode);
        }
        if (this.el.sessionCreator) {
            this.el.sessionCreator.classList.toggle('ai-mode', this.state.aiMode);
        }
        if (this.el.fillAiBtn) {
            this.el.fillAiBtn.style.display = this.state.aiMode ? 'flex' : 'none';
        }
        if (this.el.uploadMediaBtn) {
            this.el.uploadMediaBtn.style.display = this.state.aiMode ? 'flex' : 'none';
        }
        if (this.el.aiModelSelector) {
            this.el.aiModelSelector.style.display = this.state.aiMode ? 'block' : 'none';
        }
        if (this.el.uploadedFileStatus) {
            // Only show if AI mode is on AND a file is uploaded
            this.el.uploadedFileStatus.style.display = (this.state.aiMode && this.state.uploadedMediaContent) ? 'flex' : 'none';
        }
        if (this.el.viewAiPromptBtn) {
            this.el.viewAiPromptBtn.style.display = this.state.aiMode ? 'flex' : 'none';
        }

        if (this.state.aiMode) {
            // Inject user's specific hard-coded prompt template
            const currentText = this.el.sessionInput.innerText.trim();
            if (!currentText || currentText.includes("Click '+ Add Question'") || currentText === "Untitled Question") {
                this.el.sessionInput.innerText = `Question title: 
Question context: 
Question options:
(A) 
(B) 
(C) 
(D) 
Question explanation:`;
            }

            // Focus and interactivity fix
            if (this.el.sessionInput) {
                this.el.sessionInput.focus();
                this.el.sessionInput.style.pointerEvents = "auto";
                this.el.sessionInput.style.zIndex = "10";
            }
        }
    },

    viewAiPrompt() {
        if (!this.el.aiPromptModal) return;
        const promptArea = document.getElementById("promptTextArea");
        if (promptArea) {
            promptArea.innerText = this.getSystemPrompt();
        }
        this.el.aiPromptModal.style.display = 'flex';
    },

    getSystemPrompt(learningData = null) {
        let statsPrompt = "";
        let examplesPrompt = "";

        if (learningData) {
            const { stats, examples } = learningData;

            // 1. Adaptive Difficulty based on stats
            const successRate = stats.total > 0 ? (stats.correct / stats.total) * 100 : 50;
            if (successRate > 80 && stats.total > 10) {
                statsPrompt = "\nUSER PERFORMANCE: EXCELLENT. Generate challenging 3rd-order reasoning questions (Step 2 CK style) requiring multi-step diagnosis and management. Include subtle distractors.";
                console.log("%c[AI Learning] Performance: EXCELLENT (>80%). Difficulty: 3rd-Order Reasoning (Hard)", "color: #10b981; font-weight: bold;");
            } else if (successRate < 40 && stats.total > 5) {
                statsPrompt = "\nUSER PERFORMANCE: STRUGGLING. Focus on high-yield fundamental concepts and clear clinical presentations to help build core knowledge.";
                console.log("%c[AI Learning] Performance: STRUGGLING (<40%). Difficulty: Fundamentals (Basic)", "color: #f59e0b; font-weight: bold;");
            } else {
                statsPrompt = "\nUSER PERFORMANCE: STEADY. Maintain standard USMLE Step 1/2 difficulty with high-yield clinical vignettes.";
                console.log("%c[AI Learning] Performance: STEADY. Difficulty: Standard", "color: #6366f1; font-weight: bold;");
            }

            // 2. Few-Shot Learning from user's own questions
            if (examples && examples.length > 0) {
                console.log(`%c[AI Learning] Style Mimicry: Loaded ${examples.length} your saved questions as examples.`, "color: #6366f1;");
                examplesPrompt = "\nGOLD STANDARD EXAMPLES (Follow this user's specific medical focus and writing style):\n\n";
                examples.forEach(ex => {
                    examplesPrompt += `Question title: ${ex.title || "Untitled"}\n`;
                    examplesPrompt += `Question context: ${ex.text || ""}\n`;
                    examplesPrompt += `Question options:\n`;
                    (ex.options || []).forEach((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        examplesPrompt += `${opt.isCorrect ? '*' : ''}(${letter}) ${opt.text}\n`;
                    });
                    examplesPrompt += `Question explanation:\n${ex.explanation || ""}\n\n`;
                });
            }
        }

        return `You are an MCQ generator for a medical education app. Output ONLY questions in the exact template format shown below. Do not add commentary, headings, explanations outside the template, or extra text. Do not use markdown. Do not number questions unless instructed. Follow the structure exactly and keep spacing identical.

Each question must test high-yield medical knowledge suitable for USMLE Step 1 or Step 2 CK level. Focus on mechanism, pathophysiology, diagnosis, and management. Avoid trivial recall. Use realistic clinical vignettes.
${statsPrompt}

CRITICAL REQUIREMENTS:
1. The "Question context" field MUST end with a clear question (lead-in question). NEVER end it with a period.
2. You MUST mark the correct answer with an asterisk (*) placed IMMEDIATELY BEFORE the option label (e.g., *(B) or *(C)). DO NOT FORGET THE ASTERISK.
${examplesPrompt}

Formatting rules are strict:
Use exactly these field labels: Question title, Question context, Question options, Question explanation.
The "Question context" MUST contain the clinical vignette AND the lead-in question.
Provide exactly four options labeled (A), (B), (C), (D).
Mark ONLY ONE correct answer with an asterisk like *(B).
Randomize which letter is correct.
The explanation must justify why the correct option is correct and briefly explain why the others are wrong.
No extra blank lines inside a question.
Separate multiple questions with one blank line only.

Template to follow exactly:
Question title: <brief title>
Question context: <clinical vignette ending with a ? lead-in question>
Question options:
(A) <option>
(B) <option>
(C) <option>
(D) <option>
Question explanation:
<explanation>

Example of correct formatting (Use this as the fallback formatting guide):

Question title: Epigastric Pain
Question context: A 45-year-old man presents with burning epigastric pain that is relieved by meals. He has been taking ibuprofen for chronic back pain. Which of the following is the most likely diagnosis?
Question options:
(A) Acute pancreatitis
(B) Cholecystitis
*(C) Duodenal ulcer
(D) GERD
Question explanation:
Duodenal ulcers often present with pain that improves with food, whereas gastric ulcers worsen with food. Ibuprofen (NSAID) use is a major risk factor. Option (A) presents with radiating back pain. Option (B) has RUQ pain. Option (D) has retrosternal burning.`;
    },

    showAiHint() {
        console.log("[QuestionBase] AI Mode Active: Follow the template to generate high-yield medical MCQs.");
    },

    async fillWithAI() {
        if (!this.state.aiMode) return;

        const text = this.el.sessionInput.innerText;
        // Check if user actually provided some input
        const hasContent = text.replace(/Question (title|context|options|explanation):/g, "").trim().length > 5;

        if (!hasContent) {
            alert("Please provide at least a title or some context for the AI to generate the question.");
            return;
        }

        // Show loading state
        if (this.el.toggleAiModeBtn) this.el.toggleAiModeBtn.classList.add('loading');
        const overlay = document.getElementById('aiLoadingOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            // Update loading text to show model
            const loadingText = overlay.querySelector('.ai-loading-text');
            const selectedModel = this.el.aiModelSelector ? this.el.aiModelSelector.value : null;
            const modelName = selectedModel ? selectedModel.split('/')[1].split(':')[0] : 'AI';
            if (loadingText) {
                loadingText.textContent = `${modelName} is thinking...`;
            }
        }

        try {
            // NEW: Fetch Learning Data (Stats + Examples)
            let learningData = null;
            try {
                const data = await window.fileSystemService.makeRequest('/ai/learning-data');
                if (data) {
                    learningData = data;
                    console.log("[AI Learning] Data retrieved successfully:", learningData);
                }
            } catch (e) { console.warn("Failed to fetch learning data, proceeding with defaults."); }

            const systemPrompt = this.getSystemPrompt(learningData);

            // Build tag context from Subject / System / Major / Minor state
            const tagParts = [];
            if (this.state.selectedTagSubjects.length) tagParts.push(`Subject: ${this.state.selectedTagSubjects.join(', ')}`);
            if (this.state.selectedTagSystems.length)  tagParts.push(`System: ${this.state.selectedTagSystems.join(', ')}`);
            if (this.state.selectedTagMajors.length)   tagParts.push(`Major: ${this.state.selectedTagMajors.join(', ')}`);
            if (this.state.selectedTagMinors.length)   tagParts.push(`Minor: ${this.state.selectedTagMinors.join(', ')}`);
            const tagsContext = tagParts.length > 0
                ? `[TOPIC CONTEXT]\n${tagParts.join('\n')}\n\n`
                : '';

            // Include uploaded media content if available
            let userPrompt = '';
            if (this.state.uploadedMediaContent) {
                // Truncate content to fit context window
                // 131k context limit - 10k output = 121k for input
                // Conservatively assume dense tokenization (e.g. 1.25 chars/token) -> 121k * 1.25 ~= 150k chars
                const MAX_CHARS = 150000;
                let content = this.state.uploadedMediaContent;

                if (content.length > MAX_CHARS) {
                    console.warn(`[AI] Uploaded content too large (${content.length} chars). Truncating to ${MAX_CHARS} chars to fit context window.`);
                    content = content.substring(0, MAX_CHARS) + "\n\n[CONTENT TRUNCATED TO FIT CONTEXT WINDOW]";
                    // Non-blocking notification via console
                }

                userPrompt = `${tagsContext}Based on this document:\n${content}\n\nFill this frame:\n${text}`;
            } else {
                userPrompt = `${tagsContext}Fill this frame:\n${text}`;
            }

            // Get selected model
            const selectedModel = this.el.aiModelSelector ? this.el.aiModelSelector.value : null;

            try {
                const data = await window.fileSystemService.makeRequest('/ai/chat', {
                    method: 'POST',
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        max_tokens: 10000,
                        model: selectedModel
                    })
                });

                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    this.el.sessionInput.innerText = data.choices[0].message.content;
                    return;
                }
            } catch (error) {
                console.error("[QuestionBase] AI Fill failed:", error);
                throw error;
            }

        } catch (error) {
            console.error("[QuestionBase] AI Fill failed:", error);

            // Try to parse error details
            let errorMessage = "AI generation failed. Please ensure your local server is running on port 3001.";

            try {
                const errorData = await error.json?.() || error;
                if (errorData.details) {
                    const details = typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details);
                    errorMessage = `AI Error (${errorData.model || 'unknown model'}): ${details}`;
                }
                if (errorData.errorType === 'ECONNABORTED') {
                    errorMessage = `Model timeout: ${errorData.model || 'selected model'} took too long to respond. Try a faster model like Trinity or Step 3.5 Flash.`;
                }
            } catch (e) {
                // Use default message
            }

            alert(errorMessage);
        } finally {
            if (this.el.toggleAiModeBtn) this.el.toggleAiModeBtn.classList.remove('loading');
            if (overlay) overlay.classList.add('hidden');
        }
    },

    uploadMedia() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.txt,.md';
        fileInput.style.display = 'none';

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                // Clean up if no file selected
                if (fileInput.parentNode) {
                    document.body.removeChild(fileInput);
                }
                return;
            }

            // Show loading state on upload button
            if (this.el.uploadMediaBtn) {
                this.el.uploadMediaBtn.classList.add('loading');
                this.el.uploadMediaBtn.disabled = true;
            }
            try {
                let content = '';

                // Read based on file type
                if (file.name.endsWith('.pdf')) {
                    // PDF Processing using pdf.js
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
                        const pdf = await loadingTask.promise;

                        // Show progress if many pages
                        if (this.el.uploadMediaBtn) {
                            this.el.uploadMediaBtn.innerHTML = `Scanning ${pdf.numPages} pages...`;
                        }

                        let fullText = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            fullText += `[Page ${i}]\n${pageText}\n\n`;
                        }

                        content = `[PDF Content from ${file.name}]\n${fullText}`;
                        console.log(`PDF "${file.name}" loaded successfully. Extracted ${fullText.length} characters from ${pdf.numPages} pages.`);

                    } catch (error) {
                        console.error("PDF reading failed:", error);
                        throw new Error("Failed to read PDF. ensuring it's not password protected/corrupted.");
                    }
                } else {
                    // Text/Markdown Processing
                    content = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (e) => reject(new Error("File read error"));
                        reader.readAsText(file);
                    });
                    console.log(`File "${file.name}" loaded successfully.`);
                }

                // Update State
                this.state.uploadedMediaContent = content;

                // Update UI - Success State
                if (this.el.uploadedFileStatus && this.el.uploadedFileName) {
                    this.el.uploadedFileName.textContent = file.name;
                    this.el.uploadedFileStatus.style.display = 'flex';
                }

                if (this.el.uploadMediaBtn) {
                    this.el.uploadMediaBtn.style.background = 'var(--success)';
                    this.el.uploadMediaBtn.style.color = 'white';
                    this.el.uploadMediaBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Media Loaded
                    `;

                    // Reset button after 3 seconds
                    setTimeout(() => {
                        if (this.el.uploadMediaBtn) {
                            this.el.uploadMediaBtn.style.background = '';
                            this.el.uploadMediaBtn.style.color = '';
                            this.el.uploadMediaBtn.innerHTML = `
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="12" y1="18" x2="12" y2="12"></line>
                                  <line x1="9" y1="15" x2="15" y2="15"></line>
                                </svg>
                                Add Media
                            `;
                        }
                    }, 3000);
                }

                // Refocus on session input
                if (this.el.sessionInput) {
                    this.el.sessionInput.contentEditable = 'true';
                    this.el.sessionInput.focus();
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(this.el.sessionInput);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }

            } catch (error) {
                console.error('[QuestionBase] Media upload failed:', error);
                alert(error.message || 'Failed to upload media. Please try again.');
                this.state.uploadedMediaContent = null;
            } finally {
                // Remove loading state
                if (this.el.uploadMediaBtn) {
                    this.el.uploadMediaBtn.classList.remove('loading');
                    this.el.uploadMediaBtn.disabled = false;
                }
                // Clean up file input
                if (fileInput.parentNode) {
                    document.body.removeChild(fileInput);
                }
            }
        };

        // Trigger file selection
        document.body.appendChild(fileInput);
        fileInput.click();
    },

    // ... existing methods ...
};

window.QuestionBase = QuestionBase;
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("questionBase")) {
        QuestionBase.init();
        // Auto-open moved to app.js after settings are loaded
    }
});
