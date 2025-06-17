import { useRef, useCallback } from "react";
import { WINE_CONFIG } from "../../../../shared/wineConfig";
import { VoiceRefs, VoiceState } from "./VoiceStateManager";

// Dynamic welcome message generator
const getDynamicWelcomeMessage = () => {
  const wineName = `${WINE_CONFIG.vintage} ${WINE_CONFIG.winery} "${WINE_CONFIG.vineyard}"`;
  return `Ah, the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard}—a stellar pick. This ${WINE_CONFIG.varietal} is brimming with red and black raspberries, laced with sage and a touch of dark chocolate on the nose. On the palate? Think ripe blackberry and plum wrapped in full-bodied richness, finishing with a lively acidity that lingers. Planning to pop the cork soon? I'd be delighted to offer serving tips or pairing ideas to make the most of it.`;
};

export const useVoiceAudioManager = (
  refs: VoiceRefs,
  updateState: (updates: Partial<VoiceState>) => void
) => {
  // Cache welcome message for instant playback
  const cacheWelcomeMessage = useCallback(async () => {
    console.log("QR SCAN: welcome audio caching triggered");
    const welcomeMessage = getDynamicWelcomeMessage();

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: welcomeMessage,
          voice: process.env.NODE_ENV === "development" ? "shimmer" : "nova",
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch TTS");

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const blobUrl = URL.createObjectURL(blob);

      const audio = new Audio(blobUrl);

      // Wait until audio is fully loaded
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = reject;
        audio.load();
      });

      refs.welcomeAudioCacheRef.current = blobUrl;
      refs.welcomeAudioElementRef.current = audio;
      console.log("QR SCAN: fetched and cached welcome audio");
    } catch (error) {
      console.error("QR SCAN: Failed to cache welcome audio:", error);
    }
  }, [refs]);

  // Play welcome message
  const playWelcomeMessage = useCallback(async () => {
    console.log("QR SCAN: Playing welcome message via OpenAI TTS");

    if (!refs.welcomeAudioElementRef.current || !refs.welcomeAudioCacheRef.current) {
      console.log("QR SCAN: Welcome audio not cached, caching now...");
      await cacheWelcomeMessage();
    }

    if (refs.welcomeAudioElementRef.current) {
      try {
        updateState({ isPlayingAudio: true });
        await refs.welcomeAudioElementRef.current.play();
        
        refs.welcomeAudioElementRef.current.onended = () => {
          updateState({ isPlayingAudio: false });
        };
      } catch (error) {
        console.error("QR SCAN: Failed to play welcome audio:", error);
        updateState({ isPlayingAudio: false });
      }
    }
  }, [refs, updateState, cacheWelcomeMessage]);

  // Handle TTS audio events
  const handleTTSAudioStart = useCallback(() => {
    console.log("🎤 VoiceAssistant: TTS audio started from suggestion");
    updateState({ isPlayingAudio: true });
  }, [updateState]);

  const handleTTSAudioStop = useCallback(() => {
    console.log("🎤 VoiceAssistant: TTS audio stopped from suggestion");
    updateState({ isPlayingAudio: false });
  }, [updateState]);

  // Stop all audio playback
  const stopAllAudio = useCallback(() => {
    console.log("🛑 VoiceAssistant: Stopping all audio playback");
    
    // Stop OpenAI TTS audio
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }

    // Stop welcome audio
    if (refs.welcomeAudioElementRef.current) {
      refs.welcomeAudioElementRef.current.pause();
      refs.welcomeAudioElementRef.current.currentTime = 0;
    }

    // Stop current audio ref
    if (refs.currentAudioRef.current) {
      refs.currentAudioRef.current.pause();
      refs.currentAudioRef.current.currentTime = 0;
      refs.currentAudioRef.current = null;
    }

    updateState({ isPlayingAudio: false });
    console.log("🛑 VoiceAssistant: All audio stopped");
  }, [refs, updateState]);

  // Text-to-speech with caching
  const textToSpeech = useCallback(async (text: string): Promise<void> => {
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to convert text to speech");
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      refs.currentAudioRef.current = audio;
      updateState({ isPlayingAudio: true });

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        updateState({ isPlayingAudio: false });
        refs.currentAudioRef.current = null;
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        updateState({ isPlayingAudio: false });
        refs.currentAudioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("TTS Error:", error);
      updateState({ isPlayingAudio: false });
    }
  }, [refs, updateState]);

  return {
    cacheWelcomeMessage,
    playWelcomeMessage,
    handleTTSAudioStart,
    handleTTSAudioStop,
    stopAllAudio,
    textToSpeech,
  };
};