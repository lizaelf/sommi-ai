// Clean Voice System - Minimal logging, maximum reliability
class CleanVoiceSystem {
  constructor() {
    this.selectedVoice = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve) => {
      const selectVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return false;

        // Find male voice with strict priority
        const maleVoice = 
          voices.find(v => v.name === 'Google UK English Male') ||
          voices.find(v => v.name === 'Google US English Male') ||
          voices.find(v => v.name.includes('Google') && v.name.includes('Male')) ||
          voices.find(v => v.name.toLowerCase().includes('male')) ||
          voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('female'));

        if (maleVoice) {
          this.selectedVoice = maleVoice;
          this.isInitialized = true;
          window.selectedVoice = maleVoice;
          localStorage.setItem('LOCKED_VOICE_URI', maleVoice.voiceURI);
          localStorage.setItem('LOCKED_VOICE_NAME', maleVoice.name);
          resolve(maleVoice);
          return true;
        }
        return false;
      };

      if (selectVoice()) return;
      
      // Wait for voices to load
      const voicesChangedHandler = () => {
        if (selectVoice()) {
          window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
      
      // Trigger voice loading
      window.speechSynthesis.getVoices();
    });

    return this.initPromise;
  }

  getVoice() {
    return this.selectedVoice;
  }

  async speak(text) {
    if (!text) return;
    
    await this.initialize();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    
    return utterance;
  }
}

// Global instance
window.cleanVoiceSystem = new CleanVoiceSystem();

// Replace global speakResponse function
window.speakResponse = async function(text) {
  try {
    await window.cleanVoiceSystem.speak(text);
  } catch (error) {
    console.error('Speech synthesis failed:', error);
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cleanVoiceSystem.initialize();
  });
} else {
  window.cleanVoiceSystem.initialize();
}

export default window.cleanVoiceSystem;