// Type definitions for the note-taking app

/**
 * Represents a note in the application
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  tags?: string[];
  color?: string;
}

/**
 * Represents a folder in the application
 */
export interface Folder {
  id: string;
  name: string;
  icon: string;
  color?: string;
  createdAt: number;
  parentId?: string | null;
}

/**
 * Represents an item in the trash
 */
export interface TrashItem {
  id: string;
  type: 'note' | 'folder';
  data: Note | Folder;
  deletedAt: number;
  originalParentId?: string | null;
}

/**
 * Application settings
 */
export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoBackup: boolean;
  highlightColor: string;
  autoHighlight: boolean;
  sidebarWidth?: number;
  viewMode?: 'list' | 'grid' | 'compact';
}

/**
 * Window state for managing multiple note windows
 */
export interface WindowState {
  id: string;
  noteId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

/**
 * Editor instance interface
 */
export interface EditorInstance {
  container: HTMLElement;
  noteId: string;
  getContent(): string;
  setContent(content: string): void;
  focus(): void;
  destroy(): void;
}

/**
 * Storage service interface
 */
export interface StorageService {
  loadNotes(): Promise<Note[]>;
  saveNotes(notes: Note[]): Promise<void>;
  loadFolders(): Promise<Folder[]>;
  saveFolders(folders: Folder[]): Promise<void>;
  loadSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  loadTrash(): Promise<TrashItem[]>;
  saveTrash(trash: TrashItem[]): Promise<void>;
  deleteNoteFromFileSystem(noteId: string): Promise<void>;
  deleteFolderFromFileSystem(folderId: string): Promise<void>;
  saveNote(noteId: string, noteData: Note): Promise<void>;
  uploadImage(file: File, noteId: string): Promise<string>;
  uploadImages(files: FileList, noteId: string): Promise<string[]>;
}

/**
 * Context menu item
 */
export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
}

/**
 * Search result
 */
export interface SearchResult {
  noteId: string;
  title: string;
  snippet: string;
  matches: number;
  folderId: string | null;
}

/**
 * Drag and drop data
 */
export interface DragData {
  type: 'note' | 'folder' | 'image';
  id: string;
  data?: any;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'html' | 'markdown' | 'pdf' | 'json';
  includeImages: boolean;
  includeFolders: boolean;
  includeMetadata: boolean;
}

/**
 * Workspace data structure
 */
export interface WorkspaceData {
  notes: Note[];
  folders: Folder[];
  settings: Settings;
  trash: TrashItem[];
  version: string;
}
