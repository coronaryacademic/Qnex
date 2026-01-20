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
              <div id="dungeonSidebar" class="dungeon-sidebar"></div>
              <div class="dungeon-main">
                  <div id="dungeonMainContent" class="dungeon-question-container"></div>
              </div>
              <button id="dungeonCloseBtn" style="position:fixed; top:20px; left:20px; z-index:9999; padding:8px; background:#000; color:#fff; border:1px solid #333; cursor:pointer;" onclick="window.DungeonBase.close()">Exit</button>
            `;
        }

        // 3. Ensure Toolbar exists
        if (!this.el.container.querySelector('#dungeonToolbar')) {
             const toolbarHTML = `
                <div id="dungeonToolbar" class="dungeon-toolbar vertical">
                    <div class="dungeon-tool-btn" data-tool="highlight" title="Highlight">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="flag" title="Flag">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                    </div>
                    <div class="dungeon-toolbar-divider"></div>
                    <div id="dungeonToolPrev" class="dungeon-tool-btn" title="Previous">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </div>
                    <div id="dungeonToolNext" class="dungeon-tool-btn" title="Next">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
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

    this.bindEvents();
  }

  initToolbar() {
      const toolbar = document.getElementById("dungeonToolbar");
      if (!toolbar) return;

      const snapThreshold = 100; // px distance to edge to trigger snap
      let isDragging = false;
      let startX, startY;
      
      // Load saved state
      try {
        const saved = JSON.parse(localStorage.getItem("dungeonToolbarState"));
        if (saved) {
            this.setToolbarPosition(toolbar, saved);
        } else {
            // Default center-ish
            toolbar.style.top = '100px';
            toolbar.style.right = '100px';
        }
      } catch(e) {}

      // Drag Events
      toolbar.addEventListener('mousedown', (e) => {
          if (e.target.closest('.dungeon-tool-btn')) return;
          isDragging = true;
          // startWidth = toolbar.offsetWidth; // Not needed
          // startHeight = toolbar.offsetHeight; // Not needed
          toolbar.style.cursor = 'grabbing';
          toolbar.style.transition = 'none'; // Disable transition during drag
      });

      window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          e.preventDefault();
          
          // Constrain to window
          const x = e.clientX;
          const y = e.clientY;
          const w = window.innerWidth;
          const h = window.innerHeight;
          const rect = toolbar.getBoundingClientRect();
          const tw = rect.width;
          const th = rect.height;

          let newX = x - 25;
          let newY = y - 25;
          
          // Clamp
          if (newX < 0) newX = 0;
          if (newX + tw > w) newX = w - tw;
          if (newY < 0) newY = 0;
          if (newY + th > h) newY = h - th;

          toolbar.style.left = newX + "px";
          toolbar.style.top = newY + "px";
          toolbar.style.right = 'auto';
          toolbar.style.bottom = 'auto';
      });

      window.addEventListener('mouseup', (e) => {
          if (isDragging) {
              isDragging = false;
              toolbar.style.cursor = 'grab';
              toolbar.style.transition = ''; // Re-enable transition
              
              const x = e.clientX;
              const y = e.clientY;
              const w = window.innerWidth;
              const h = window.innerHeight;
              
              let newState = { orientation: 'vertical', side: 'right', pos: 0.5 }; // default

              // Check proximities
              const distTop = y;
              const distBottom = h - y;
              const distLeft = x;
              const distRight = w - x;
              
              const min = Math.min(distTop, distBottom, distLeft, distRight);
              
              if (min === distTop) {
                  newState = { orientation: 'horizontal', side: 'top', pos: x / w };
              } else if (min === distBottom) {
                  newState = { orientation: 'horizontal', side: 'bottom', pos: x / w };
              } else if (min === distLeft) {
                  newState = { orientation: 'vertical', side: 'left', pos: y / h };
              } else {
                  newState = { orientation: 'vertical', side: 'right', pos: y / h };
              }
              
              this.setToolbarPosition(toolbar, newState);
              localStorage.setItem("dungeonToolbarState", JSON.stringify(newState));
          }
      });

      // Bind Nav Buttons inside Toolbar
      const btnPrev = document.getElementById("dungeonToolPrev");
      const btnNext = document.getElementById("dungeonToolNext");
      if (btnPrev) btnPrev.onclick = () => this.navPrev();
      if (btnNext) btnNext.onclick = () => this.navNext();
      
      // Bind Tools
      const tools = toolbar.querySelectorAll('.dungeon-tool-btn[data-tool]');
      tools.forEach(btn => {
          btn.addEventListener('click', () => {
              btn.classList.toggle('active');
              // Logic for tools here...
          });
      });
  }
  
  setToolbarPosition(el, state) {
      el.classList.remove('vertical', 'horizontal');
      el.classList.add(state.orientation);
      
      el.style.left = ''; el.style.right = ''; el.style.top = ''; el.style.bottom = '';
      el.style.transform = '';
      
      if (state.side === 'top') {
          el.style.top = '10px';
          el.style.left = (state.pos * 100) + '%';
          el.style.transform = 'translateX(-50%)';
      } else if (state.side === 'bottom') {
          el.style.bottom = '10px';
          el.style.left = (state.pos * 100) + '%';
          el.style.transform = 'translateX(-50%)';
      } else if (state.side === 'left') {
          el.style.left = '10px';
          el.style.top = (state.pos * 100) + '%';
          el.style.transform = 'translateY(-50%)';
      } else { // right
          el.style.right = '10px';
          el.style.top = (state.pos * 100) + '%';
          el.style.transform = 'translateY(-50%)';
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
              
              const onMouseMove = (ev) => {
                  const newWidth = startWidth + (ev.clientX - startX);
                  if (newWidth >= 50 && newWidth <= 300) {
                      this.el.sidebar.style.width = newWidth + 'px';
                  }
              };
              
              const onMouseUp = () => {
                  localStorage.setItem("dungeonSidebarWidth", parseInt(this.el.sidebar.style.width)); // Save
                  document.body.style.cursor = ""; // Reset cursor
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
              };
              
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
          });
          
          this.el.sidebar.appendChild(handle);
      }
  }

  bindEvents() {
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

  renderSidebar() {
    // Preserve Resizer Handle
    const handle = this.el.sidebar.querySelector('.dungeon-resizer-handle');
    
    this.el.sidebar.innerHTML = "";
    
    // Re-append handle if it existed
    if (handle) this.el.sidebar.appendChild(handle);
    else this.initResizer(); // Fallback if handle wasn't there

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
      <!-- Context Box (Image/Code) -->
      <div class="dungeon-context-box">
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

    // Actions Row (Submit only now)
    html += `<div class="dungeon-actions-row" style="justify-content: center;">`;

    if (!isSubmitted) {
        html += `<button class="dungeon-submit-btn" onclick="window.DungeonBase.handleSubmit()">Submit</button>`;
    } else {
        html += `<div style="padding: 10px; color: var(--text-muted);">Answer Submitted</div>`;
    }

    html += `</div>`; // End actions row

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
