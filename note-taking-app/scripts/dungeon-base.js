export default class DungeonBase {
  constructor() {
    this.el = {};
    this.state = {
      questions: [],
      currentIndex: 0,
      answers: new Map() // id -> { isCorrect: boolean, selectedId: string }
    };
  }

  init() {
    this.el.container = document.getElementById("dungeonBase");
    this.el.strip = document.getElementById("dungeonStrip");
    this.el.card = document.getElementById("dungeonCard");
    this.el.closeBtn = document.getElementById("dungeonCloseBtn");

    if (!this.el.container) {
      console.error("DungeonBase container not found in DOM");
      return;
    }

    this.bindEvents();
  }

  bindEvents() {
    if (this.el.closeBtn) {
      this.el.closeBtn.onclick = () => this.close();
    }
    
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
    
    this.el.container.classList.remove("hidden");
    this.render();
  }

  close() {
    this.el.container.classList.add("hidden");
  }

  render() {
    this.renderStrip();
    this.renderQuestion();
  }

  renderStrip() {
    this.el.strip.innerHTML = "";
    
    this.state.questions.forEach((q, index) => {
      const segment = document.createElement("div");
      segment.className = "dungeon-segment";
      
      // Active State (Bulging)
      if (index === this.state.currentIndex) {
        segment.classList.add("active");
      }

      // Solved State
      const answer = this.state.answers.get(q.id);
      let bulletContent = "";
      
      if (answer) {
        if (answer.isCorrect) {
          segment.classList.add("correct");
          bulletContent = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else {
          segment.classList.add("wrong");
          bulletContent = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        }
      }

      segment.innerHTML = `<div class="dungeon-bullet">${bulletContent}</div>`;
      
      // Click to jump
      segment.onclick = () => {
        this.state.currentIndex = index;
        this.render();
      };
      
      this.el.strip.appendChild(segment);
    });
  }

  renderQuestion() {
    const q = this.state.questions[this.state.currentIndex];
    const answer = this.state.answers.get(q.id);
    
    let html = `
      <div class="dungeon-question-title">${q.title || "Untitled Question"}</div>
      <div class="dungeon-options">
    `;
    
    const options = q.options || [];
    options.forEach(opt => {
      let className = "dungeon-option";
      // Feedback logic
      if (answer) {
        // If answered, show verification
        if (opt.id === answer.selectedId) {
          className += answer.isCorrect ? " correct" : " wrong";
        } else if (opt.isCorrect && !answer.isCorrect) {
           // Show correct answer if user was wrong
           className += " correct"; // Or maybe "missed-correct"? For now green.
           // Actually, standard is: Highlight chosen (Red/Green). Highlight correct (Green).
           // If user chose Wrong, highlight it Red. And highlight Correct one Green.
        }
      }
      
      html += `
        <div class="dungeon-option ${className}" data-id="${opt.id}" ${answer ? '' : 'onclick="window.DungeonBase.handleAnswer(\'' + opt.id + '\')"'}>
           <!-- Optional check/radio icon -->
           <div class="option-marker" style="width:20px; height:20px; border:2px solid currentColor; border-radius:50%; display:flex; align-items:center; justify-content:center;">
              ${(answer && (opt.id === answer.selectedId || (opt.isCorrect && !answer.isCorrect))) 
                ? (opt.isCorrect ? '<div style="width:10px; height:10px; background:currentColor; border-radius:50%;"></div>' : '<span>×</span>') 
                : ''}
           </div>
           <span>${opt.text || "Option"}</span>
        </div>
      `;
    });
    
    html += `</div>`; // Close options
    
    // Explanation if answered
    if (answer && q.explanation) {
       html += `
         <div style="margin-top: 20px; padding: 15px; background: var(--bg); border-radius: 8px; border-left: 4px solid var(--accent);">
            <strong>Explanation:</strong> ${q.explanation}
         </div>
       `;
    }

    this.el.card.innerHTML = html;
    
    // Re-bind clicks if needed (using global handler for simplicity in template string above is risky with modules, better addEventListener)
    // I'll use querySelectorAll to bind clicks to avoid global scope issues.
    this.el.card.querySelectorAll(".dungeon-option").forEach(el => {
       if (!answer) {
         el.onclick = () => this.handleAnswer(el.dataset.id);
       }
    });
  }

  handleAnswer(optionId) {
    const q = this.state.questions[this.state.currentIndex];
    
    // Check correctness
    const selectedOpt = q.options.find(o => o.id === optionId);
    const isCorrect = selectedOpt && selectedOpt.isCorrect;
    
    // Save state
    this.state.answers.set(q.id, {
      isCorrect,
      selectedId: optionId
    });
    
    // Re-render
    this.render();
    
    // Auto-advance? Maybe wait a second?
    // User didn't request auto-advance, so stay.
  }

  navNext() {
    if (this.state.currentIndex < this.state.questions.length - 1) {
      this.state.currentIndex++;
      this.render();
    }
  }

  navPrev() {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
      this.render();
    }
  }
}
