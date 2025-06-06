// OpenAI TTS service for reliable cross-platform voice synthesis

class OpenAITTSService {
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private lastResponse: string = '';

  constructor() {
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context on user interaction if needed
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('touchstart', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
      }
    } catch (error) {
      console.warn("AudioContext initialization failed:", error);
    }
  }

  // Convert text to speech using OpenAI TTS API
  async speakText(text: string): Promise<void> {
    try {
      console.log("Converting text to speech with OpenAI TTS...");
      this.lastResponse = text;

      // Stop any currently playing audio
      this.stopCurrentAudio();

      // Call the server TTS endpoint
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle quota exceeded - fallback to browser TTS
        if (response.status === 429 && errorData.fallback) {
          console.warn("OpenAI TTS quota exceeded, falling back to browser speech synthesis");
          this.fallbackTorowserTTS(text);
          return;
        }
        
        throw new Error(errorData.error || 'TTS request failed');
      }

      // Get audio data as blob
      const audioBlob = await response.blob();
      console.log("Received audio blob, size:", audioBlob.size);

      // Create audio URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      // Set up audio events
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        
        // Dispatch event to notify that audio finished
        window.dispatchEvent(new CustomEvent('audio-status', {
          detail: { status: 'ended' }
        }));
      };

      audio.onerror = (error) => {
        console.error("Audio playback error:", error);
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        
        // Fallback to browser TTS on playback error
        this.fallbackTorowserTTS(text);
      };

      audio.onplay = () => {
        // Dispatch event to notify that audio started
        window.dispatchEvent(new CustomEvent('audio-status', {
          detail: { status: 'playing' }
        }));
      };

      // Play the audio
      await audio.play();
      console.log("OpenAI TTS audio playback started");

    } catch (error) {
      console.error("OpenAI TTS error:", error);
      
      // Fallback to browser TTS on any error
      this.fallbackTorowserTTS(text);
    }
  }

  // Fallback to browser speech synthesis
  private fallbackTorowserTTS(text: string) {
    console.log("Using browser speech synthesis as fallback");
    
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Try to find a male voice
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(voice => 
        voice.name.includes('Male') || 
        voice.name.includes('David') || 
        voice.name.includes('James')
      );
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      }
      
      utterance.onstart = () => {
        window.dispatchEvent(new CustomEvent('audio-status', {
          detail: { status: 'playing' }
        }));
      };
      
      utterance.onend = () => {
        window.dispatchEvent(new CustomEvent('audio-status', {
          detail: { status: 'ended' }
        }));
      };
      
      utterance.onerror = (error) => {
        console.error("Browser TTS error:", error);
        window.dispatchEvent(new CustomEvent('audio-status', {
          detail: { status: 'error' }
        }));
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.error("No TTS options available");
    }
  }

  // Stop currently playing audio
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // Also stop browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Play the last assistant response again
  playLastResponse() {
    if (this.lastResponse) {
      this.speakText(this.lastResponse);
    }
  }

  // Check if audio is currently playing
  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

// Create singleton instance
export const openaiTTS = new OpenAITTSService();

// Expose to window for compatibility with existing code
if (typeof window !== 'undefined') {
  (window as any).openaiTTS = openaiTTS;
}

export default openaiTTS;