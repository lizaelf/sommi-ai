import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupAudioContextInitialization, setupUserInteractionTracking } from "./lib/audioContext";
import { enableDarkMode } from "./utils/darkMode";
import "@fontsource/lora"; // Import Lora font

// Force English language for the entire application
document.documentElement.lang = 'en';
if (navigator.language) {
  Object.defineProperty(navigator, 'language', {
    writable: true,
    value: 'en-US'
  });
}
if (navigator.languages) {
  Object.defineProperty(navigator, 'languages', {
    writable: true,
    value: ['en-US', 'en']
  });
}

// Initialize audio context on page load
setupAudioContextInitialization();

// Set up user interaction tracking for audio permissions
setupUserInteractionTracking();

// Enable dark mode by default
enableDarkMode();

createRoot(document.getElementById("root")!).render(<App />);
