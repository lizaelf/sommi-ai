/**
 * CRITICAL: Centralized voice management system
 * Ensures consistent male voice across ALL components
 */

export class VoiceManager {
  private static instance: VoiceManager;
  private lockedVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;

  private constructor() {
    this.initializeVoice();
  }

  public static getInstance(): VoiceManager {
    if (!VoiceManager.instance) {
      VoiceManager.instance = new VoiceManager();
    }
    return VoiceManager.instance;
  }

  private initializeVoice(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const selectLockedVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      // Try to restore from localStorage first
      const storedVoiceURI = localStorage.getItem('LOCKED_VOICE_URI');
      if (storedVoiceURI) {
        const storedVoice = voices.find(voice => voice.voiceURI === storedVoiceURI);
        if (storedVoice) {
          this.lockedVoice = storedVoice;
          this.isInitialized = true;
          console.log("VOICE MANAGER: Restored locked voice:", storedVoice.name);
          return;
        }
      }

      // Select new voice with strict priority
      let selectedVoice: SpeechSynthesisVoice | undefined;

      // PRIORITY 1: Google UK English Male
      selectedVoice = voices.find(voice => voice.name === 'Google UK English Male');

      // PRIORITY 2: Google US English Male
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.name === 'Google US English Male');
      }

      // PRIORITY 3: Any Google male voice with English
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.includes('Google') && 
          voice.name.includes('Male') && 
          voice.lang.startsWith('en')
        );
      }

      // PRIORITY 4: Any English male voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.includes('Male') && 
          voice.lang.startsWith('en')
        );
      }

      if (selectedVoice) {
        this.lockedVoice = selectedVoice;
        this.isInitialized = true;
        
        // Store in localStorage for persistence
        localStorage.setItem('LOCKED_VOICE_URI', selectedVoice.voiceURI);
        localStorage.setItem('LOCKED_VOICE_NAME', selectedVoice.name);
        
        console.log("VOICE MANAGER: Locked male voice:", selectedVoice.name);
      }
    };

    // Try immediate selection
    selectLockedVoice();

    // Also listen for voice changes
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = selectLockedVoice;
    }
  }

  public getLockedVoice(): SpeechSynthesisVoice | null {
    if (!this.isInitialized) {
      this.initializeVoice();
    }
    return this.lockedVoice;
  }

  public createUtterance(text: string): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voice = this.getLockedVoice();
    if (voice) {
      utterance.voice = voice;
      console.log("VOICE MANAGER: Using locked voice:", voice.name);
    } else {
      console.warn("VOICE MANAGER: No locked voice available");
    }

    return utterance;
  }

  public speak(text: string, onEnd?: () => void, onError?: () => void): void {
    if (!text || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = this.createUtterance(text);
    
    if (onEnd) {
      utterance.onend = onEnd;
    }
    
    if (onError) {
      utterance.onerror = onError;
    }

    window.speechSynthesis.speak(utterance);
  }

  public cancel(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

// Export singleton instance
export const voiceManager = VoiceManager.getInstance();

// Make globally available for legacy code
declare global {
  interface Window {
    voiceManager: VoiceManager;
  }
}

if (typeof window !== 'undefined') {
  window.voiceManager = voiceManager;
}