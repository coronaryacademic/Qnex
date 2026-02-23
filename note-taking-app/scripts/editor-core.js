
export class BlockEditor {
  constructor(container, initialContent = "", onChange = () => {}) {
    this.container = container;
    this.onChange = onChange;
    this.blocks = [];
    this._undoStack = [];
    this._redoStack = [];
    this._suppressChange = false;

    this.init(initialContent);
  }

  // ─── Init ───────────────────────────────────────────────────────────────────

  init(content) {
    this.container.innerHTML = "";
    this.container.classList.add("block-editor");

    this.blocks = this.parseContent(content);
    this.render();

    this.container.addEventListener("keydown",  this._onKeyDown.bind(this));
    this.container.addEventListener("input",    this._onInput.bind(this));
    this.container.addEventListener("click",    this._onClick.bind(this));

    // Track last focused block so toolbar actions can restore selection
    this.container.addEventListener("focusin", (e) => {
      const b = e.target.closest("[data-block-id]");
      if (b) this._lastFocusBlock = b;
    });

    // Save initial snapshot
    this._pushUndo();
  }

  // ─── Unique ID ────────────────────────────────────────────────────────────

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  // ─── Parse HTML → Blocks ─────────────────────────────────────────────────

  parseContent(html) {
    if (!html || !html.trim()) {
      return [this._makeBlock("p", "")];
    }

    const wrap = document.createElement("div");
    wrap.innerHTML = html;

    const blocks = [];
    this._parseNodes(wrap.childNodes, blocks);

    if (blocks.length === 0) blocks.push(this._makeBlock("p", ""));
    return blocks;
  }

  _parseNodes(nodeList, acc) {
    nodeList.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent;
        if (t.trim()) acc.push(this._makeBlock("p", this._escapeForBlock(t)));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tag = node.tagName.toUpperCase();

      if (tag === "UL") {
        node.querySelectorAll("li").forEach(li => {
          acc.push(this._makeBlock("ul", li.innerHTML));
        });
      } else if (tag === "OL") {
        node.querySelectorAll("li").forEach(li => {
          acc.push(this._makeBlock("ol", li.innerHTML));
        });
      } else if (tag === "H1") {
        acc.push(this._makeBlock("h1", node.innerHTML));
      } else if (tag === "H2") {
        acc.push(this._makeBlock("h2", node.innerHTML));
      } else if (tag === "H3") {
        acc.push(this._makeBlock("h3", node.innerHTML));
      } else if (tag === "BLOCKQUOTE") {
        acc.push(this._makeBlock("quote", node.innerHTML));
      } else if (tag === "TABLE" || node.classList.contains("note-table")) {
        acc.push(this._makeBlock("table", node.outerHTML));
      } else if (node.classList.contains("sketch-container")) {
        acc.push(this._makeBlock("sketch", node.outerHTML));
      } else if (node.classList.contains("image-container") || tag === "IMG") {
        acc.push(this._makeBlock("image", node.outerHTML));
      } else if (tag === "P" || tag === "DIV") {
        // Recurse into divs that might contain structured content; but if they
        // only contain inline nodes, treat as paragraph.
        const hasBlockChild = Array.from(node.children).some(c =>
          ["H1","H2","H3","UL","OL","TABLE","BLOCKQUOTE"].includes(c.tagName.toUpperCase())
        );
        if (hasBlockChild) {
          this._parseNodes(node.childNodes, acc);
        } else {
          acc.push(this._makeBlock("p", node.innerHTML));
        }
      } else if (tag === "BR") {
        // ignore bare BRs
      } else {
        acc.push(this._makeBlock("p", node.innerHTML));
      }
    });
  }

  _makeBlock(type, content) {
    return { id: this.uid(), type, content: content || "" };
  }

  _escapeForBlock(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ─── Serialize Blocks → HTML ─────────────────────────────────────────────

  serialize() {
    let html = "";
    let i = 0;
    while (i < this.blocks.length) {
      const b = this.blocks[i];

      // Group consecutive ul blocks
      if (b.type === "ul") {
        let items = "";
        while (i < this.blocks.length && this.blocks[i].type === "ul") {
          items += `<li data-block-id="${this.blocks[i].id}">${this.blocks[i].content}</li>`;
          i++;
        }
        html += `<ul>${items}</ul>`;
        continue;
      }

      // Group consecutive ol blocks
      if (b.type === "ol") {
        let items = "";
        while (i < this.blocks.length && this.blocks[i].type === "ol") {
          items += `<li data-block-id="${this.blocks[i].id}">${this.blocks[i].content}</li>`;
          i++;
        }
        html += `<ol>${items}</ol>`;
        continue;
      }

      // Passthrough types
      if (["table", "image", "sketch", "div"].includes(b.type)) {
        html += b.content;
        i++;
        continue;
      }

      const tag = this._tagForType(b.type);
      html += `<${tag} data-block-id="${b.id}">${b.content}</${tag}>`;
      i++;
    }
    return html;
  }

  _tagForType(type) {
    const map = { h1: "h1", h2: "h2", h3: "h3", quote: "blockquote", ul: "li", ol: "li" };
    return map[type] || "p";
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  render() {
    this.container.innerHTML = "";
    this.blocks.forEach(b => this.container.appendChild(this._createElement(b)));
  }

  _createElement(block) {
    // Passthrough blocks (table, image, sketch)
    if (["table", "image", "sketch", "div"].includes(block.type)) {
      const tmp = document.createElement("div");
      tmp.innerHTML = block.content;
      const el = tmp.firstElementChild;
      if (el) {
        el.dataset.blockId = block.id;
        el.classList.add("editor-block", `block-${block.type}`);
        if (block.type === "table") el.contentEditable = "false";
        if (block.type === "sketch") {
          el.contentEditable = "false";
          this._initSketch(el, block);
        }
        return el;
      }
      // Fallback: create empty p
      return this._makeEl("p", block);
    }

    return this._makeEl(this._tagForType(block.type), block);
  }

  _makeEl(tag, block) {
    const el = document.createElement(tag === "li" ? "p" : tag);
    el.dataset.blockId = block.id;
    el.innerHTML = block.content;
    el.contentEditable = "true";
    el.classList.add("editor-block", `block-${block.type}`);

    if (block.type === "p") {
      el.classList.add("body-text");
      this._updateEmptyState(el);
    }

    // ul/ol styling is handled entirely by CSS via .block-ul / .block-ol
    // No inline styles needed here.

    return el;
  }

  _updateEmptyState(el) {
    const empty = !el.textContent.trim() && !el.querySelector("img, table");
    el.classList.toggle("empty-block", empty);
    if (empty) el.dataset.placeholder = "Type to write...";
    else delete el.dataset.placeholder;
  }

  // ─── Undo / Redo ─────────────────────────────────────────────────────────

  _snapshot() {
    return JSON.stringify(this.blocks.map(b => ({ id: b.id, type: b.type, content: b.content })));
  }

  _pushUndo() {
    const snap = this._snapshot();
    if (this._undoStack.length && this._undoStack[this._undoStack.length - 1] === snap) return;
    this._undoStack.push(snap);
    if (this._undoStack.length > 100) this._undoStack.shift();
    this._redoStack = [];
  }

  _restoreSnapshot(snap) {
    this.blocks = JSON.parse(snap);
    this._suppressChange = true;
    this.render();
    this._suppressChange = false;
    this.onChange(this.serialize());
  }

  undo() {
    if (this._undoStack.length <= 1) return;
    const current = this._undoStack.pop();
    this._redoStack.push(current);
    this._restoreSnapshot(this._undoStack[this._undoStack.length - 1]);
  }

  redo() {
    if (!this._redoStack.length) return;
    const snap = this._redoStack.pop();
    this._undoStack.push(snap);
    this._restoreSnapshot(snap);
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  _onKeyDown(e) {
    // Let Ctrl+F bubble
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") return;

    // Undo / Redo via keyboard
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      this.undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
      e.preventDefault();
      this.redo();
      return;
    }

    const blockEl = this._blockElAtCursor();
    if (!blockEl) return;

    const block = this._blockForEl(blockEl);
    if (!block) return;

    if (e.key === "Enter") {
      if (e.shiftKey) return; // soft break – browser handles it

      // Exit list on Enter in empty list item
      if ((block.type === "ul" || block.type === "ol") && !blockEl.textContent.trim()) {
        e.preventDefault();
        this._syncBlockContent(blockEl, block);
        this._convertBlock(block, blockEl, "p");
        return;
      }

      e.preventDefault();
      this._syncBlockContent(blockEl, block);

      const newType = (block.type === "ul" || block.type === "ol") ? block.type : "p";
      const newBlock = this._makeBlock(newType, "");
      const idx = this._indexOf(block);
      this.blocks.splice(idx + 1, 0, newBlock);
      const newEl = this._createElement(newBlock);
      blockEl.after(newEl);
      this._focusBlock(newBlock.id);
      this._pushUndo();
      this._triggerChange();
    }

    if (e.key === "Backspace") {
      this._syncBlockContent(blockEl, block);

      // Exit list type on Backspace in empty item
      if ((block.type === "ul" || block.type === "ol") && !blockEl.textContent.trim()) {
        e.preventDefault();
        this._convertBlock(block, blockEl, "p");
        return;
      }

      const idx = this._indexOf(block);

      // Remove empty block (not first)
      if (!blockEl.textContent.trim() && idx > 0) {
        e.preventDefault();
        this.blocks.splice(idx, 1);
        blockEl.remove();
        this._focusBlock(this.blocks[idx - 1].id, true);
        this._pushUndo();
        this._triggerChange();
        return;
      }

      // Merge at start into previous
      if (this._cursorAtStart(blockEl) && idx > 0) {
        e.preventDefault();
        const prev = this.blocks[idx - 1];
        const prevEl = this._elForBlock(prev);
        if (prevEl) {
          const extra = block.content;
          prev.content += extra;
          prevEl.innerHTML = prev.content;
          this.blocks.splice(idx, 1);
          blockEl.remove();
          this._focusBlock(prev.id, true);
          this._pushUndo();
          this._triggerChange();
        }
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (block.type === "p") {
        // Convert to ul on Tab
        this._syncBlockContent(blockEl, block);
        this._convertBlock(block, blockEl, "ul");
      } else if (block.type === "ul") {
        // Shift+Tab exits list
        if (e.shiftKey) {
          this._syncBlockContent(blockEl, block);
          this._convertBlock(block, blockEl, "p");
        }
      } else if (block.type === "ol") {
        if (e.shiftKey) {
          this._syncBlockContent(blockEl, block);
          this._convertBlock(block, blockEl, "p");
        }
      }
    }

    if (e.key === "ArrowUp") {
      const idx = this._indexOf(block);
      if (idx > 0) { e.preventDefault(); this._focusBlock(this.blocks[idx - 1].id); }
    }

    if (e.key === "ArrowDown") {
      const idx = this._indexOf(block);
      if (idx < this.blocks.length - 1) { e.preventDefault(); this._focusBlock(this.blocks[idx + 1].id); }
    }
  }

  _onInput(e) {
    const blockEl = this._blockElAtCursor();
    if (!blockEl) return;

    this._syncBlockContent(blockEl, this._blockForEl(blockEl));

    const block = this._blockForEl(blockEl);
    if (!block) return;

    if (block.type === "p") this._updateEmptyState(blockEl);

    // Markdown shortcuts – only on space key (safe: check text starts with trigger)
    this._checkMarkdown(block, blockEl);

    this._triggerChange();
  }

  _onClick(e) {
    if (e.target === this.container) {
      const last = this.blocks[this.blocks.length - 1];
      if (last) this._focusBlock(last.id, true);
    }
  }

  // ─── Markdown Shortcuts ───────────────────────────────────────────────────

  _checkMarkdown(block, el) {
    if (block.type !== "p") return; // Only convert paragraphs

    const text = el.textContent;

    const shortcuts = [
      { prefix: "# ",   type: "h1",    strip: 2 },
      { prefix: "## ",  type: "h2",    strip: 3 },
      { prefix: "### ", type: "h3",    strip: 4 },
      { prefix: "> ",   type: "quote", strip: 2 },
      { prefix: "- ",   type: "ul",    strip: 2 },
      { prefix: "* ",   type: "ul",    strip: 2 },
      { prefix: "1. ",  type: "ol",    strip: 3 },
    ];

    for (const sc of shortcuts) {
      if (text.startsWith(sc.prefix)) {
        // Strip the markdown chars from content then convert
        block.content = el.innerHTML.replace(sc.prefix, ""); // remove just the prefix once
        this._convertBlock(block, el, sc.type);
        return;
      }
    }
  }

  // ─── Block Helpers ────────────────────────────────────────────────────────

  _syncBlockContent(el, block) {
    if (block) block.content = el.innerHTML;
  }

  _indexOf(block) {
    return this.blocks.findIndex(b => b.id === block.id);
  }

  _blockForEl(el) {
    const id = el?.dataset?.blockId;
    return id ? this.blocks.find(b => b.id === id) : null;
  }

  _elForBlock(block) {
    return this.container.querySelector(`[data-block-id="${block.id}"]`);
  }

  _blockElAtCursor() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    let node = sel.anchorNode;
    if (!node) return null;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return el ? el.closest("[data-block-id]") : null;
  }

  _cursorAtStart(el) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (range.startOffset !== 0) return false;
    // Check we're on the first node inside el
    let node = sel.anchorNode;
    while (node && node !== el) {
      if (node.previousSibling) return false;
      node = node.parentNode;
    }
    return true;
  }

  _focusBlock(id, atEnd = false) {
    const el = this.container.querySelector(`[data-block-id="${id}"]`);
    if (!el) return;
    el.focus();
    try {
      const range = document.createRange();
      const sel = window.getSelection();
      if (atEnd) {
        range.selectNodeContents(el);
        range.collapse(false);
      } else {
        const first = el.firstChild;
        if (first) range.setStart(first, 0);
        else range.setStart(el, 0);
        range.collapse(true);
      }
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) { /* ignore */ }
  }

  _convertBlock(block, el, newType) {
    block.type = newType;
    const newEl = this._createElement(block);
    el.replaceWith(newEl);
    this._focusBlock(block.id, true);
    this._pushUndo();
    this._triggerChange();
  }

  // ─── Public API: Toolbar Actions ─────────────────────────────────────────

  /**
   * Apply a block-level type change (h1, h2, h3, ul, ol, quote, p).
   * Toggles back to 'p' if already that type.
   */
  applyBlockAction(type) {
    // Sync DOM → model first
    const blockEl = this._blockElAtCursor();
    if (!blockEl) return;
    const block = this._blockForEl(blockEl);
    if (!block) return;

    this._syncBlockContent(blockEl, block);
    const newType = block.type === type ? "p" : type;
    this._convertBlock(block, blockEl, newType);
  }

  /**
   * Apply an inline formatting command.
   * Supported: bold, italic, underline, strikeThrough, removeFormat,
   *            justifyLeft, justifyCenter, justifyRight, backColor, foreColor,
   *            insertHTML, insertText, undo, redo
   */
  applyInlineAction(action, value = null) {
    if (action === "undo") { this.undo(); return; }
    if (action === "redo") { this.redo(); return; }

    // Save the current selection so we can restore it after toolbar button
    // steals focus via mousedown
    const sel = window.getSelection();
    let savedRange = null;
    if (sel && sel.rangeCount) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }

    // Restore focus + selection inside the editor before execCommand
    const blockEl = this._lastFocusBlock || this._blockElAtCursor();
    if (blockEl) {
      blockEl.focus();
      if (savedRange) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }

    document.execCommand(action, false, value ?? null);

    // Sync the block model after execCommand mutates the DOM
    setTimeout(() => {
      const el = this._blockElAtCursor();
      if (el) this._syncBlockContent(el, this._blockForEl(el));
      this._pushUndo();
      this._triggerChange();
    }, 0);
  }

  focus() {
    const last = this.blocks[this.blocks.length - 1];
    if (last) this._focusBlock(last.id, true);
  }

  getHTML() {
    return this.serialize();
  }

  // ─── Insert Utilities ─────────────────────────────────────────────────────

  insertBlock(type, content, afterId = null) {
    const newBlock = this._makeBlock(type, content || "");
    if (afterId) {
      const idx = this.blocks.findIndex(b => b.id === afterId);
      if (idx !== -1) {
        this.blocks.splice(idx + 1, 0, newBlock);
        const refEl = this._elForBlock(this.blocks[idx]);
        if (refEl) refEl.after(this._createElement(newBlock));
        else this.render();
        this._triggerChange();
        return newBlock;
      }
    }
    this.blocks.push(newBlock);
    this.container.appendChild(this._createElement(newBlock));
    this._triggerChange();
    return newBlock;
  }

  insertSketch() {
    const curBlock = this._blockForEl(this._blockElAtCursor());
    const sketchHtml = `<div class="sketch-container"></div>`;
    this.insertBlock("sketch", sketchHtml, curBlock?.id ?? null);
  }

  refresh() {
    const html = this.serialize();
    this.blocks = this.parseContent(html);
    this.render();
  }

  _triggerChange() {
    if (!this._suppressChange) this.onChange(this.serialize());
  }

  // ─── Sketch (Drawing) Block ───────────────────────────────────────────────

  _initSketch(container, block) {
    let canvas = container.querySelector("canvas");
    if (!canvas) {
      container.innerHTML = `
        <div class="sketch-toolbar">
          <button data-tool="pencil" class="active" title="Pencil">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button data-tool="highlighter" title="Highlighter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
          </button>
          <button data-tool="eraser" title="Eraser">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.4 5.4c1 1 1 2.5 0 3.4L13 21Z"/><path d="m22 21-10-10"/><path d="m18 11 4 4"/></svg>
          </button>
          <div class="divider"></div>
          <button data-tool="clear" title="Clear All">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
        <canvas width="800" height="400"></canvas>
      `;
      canvas = container.querySelector("canvas");
    }

    const ctx = canvas.getContext("2d");
    let drawing = false, lx = 0, ly = 0, tool = "pencil";

    const toolbar = container.querySelector(".sketch-toolbar");
    toolbar.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.tool === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this._saveSketch(container, canvas, block);
        return;
      }
      tool = btn.dataset.tool;
      toolbar.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });

    const pos = e => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    };

    canvas.addEventListener("mousedown", e => { drawing = true; const p = pos(e); [lx, ly] = [p.x, p.y]; });
    canvas.addEventListener("mousemove", e => {
      if (!drawing) return;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(p.x, p.y);
      if (tool === "pencil")      { ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = "#000"; ctx.lineWidth = 2; }
      else if (tool === "highlighter") { ctx.globalCompositeOperation = "multiply"; ctx.strokeStyle = "rgba(255,255,0,0.4)"; ctx.lineWidth = 20; }
      else if (tool === "eraser") { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = 20; }
      ctx.lineJoin = ctx.lineCap = "round";
      ctx.stroke();
      [lx, ly] = [p.x, p.y];
    });
    window.addEventListener("mouseup", () => { if (drawing) { drawing = false; this._saveSketch(container, canvas, block); } });

    // Restore
    const data = container.dataset.initialData;
    if (data) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = data; }
  }

  _saveSketch(container, canvas, block) {
    const url = canvas.toDataURL();
    container.dataset.initialData = url;
    block.content = container.outerHTML;
    this._triggerChange();
  }
}
