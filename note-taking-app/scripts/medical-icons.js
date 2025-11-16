// Medical Icons for Notes and Folders
// Now using plain emojis instead of SVG for simplicity.
const medicalIcons = {
  anatomy: "🦴",
  physiology: "⚡",
  pathology: "🧫",
  clinical: "🩺",
  surgery: "🩸",
  // Use a very common medical symbol instead of lungs (better font support)
  internal: "⚕️",
  pharma: "💊",
  cardiology: "❤️",
  neurology: "🧠",
  // Defaults
  // Default icon for notes
  default: "📝",
  // Default icon for folders
  folderDefault: "📁",
};

// Function to get icon HTML by type
function getIcon(type) {
  return medicalIcons[type] || medicalIcons.default;
}

export { medicalIcons, getIcon };
