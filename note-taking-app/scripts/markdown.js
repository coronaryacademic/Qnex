// Centralized markdown-related helpers for the note-taking app
// All future markdown parsing/rendering should live here.

(function () {
  "use strict";

  // --- Markdown table parsing (moved from table-utils.js) ---
  function parseMarkdownTable(text) {
    if (!text || typeof text !== "string") return [];

    const lines = text.trim().split("\n");
    const rows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip separator line (e.g., |---|---|)
      if (line.match(/^\|?[\s\-:|]+\|?$/)) continue;

      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c);

      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    return rows;
  }

  // --- Inline markdown-style shortcuts for the editor ---
  function isEditableContent(element) {
    return (
      element &&
      element.classList &&
      element.classList.contains("content") &&
      element.classList.contains("editable")
    );
  }

  function getEditorFromNode(node) {
    if (!node) return null;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    if (!node) return null;
    return node.closest(".content.editable");
  }

  function getCurrentBlock(node, editor) {
    if (!node) return null;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    let el = node;
    while (el && el !== editor) {
      const tag = el.tagName;
      if (tag === "DIV" || tag === "P" || tag === "LI") {
        return el;
      }
      el = el.parentElement;
    }
    return editor;
  }

  function applyHeadingShortcut(block, selection) {
    if (!block) return;
    const text = block.textContent || "";
    const match = text.match(/^(#{1,6})\s+(.*)$/);
    if (!match) return;

    const level = match[1].length;
    const content = match[2];
    if (!content.trim()) return;

    block.innerHTML = "";
    const span = document.createElement("span");
    span.className = "md-heading md-heading-" + level;
    span.textContent = content;
    block.appendChild(span);

    if (selection) {
      const range = document.createRange();
      const textNode = span.firstChild;
      const offset = textNode ? textNode.textContent.length : 0;
      range.setStart(textNode || span, offset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function applyHorizontalRuleShortcut(block) {
    if (!block) return;
    const text = (block.textContent || "").trim();
    if (!text) return;

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(text)) {
      block.innerHTML = "";
      const hr = document.createElement("hr");
      block.appendChild(hr);
    }
  }

  function applyArrowShortcuts(selection) {
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    let node = range.startContainer;
    if (!node) return;

    if (node.nodeType !== Node.TEXT_NODE) {
      if (node.childNodes.length === 0) return;
      node = node.childNodes[0];
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
    }

    const text = node.textContent || "";
    const offset = range.startOffset;
    const before = text.slice(0, offset);
    const after = text.slice(offset);

    // Preserve any trailing whitespace after the pattern
    const trimmedBefore = before.replace(/\s+$/, "");
    const trailing = before.slice(trimmedBefore.length);

    const patterns = [
      { pattern: "<->", replacement: "↔" },
      { pattern: "->", replacement: "→" },
      { pattern: "<-", replacement: "←" },
    ];

    let newBefore = trimmedBefore;
    let matched = false;

    for (const { pattern, replacement } of patterns) {
      if (trimmedBefore.endsWith(pattern)) {
        newBefore =
          trimmedBefore.slice(0, trimmedBefore.length - pattern.length) +
          replacement;
        matched = true;
        break;
      }
    }

    if (!matched) return;

    newBefore += trailing;
    node.textContent = newBefore + after;

    const newOffset = newBefore.length;
    const newRange = document.createRange();
    newRange.setStart(node, Math.min(newOffset, node.textContent.length));
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  function applyListShortcuts(editor, block, selection) {
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let node = range.startContainer;
    if (!node) return;

    if (node.nodeType !== Node.TEXT_NODE) {
      // Try to find a text node to work with
      if (node.childNodes && node.childNodes.length > 0) {
        // Use the last child so we stay near the caret
        node = node.childNodes[node.childNodes.length - 1];
      }
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
    }

    const text = node.textContent || "";
    const offset = range.startOffset;
    const before = text.slice(0, offset);
    const after = text.slice(offset);

    // Match patterns at the start of the line like "- ", "+ ", "* ", "1. "
    const match = before.match(/^\s*([-+*]|\d+\.)\s$/);
    if (!match) return;

    const marker = match[1];

    // Remove the marker from the text node
    const withoutMarker = before.replace(/^\s*([-+*]|\d+\.)\s$/, "");
    node.textContent = withoutMarker + after;

    // Restore caret position right where the text should start
    const newOffset = withoutMarker.length;
    const newRange = document.createRange();
    newRange.setStart(node, Math.min(newOffset, node.textContent.length));
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Turn the current line into a list item
    if (marker === "-" || marker === "+" || marker === "*") {
      document.execCommand("insertUnorderedList");
    } else {
      document.execCommand("insertOrderedList");
    }
  }

  function setupInlineMarkdownShortcuts() {
    // Handle space and Enter follow-ups on keyup for headings, lists, arrows, and horizontal rules
    document.addEventListener("keyup", (e) => {
      if (e.key !== " " && e.key !== "Enter") return;

      const target = e.target;
      if (!isEditableContent(target)) {
        const editorFromTarget = getEditorFromNode(target);
        if (!isEditableContent(editorFromTarget)) return;
      }

      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const editor = getEditorFromNode(selection.anchorNode);
      if (!editor || !isEditableContent(editor)) return;

      const block = getCurrentBlock(selection.anchorNode, editor);

      if (e.key === " ") {
        applyHeadingShortcut(block, selection);
        applyListShortcuts(editor, block, selection);
        applyArrowShortcuts(selection);
      } else if (e.key === "Enter") {
        // Only support --- style horizontal rules on the previous line; let the browser manage new lines
        const hrTarget = (block && block.previousElementSibling) || block;
        if (hrTarget) {
          applyHorizontalRuleShortcut(hrTarget);
        }
      }
    });
  }

  // --- Notion-style header behavior (now initializes all inline markdown helpers) ---
  function setupNotionHeaders() {
    setupInlineMarkdownShortcuts();
    console.log("\u2713 Markdown inline shortcuts initialized");
  }

  // --- Simple Frontmatter Parsing ---
  function parseFrontmatter(text) {
    if (!text || typeof text !== "string") return { data: {}, content: text };

    const regex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
    const match = text.match(regex);

    if (match) {
      const yamlStr = match[1];
      const content = match[2];
      const data = {};

      yamlStr.split("\n").forEach((line) => {
        const parts = line.split(":");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(":").trim().replace(/^["'](.*)["']$/, "$1");
          data[key] = value;
        }
      });

      return { data, content };
    }

    return { data: {}, content: text };
  }

  // Helper to escape HTML for MD
  function escapeHtmlForMarkdown(html) {
    if (!html) return "";
    let md = html;
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
    md = md.replace(/<br\s*\/?>/gi, "\n");
    md = md.replace(/&nbsp;/g, " ");
    md = md.replace(/<[^>]+>/g, ""); // Remove other tags
    return md.trim();
  }

  // Expose markdown utilities globally for existing code to use
  window.Markdown = {
    parseMarkdownTable,
    setupNotionHeaders,
    parseFrontmatter,
    escapeHtmlForMarkdown,
  };

  // Initialize header behavior on DOM ready (or immediately if DOM is already loaded)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      try {
        setupNotionHeaders();
      } catch (err) {
        console.error("Failed to initialize markdown headers", err);
      }
    });
  } else {
    try {
      setupNotionHeaders();
    } catch (err) {
      console.error("Failed to initialize markdown headers", err);
    }
  }
})();
