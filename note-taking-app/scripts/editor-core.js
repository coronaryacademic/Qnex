
export class BlockEditor {
    constructor(container, initialContent = "", onChange = () => { }) {
        this.container = container;
        this.onChange = onChange;
        this.blocks = [];
        this.history = [];
        this.historyIndex = -1;

        // Initialize
        this.init(initialContent);
    }

    init(content) {
        this.container.innerHTML = "";
        this.container.classList.add("block-editor");

        // Parse content into blocks
        this.blocks = this.parseContent(content);

        // Render blocks
        this.render();

        // Add event listeners
        this.container.addEventListener("keydown", this.handleKeyDown.bind(this));
        this.container.addEventListener("input", this.handleInput.bind(this));
        this.container.addEventListener("click", this.handleClick.bind(this));
    }

    // --- Parsing & Serialization ---

    parseContent(html) {
        if (!html) return [{ id: this.uid(), type: "p", content: "" }];

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const blocks = [];

        // If content is just text without tags, wrap it
        if (tempDiv.childNodes.length === 1 && tempDiv.childNodes[0].nodeType === Node.TEXT_NODE) {
            return [{ id: this.uid(), type: "p", content: tempDiv.textContent }];
        }

        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.trim()) {
                    blocks.push({ id: this.uid(), type: "p", content: node.textContent });
                }
                return;
            }

            let type = "p";
            if (node.tagName === "H1") type = "h1";
            else if (node.tagName === "H2") type = "h2";
            else if (node.tagName === "H3") type = "h3";
            else if (node.tagName === "BLOCKQUOTE") type = "quote";
            else if (node.tagName === "TABLE" || node.classList.contains("note-table")) type = "table";
            else if (node.tagName === "IMG" || node.classList.contains("image-container")) type = "image";
            else if (node.tagName === "DIV" && node.classList.contains("sketch-container")) type = "sketch";
            else if (node.tagName === "DIV" && !node.classList.contains("image-container")) type = "div";
            else if (node.tagName === "UL" || node.tagName === "OL") {
                Array.from(node.children).forEach(li => {
                    if (li.tagName === "LI") {
                        blocks.push({ id: this.uid(), type: "ul", content: li.innerHTML });
                    }
                });
                return; // Skip adding the UL itself
            }
            else if (node.tagName === "LI") type = "ul";

            blocks.push({
                id: this.uid(),
                type: type,
                content: ['table', 'image', 'div', 'sketch'].includes(type) ? node.outerHTML : node.innerHTML
            });
        };

        Array.from(tempDiv.children).forEach(processNode);

        if (blocks.length === 0) {
            blocks.push({ id: this.uid(), type: "p", content: "" });
        }

        return blocks;
    }

    serialize() {
        // We need to handle grouping of lists for valid HTML output
        let html = "";
        let currentList = null;

        this.blocks.forEach(block => {
            if (block.type === 'ul') {
                if (!currentList) {
                    currentList = [];
                }
                currentList.push(block);
            } else {
                if (currentList) {
                    html += `<ul>${currentList.map(b => `<li data-block-id="${b.id}">${b.content}</li>`).join("")}</ul>`;
                    currentList = null;
                }

                if (['table', 'image', 'div', 'sketch'].includes(block.type)) {
                    html += block.content;
                } else {
                    const tag = this.getTagForType(block.type);
                    html += `<${tag} data-block-id="${block.id}">${block.content}</${tag}>`;
                }
            }
        });

        if (currentList) {
            html += `<ul>${currentList.map(b => `<li data-block-id="${b.id}">${b.content}</li>`).join("")}</ul>`;
        }

        return html;
    }

    getTagForType(type) {
        switch (type) {
            case "h1": return "h1";
            case "h2": return "h2";
            case "h3": return "h3";
            case "quote": return "blockquote";
            case "ul": return "div"; // Rendered as div in editor, but serialized as ul/li
            default: return "p";
        }
    }

    // --- Rendering ---

    render() {
        this.container.innerHTML = "";
        this.blocks.forEach(block => {
            const el = this.createBlockElement(block);
            this.container.appendChild(el);
        });
    }

    createBlockElement(block) {
        if (['table', 'image', 'div', 'sketch'].includes(block.type)) {
            const temp = document.createElement('div');
            temp.innerHTML = block.content;
            const el = temp.firstElementChild;
            if (el) {
                el.dataset.blockId = block.id;
                el.classList.add("editor-block");
                el.classList.add(`block-${block.type}`);
                if (block.type === 'table') el.contentEditable = false;
                if (block.type === 'sketch') {
                    el.contentEditable = false;
                    this.initDrawingBlock(el, block);
                }
                return el;
            }
        }

        const el = document.createElement(this.getTagForType(block.type));
        el.dataset.blockId = block.id;
        el.innerHTML = block.content;
        el.contentEditable = true;
        el.classList.add("editor-block");
        el.classList.add(`block-${block.type}`);
        if (block.type === 'p') el.classList.add('body-text');

        if (!block.content && block.type === 'p') {
            el.classList.add('empty-block');
            el.dataset.placeholder = "Type to write...";
        }

        return el;
    }

    // --- Event Handling ---

    handleKeyDown(e) {
        const currentBlockEl = this.getBlockElementAtSelection();
        // Pass through Ctrl+F (let it bubble to document)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
            return;
        }

        if (!currentBlockEl) return;

        const blockId = currentBlockEl.dataset.blockId;
        const blockIndex = this.blocks.findIndex(b => b.id === blockId);
        const block = this.blocks[blockIndex];

        if (e.key === "Enter") {
            if (e.shiftKey) return; // Allow soft breaks

            // If current block is empty ul, convert to p (exit list)
            if (block.type === 'ul' && block.content === '') {
                e.preventDefault();
                this.convertBlockType(block, currentBlockEl, "p", 0);
                return;
            }

            e.preventDefault();

            // Create new block
            const newBlock = { id: this.uid(), type: "p", content: "" };

            // If current block is ul, new block should be ul
            if (block.type === 'ul') {
                newBlock.type = 'ul';
            }

            // Split content if cursor is in middle (advanced) or just append (simple)
            // For now, simple append after
            this.blocks.splice(blockIndex + 1, 0, newBlock);

            // Update DOM
            const newEl = this.createBlockElement(newBlock);
            currentBlockEl.after(newEl);

            // Focus new block
            this.focusBlock(newBlock.id);
            this.triggerChange();
        }

        if (e.key === "Backspace") {
            if (block.content === "") {
                if (block.type === 'ul') {
                    e.preventDefault();
                    this.convertBlockType(block, currentBlockEl, "p", 0);
                    return;
                }

                if (blockIndex > 0) {
                    e.preventDefault();
                    // Merge with previous
                    const prevBlock = this.blocks[blockIndex - 1];
                    this.blocks.splice(blockIndex, 1);
                    currentBlockEl.remove();
                    this.focusBlock(prevBlock.id, true); // Focus at end
                    this.triggerChange();
                }
            } else if (this.isCursorAtStart(currentBlockEl) && blockIndex > 0) {
                e.preventDefault();
                // Merge content with previous block
                const prevBlock = this.blocks[blockIndex - 1];
                const oldContentLength = prevBlock.content.length; // Rough estimate for cursor
                prevBlock.content += block.content;

                // Update previous block DOM
                const prevEl = this.container.querySelector(`[data-block-id="${prevBlock.id}"]`);
                prevEl.innerHTML = prevBlock.content;

                // Remove current
                this.blocks.splice(blockIndex, 1);
                currentBlockEl.remove();

                // Set cursor to merge point (simplified)
                this.focusBlock(prevBlock.id, true);
                this.triggerChange();
            }
        }

        if (e.key === "ArrowUp") {
            if (blockIndex > 0) {
                e.preventDefault();
                this.focusBlock(this.blocks[blockIndex - 1].id);
            }
        }

        if (e.key === "ArrowDown") {
            if (blockIndex < this.blocks.length - 1) {
                e.preventDefault();
                this.focusBlock(this.blocks[blockIndex + 1].id);
            }
        }
    }

    handleInput(e) {
        const currentBlockEl = this.getBlockElementAtSelection();
        if (!currentBlockEl) return;

        const blockId = currentBlockEl.dataset.blockId;
        const blockIndex = this.blocks.findIndex(b => b.id === blockId);

        // Update model
        const content = currentBlockEl.innerHTML;
        this.blocks[blockIndex].content = content;

        // Toggle empty class for placeholder
        if (this.blocks[blockIndex].type === 'p') {
            if (!currentBlockEl.textContent && !currentBlockEl.querySelector('img') && !currentBlockEl.querySelector('table')) {
                currentBlockEl.classList.add('empty-block');
                currentBlockEl.dataset.placeholder = "Type to write...";
            } else {
                currentBlockEl.classList.remove('empty-block');
                delete currentBlockEl.dataset.placeholder;
            }
        }

        // Check for markdown shortcuts
        this.checkMarkdownShortcuts(this.blocks[blockIndex], currentBlockEl);

        this.triggerChange();
    }

    handleClick(e) {
        // If clicking the container background (not a block), focus the last block
        if (e.target === this.container) {
            const lastBlock = this.blocks[this.blocks.length - 1];
            if (lastBlock) {
                this.focusBlock(lastBlock.id, true); // Focus at end
            }
        }
    }

    focus() {
        // Public method to focus the editor (focuses last block)
        const lastBlock = this.blocks[this.blocks.length - 1];
        if (lastBlock) {
            this.focusBlock(lastBlock.id, true);
        }
    }

    checkMarkdownShortcuts(block, el) {
        const text = el.textContent;

        if (text.startsWith("# ") && block.type !== "h1") {
            this.convertBlockType(block, el, "h1", 2);
        } else if (text.startsWith("## ") && block.type !== "h2") {
            this.convertBlockType(block, el, "h2", 3);
        } else if (text.startsWith("### ") && block.type !== "h3") {
            this.convertBlockType(block, el, "h3", 4);
        } else if (text.startsWith("> ") && block.type !== "quote") {
            this.convertBlockType(block, el, "quote", 2);
        } else if ((text.startsWith("- ") || text.startsWith("* ")) && block.type !== "ul") {
            this.convertBlockType(block, el, "ul", 2);
        }
    }

    convertBlockType(block, el, newType, stripChars) {
        block.type = newType;
        if (stripChars > 0) {
            block.content = block.content.substring(stripChars); // Remove the markdown chars
        }

        // Re-render this block
        const newEl = this.createBlockElement(block);
        el.replaceWith(newEl);
        this.focusBlock(block.id, true); // Focus at end? Or start?
        this.triggerChange();
    }

    // --- Helpers ---

    uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getBlockElementAtSelection() {
        const sel = window.getSelection();
        if (!sel.rangeCount) return null;
        let node = sel.anchorNode;
        return node.nodeType === Node.ELEMENT_NODE && node.classList.contains("editor-block")
            ? node
            : node.parentElement.closest(".editor-block");
    }

    focusBlock(id, atEnd = false) {
        const el = this.container.querySelector(`[data-block-id="${id}"]`);
        if (el) {
            el.focus();

            // Always set cursor position explicitly
            const range = document.createRange();
            const sel = window.getSelection();

            if (atEnd) {
                // Move cursor to end
                range.selectNodeContents(el);
                range.collapse(false);
            } else {
                // Move cursor to start
                if (el.childNodes.length > 0) {
                    range.setStart(el.childNodes[0], 0);
                } else {
                    range.setStart(el, 0);
                }
                range.collapse(true);
            }

            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    isCursorAtStart(el) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return false;
        const range = sel.getRangeAt(0);
        // This is a simplified check; robust check needs to handle nested nodes
        return range.startOffset === 0 && sel.anchorNode === el || (sel.anchorNode.parentNode === el && range.startOffset === 0 && Array.from(el.childNodes).indexOf(sel.anchorNode) === 0);
    }

    insertBlock(type, content, index = -1) {
        const newBlock = { id: this.uid(), type, content };
        if (index === -1) {
            this.blocks.push(newBlock);
            this.container.appendChild(this.createBlockElement(newBlock));
        } else {
            this.blocks.splice(index, 0, newBlock);
            const nextBlock = this.blocks[index + 1];
            if (nextBlock) {
                const nextEl = this.container.querySelector(`[data-block-id="${nextBlock.id}"]`);
                if (nextEl) {
                    nextEl.before(this.createBlockElement(newBlock));
                } else {
                    this.render(); // Fallback
                }
            } else {
                this.container.appendChild(this.createBlockElement(newBlock));
            }
        }
        this.triggerChange();
        return newBlock;
    }

    refresh() {
        // Re-parse content from DOM if needed, or just re-render
        // For now, let's assume we want to re-parse from current HTML
        const html = this.container.innerHTML;
        this.blocks = this.parseContent(html);
        this.render();
    }


    getHTML() {
        return this.serialize();
    }

    triggerChange() {
        this.onChange(this.serialize());
    }

    // --- Drawing Block Logic ---

    initDrawingBlock(container, block) {
        // The container for a sketch block has: .sketch-toolbar (small floating) and .sketch-canvas
        // If we are initializing from HTML, we might need to recreate the canvas if content is just an <img>
        // But let's assume we store the data in an attribute or similar.
        // For now, let's look for existing canvas or img

        let canvas = container.querySelector('canvas');
        if (!canvas) {
            container.innerHTML = `
            <div class="sketch-toolbar">
              <button data-tool="pencil" class="active" title="Pencil"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
              <button data-tool="highlighter" title="Highlighter"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg></button>
              <button data-tool="eraser" title="Eraser"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.4 5.4c1 1 1 2.5 0 3.4L13 21Z"/><path d="m22 21-10-10"/><path d="m18 11 4 4"/></svg></button>
              <div class="divider"></div>
              <button data-tool="clear" title="Clear All"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
            </div>
            <canvas width="800" height="400"></canvas>
          `;
            canvas = container.querySelector('canvas');
        }

        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let currentTool = 'pencil';

        const toolbar = container.querySelector('.sketch-toolbar');
        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const tool = btn.dataset.tool;
            if (tool === 'clear') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.updateSketchContent(container, canvas);
                return;
            }
            currentTool = tool;
            toolbar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });

        // Drawing logic
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };

        const start = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            [lastX, lastY] = [pos.x, pos.y];
        };

        const draw = (e) => {
            if (!isDrawing) return;
            const pos = getPos(e);

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);

            if (currentTool === 'pencil') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
            } else if (currentTool === 'highlighter') {
                ctx.globalCompositeOperation = 'multiply';
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
                ctx.lineWidth = 20;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
            } else if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = 20;
            }

            ctx.stroke();
            [lastX, lastY] = [pos.x, pos.y];
        };

        const stop = () => {
            if (isDrawing) {
                isDrawing = false;
                this.updateSketchContent(container, canvas);
            }
        };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stop);

        // Restore if data exists (as data-url in an img or similar)
        const dataUrl = container.dataset.initialData;
        if (dataUrl) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = dataUrl;
        }
    }

    updateSketchContent(container, canvas) {
        // Serialize the canvas to an img and update container.dataset.initialData
        // This ensures when serialize() is called, the latest drawing is included.
        const dataUrl = canvas.toDataURL();
        container.dataset.initialData = dataUrl;

        // We update the content property of the block in this.blocks
        const blockId = container.dataset.blockId;
        const block = this.blocks.find(b => b.id === blockId);
        if (block) {
            block.content = `<div class="sketch-container" data-initial-data="${dataUrl}">${container.innerHTML}</div>`;
            this.triggerChange();
        }
    }

    insertSketch() {
        const sketchHtml = `<div class="sketch-container"></div>`;
        this.insertBlock('sketch', sketchHtml);
    }

    // --- Toolbar & Integration Actions ---

    applyBlockAction(type) {
        const currentBlockEl = this.getBlockElementAtSelection();
        if (!currentBlockEl) return;

        const blockId = currentBlockEl.dataset.blockId;
        const blockIndex = this.blocks.findIndex(b => b.id === blockId);
        const block = this.blocks[blockIndex];

        if (block) {
            // Toggle if already that type, convert to 'p'
            const newType = block.type === type ? "p" : type;
            this.convertBlockType(block, currentBlockEl, newType, 0);
        }
    }

    applyInlineAction(action, value = null) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        // Inline actions like Bold/Italic/Underline/Color/Highlight
        // work naturally with document.execCommand if focus is inside a block.
        // We just ensure focus and then trigger change after a small delay.
        document.execCommand(action, false, value);
        setTimeout(() => this.triggerChange(), 10);
    }

    // Helper for context menu/external use
    getCurrentBlock() {
        return this.getBlockElementAtSelection();
    }
}
