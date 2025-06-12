import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupAudioContextInitialization, setupUserInteractionTracking } from "./lib/audioContext";
import { enableDarkMode } from "./utils/darkMode";
import "@fontsource/lora"; // Import Lora font

// Global error handling to prevent unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Prevent the default behavior (console error)
  event.preventDefault();
  
  // Log only network-related errors for debugging
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('fetch') || event.reason.message.includes('network'))) {
    console.debug('Network request failed silently:', event.reason.message);
  }
});

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

createRoot(document.getElementById("root")!).render(<App />);
