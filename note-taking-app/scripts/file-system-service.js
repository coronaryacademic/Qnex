// File System Service - Handles all file system operations via REST API
// File System Service - Handles all file system operations via REST API
// Version 1.2 - Dual-port auto-discovery
class FileSystemService {
  constructor() {
    // Candidates to check
    this.ports = [3001, 3002];
    this.baseUrl = "http://localhost:3001/api"; // Default start
    this.fallbackUrl = "http://localhost:3002/api";
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.isOffline = false; // Track connectivity state to prevent console spam

    // Auto-discover which port is active
    this.readyPromise = this.init();
  }

  async waitForReady() {
    return this.readyPromise;
  }

  async init() {
    console.log("[FileSystemService] Probing for active server...");
    for (const port of this.ports) {
      const url = `http://localhost:${port}/api`;
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 200); // Reduced timeout for faster offline detection
        const res = await fetch(`${url}/health`, { signal: controller.signal });
        clearTimeout(id);

        if (res.ok) {
          try {
            const data = await res.json();
            if (data && data.status === 'OK') {
              console.log(`[FileSystemService] ✅ Verified active server at port ${port}`);
              this.baseUrl = url;
              this.fallbackUrl = `http://localhost:${port === 3001 ? 3002 : 3001}/api`;
              this.isOffline = false;
              return;
            }
          } catch (err) {
            console.warn(`[FileSystemService] ⚠️ Port ${port} responded but content invalid:`, err);
          }
        }
      } catch (e) {
        // Continue probing
      }
    }
    console.warn("[FileSystemService] ⚠️ No active server found during probe. Using baseline:", this.baseUrl);
    this.isOffline = true;
  }

  // Helper method for making HTTP requests with retry logic
  async makeRequest(url, options = {}) {
    // Ensure we've finished probing before making requests
    await this.waitForReady();

    // If we determined we are offline, don't attempt fetch to avoid browser console errors
    if (this.isOffline) {
      throw new Error("SERVER_OFFLINE");
    }

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    };

    const tryRequest = async (targetBaseUrl) => {
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          const response = await fetch(`${targetBaseUrl}${url}`, defaultOptions);

          // If it's a 404, we don't retry on the SAME port, 
          // but we might want to try the OTHER port if this is the primary.
          if (response.status === 404) {
            return { status: 404, statusText: response.statusText };
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await response.json();
          } else {
            return await response.text();
          }
        } catch (error) {
          if (attempt === this.retryAttempts) throw error;
          await new Promise(r => setTimeout(r, this.retryDelay * attempt));
        }
      }
    };

    try {
      const result = await tryRequest(this.baseUrl);
      // if 404 and we have a fallback, try fallback
      if (result && result.status === 404 && this.baseUrl !== this.fallbackUrl) {
        console.log(`[SERVICE] 404 on ${this.baseUrl}, trying fallback ${this.fallbackUrl}`);
        this.baseUrl = this.fallbackUrl;
        return await this.makeRequest(url, options);
      }

      // If result is a 404 object (meaning it's the final fallback that 404'd)
      if (result && result.status === 404) {
        throw new Error(`HTTP 404: ${result.statusText}`);
      }

      return result;
    } catch (error) {
      if (this.baseUrl !== this.fallbackUrl) {
        console.log(`[SERVICE] Error on ${this.baseUrl}, trying fallback ${this.fallbackUrl}`);
        this.baseUrl = this.fallbackUrl;
        return await this.makeRequest(url, options);
      }
      throw error;
    }
  }

  // Check if server is running
  async checkHealth() {
    await this.waitForReady();
    if (this.isOffline) return false;
    
    try {
      const response = await this.makeRequest("/health");
      return response.status === "OK";
    } catch (error) {
      // console.error("Health check failed:", error); // Suppress log
      return false;
    }
  }

  // NOTES OPERATIONS

  async loadNotes() {
    try {
      const notes = await this.makeRequest("/notes");
      return Array.isArray(notes) ? notes : [];
    } catch (error) {
      console.error("Error loading notes:", error);
      throw error;
    }
  }

  async saveNote(noteId, noteData) {
    try {
      const response = await this.makeRequest(`/notes/${noteId}`, {
        method: "POST",
        body: JSON.stringify(noteData),
      });
      return response;
    } catch (error) {
      console.error("Error saving note:", error);
      throw error;
    }
  }

  async saveNotes(notes) {
    try {
      const response = await this.makeRequest('/notes', {
        method: 'POST',
        body: JSON.stringify(notes),
      });
      return response;
    } catch (error) {
      console.error('Error batch saving notes:', error);
      throw error;
    }
  }

  async deleteNoteFromCollection(noteId) {
    try {
      const response = await this.makeRequest(`/notes/${noteId}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      // 404 errors are OK - note doesn't exist (already deleted or never existed)
      const is404 =
        error.message?.includes("404") || error.message?.includes("Not Found");
      if (is404) {
        // Silently succeed for 404 - the note is gone, which is what we wanted
        // Don't log anything - 404 on delete is expected behavior
        return {
          success: true,
          message: "Note already deleted or does not exist",
        };
      }
      // Only log non-404 errors
      console.error("Error deleting note:", error);
      throw error;
    }
  }

  // FOLDERS OPERATIONS

  async loadFolders() {
    try {
      const folders = await this.makeRequest("/folders");
      return Array.isArray(folders) ? folders : [];
    } catch (error) {
      console.error("Error loading folders:", error);
      throw error;
    }
  }

  async saveFolders(folders) {
    try {
      const response = await this.makeRequest("/folders", {
        method: "POST",
        body: JSON.stringify(folders),
      });
      return response;
    } catch (error) {
      console.error("Error saving folders:", error);
      throw error;
    }
  }

  async deleteFolderFromCollection(folderId) {
    try {
      const response = await this.makeRequest(`/folders/${folderId}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      // 404 errors are OK - folder doesn't exist (already deleted or never existed)
      const is404 =
        error.message?.includes("404") || error.message?.includes("Not Found");
      if (is404) {
        // Silently succeed for 404 - the folder is gone, which is what we wanted
        // Don't log anything - 404 on delete is expected behavior
        return {
          success: true,
          message: "Folder already deleted or does not exist",
        };
      }
      console.error("Error deleting folder:", error);
      throw error;
    }
  }

  // QUESTIONS OPERATIONS

  async loadQuestions() {
    try {
      const data = await this.makeRequest("/questions");
      return data || { questions: [], folders: [] };
    } catch (error) {
      console.error("Error loading questions:", error);
      return { questions: [], folders: [] };
    }
  }

  async saveQuestions(data) {
    try {
      const response = await this.makeRequest("/questions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("Error saving questions:", error);
      throw error;
    }
  }

  // IMAGE OPERATIONS
  async uploadImage(imageName, base64Data) {
    try {
      const response = await this.makeRequest("/upload", {
        method: "POST",
        body: JSON.stringify({
          image: base64Data,
          name: imageName
        }),
      });
      return response;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  // TRASH OPERATIONS

  async loadTrash() {
    try {
      const trash = await this.makeRequest("/trash");
      return Array.isArray(trash) ? trash : [];
    } catch (error) {
      console.error("Error loading trash:", error);
      throw error;
    }
  }

  async saveTrash(trashItems) {
    try {
      const response = await this.makeRequest("/trash", {
        method: "POST",
        body: JSON.stringify(trashItems),
      });
      return response;
    } catch (error) {
      console.error("Error saving trash:", error);
      throw error;
    }
  }

  async deleteTrashItem(itemId) {
    try {
      // Load current trash, remove item, save back
      const currentTrash = await this.loadTrash();
      const updatedTrash = currentTrash.filter((item) => item.id !== itemId);
      return await this.saveTrash(updatedTrash);
    } catch (error) {
      console.error("Error deleting trash item:", error);
      throw error;
    }
  }

  async clearAllTrash() {
    try {
      const response = await this.makeRequest("/trash", {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Error clearing trash:", error);
      throw error;
    }
  }

  // SETTINGS OPERATIONS

  async loadSettings() {
    try {
      const settings = await this.makeRequest("/settings");
      return settings || {};
    } catch (error) {
      if (error.message !== "SERVER_OFFLINE") {
        console.warn(
          "Error loading settings from server, returning defaults:",
          error
        );
      }
      // Return empty object instead of throwing - let app.js handle defaults
      return {};
    }
  }

  async saveSettings(settings) {
    try {
      const response = await this.makeRequest("/settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      return response;
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  }

  // FILE STRUCTURE OPERATIONS (for sidebar)

  async getFileStructure() {
    try {
      const structure = await this.makeRequest("/file-structure");
      return structure || { folders: [], notes: [] };
    } catch (error) {
      console.error("Error getting file structure:", error);
      throw error;
    }
  }

  // UTILITY METHODS

  // Check if the file system service is available
  async isAvailable() {
    return await this.checkHealth();
  }

  // Get server status information
  async getServerInfo() {
    try {
      return await this.makeRequest("/health");
    } catch (error) {
      return {
        status: "ERROR",
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Delete all notes
  async deleteAllNotes() {
    try {
      const response = await this.makeRequest("/notes", {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Error deleting all notes:", error);
      throw error;
    }
  }

  // Create backup
  async createBackup() {
    try {
      const response = await this.makeRequest("/backup", {
        method: "POST",
      });
      return response;
    } catch (error) {
      console.error("Error creating backup:", error);
      throw error;
    }
  }

  // AI OPERATIONS
  async chatWithAI(messages, maxTokens = 200) {
    try {
      const response = await this.makeRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: messages,
          max_tokens: maxTokens
        }),
      });
      return response;
    } catch (error) {
      console.error("AI Chat Error:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const fileSystemService = new FileSystemService();
export default fileSystemService;
