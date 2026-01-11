
// Question Layer Module
// Question Layer Module
const QuestionBase = {
  state: {
    questions: [],
    folders: [],
    activeQuestionId: null,
    expandedFolders: new Set(), // Set of folder IDs
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
    this.cacheElements();
    this.bindEvents();
    this.initResizer();
    this.loadData();
    this.loadSidebarWidth();
    
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
    this.el.saveBtn = document.getElementById("saveQuestionBtn");
    this.el.newBtn = document.getElementById("questionActionBtn");
    this.el.backBtn = document.getElementById("backToMainFromQuestions");
    this.el.openBtn = document.getElementById("openQuestionsBtn");
    this.el.floatBtn = document.getElementById("openQuestionsFloatBtn");
    this.el.resizer = document.getElementById("questionSidebarResizer");
    this.el.searchInput = document.getElementById("questionSearchInput");
    this.el.clearSearchBtn = document.getElementById("clearQuestionSearch");

    // create context menu element
    this.createContextMenu();
  },

  createContextMenu() {
    const menu = document.createElement("div");
    menu.className = "q-ctx-menu hidden";
    menu.innerHTML = `
      <div class="q-ctx-item" data-action="rename">Rename</div>
      <div class="q-ctx-item" data-action="star">Star / Unstar</div>
      <div class="q-ctx-divider"></div>
      <div class="q-ctx-item delete" data-action="delete">Delete</div>
    `;
    document.body.appendChild(menu);
    this.el.ctxMenu = menu;
    
    // Bind context menu clicks
    menu.addEventListener("click", (e) => {
        const item = e.target.closest(".q-ctx-item");
        if (!item) return;
        const action = item.dataset.action;
        const targetId = this.el.ctxMenu.dataset.targetId;
         const type = this.el.ctxMenu.dataset.targetType; // 'question' or 'folder'
        this.handleContextAction(action, targetId, type);
        this.hideContextMenu();
    });
  },

  bindEvents() {
    // Navigation
    if (this.el.openBtn) this.el.openBtn.addEventListener("click", () => this.open());
    if (this.el.floatBtn) this.el.floatBtn.addEventListener("click", () => this.open());
    if (this.el.backBtn) this.el.backBtn.addEventListener("click", () => this.close());

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
    if (this.el.addOptionBtn) this.el.addOptionBtn.addEventListener("click", () => this.addOptionUI());

    // Search
    if (this.el.searchInput) this.el.searchInput.addEventListener("input", () => this.renderSidebar());
    if (this.el.clearSearchBtn) {
      this.el.clearSearchBtn.addEventListener("click", () => {
        this.el.searchInput.value = "";
        this.renderSidebar();
      });
    }
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

  async loadData() {
    // Wait for App Storage to be ready
    if (typeof window.Storage === 'undefined') {
        let attempts = 0;
        while(typeof window.Storage === 'undefined' && attempts < 20) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
    }

    if (typeof window.Storage !== 'undefined' && window.Storage.loadQuestions) {
        try {
            const data = await window.Storage.loadQuestions();
            if (Array.isArray(data)) {
                // Legacy format
                this.state.questions = data;
                this.state.folders = [];
            } else {
                this.state.questions = data.questions || [];
                this.state.folders = data.folders || [];
            }
        } catch (e) {
            console.error("Failed to load questions", e);
             this.state.questions = [];
             this.state.folders = [];
        }
    } else {
         this.loadQuestionsLegacy(); // Fallback
    }
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
    if (this.state.questions.length === 0 && this.state.folders.length === 0) {
        this.createNewQuestion();
    }
  },

  close() {
    this.el.base.classList.add("hidden");
  },

  createNewFolder() {
      const name = prompt("Folder Name:");
      if (!name) return;
      const newFolder = {
          id: "fq-" + Date.now(),
          title: name,
          parentId: null // top level for now
      };
      this.state.folders.push(newFolder);
      this.saveData();
  },
  
  createNewQuestion(folderId = null) {
    const newQ = {
      id: "q-" + Date.now(),
      title: "New Question",
      text: "",
      options: [
        { id: 1, text: "Option A", isCorrect: false },
        { id: 2, text: "Option B", isCorrect: false }
      ],
      explanation: "",
      folderId: folderId,
      starred: false,
      updatedAt: new Date().toISOString()
    };
    
    this.state.questions.unshift(newQ);
    this.activeQuestionId = newQ.id;
    this.saveData();
    this.loadQuestionIntoEditor(newQ);
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
    
    const originalText = this.el.saveBtn.textContent;
    this.el.saveBtn.textContent = "Saved!";
    setTimeout(() => this.el.saveBtn.textContent = originalText, 1500);
  },

  loadQuestionIntoEditor(q) {
    this.activeQuestionId = q.id;
    this.el.emptyState.style.display = "none";
    this.el.editor.classList.remove("hidden");

    this.el.titleInput.value = q.title;
    this.el.textInput.innerHTML = q.text || "";
    this.el.explanationInput.value = q.explanation || "";

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

    // 1. Render Starred Section (if any starred and matching)
    const starred = this.state.questions.filter(q => q.starred && matches(q));
    if (starred.length > 0) {
        this.renderSection("Starred", starred, "star");
    }

    // 2. Render Folders
    if (!query) { // Only show folders if not searching (or show folders that match? Simplest is flatten on search)
         this.state.folders.forEach(folder => {
             const folderQs = this.state.questions.filter(q => q.folderId === folder.id);
             this.renderFolder(folder, folderQs);
         });
    }

    // 3. Render Uncategorized/All
    let others = [];
    if (query) {
        // Flattened view for search
        others = this.state.questions.filter(q => matches(q));
         // Logic: if search is active, show ALL matches in one list? 
         // Or keep sections? Users usually prefer flattened list on search.
         this.state.questions.forEach(q => {
             if (matches(q)) {
                 this.renderQuestionItem(q, this.el.list);
             }
         });
         
         if (this.el.list.children.length === 0) {
             this.el.list.innerHTML = '<div class="sidebar-empty-state">No matching questions</div>';
         }
         return;
    } else {
        // Uncategorized
        others = this.state.questions.filter(q => !q.folderId);
        if (others.length > 0) {
            // Label "All Questions" or just list them? 
            // If we have folders, maybe separate "Uncategorized" header?
            if (this.state.folders.length > 0) {
                const header = document.createElement("div");
                header.className = "q-sidebar-header";
                header.textContent = "Uncategorized";
                this.el.list.appendChild(header);
            }
            others.forEach(q => this.renderQuestionItem(q, this.el.list));
        }
    }

    if (this.state.questions.length === 0) {
        this.el.list.innerHTML = '<div class="sidebar-empty-state">No questions yet</div>';
    }
  },

  renderSection(title, questions, iconType) {
      const section = document.createElement("div");
      section.className = "q-section";
      section.innerHTML = `<div class="q-section-header">${title}</div>`;
      questions.forEach(q => this.renderQuestionItem(q, section));
      this.el.list.appendChild(section);
  },

  renderFolder(folder, questions) {
      const isExpanded = this.state.expandedFolders.has(folder.id);
      const folderEl = document.createElement("div");
      folderEl.className = "q-folder";
      folderEl.innerHTML = `
        <div class="q-folder-header" data-id="${folder.id}">
            <svg class="folder-chevron ${isExpanded ? 'open' : ''}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
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
      
      // Toggle
      header.addEventListener("click", (e) => {
          if (this.state.expandedFolders.has(folder.id)) {
              this.state.expandedFolders.delete(folder.id);
              content.classList.add("hidden");
              header.querySelector(".folder-chevron").classList.remove("open");
          } else {
              this.state.expandedFolders.add(folder.id);
              content.classList.remove("hidden");
              header.querySelector(".folder-chevron").classList.add("open");
          }
      });
      
      // Context Menu for Folder
      header.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.showContextMenu(e.clientX, e.clientY, folder.id, 'folder');
      });

      questions.forEach(q => this.renderQuestionItem(q, content));
      this.el.list.appendChild(folderEl);
  },

  renderQuestionItem(q, container) {
      const el = document.createElement("div");
      el.className = `question-item ${q.id === this.activeQuestionId ? "active" : ""}`;
      el.dataset.id = q.id;
      // Context Menu
      el.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.showContextMenu(e.clientX, e.clientY, q.id, 'question');
      });
      el.onclick = () => this.loadQuestionIntoEditor(q);

      el.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${q.starred ? "gold" : "none"}" stroke="${q.starred ? "gold" : "currentColor"}" stroke-width="2">
          ${q.starred 
             ? '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'
             : '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>'}
        </svg>
        <div class="question-item-title">${q.title || "Untitled"}</div>
      `;
      container.appendChild(el);
  },

  showContextMenu(x, y, id, type) {
      this.el.ctxMenu.style.top = `${y}px`;
      this.el.ctxMenu.style.left = `${x}px`;
      this.el.ctxMenu.classList.remove("hidden");
      this.el.ctxMenu.dataset.targetId = id;
      this.el.ctxMenu.dataset.targetType = type;
      
      // Update menu items based on type
      const starBtn = this.el.ctxMenu.querySelector('[data-action="star"]');
      if (type === 'folder') {
          starBtn.style.display = 'none';
      } else {
          starBtn.style.display = 'block';
      }
  },

  hideContextMenu() {
      if (this.el.ctxMenu) this.el.ctxMenu.classList.add("hidden");
  },

  async handleContextAction(action, id, type) {
      if (type === 'question') {
          const qIndex = this.state.questions.findIndex(q => q.id === id);
          if (qIndex === -1) return;
          const q = this.state.questions[qIndex];

          if (action === 'delete') {
              if (confirm("Delete this question?")) {
                  // Sync to trash logic
                  const trashItem = { ...q, type: 'question', deletedAt: new Date().toISOString() };
                  try {
                    const trash = await window.Storage.loadTrash();
                    trash.push(trashItem);
                    await window.Storage.saveTrash(trash);
                  } catch(e) { console.warn("Failed to sync to trash", e); } // proceed anyway

                  this.state.questions.splice(qIndex, 1);
                  if (this.activeQuestionId === id) {
                      this.activeQuestionId = null;
                      this.el.editor.classList.add("hidden");
                      this.el.emptyState.style.display = "flex";
                  }
                  this.saveData();
              }
          } else if (action === 'rename') {
              const newTitle = prompt("Rename question:", q.title);
              if (newTitle) {
                  q.title = newTitle;
                  this.saveData();
              }
          } else if (action === 'star') {
              q.starred = !q.starred;
              this.saveData();
          }
      } else if (type === 'folder') {
          const fIndex = this.state.folders.findIndex(f => f.id === id);
          if (fIndex === -1) return;
          const folder = this.state.folders[fIndex];
          
          if (action === 'delete') {
               if (confirm(`Delete folder "${folder.title}" and its questions?`)) {
                   // Delete folder and questions inside? Or move questions to root?
                   // Standard behavior: delete contents or ask. Let's delete contents for now to be simple but synced.
                   const questionsInFolder = this.state.questions.filter(q => q.folderId === id);
                   
                   // Move to trash
                    try {
                        const trash = await window.Storage.loadTrash();
                        questionsInFolder.forEach(q => {
                            trash.push({ ...q, type: 'question', deletedAt: new Date().toISOString() });
                        });
                        // Also optional: archive folder itself?
                        await window.Storage.saveTrash(trash);
                    } catch(e) {}

                   // Remove from state
                   this.state.questions = this.state.questions.filter(q => q.folderId !== id);
                   this.state.folders.splice(fIndex, 1);
                   this.saveData();
               }
          } else if (action === 'rename') {
              const newTitle = prompt("Rename folder:", folder.title);
              if (newTitle) {
                  folder.title = newTitle;
                  this.saveData();
              }
          }
      }
  }
};


// Auto-initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    QuestionBase.init();
});

export default QuestionBase;
