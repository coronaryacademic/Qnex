
export class BlockEditor {
  constructor(container, initialContent = "", onChange = () => {}) {
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
            content: ['table', 'image', 'div'].includes(type) ? node.outerHTML : node.innerHTML
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
            
            if (['table', 'image', 'div'].includes(block.type)) {
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
    if (['table', 'image', 'div'].includes(block.type)) {
        const temp = document.createElement('div');
        temp.innerHTML = block.content;
        const el = temp.firstElementChild;
        if (el) {
            el.dataset.blockId = block.id;
            el.classList.add("editor-block");
            el.classList.add(`block-${block.type}`);
            if (block.type === 'table') el.contentEditable = false; 
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
}
