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

        this.el = null;
        this.textarea = null;

        this.init(initialText);
        DungeonNote.activeNotes.add(this);
    }

    static destroyAll() {
        console.log(`[DungeonNote] Destroying all (${DungeonNote.activeNotes.size}) active notes.`);
        const notes = Array.from(DungeonNote.activeNotes);
        notes.forEach(note => note.destroy());
    }

    init(initialText) {
        // Stable ID system - link note to the specific question
        const noteId = `dungeon_note_${this.questionId}`;
        const html = `
            <div id="${noteId}" class="dungeon-note-window" style="left: ${window.innerWidth / 2 - 160}px; top: ${window.innerHeight / 2 - 100}px;">
                <div class="dungeon-note-header">
                    <div class="dungeon-note-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Sticky Note - Q${this.questionIndex + 1}
                    </div>
                    <div class="dungeon-note-actions">
                        <button class="dungeon-note-btn close" title="Close">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="dungeon-note-body">
                    <textarea class="dungeon-note-textarea" placeholder="Write your thoughts here...">${initialText}</textarea>
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
                        <button class="dungeon-note-tool bulb" title="Add Explanation & Reveal">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"></path></svg>
                        </button>
                    </div>
                    <div class="dungeon-note-toolbar-right">
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
        this.loadingEl = this.el.querySelector('.dungeon-note-loading');

        this.bindEvents();

        // If no initial text provided, try to load from backend
        if (!initialText) {
            this.loadFromBackend();
        }
    }

    async loadFromBackend() {
        const noteId = `dungeon_note_${this.questionId}`;
        if (this.loadingEl) this.loadingEl.classList.add('active');

        try {
            if (window.Storage && window.Storage.loadNotes) {
                const notes = await window.Storage.loadNotes();
                const existingNote = notes.find(n => n.id === noteId);

                if (existingNote && this.textarea) {
                    // Extract content if it's formatted as Markdown with frontmatter
                    // matter.stringify usually puts content after the second ---
                    let content = existingNote.content || existingNote.contentHtml || "";

                    // Simple cleaning of frontmatter if it's there (backend usually returns it pre-parsed though)
                    this.textarea.value = content;
                    console.log(`[DungeonNote] Restored content for ${noteId}`);
                }
            }
        } catch (error) {
            console.error("[DungeonNote] Failed to load existing note:", error);
        } finally {
            if (this.loadingEl) this.loadingEl.classList.remove('active');
        }
    }

    bindEvents() {
        const header = this.el.querySelector('.dungeon-note-header');
        const resizer = this.el.querySelector('.dungeon-note-resizer');
        const closeBtn = this.el.querySelector('.close');
        const saveBtn = this.el.querySelector('.save');
        const bulbBtn = this.el.querySelector('.bulb');
        const linkBtn = this.el.querySelector('.link');
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
            this.textarea.value += `${separator}**Explanation:**\n${explanation}`;
            this.textarea.focus();
        };

        const navigateToQ = () => {
            if (this.dungeon.state.currentIndex !== this.questionIndex) {
                this.dungeon.jumpToQuestion(this.questionIndex);
            }
            // Add a brief highlight to the question or just ensure it's in view
            this.dungeon.el.main.scrollIntoView({ behavior: 'smooth' });
        };

        linkBtn.onclick = navigateToQ;
        qLink.onclick = navigateToQ;
    }

    async save() {
        const text = this.textarea.value;
        if (!text.trim()) {
            this.dungeon.showNotification("Cannot save an empty note.", "error");
            return;
        }

        const title = `Dungeon Note - Q${this.questionIndex + 1} (${this.question.title || 'Untitled'})`;
        const noteId = `dungeon_note_${this.questionId}`;

        try {
            // Use global Storage exposed by app.js
            if (window.Storage && window.Storage.saveNote) {
                // Send as object to match server expectations
                const noteData = {
                    id: noteId,
                    title: title,
                    content: text,
                    contentHtml: text, // Server might use this for MD conversion if content is missing
                    type: 'dungeon-note',
                    questionId: this.questionId,
                    questionIndex: this.questionIndex,
                    date: new Date().toISOString()
                };

                await window.Storage.saveNote(noteId, noteData);

                // Refresh main app UI if available
                if (window.TwoBase) {
                    if (typeof window.TwoBase.refreshSidebar === 'function') {
                        window.TwoBase.refreshSidebar();
                    }
                    if (typeof window.TwoBase.refreshWorkspace === 'function') {
                        window.TwoBase.refreshWorkspace();
                    }
                }

                this.dungeon.showNotification("Note saved to disk!", "success");
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

            // Clear reference in dungeon if it's this note
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
