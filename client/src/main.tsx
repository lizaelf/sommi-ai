import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupAudioContextInitialization } from "./lib/audioContext";

// Initialize audio context on page load
setupAudioContextInitialization();

createRoot(document.getElementById("root")!).render(<App />);
