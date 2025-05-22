import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupAudioContextInitialization } from "./lib/audioContext";
import { enableDarkMode } from "./utils/darkMode";
import "@fontsource/lora"; // Import Lora font

// Initialize audio context on page load
setupAudioContextInitialization();

// Enable dark mode by default
enableDarkMode();

createRoot(document.getElementById("root")!).render(<App />);
