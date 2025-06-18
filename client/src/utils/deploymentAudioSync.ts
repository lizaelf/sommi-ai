// Deployment audio synchronization utility
// Ensures voice assistant functionality works identically in Replit and deployed versions

interface AudioManager {
  currentAudio: HTMLAudioElement | null;
  isPlaying: boolean;
  stop: () => void;
  cleanup: () => void;
}

class DeploymentAudioManager implements AudioManager {
  currentAudio: HTMLAudioElement | null = null;
  isPlaying: boolean = false;
  private audioElements: Set<HTMLAudioElement> = new Set();

  constructor() {
    this.initializeGlobalHandlers();
  }

  private initializeGlobalHandlers() {
    // Global audio stop handler for deployment compatibility
    (window as any).deploymentStopAudio = () => {
      this.stop();
    };

    // Listen for deployment-specific audio events
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Prevent multiple audio instances
    document.addEventListener('play', (event) => {
      const audio = event.target as HTMLAudioElement;
      if (audio.tagName === 'AUDIO') {
        this.trackAudio(audio);
      }
    }, true);
  }

  private trackAudio(audio: HTMLAudioElement) {
    this.audioElements.add(audio);
    
    audio.addEventListener('ended', () => {
      this.audioElements.delete(audio);
      if (audio === this.currentAudio) {
        this.currentAudio = null;
        this.isPlaying = false;
      }
    });

    audio.addEventListener('pause', () => {
      if (audio === this.currentAudio) {
        this.isPlaying = false;
      }
    });
  }

  setCurrentAudio(audio: HTMLAudioElement) {
    // Stop previous audio
    this.stop();
    
    this.currentAudio = audio;
    this.isPlaying = true;
    this.trackAudio(audio);
  }

  stop() {
    // Stop current audio reference
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (error) {
        console.warn("Error stopping current audio:", error);
      }
      this.currentAudio = null;
    }

    // Stop all tracked audio elements
    this.audioElements.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {
        console.warn("Error stopping tracked audio:", error);
      }
    });

    // Fallback: stop all audio elements in DOM
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      try {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      } catch (error) {
        console.warn("Error stopping DOM audio:", error);
      }
    });

    this.isPlaying = false;
    this.audioElements.clear();

    // Dispatch stop event for component synchronization
    window.dispatchEvent(new CustomEvent('deploymentAudioStopped'));
  }

  cleanup() {
    this.stop();
    this.audioElements.clear();
  }
}

// Global audio manager instance
export const deploymentAudioManager = new DeploymentAudioManager();

// Deployment-specific audio utilities
export const deploymentAudioUtils = {
  // Enhanced play function with deployment compatibility
  playAudio: (audioSrc: string): Promise<HTMLAudioElement> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioSrc);
      
      audio.onloadeddata = () => {
        deploymentAudioManager.setCurrentAudio(audio);
        
        audio.play()
          .then(() => resolve(audio))
          .catch(reject);
      };
      
      audio.onerror = reject;
    });
  },

  // Stop all audio with deployment compatibility
  stopAllAudio: () => {
    deploymentAudioManager.stop();
    
    // Additional deployment-specific cleanup
    if ((window as any).voiceAssistantState) {
      (window as any).voiceAssistantState.isPlayingAudio = false;
    }
    
    // Trigger global stop functions
    if ((window as any).stopVoiceAudio) {
      (window as any).stopVoiceAudio();
    }
  },

  // Check if audio is currently playing
  isAudioPlaying: (): boolean => {
    return deploymentAudioManager.isPlaying;
  }
};

// Export for global access
(window as any).deploymentAudioUtils = deploymentAudioUtils;