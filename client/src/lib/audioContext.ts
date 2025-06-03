// Global audio context initialization for the application
// This ensures audio playback works consistently across the app

// Track if audio context has been initialized
let audioContextInitialized = false;

// Track if user has unlocked audio for the session
let audioUnlockedForSession = false;

/**
 * Initialize the audio context on first user interaction
 * This is important because browsers require user interaction before allowing audio playback
 */
export function initAudioContext(): Promise<boolean> {
  if (!audioContextInitialized) {
    try {
      // Create and immediately suspend a silent audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.warn('AudioContext not supported in this browser');
        return Promise.resolve(false);
      }
      
      const audioCtx = new AudioContext();
      return audioCtx.resume().then(() => {
        console.log('Audio context started successfully');
        audioContextInitialized = true;
        return true;
      }).catch(error => {
        console.error('Failed to start audio context:', error);
        return false;
      });
    } catch (error) {
      console.error('Error initializing audio context:', error);
      return Promise.resolve(false);
    }
  }
  
  return Promise.resolve(audioContextInitialized);
}

/**
 * Unlock audio for the session - allows subsequent voice responses to autoplay
 * Call this when user performs any intentional audio interaction (unmute, speak, etc)
 */
export function unlockAudioForSession(): void {
  audioUnlockedForSession = true;
  console.log('Audio unlocked for session - voice responses can now autoplay');
}

/**
 * Check if audio is unlocked for the current session
 */
export function isAudioUnlockedForSession(): boolean {
  return audioUnlockedForSession;
}

// Function to check if audio context is initialized
export function isAudioContextInitialized(): boolean {
  return audioContextInitialized;
}

// Export a function to add the event listener
export function setupAudioContextInitialization(): void {
  // Initialize on any user interaction (only once)
  document.addEventListener('click', () => {
    initAudioContext().then(success => {
      if (success) {
        console.log('Audio context initialized on user interaction');
      }
    });
  }, { once: true });
  
  // Also try to initialize on page load with a timeout
  // (some browsers might allow this without user interaction)
  setTimeout(() => {
    if (!audioContextInitialized) {
      initAudioContext().then(success => {
        if (success) {
          console.log('Audio context initialized on page load');
        }
      });
    }
  }, 1000);
}