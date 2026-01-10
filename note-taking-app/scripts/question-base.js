
// Question Layer Module
const QuestionBase = {
  state: {
    questions: [],
    activeQuestionId: null,
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
    openBtn: null, // The button in main sidebar
    floatBtn: null,
    resizer: null,
    searchInput: null,
    clearSearchBtn: null,
  },

  init() {
    console.log("Initializing Question Base...");
    this.cacheElements();
    this.bindEvents();
    this.initResizer();
    this.loadQuestions();
    this.loadSidebarWidth();
    this.renderSidebar();
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
  },

  bindEvents() {
    // Navigation
    if (this.el.openBtn) {
      this.el.openBtn.addEventListener("click", () => this.open());
    }
    if (this.el.floatBtn) {
      this.el.floatBtn.addEventListener("click", () => this.open());
    }
    if (this.el.backBtn) {
      this.el.backBtn.addEventListener("click", () => {
         this.close();
      });
    }

    // Question Actions
    if (this.el.newBtn) {
      this.el.newBtn.addEventListener("click", () => this.createNewQuestion());
    }
    if (this.el.saveBtn) {
      this.el.saveBtn.addEventListener("click", () => this.saveCurrentQuestion());
    }
    if (this.el.addOptionBtn) {
      this.el.addOptionBtn.addEventListener("click", () => this.addOptionUI());
    }

    // Search
    if (this.el.searchInput) {
      this.el.searchInput.addEventListener("input", () => this.renderSidebar());
    }
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
      startWidth = parseInt(
        document.defaultView.getComputedStyle(this.el.sidebar).width,
        10
      );
      this.el.sidebar.classList.add("resizing");
      document.body.style.cursor = "col-resize";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const newWidth = startWidth + (e.clientX - startX);
      
      // Update width
      if (newWidth > 230 && newWidth < 600) {
        this.el.sidebar.style.width = `${newWidth}px`;
      }
    });

      document.addEventListener("mouseup", () => {
        if (isResizing) {
          isResizing = false;
          this.el.sidebar.classList.remove("resizing");
          document.body.style.cursor = "default";
          this.saveSidebarWidth();
        }
      });
    },

    loadSidebarWidth() {
      const width = localStorage.getItem("app-question-sidebar-width");
      if (width) {
        this.el.sidebar.style.width = width;
        if (parseInt(width) < 180) {
          this.el.sidebar.classList.add("narrow");
        } else {
          this.el.sidebar.classList.remove("narrow");
        }
      }
    },

    saveSidebarWidth() {
      if (this.el.sidebar) {
        localStorage.setItem("app-question-sidebar-width", this.el.sidebar.style.width);
      }
    },

  loadQuestions() {
    const stored = localStorage.getItem("app-questions");
    if (stored) {
      try {
        this.state.questions = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to load questions", e);
        this.state.questions = [];
      }
    }
  },

  saveQuestions() {
    localStorage.setItem("app-questions", JSON.stringify(this.state.questions));
    this.renderSidebar();
  },

  open() {
    this.el.base.classList.remove("hidden");
    // Ensure 2-base layers might be covered, but this is fixed overlay Z=1000
    if (this.state.questions.length === 0) {
        this.createNewQuestion(); // Auto-create first question if empty
    }
  },

  close() {
    this.el.base.classList.add("hidden");
  },

  createNewQuestion() {
    const newQ = {
      id: "q-" + Date.now(),
      title: "New Question",
      text: "",
      options: [
        { id: 1, text: "Option A", isCorrect: false },
        { id: 2, text: "Option B", isCorrect: false }
      ],
      explanation: "",
      updatedAt: new Date().toISOString()
    };
    
    this.state.questions.unshift(newQ);
    this.activeQuestionId = newQ.id;
    this.saveQuestions(); // saves and renders sidebar
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
      newOptions.push({
        id: Date.now() + Math.random(), // simplistic ID re-gen
        text: input.value,
        isCorrect: radio.checked
      });
    });
    q.options = newOptions;
    q.updatedAt = new Date().toISOString();

    this.saveQuestions(); // Persist and re-render sidebar
    
    // Show simple feedback
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
    (q.options || []).forEach(opt => this.addOptionUI(opt.text, opt.isCorrect));

    // Highlight sidebar item
    const items = this.el.list.querySelectorAll(".question-item");
    items.forEach(i => i.classList.remove("active"));
    const activeItem = this.el.list.querySelector(`[data-id="${q.id}"]`);
    if (activeItem) activeItem.classList.add("active");
  },

  addOptionUI(text = "", isCorrect = false) {
    const div = document.createElement("div");
    div.className = `option-item ${isCorrect ? "correct" : ""}`;
    
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "correct-option"; // Group for this question
    radio.className = "option-radio";
    radio.checked = isCorrect;
    radio.addEventListener("change", () => {
        // Remove 'correct' class from all siblings
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

  renderSidebar() {
    this.el.list.innerHTML = "";
    
    // Filter questions based on search
    const query = this.el.searchInput ? this.el.searchInput.value.toLowerCase().trim() : "";
    const filtered = this.state.questions.filter(q => {
       if (!query) return true;
       return (q.title && q.title.toLowerCase().includes(query)) || 
              (q.text && q.text.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      if (query) {
         this.el.list.innerHTML = '<div class="sidebar-empty-state">No matching questions</div>';
      } else {
         this.el.list.innerHTML = '<div class="sidebar-empty-state">No questions yet</div>';
      }
      return;
    }

    filtered.forEach(q => {
      const el = document.createElement("div");
      el.className = `question-item ${q.id === this.activeQuestionId ? "active" : ""}`;
      el.dataset.id = q.id;
      el.onclick = () => this.loadQuestionIntoEditor(q);

      el.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div class="question-item-title">${q.title || "Untitled"}</div>
      `;
      this.el.list.appendChild(el);
    });
  },
};

// Auto-initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    QuestionBase.init();
});

export default QuestionBase;
