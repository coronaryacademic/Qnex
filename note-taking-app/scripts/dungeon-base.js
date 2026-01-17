export default class DungeonBase {
  constructor() {
    this.el = {};
    this.state = {
      questions: [],
      currentIndex: 0,
      answers: new Map(), // id -> { isCorrect: boolean, selectedId: string, submitted: boolean }
      selectedOption: null // Temporary selection before submit
    };
  }

  init() {
    this.el.container = document.getElementById("dungeonBase");
    
    // Inject new structure if needed (since we changed layouts drastically)
    if (this.el.container) {
      if (!this.el.container.querySelector('.dungeon-sidebar')) {
          this.el.container.innerHTML = `
            <div id="dungeonSidebar" class="dungeon-sidebar"></div>
            <div class="dungeon-main">
                <div id="dungeonMainContent" class="dungeon-question-container"></div>
            </div>
            <div class="dungeon-right-panel">
                <div class="dungeon-toolbar">
                    <div class="dungeon-tool-btn" title="Highlight"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg></div>
                    <div class="dungeon-tool-btn" title="Note"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
                    <div class="dungeon-tool-btn" title="Flag"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg></div>
                </div>
                <div class="dungeon-nav-buttons">
                    <button id="dungeonPrevBtn" class="dungeon-nav-btn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                    <button id="dungeonNextBtn" class="dungeon-nav-btn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                </div>
            </div>
            <button id="dungeonCloseBtn" style="position:fixed; top:20px; left:20px; z-index:9999; padding:8px; background:#000; color:#fff; border:1px solid #333; cursor:pointer;" onclick="window.DungeonBase.close()">Exit</button>
          `;
      }
    }

    this.el.sidebar = document.getElementById("dungeonSidebar");
    this.el.main = document.getElementById("dungeonMainContent");
    this.el.prevBtn = document.getElementById("dungeonPrevBtn");
    this.el.nextBtn = document.getElementById("dungeonNextBtn");

    if (!this.el.container) {
      console.error("DungeonBase container not found in DOM");
      return;
    }

    this.bindEvents();
  }

  bindEvents() {
    if (this.el.prevBtn) this.el.prevBtn.onclick = () => this.navPrev();
    if (this.el.nextBtn) this.el.nextBtn.onclick = () => this.navNext();
    
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
  }

  render() {
    // 1. Sidebar
    this.renderSidebar();
    
    // 2. Main Question
    this.renderQuestion();

    // 3. Nav Buttons State
    if (this.el.prevBtn) this.el.prevBtn.style.opacity = this.state.currentIndex === 0 ? "0.3" : "1";
    if (this.el.nextBtn) this.el.nextBtn.style.opacity = this.state.currentIndex === this.state.questions.length - 1 ? "0.3" : "1";
  }

  renderSidebar() {
    this.el.sidebar.innerHTML = "";
    
    this.state.questions.forEach((q, index) => {
      const box = document.createElement("div");
      box.className = "dungeon-q-box";
      
      if (index === this.state.currentIndex) {
        box.classList.add("active");
      }

      // Check Status
      const answer = this.state.answers.get(q.id);
      let content = ".";
      if (answer && answer.submitted) {
          if (answer.isCorrect) {
              box.classList.add("correct");
              content = "✓";
          } else {
              box.classList.add("wrong");
              content = "x";
          }
      }

      box.innerHTML = `<span class="dungeon-box-status">${content}</span>`;
      
      box.onclick = () => {
        this.saveCurrentSelection(); // If they selected something but didn't submit, save it? Or discard? Let's just switch.
        this.state.currentIndex = index;
        this.state.selectedOption = null; // Reset temp selection on switch
        // Restore temp selection if we want persistence of drafts? simpler to reset.
        this.render();
      };
      
      this.el.sidebar.appendChild(box);
    });
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
      <div class="dungeon-question-header">${q.title || "Untitled Question"}</div>
      
      <!-- Context Box (Image/Code) - Placeholder if empty -->
      <div class="dungeon-context-box">
          <div style="text-align:center; padding: 20px;">
             ${q.text || "No question details."}
          </div>
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
            if (opt.id === submittedSel) {
                 classes += " selected"; // Visual selected
                 if (answer.isCorrect) classes += " correct-answer";
                 else classes += " wrong-answer";
            }
            if (opt.isCorrect && !answer.isCorrect) {
                 classes += " correct-answer"; // Show missed correct answer
            }
        } else {
            // Interactive state
            if (opt.id === currentSel) classes += " selected";
        }

        html += `
          <div class="${classes}" onclick="window.DungeonBase.handleSelectOption('${opt.id}')">
              <div class="dungeon-radio-circle"></div>
              <div class="dungeon-radio-text">${opt.text || "Option"}</div>
          </div>
        `;
    });

    html += `</div>`; // End options

    // Submit Button (Show if not submitted)
    if (!isSubmitted) {
        html += `<button class="dungeon-submit-btn" onclick="window.DungeonBase.handleSubmit()">Submit</button>`;
    } else {
        // Explanation
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

      const selectedOpt = q.options.find(o => o.id === this.state.selectedOption);
      const isCorrect = selectedOpt && selectedOpt.isCorrect;

      this.state.answers.set(q.id, {
          submitted: true,
          selectedId: this.state.selectedOption,
          isCorrect: isCorrect
      });

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
