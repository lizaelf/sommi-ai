// Global audio context initialization for the application
// This ensures audio playback works consistently across the app

// Track if audio context has been initialized
let audioContextInitialized = false;
let userHasInteracted = false;

// Track user interactions to enable audio playback
function trackUserInteraction() {
  if (!userHasInteracted) {
    userHasInteracted = true;
    console.log('User interaction detected - audio playback now allowed');
    
    // Initialize audio context immediately on first interaction
    initAudioContext();
    
    // Try to play any pending autoplay audio
    if ((window as any).pendingAutoplayAudio) {
      console.log('Playing previously blocked autoplay audio after user interaction');
      const pendingAudio = (window as any).pendingAutoplayAudio;
      (window as any).pendingAutoplayAudio = null;
      
      pendingAudio.play().then(() => {
        console.log('Pending autoplay audio started after user interaction');
      }).catch((error: any) => {
        console.error('Failed to play pending autoplay audio:', error);
      });
    }
  }
}

// Set up interaction listeners
export function setupUserInteractionTracking() {
  const events = ['click', 'touchstart', 'keydown', 'mousedown'];
  
  events.forEach(eventType => {
    document.addEventListener(eventType, trackUserInteraction, { once: true, passive: true });
  });
}

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
      
      // Also create a dummy audio element to unlock audio on iOS/Safari
      const dummyAudio = new Audio();
      dummyAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==";
      dummyAudio.volume = 0;
      
      return audioCtx.resume().then(() => {
        console.log('Audio context started successfully');
        audioContextInitialized = true;
        
        // Try to play and immediately pause the dummy audio to unlock
        dummyAudio.play().then(() => {
          dummyAudio.pause();
          console.log('Audio unlocked successfully');
        }).catch(() => {
          console.log('Audio unlock not needed or failed silently');
        });
        
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

// Function to check if audio context is initialized
export function isAudioContextInitialized(): boolean {
  return audioContextInitialized;
}

// Function to check if user has interacted
export function hasUserInteracted(): boolean {
  return userHasInteracted;
}

// Function to unlock audio for the session (required for some browsers)
export function unlockAudioForSession(): Promise<boolean> {
  return initAudioContext();
}

// Export a function to add the event listener
export function setupAudioContextInitialization(): void {
  // Expose functions globally for components
  (window as any).initAudioContext = initAudioContext;
  (window as any).hasUserInteracted = hasUserInteracted;
  (window as any).isAudioContextInitialized = isAudioContextInitialized;
  
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