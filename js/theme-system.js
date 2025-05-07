/**
 * Enhanced Theme System
 * Provides a sophisticated theme management system with multiple color schemes
 */

// Theme definitions
const themes = [
  { name: "Default Light", values: { "--primary-color": "#ff6b35", "--secondary-color": "#f6f8fa", "--accent-color": "#3498FF", "--background-color": "#f4f7fa", "--surface-color": "#ffffff", "--text-color": "#212529", "--border-color": "#dee2e6" } },
  { name: "Midnight Dark", values: { "--primary-color": "#58a6ff", "--secondary-color": "#161b22", "--accent-color": "#f78166", "--background-color": "#0d1117", "--surface-color": "#161b22", "--text-color": "#c9d1d9", "--border-color": "#30363d" } },
  { name: "Ocean Breeze", values: { "--primary-color": "#0077b6", "--secondary-color": "#e0f2f7", "--accent-color": "#ffca28", "--background-color": "#caf0f8", "--surface-color": "#ffffff", "--text-color": "#023047", "--border-color": "#ade8f4" } },
  { name: "Forest Canopy", values: { "--primary-color": "#588157", "--secondary-color": "#dad7cd", "--accent-color": "#e76f51", "--background-color": "#f4f1de", "--surface-color": "#ffffff", "--text-color": "#344e41", "--border-color": "#a3b18a" } },
  { name: "Sunset Glow", values: { "--primary-color": "#e63946", "--secondary-color": "#f1faee", "--accent-color": "#457b9d", "--background-color": "#fff0e5", "--surface-color": "#ffffff", "--text-color": "#331a3f", "--border-color": "#fca311" } }
];

let currentThemeIndex = 0; // Start with the first theme
const themeToggleButton = document.getElementById('theme-toggle');
const root = document.documentElement; // Get the root element (<html>)

function applyTheme(themeIndex) {
  // Handle string values for backward compatibility
  if (typeof themeIndex === 'string') {
    if (themeIndex === 'light') {
      themeIndex = 0; // Default Light theme index
    } else if (themeIndex === 'dark') {
      themeIndex = 1; // Midnight Dark theme index
    } else {
      // If an unrecognized string is passed, default to light theme
      themeIndex = 0;
    }
  }
  
  // Ensure themeIndex is a valid number
  themeIndex = parseInt(themeIndex) || 0;
  
  // Validate themeIndex is within bounds
  if (themeIndex < 0 || themeIndex >= themes.length) {
    console.warn(`Theme index ${themeIndex} out of bounds. Defaulting to theme 0.`);
    themeIndex = 0;
  }
  
  const theme = themes[themeIndex];
  console.log(`Applying theme: ${theme.name}`);
  for (const [property, value] of Object.entries(theme.values)) {
    root.style.setProperty(property, value);
  }
  
  // Store current theme index
  currentThemeIndex = themeIndex;
  
  // Optional: Save preference to localStorage
  try {
    localStorage.setItem('selectedThemeIndex', themeIndex);
  } catch (e) {
    console.warn('Could not save theme preference to localStorage:', e);
  }
}

// Ensure the button exists before adding the listener
if (themeToggleButton) {
  themeToggleButton.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length; // Cycle through themes
    applyTheme(currentThemeIndex);
  });
} else {
  console.error('Theme toggle button not found!');
}

// Function to load saved theme preference
function loadThemePreference() {
  let savedThemeIndex = 0; // Default to the first theme
  try {
    const savedIndex = localStorage.getItem('selectedThemeIndex');
    if (savedIndex !== null) {
      // Handle both numeric indices and legacy string values
      if (typeof savedIndex === 'string' && (savedIndex === 'light' || savedIndex === 'dark')) {
        // Convert legacy theme values to proper indices
        savedThemeIndex = savedIndex === 'dark' ? 1 : 0; // 'dark' maps to Midnight Dark (index 1), 'light' to Default Light (index 0)
        // Clean up legacy value by saving the proper index
        localStorage.setItem('selectedThemeIndex', savedThemeIndex.toString());
      } else {
        const parsedIndex = parseInt(savedIndex, 10);
        // Validate the saved index
        if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < themes.length) {
          savedThemeIndex = parsedIndex;
        }
      }
    }
    
    // Also check for the old theme key and migrate if needed
    const oldTheme = localStorage.getItem('theme');
    if (oldTheme !== null && (oldTheme === 'light' || oldTheme === 'dark')) {
      savedThemeIndex = oldTheme === 'dark' ? 1 : 0;
      // Migrate to new storage key and remove old one
      localStorage.setItem('selectedThemeIndex', savedThemeIndex.toString());
      localStorage.removeItem('theme');
    }
  } catch (e) {
    console.warn('Could not load theme preference from localStorage:', e);
  }
  currentThemeIndex = savedThemeIndex;
  applyTheme(currentThemeIndex);
}

// Load saved theme or apply default on page load
document.addEventListener('DOMContentLoaded', loadThemePreference);