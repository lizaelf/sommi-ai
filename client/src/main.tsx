import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupAudioContextInitialization, setupUserInteractionTracking } from "./lib/audioContext";
import "./lib/cleanVoiceSystem";
import { enableDarkMode } from "./utils/darkMode";
import "@fontsource/lora"; // Import Lora font

// Force English language for the entire application
document.documentElement.lang = 'en-US';
document.documentElement.setAttribute('data-locale', 'en-US');

// Override navigator language properties
Object.defineProperty(navigator, 'language', {
  writable: false,
  configurable: false,
  value: 'en-US'
});

Object.defineProperty(navigator, 'languages', {
  writable: false,
  configurable: false,
  value: ['en-US', 'en']
});

// Force all date/time formatting to English
document.addEventListener('DOMContentLoaded', () => {
  // Force all existing date inputs to use English locale
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach((input: any) => {
    input.setAttribute('lang', 'en-US');
  });
  
  // Monitor for dynamically added date inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node: any) => {
        if (node.nodeType === 1) { // Element node
          if (node.type === 'date') {
            node.setAttribute('lang', 'en-US');
          }
          // Check children
          const dateInputs = node.querySelectorAll && node.querySelectorAll('input[type="date"]');
          if (dateInputs) {
            dateInputs.forEach((input: any) => {
              input.setAttribute('lang', 'en-US');
            });
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Initialize audio context on page load
setupAudioContextInitialization();

// Set up user interaction tracking for audio permissions
setupUserInteractionTracking();

// Enable dark mode by default
enableDarkMode();

// Create React app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Show the page once React has mounted and fonts are ready
Promise.all([
  document.fonts.ready,
  new Promise(resolve => {
    // Wait for next frame to ensure React has rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  })
]).then(() => {
  document.body.classList.add('ready');
  
  // Remove any loading overlay
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    setTimeout(() => loadingOverlay.remove(), 150);
  }
});
