// Note Font & Fullscreen Handler
// This script handles per-note font settings and fullscreen toggle from editor menu

(function() {
  'use strict';

  // Setup font controls for each editor
  function setupNoteFontControls(editor, note) {
    const fontIncreaseBtn = editor.querySelector('[data-action="font-increase"]');
    const fontDecreaseBtn = editor.querySelector('[data-action="font-decrease"]');
    const fontFamilySelect = editor.querySelector('.font-family-select');
    const fontSizeLabel = editor.querySelector('.font-size-label');
    const contentEditable = editor.querySelector('.content.editable');
    const fullscreenBtn = editor.querySelector('[data-action="fullscreen"]');

    if (!contentEditable) return;

    // Initialize note font settings if not present
    if (!note.fontSize) note.fontSize = 16;
    if (!note.fontFamily) note.fontFamily = "Arial, sans-serif";

    // Apply saved font settings
    contentEditable.style.fontSize = note.fontSize + 'px';
    contentEditable.style.fontFamily = note.fontFamily;
    if (fontSizeLabel) fontSizeLabel.textContent = note.fontSize + 'px';
    if (fontFamilySelect) fontFamilySelect.value = note.fontFamily;

    // Font increase
    if (fontIncreaseBtn) {
      fontIncreaseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        note.fontSize = Math.min(note.fontSize + 2, 32);
        contentEditable.style.fontSize = note.fontSize + 'px';
        if (fontSizeLabel) fontSizeLabel.textContent = note.fontSize + 'px';
        if (window.saveNotes) window.saveNotes();
        console.log('✓ Font size increased to', note.fontSize);
      });
    }

    // Font decrease
    if (fontDecreaseBtn) {
      fontDecreaseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        note.fontSize = Math.max(note.fontSize - 2, 10);
        contentEditable.style.fontSize = note.fontSize + 'px';
        if (fontSizeLabel) fontSizeLabel.textContent = note.fontSize + 'px';
        if (window.saveNotes) window.saveNotes();
        console.log('✓ Font size decreased to', note.fontSize);
      });
    }

    // Font family change
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener('change', (e) => {
        e.stopPropagation();
        note.fontFamily = fontFamilySelect.value;
        contentEditable.style.fontFamily = note.fontFamily;
        if (window.saveNotes) window.saveNotes();
        console.log('✓ Font family changed to', note.fontFamily);
      });
    }

    // Fullscreen toggle
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.toggleFullscreen === 'function') {
          window.toggleFullscreen();
        } else if (typeof toggleFullscreen === 'function') {
          toggleFullscreen();
        } else {
          // Fallback: toggle fullscreen class
          document.body.classList.toggle('fullscreen');
        }
        // Close the menu
        const editorMenu = editor.querySelector('.editor-menu');
        if (editorMenu) editorMenu.classList.remove('open');
        console.log('✓ Fullscreen toggled');
      });
    }
  }

  // Auto-setup for dynamically created editors
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.classList && node.classList.contains('editor')) {
          const noteId = node.dataset.noteId;
          if (noteId && window.state && window.state.notes) {
            const note = window.state.notes.find(n => n.id === noteId);
            if (note) {
              setupNoteFontControls(node, note);
            }
          }
        }
      });
    });
  });

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Expose setup function globally
  window.setupNoteFontControls = setupNoteFontControls;

  console.log('✓ Note font handler initialized');
})();
