/**
 * DungeonNote - Manages individual sticky notes in the Dungeon layer.
 */
class DungeonNote {
    static activeNotes = new Set();

    constructor(dungeon, questionId, initialText = "") {
        this.dungeon = dungeon;
        this.questionId = questionId;
        this.questionIndex = dungeon.state.currentIndex;
        this.question = dungeon.state.questions[this.questionIndex];
        
        // New properties for session-wide scope
        this.isSessionWide = false;
        this.sessionId = dungeon.state.sessionId;
        this.isViewMode = false; // Toggle between Edit (Textarea) and View (Rendered)

        this.el = null;
        this.textarea = null;
        this.previewEl = null;

        this.init(initialText);
        DungeonNote.activeNotes.add(this);
    }

    static destroyAll() {
        console.log(`[DungeonNote] Destroying all (${DungeonNote.activeNotes.size}) active notes.`);
        const notes = Array.from(DungeonNote.activeNotes);
        notes.forEach(note => note.destroy());
    }

    init(initialText) {
        // Stable ID system - link note to the specific question by default
        const noteId = `dungeon_note_${this.questionId}`;
        
        const html = `
            <div id="${noteId}" class="dungeon-note-window" style="left: ${window.innerWidth / 2 - 160}px; top: ${window.innerHeight / 2 - 100}px;">
                <div class="dungeon-note-header">
                    <div class="dungeon-note-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Sticky Note - Q${this.questionIndex + 1}</span>
                    </div>
                    <div class="dungeon-note-actions">
                        <button class="dungeon-note-btn close" title="Close">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="dungeon-note-body">
                    <textarea class="dungeon-note-textarea" placeholder="Write your thoughts here...">${initialText}</textarea>
                    <div class="dungeon-note-preview"></div>
                    <div class="dungeon-note-loading">
                        <div class="dungeon-note-spinner"></div>
                        <span>Loading from disk...</span>
                    </div>
                </div>
                <div class="dungeon-note-toolbar">
                    <div class="dungeon-note-toolbar-left">
                        <button class="dungeon-note-tool link" title="Jump to Question">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </button>
                        <button class="dungeon-note-tool q-insert-link" title="Insert Link to Current Question" style="display: none;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path><line x1="12" y1="12" x2="12" y2="12" stroke-width="4" stroke-linecap="round"></line></svg>
                        </button>
                        <button class="dungeon-note-tool bulb" title="Add Explanation & Reveal">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"></path></svg>
                        </button>
                         <button class="dungeon-note-tool view-toggle" title="Toggle Preview/Edit">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                    <div class="dungeon-note-toolbar-right">
                        <button class="dungeon-note-tool scope-toggle" title="Toggle Session/Question Scope">
                            <svg class="scope-icon-single" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            <svg class="scope-icon-session" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>
                        </button>
                        <button class="dungeon-note-tool save" title="Save to Disk">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        </button>
                    </div>
                </div>
                <div class="dungeon-note-footer">
                    Linked to <span class="dungeon-note-q-link">Question ${this.questionIndex + 1}</span>
                </div>
                <div class="dungeon-note-resizer"></div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.el = document.getElementById(noteId);
        this.textarea = this.el.querySelector('.dungeon-note-textarea');
        this.previewEl = this.el.querySelector('.dungeon-note-preview');
        this.loadingEl = this.el.querySelector('.dungeon-note-loading');

        this.bindEvents();

        // If no initial text provided, try to load from backend
        if (!initialText) {
            this.loadFromBackend();
        }
    }

    bindEvents() {
        const header = this.el.querySelector('.dungeon-note-header');
        const resizer = this.el.querySelector('.dungeon-note-resizer');
        const closeBtn = this.el.querySelector('.close');
        const saveBtn = this.el.querySelector('.save');
        const bulbBtn = this.el.querySelector('.bulb');
        const linkBtn = this.el.querySelector('.link');
        const qInsertBtn = this.el.querySelector('.q-insert-link');
        const viewToggleBtn = this.el.querySelector('.view-toggle');
        const scopeToggleBtn = this.el.querySelector('.scope-toggle');
        const qLink = this.el.querySelector('.dungeon-note-q-link');

        // Dragging logic
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const onMouseDownDrag = (e) => {
            if (e.target.closest('.dungeon-note-btn')) return;
            isDragging = true;
            this.el.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(this.el.style.left);
            startTop = parseInt(this.el.style.top);

            document.addEventListener('mousemove', onMouseMoveDrag);
            document.addEventListener('mouseup', onMouseUpDrag);
        };

        const onMouseMoveDrag = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            this.el.style.left = (startLeft + dx) + 'px';
            this.el.style.top = (startTop + dy) + 'px';
        };

        const onMouseUpDrag = () => {
            isDragging = false;
            this.el.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMoveDrag);
            document.removeEventListener('mouseup', onMouseUpDrag);
        };

        header.addEventListener('mousedown', onMouseDownDrag);

        // Resize Logic
        let isResizing = false;
        let startW, startH;

        const onMouseDownResize = (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.el.getBoundingClientRect();
            startW = rect.width;
            startH = rect.height;

            document.addEventListener('mousemove', onMouseMoveResize);
            document.addEventListener('mouseup', onMouseUpResize);
            e.preventDefault();
        };

        const onMouseMoveResize = (e) => {
            if (!isResizing) return;
            const dw = e.clientX - startX;
            const dh = e.clientY - startY;
            this.el.style.width = Math.max(200, startW + dw) + 'px';
            this.el.style.height = Math.max(150, startH + dh) + 'px';
        };

        const onMouseUpResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMoveResize);
            document.removeEventListener('mouseup', onMouseUpResize);
        };

        resizer.addEventListener('mousedown', onMouseDownResize);

        // Actions
        closeBtn.onclick = () => this.destroy();

        saveBtn.onclick = () => this.save();

        bulbBtn.onclick = () => {
            // Reveal answer if not revealed
            if (!this.question.revealed) {
                this.dungeon.toggleReveal();
            }

            // Append explanation
            const explanation = this.question.explanation || "No explanation available.";
            const separator = this.textarea.value ? "\n\n---\n" : "";
            const prefix = this.isSessionWide ? `**Question ${this.questionIndex + 1} Explanation:**\n` : "**Explanation:**\n";
            this.textarea.value += `${separator}${prefix}${explanation}`;
            this.textarea.focus();
        };

        const navigateToQ = (idx) => {
            if (idx === undefined) idx = this.questionIndex;
            if (this.dungeon.state.currentIndex !== idx) {
                this.dungeon.jumpToQuestion(idx);
            }
            this.dungeon.el.main.scrollIntoView({ behavior: 'smooth' });
        };

        linkBtn.onclick = () => navigateToQ(this.questionIndex);
        qLink.onclick = () => navigateToQ(this.questionIndex);

        // Insert Link (Session Mode only)
        if (qInsertBtn) {
            qInsertBtn.onclick = () => {
                const link = `[[Q${this.questionIndex + 1}]]`;
                // Insert at cursor
                const start = this.textarea.selectionStart;
                const end = this.textarea.selectionEnd;
                const text = this.textarea.value;
                this.textarea.value = text.substring(0, start) + link + text.substring(end);
                this.textarea.focus();
                this.textarea.selectionStart = this.textarea.selectionEnd = start + link.length;
            };
        }

        // Toggle View/Edit
        if (viewToggleBtn) {
            viewToggleBtn.onclick = () => {
                this.isViewMode = !this.isViewMode;
                if (this.isViewMode) {
                    this.renderPreview();
                    this.textarea.classList.add('hidden');
                    this.previewEl.classList.add('active');
                    viewToggleBtn.classList.add('active');
                } else {
                    this.previewEl.classList.remove('active');
                    this.textarea.classList.remove('hidden');
                    viewToggleBtn.classList.remove('active');
                    this.textarea.focus();
                }
            };
        }

        // Scope Toggle
        if (scopeToggleBtn) {
            scopeToggleBtn.onclick = () => this.toggleScope();
        }

        // Click handler for links in preview
        this.previewEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('dungeon-note-internal-link')) {
                const qNum = parseInt(e.target.dataset.q);
                if (!isNaN(qNum)) {
                    navigateToQ(qNum - 1);
                }
            }
        });
    }

    renderPreview() {
        if (!this.previewEl) return;
        const text = this.textarea.value;
        // Basic escaping
        let html = text.replace(/&/g, "&amp;")
                       .replace(/</g, "&lt;")
                       .replace(/>/g, "&gt;");
        
        // Convert newlines to <br>
        html = html.replace(/\n/g, "<br>");

        // Convert [[Q1]] or [Q1] to links
        // Regex for [[Q123]] or [Q123]
        html = html.replace(/\[\[Q(\d+)\]\]/g, '<span class="dungeon-note-internal-link" data-q="$1">Q$1</span>');
        html = html.replace(/\[Q(\d+)\]/g, '<span class="dungeon-note-internal-link" data-q="$1">Q$1</span>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        this.previewEl.innerHTML = html;
    }

    toggleScope() {
        this.isSessionWide = !this.isSessionWide;
        this.updateScopeUI();
        // Reload content for the new scope
        this.loadFromBackend();
    }

    updateScopeUI() {
        const scopeBtn = this.el.querySelector('.scope-toggle');
        const titleSpan = this.el.querySelector('.dungeon-note-title span');
        const footer = this.el.querySelector('.dungeon-note-footer');
        const qInsertBtn = this.el.querySelector('.q-insert-link');
        const linkBtn = this.el.querySelector('.link');

        if (this.isSessionWide) {
            scopeBtn.classList.add('session-mode');
            titleSpan.textContent = 'Session Note';
            footer.innerHTML = 'Linked to <span class="dungeon-note-q-link">Entire Session</span>';
            if (qInsertBtn) qInsertBtn.style.display = 'block';
            if (linkBtn) linkBtn.style.display = 'none';
        } else {
            scopeBtn.classList.remove('session-mode');
            titleSpan.textContent = `Sticky Note - Q${this.questionIndex + 1}`;
            footer.innerHTML = `Linked to <span class="dungeon-note-q-link">Question ${this.questionIndex + 1}</span>`;
            if (qInsertBtn) qInsertBtn.style.display = 'none';
            if (linkBtn) linkBtn.style.display = 'block';
        }
    }

    async loadFromBackend() {
        const noteId = this.isSessionWide 
            ? `dungeon_note_session_${this.sessionId}`
            : `dungeon_note_${this.questionId}`;

        if (this.loadingEl) this.loadingEl.classList.add('active');

        try {
            if (window.Storage && window.Storage.loadNotes) {
                const notes = await window.Storage.loadNotes();
                const existingNote = notes.find(n => n.id === noteId);

                // Always clear first when switching scope
                this.textarea.value = "";
                if (this.isViewMode) this.renderPreview();

                if (existingNote && this.textarea) {
                    let content = existingNote.content || existingNote.contentHtml || "";
                    this.textarea.value = content;
                    console.log(`[DungeonNote] Restored content for ${noteId}`);
                    // Refresh preview if active
                    if (this.isViewMode) this.renderPreview();
                }
            }
        } catch (error) {
            console.error("[DungeonNote] Failed to load existing note:", error);
        } finally {
            if (this.loadingEl) this.loadingEl.classList.remove('active');
        }
    }

    async save() {
        const text = this.textarea.value;
        if (!text.trim()) {
            this.dungeon.showNotification("Cannot save an empty note.", "error");
            return;
        }

        const title = this.isSessionWide 
            ? 'Session Note' 
            : `Dungeon Note - Q${this.questionIndex + 1} (${this.question.title || 'Untitled'})`;
            
        const noteId = this.isSessionWide 
            ? `dungeon_note_session_${this.sessionId}`
            : `dungeon_note_${this.questionId}`;

        try {
            if (window.Storage && window.Storage.saveNote) {
                const now = new Date().toISOString();
                
                let existingNote = null;
                if (window.state && window.state.notes) {
                    existingNote = window.state.notes.find(n => n.id === noteId);
                }
                
                const noteData = {
                    id: noteId,
                    title: title,
                    content: text,
                    contentHtml: text,
                    type: 'dungeon-note',
                    questionId: this.isSessionWide ? null : this.questionId,
                    questionIndex: this.questionIndex,
                    sessionId: this.sessionId,
                    isSessionWide: this.isSessionWide,
                    folderId: null,
                    order: existingNote ? existingNote.order : (window.state?.notes?.length || 0),
                    createdAt: existingNote ? existingNote.createdAt : now,
                    updatedAt: now,
                    date: now
                };

                await window.Storage.saveNote(noteId, noteData);
                
                console.log(`[DungeonNote] Save completed for ${noteId}`);

                if (window.TwoBase) {
                    if (typeof window.TwoBase.refreshSidebar === 'function') window.TwoBase.refreshSidebar();
                    if (typeof window.TwoBase.refreshWorkspace === 'function') window.TwoBase.refreshWorkspace();
                }

                this.dungeon.showNotification(`Note saved (${this.isSessionWide ? 'Session' : 'Question'})!`, "success");
                const saveIcon = this.el.querySelector('.save');
                if (saveIcon) {
                    saveIcon.style.color = '#10b981';
                    setTimeout(() => { if (this.el) saveIcon.style.color = ''; }, 2000);
                }
            } else {
                throw new Error("Storage system not available");
            }
        } catch (error) {
            console.error("[DungeonNote] Save failed:", error);
            this.dungeon.showNotification("Failed to save note: " + error.message, "error");
        }
    }

    destroy() {
        if (this.el) {
            this.el.style.opacity = '0';
            this.el.style.transform = 'scale(0.9)';

            if (this.dungeon && this.dungeon.currentNote === this) {
                this.dungeon.currentNote = null;
            }

            setTimeout(() => {
                if (this.el) this.el.remove();
                DungeonNote.activeNotes.delete(this);
            }, 200);
        }
    }
}

window.DungeonNote = DungeonNote;
