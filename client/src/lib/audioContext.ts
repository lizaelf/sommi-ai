// Global audio context initialization for the application
// This ensures audio playback works consistently across the app

// Track if audio context has been initialized
let audioContextInitialized = false;
let userHasInteracted = false;
let audioUnlocked = false;

// Silent audio data - very short empty MP3
const silentAudioData = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAACQAAAA=";

// Unlock audio on first user interaction
function unlockAudio() {
  if (audioUnlocked) return;
  
  try {
    console.log('Unlocking audio with silent audio object');
    const silentAudio = new Audio();
    silentAudio.src = silentAudioData;
    silentAudio.volume = 0;
    silentAudio.play().then(() => {
      audioUnlocked = true;
      console.log('Audio unlocked successfully');
    }).catch((error) => {
      console.log('Silent audio play failed, but this is expected on some browsers:', error);
      audioUnlocked = true; // Still mark as unlocked since we tried
    });
  } catch (error) {
    console.error('Error creating silent audio for unlock:', error);
  }
}

// Track user interactions to enable audio playback
function trackUserInteraction() {
  if (!userHasInteracted) {
    userHasInteracted = true;
    console.log('User interaction detected - audio playback now allowed');
    
    // Unlock audio immediately
    unlockAudio();
    
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
      
      return audioCtx.resume().then(() => {
        console.log('Audio context started successfully');
        audioContextInitialized = true;
        
        // Unlock audio with silent audio on context initialization
        unlockAudio();
        
        return true;
      }).catch((error) => {
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