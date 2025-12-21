
  // ===================================
  // Persistence for Split View
  // ===================================

  let _saveTimeout = null;
  // Debounced save to prevent spamming the backend
  function saveTwoBaseSession() {
      // Use debounce
      if (_saveTimeout) clearTimeout(_saveTimeout);
      
      _saveTimeout = setTimeout(async () => {
          if (!window.Storage) return;
          
          try {
              // 1. Load current settings to ensure we don't overwrite other unrelated settings
              // Note: loadSettings handles errors and returns object
              const currentSettings = await window.Storage.loadSettings();
              
              const newSessionState = {
                  splitView: TwoBaseState.splitView,
                  leftPaneNote: TwoBaseState.leftPaneNote,
                  rightPaneNote: TwoBaseState.rightPaneNote,
                  activeNote: TwoBaseState.activeNote,
                  openNotes: TwoBaseState.openNotes,
                  // Save the split ratio if split view is active
                  splitPercentage: TwoBaseState.splitView && el.notePaneLeft ? el.notePaneLeft.style.flexBasis || el.notePaneLeft.style.flex : null
              };
              
              // 2. Merge
              const updatedSettings = {
                  ...currentSettings,
                  splitViewState: newSessionState
              };
              
              // 3. Save
              await window.Storage.saveSettings(updatedSettings);
              // console.log("[TwoBase] Session state saved", newSessionState);
          } catch (err) {
              console.error("[TwoBase] Failed to save session state:", err);
          }
      }, 1000); // 1s debounce
  }
  
  // Restore function - to be called after init
  async function restoreTwoBaseSession() {
      if (!window.Storage) return;
      
      try {
          const settings = await window.Storage.loadSettings();
          const savedState = settings.splitViewState;
          
          if (!savedState) return; // No saved state
          
          console.log("[TwoBase] Restoring session:", savedState);
          
          // Restore Open Notes first
          if (Array.isArray(savedState.openNotes) && savedState.openNotes.length > 0) {
              TwoBaseState.openNotes = savedState.openNotes;
          }
          
          // Restore Split View
          if (savedState.splitView) {
               // Must have valid notes for split
               const left = savedState.leftPaneNote;
               const right = savedState.rightPaneNote;
               
               if (left && right) {
                   TwoBaseState.leftPaneNote = left;
                   TwoBaseState.rightPaneNote = right;
                   TwoBaseState.splitView = true;
                   
                   // Update UI class immediately
                   if (el.notePaneRight) {
                      el.notePaneRight.classList.remove("hidden");
                      el.notePaneRight.style.display = "flex";
                   }
                   if (el.noteResizer) {
                      el.noteResizer.classList.remove("hidden");
                      el.noteResizer.style.display = "block";
                   }
                   if (el.splitNoteBtn) el.splitNoteBtn.classList.add("active");
                   
                   // Restore split percentage if available
                   if (savedState.splitPercentage && el.notePaneLeft) {
                       // Handle both "flex" and "flex-basis" style strings, or simple percentage
                       let pct = savedState.splitPercentage;
                       // Clean up if it contains "0 0 " (flex shorthand)
                       if (pct.includes("0 0 ")) {
                           pct = pct.replace("0 0 ", "");
                       }
                       el.notePaneLeft.style.flex = `0 0 ${pct}`;
                   }

                   // Set Active
                   TwoBaseState.activeNote = savedState.activeNote || left;
                   
                   // Render will happen when user enters note base or if we force it?
                   // Usually initElements is called early. 
                   // However, renderNoteTabs() updates the UI.
                   renderNoteTabs();
                   
                   // Defer actual editor rendering until they switch to note base?
                   // No, we should assume we might be in note base or going there.
                   // But safe to just set state.
                   // If we are already in note base, we might need to trigger render.
               }
          } else {
              // Single view restore
              if (savedState.activeNote) {
                  TwoBaseState.activeNote = savedState.activeNote;
                  TwoBaseState.leftPaneNote = savedState.activeNote;
                  renderNoteTabs();
              }
          }
          
          // CRITICAL: If we are restoring, we might need to re-render editors if the TwoBase is active
          // But usually this runs on startup.
          // If the user was in Note Base, they might want to return there.
          // For now, we update state so when they click a note, it loads correctly?
          // Or we can pre-load 
          
      } catch (err) {
          console.error("[TwoBase] Failed to restore session:", err);
      }
  }

  // Expose for testing or manual invocation
  window.saveTwoBaseSession = saveTwoBaseSession;
  window.restoreTwoBaseSession = restoreTwoBaseSession;
