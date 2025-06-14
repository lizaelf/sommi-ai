// Streamlined Voice Management System
class VoiceManager {
  constructor() {
    this.lockedVoice = null;
    this.isInitialized = false;
    this.initializationAttempts = 0;
    this.maxAttempts = 3;
  }

  initialize() {
    if (this.isInitialized || this.initializationAttempts >= this.maxAttempts) {
      return;
    }

    this.initializationAttempts++;
    const voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
      // Wait for voices to load
      setTimeout(() => this.initialize(), 100);
      return;
    }

    // Find male voice with priority order
    const maleVoice = this.findMaleVoice(voices);
    
    if (maleVoice) {
      this.lockedVoice = maleVoice;
      this.isInitialized = true;
      
      // Store globally
      window.selectedVoice = maleVoice;
      localStorage.setItem('LOCKED_VOICE_URI', maleVoice.voiceURI);
      localStorage.setItem('LOCKED_VOICE_NAME', maleVoice.name);
      
      console.log('Voice system initialized:', maleVoice.name);
    }
  }

  findMaleVoice(voices) {
    // Priority order for male voices
    const priorities = [
      'Google UK English Male',
      'Google US English Male',
      voice => voice.name.includes('Google') && voice.name.includes('Male'),
      voice => voice.name.toLowerCase().includes('male'),
      voice => voice.lang.startsWith('en') && !voice.name.toLowerCase().includes('female')
    ];

    for (const priority of priorities) {
      let voice;
      if (typeof priority === 'string') {
        voice = voices.find(v => v.name === priority);
      } else {
        voice = voices.find(priority);
      }
      if (voice) return voice;
    }

    return voices[0]; // Fallback
  }

  getVoice() {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.lockedVoice;
  }
}

// Create global instance
window.voiceManager = new VoiceManager();

// Initialize when DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.voiceManager.initialize();
  });
} else {
  window.voiceManager.initialize();
}

// Handle voice changes
if (window.speechSynthesis) {
  let voicesHandled = false;
  window.speechSynthesis.onvoiceschanged = () => {
    if (!voicesHandled) {
      voicesHandled = true;
      window.voiceManager.initialize();
    }
  };
}

export default window.voiceManager;