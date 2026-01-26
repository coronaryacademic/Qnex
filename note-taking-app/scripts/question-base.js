

// Question Layer Module
console.log('[QuestionBase] Script loaded!');
const QuestionBase = {
    state: {
        questions: [],
        folders: [],
        activeQuestionId: null,
        activeContext: null, // Track where selection happened (e.g. 'All Questions', 'folder-123')
        expandedFolders: new Set(), // Set of folder IDs
        selectedItems: new Set(), // Set of selected question IDs for multi-select
        collapsedSections: new Set(), // Set of collapsed section names
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
        this.loadData();

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
        document.addEventListener("click", (e) => {
            if (this.el.ctxMenu && !this.el.ctxMenu.contains(e.target)) {
                this.hideContextMenu();
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
            // Add tooltip about shift-click
            this.el.newBtn.title = "New Question (Shift+Click for New Folder)";
        }

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
        if (this.el.sidebar) {
            this.el.sidebar.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent main app context menu

                const item = e.target.closest(".question-item, .q-folder-header");
                const targetId = item ? item.dataset.id : null;

                // Check if clicking specific item type
                let type = 'empty';
                if (item) {
                    if (item.classList.contains("q-folder-header")) type = 'folder';
                    else type = 'question';
                }

                this.showContextMenu(e.clientX, e.clientY, targetId, type);
            });
        }

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
                if (this.activeQuestionId) {
                    this.saveCurrentQuestion();
                }
            }

            if (e.key === "Delete" && this.state.selectedItems.size > 0) {
                e.preventDefault();
                this.deleteSelectedItems();
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

    async loadData() {
        console.log('[QuestionBase] loadData() called');
        console.log('[QuestionBase] Storage available?', typeof window.Storage, 'loadQuestions?', typeof window.Storage?.loadQuestions);

        if (typeof window.Storage !== 'undefined' && typeof window.Storage.loadQuestions === 'function') {
            try {
                console.log('[QuestionBase] Loading questions from Storage...');
                const data = await window.Storage.loadQuestions();
                console.log('[QuestionBase] Loaded data:', data);
                if (Array.isArray(data)) {
                    this.state.questions = data;
                    this.state.folders = [];
                } else {
                    this.state.questions = data.questions || [];
                    this.state.folders = data.folders || [];
                }
                console.log('[QuestionBase] Questions loaded:', this.state.questions.length, 'Folders:', this.state.folders.length);
            } catch (e) {
                console.error("[QuestionBase] Failed to load questions from Storage", e);
                this.state.questions = [];
                this.state.folders = [];
            }
        } else {
            console.warn('[QuestionBase] Storage not available yet, using localStorage fallback');
            // Direct localStorage fallback
            try {
                const stored = localStorage.getItem("app-questions");
                if (stored) {
                    const data = JSON.parse(stored);
                    if (Array.isArray(data)) {
                        this.state.questions = data;
                        this.state.folders = [];
                    } else {
                        this.state.questions = data.questions || [];
                        this.state.folders = data.folders || [];
                    }
                    console.log('[QuestionBase] Loaded from localStorage:', this.state.questions.length, 'questions');
                } else {
                    console.log('[QuestionBase] No data in localStorage');
                    this.state.questions = [];
                    this.state.folders = [];
                }
            } catch (e) {
                console.error("[QuestionBase] Failed to load from localStorage", e);
                this.state.questions = [];
                this.state.folders = [];
            }
        }
        console.log('[QuestionBase] Rendering sidebar after load');
        this.renderSidebar();
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

        if (typeof window.Storage !== 'undefined' && window.Storage.saveQuestions) {
            window.Storage.saveQuestions(data);
        } else {
            localStorage.setItem("app-questions", JSON.stringify(data));
        }
        this.renderSidebar();
    },

    open() {
        this.el.base.classList.remove("hidden");
        // Update Floating Button to "Back to Notes"
        if (this.el.floatBtn) {
            this.el.floatBtn.style.zIndex = "2000"; // Ensure on top of question layer
            this.el.floatBtn.title = "Back to Notes";
            this.el.floatBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;
        }

        // Sync FROM main sidebar
        const mainSidebar = document.getElementById("sidebar");
        // const mainToggle = document.getElementById("toggleSidebarBtn"); // Not needed for read
        if (mainSidebar) {
            const mainCollapsed = mainSidebar.classList.contains("collapsed");
            if (mainCollapsed) {
                this.el.sidebar.classList.add("collapsed");
            } else {
                this.el.sidebar.classList.remove("collapsed");
            }
        }
    },

    close() {
        this.el.base.classList.add("hidden");
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

    createNewQuestion(folderId = null) {
        const newQ = {
            id: Date.now().toString(),
            title: "",
            text: "",
            options: [],
            folderId: folderId,
            createdAt: new Date().toISOString(),
            starred: false
        };
        this.state.questions.push(newQ);
        this.activeQuestionId = newQ.id;
        this.saveData(); // Save initially to persist ID
        this.renderSidebar();
        this.loadQuestionIntoEditor(newQ);
    },



    closeQuestion() {
        this.activeQuestionId = null;
        this.el.editor.classList.add("hidden");
        this.el.emptyState.style.display = "flex";

        // Reset Header
        this.el.titleInput.value = "";
        this.el.titleInput.disabled = true;
        this.el.titleInput.placeholder = "Select a question or create new";
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
            const id = item.dataset.oid || (Date.now() + Math.random());
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

        if (this.el.titleInput) {
             this.el.titleInput.disabled = false; // Enable title input
             this.el.titleInput.placeholder = "Question Title"; // Reset placeholder
             this.el.titleInput.value = q.title || ""; // Ensure value is set (handle null/undefined)
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

        // 1. All Questions (Uncategorized)
        const uncategorized = this.state.questions.filter(q => !q.folderId && !q.starred);
        this.renderSection("All Questions", uncategorized, "list", "No questions");

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

        header.onclick = (e) => {
            e.stopPropagation();
            if (isExpanded) {
                this.state.expandedFolders.delete(folder.id);
            } else {
                this.state.expandedFolders.add(folder.id);
            }
            this.saveExpandedFolders();
            this.renderSidebar();
        };

        // Context Menu
        header.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent bubbling to sidebar container

            // Visual Highlight
            document.querySelectorAll(".question-item.context-active, .q-folder-header.context-active").forEach(el => el.classList.remove("context-active"));
            header.classList.add("context-active");

            this.showContextMenu(e.clientX, e.clientY, folder.id, 'folder');
        });

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

        // Context Menu
        el.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Right click always selects the item (single select)
            this.state.selectedItems.clear();
            this.state.selectedItems.add(q.id);
            
            // Manual Visual Update (Avoid re-rendering which kills 'el')
            // 1. Remove 'selected' and 'context-active' from all items
            container.querySelectorAll(".question-item").forEach(item => {
                item.classList.remove("selected", "context-active");
            });
            
            // 2. Add classes to current element
            el.classList.add("selected", "context-active");

            // Show menu
            this.showContextMenu(e.clientX, e.clientY, q.id, 'question', context);
        });

        // Simple Click Handler (No Multi-select)
        el.onclick = (e) => {
            // Single click - clear selection and open
            this.state.selectedItems.clear();
            this.state.selectedItems.add(q.id); 
            this.state.activeContext = context;
            this.loadQuestionIntoEditor(q);
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
        this.el.ctxMenu.classList.remove("hidden");
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
            console.log("Refreshing Question Data...");
            return this.loadData();
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
                    } catch (e) { }

                    this.state.questions = this.state.questions.filter(q => q.folderId !== id);
                    this.state.folders.splice(fIndex, 1);
                    this.saveData();
                    if (typeof window.updateTrashButton === "function") window.updateTrashButton();
                };

                if (typeof window.TwoBase?.showDeleteConfirmation === "function") {
                    window.TwoBase.showDeleteConfirmation(count, deleteFolder);
                } else {
                    if (confirm(`Delete folder "${folder.title}" and its questions?`)) await deleteFolder();
                }
            } else if (action === 'rename') {
                const newTitle = prompt("Rename folder:", folder.title);
                if (newTitle) {
                    folder.title = newTitle;
                    this.saveData();
                }
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
    }
};


// Auto-initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    QuestionBase.init();
});

// Make QuestionBase available globally
window.QuestionBase = QuestionBase;
