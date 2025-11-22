// Medical Icons for Notes and Folders
// Using SVG icons - simplified to defaults only

// SVG icon templates
const svgIcons = {
  // Document/note icon
  note: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  
  // Folder icon
  folder: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
};

const medicalIcons = {
  // All types use default icons for now
  default: svgIcons.note,
  folderDefault: svgIcons.folder,
};

// Function to get icon HTML by type
// If type is 'folder' or 'folderDefault', return folder icon
// Otherwise return note icon
function getIcon(type) {
  if (type === 'folder' || type === 'folderDefault') {
    return medicalIcons.folderDefault;
  }
  return medicalIcons.default;
}

// Make globally available
window.getIcon = getIcon;

export { medicalIcons, getIcon };
