// Mobile Audio Manager - handles TTS audio playback within user gestures
// This ensures audio works on mobile devices by playing within user interaction contexts

export class MobileAudioManager {
  private static instance: MobileAudioManager;
  private audioUnlocked: boolean = false;
  
  static getInstance(): MobileAudioManager {
    if (!MobileAudioManager.instance) {
      MobileAudioManager.instance = new MobileAudioManager();
    }
    return MobileAudioManager.instance;
  }

  // Check if device is mobile
  private isMobile(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  // Unlock audio within user gesture
  async unlockAudio(): Promise<void> {
    if (this.audioUnlocked) return;
    
    try {
      const silentAudio = new Audio();
      silentAudio.src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAACQAAAA=";
      silentAudio.volume = 0;
      await silentAudio.play();
      this.audioUnlocked = true;
      console.log("Mobile audio unlocked successfully");
    } catch (error) {
      console.log("Audio unlock attempt (expected on some browsers):", error);
      this.audioUnlocked = true; // Mark as unlocked anyway
    }
  }

  // Generate and play TTS audio directly within user gesture
  async playTTSWithinGesture(text: string): Promise<boolean> {
    try {
      // Unlock audio first if mobile
      if (this.isMobile()) {
        await this.unlockAudio();
      }

      console.log("Generating TTS audio within user gesture for:", text.substring(0, 50) + "...");
      
      // Generate TTS audio using server endpoint
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Store reference for cleanup
      (window as any).currentOpenAIAudio = audio;

      // Set up event handlers
      audio.onplay = () => {
        console.log("TTS playback started within user gesture");
        window.dispatchEvent(new CustomEvent('audio-status', {
          detail: { status: 'playing' }
        }));
      };

      audio.onended = () => {
        console.log("TTS playback completed");
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
        window.dispatchEvent(new CustomEvent('audio-status', {
          detail: { status: 'stopped' }
        }));
      };

      audio.onerror = (e: any) => {
        console.error("TTS playback error:", e);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
        window.dispatchEvent(new CustomEvent('audio-status', {
          detail: { status: 'stopped' }
        }));
      };

      // Play audio immediately within user gesture context
      await audio.play();
      console.log("TTS audio started successfully within user gesture");
      return true;

    } catch (error) {
      console.error("Failed to play TTS within gesture:", error);
      return false;
    }
  }

  // Store audio for later playback when autoplay is blocked
  async storeAudioForLaterPlayback(text: string): Promise<void> {
    try {
      console.log("Generating audio for later playback:", text.substring(0, 50) + "...");
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Store for manual playback
      (window as any).pendingAutoplayAudio = audio;
      console.log("Audio stored for manual playback");

    } catch (error) {
      console.error("Failed to store audio:", error);
    }
  }
}

// Export singleton instance
export const mobileAudioManager = MobileAudioManager.getInstance();