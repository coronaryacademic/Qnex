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
                  <div class="dungeon-scroll-wrapper">
                      <div id="dungeonMainContent" class="dungeon-question-container"></div>
                  </div>
              </div>
              <button id="dungeonCloseBtn" title="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
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

    this.bindEvents();
  }

  initToolbar() {
      const toolbar = document.getElementById("dungeonToolbar");
      if (!toolbar) return;

      // Add tooltip for interaction hints
      toolbar.title = "Drag to move, Double-click to rotate";

      // 1. Initial Position (Restored or Centered)
      const restoreOrCenterToolbar = () => {
          const savedPos = localStorage.getItem("dungeonToolbarPos");
          if (savedPos) {
              try {
                  const pos = JSON.parse(savedPos);
                  toolbar.style.left = pos.left;
                  toolbar.style.top = pos.top;
                  if (pos.vertical) toolbar.classList.add('vertical');
                  return;
              } catch(e) {}
          }

          // Fallback to center
          const w = window.innerWidth;
          const tw = toolbar.offsetWidth || 300; 
          toolbar.style.left = (w / 2 - tw / 2) + "px";
          toolbar.style.top = "40px";
      };
      setTimeout(restoreOrCenterToolbar, 0);

      // 2. Drag Logic
      let isDragging = false;
      let startX, startY, startLeft, startTop;

      const onMouseDown = (e) => {
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

      // 3. Rotation Logic
      toolbar.addEventListener('dblclick', (e) => {
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
      // Optimistically dispatch event
      const event = new CustomEvent('dungeon-questions-update', { detail: this.state.questions });
      window.dispatchEvent(event);
      
      // Try generic storage if available
      if (window.electronAPI && window.electronAPI.saveQuestions) {
          window.electronAPI.saveQuestions(JSON.parse(JSON.stringify(this.state.questions))); // Deep copy
      } else {
          // console.log("Backend save not integrated. Changes are in-memory.");
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
          this.saveQuestionsToBackend();
      }
  }

  clearHighlights() {
      const q = this.state.questions[this.state.currentIndex];
      if (!q) return;
      
      if (confirm("Clear all highlights from this question?")) {
          // Remove all highlight spans from the text
          if (q.text) {
              q.text = q.text.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');
              this.renderQuestion(); // Re-render to show changes
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
