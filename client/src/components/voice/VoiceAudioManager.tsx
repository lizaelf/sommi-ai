import React, { useRef, useEffect, useCallback } from "react";
import { WINE_CONFIG } from "../../../shared/wineConfig";

interface VoiceAudioManagerProps {
  onAudioStateChange: (state: { isPlayingAudio: boolean }) => void;
}

export const VoiceAudioManager: React.FC<VoiceAudioManagerProps> = ({
  onAudioStateChange
}) => {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const welcomeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const welcomeAudioCacheRef = useRef<string | null>(null);
  const audioCache = useRef<Map<string, Blob>>(new Map());

  // Initialize welcome message cache
  useEffect(() => {
    const initializeWelcomeCache = async () => {
      console.log("Initializing welcome audio cache");
      
      // Check if global cache exists
      const globalCache = (window as any).globalWelcomeAudioCache;
      if (globalCache) {
        console.log("Using global welcome audio cache for instant playback");
        welcomeAudioCacheRef.current = globalCache;
        
        // Pre-load audio element for instant playback
        const audio = new Audio(globalCache);
        audio.preload = 'auto';
        welcomeAudioElementRef.current = audio;
        return;
      }

      // Generate dynamic welcome message using actual wine data (same as VoiceAssistant.tsx)
      const wineName = `${WINE_CONFIG.vintage} ${WINE_CONFIG.winery} "${WINE_CONFIG.vineyard}"`;
      const welcomeMessage = `Ah, the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard}—a stellar pick. This ${WINE_CONFIG.varietal} is brimming with red and black raspberries, laced with sage and a touch of dark chocolate on the nose. On the palate? Think ripe blackberry and plum wrapped in full-bodied richness, finishing with a lively acidity that lingers. Planning to pop the cork soon? I'd be delighted to offer serving tips or pairing ideas to make the most of it.`;
      
      try {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage })
        });
        
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          welcomeAudioCacheRef.current = audioUrl;
          (window as any).globalWelcomeAudioCache = audioUrl;
          
          // Pre-load audio element
          const audio = new Audio(audioUrl);
          audio.preload = 'auto';
          welcomeAudioElementRef.current = audio;
          
          console.log("Welcome message cached successfully");
        }
      } catch (error) {
        console.error("Failed to cache welcome message:", error);
      }
    };

    initializeWelcomeCache();
  }, []);

  const getCachedAudio = useCallback((text: string): Blob | null => {
    const cacheKey = btoa(text).slice(0, 50);
    return audioCache.current.get(cacheKey) || null;
  }, []);

  const setCachedAudio = useCallback((text: string, audioBlob: Blob): void => {
    const cacheKey = btoa(text).slice(0, 50);
    audioCache.current.set(cacheKey, audioBlob);
    
    // Limit cache size
    if (audioCache.current.size > 10) {
      const firstKey = audioCache.current.keys().next().value;
      if (firstKey) {
        audioCache.current.delete(firstKey);
      }
    }
  }, []);

  const playWelcomeMessage = useCallback(async () => {
    console.log("Playing welcome message");
    
    if (welcomeAudioCacheRef.current) {
      const audio = new Audio(welcomeAudioCacheRef.current);
      currentAudioRef.current = audio;
      onAudioStateChange({ isPlayingAudio: true });
      
      audio.onended = () => {
        onAudioStateChange({ isPlayingAudio: false });
        currentAudioRef.current = null;
      };
      
      audio.onerror = () => {
        console.error("Welcome audio playback error");
        onAudioStateChange({ isPlayingAudio: false });
        currentAudioRef.current = null;
      };
      
      try {
        await audio.play();
        console.log("Welcome audio playing successfully");
      } catch (error) {
        console.error("Audio playback failed, generating fresh audio:", error);
        await generateFreshWelcomeAudio();
      }
    } else {
      await generateFreshWelcomeAudio();
    }
  }, [onAudioStateChange]);

  const generateFreshWelcomeAudio = useCallback(async () => {
    const welcomeMessage = "Hello, I see you're looking at the 2021 Ridge Vineyards Lytton Springs, an excellent choice. Are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.";
    
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomeMessage })
      });
      
      const buffer = await response.arrayBuffer();
      const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      currentAudioRef.current = audio;
      onAudioStateChange({ isPlayingAudio: true });
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        onAudioStateChange({ isPlayingAudio: false });
        currentAudioRef.current = null;
      };
      
      await audio.play();
      console.log("Fresh audio playing successfully");
    } catch (error) {
      console.error("Fresh audio generation failed:", error);
      onAudioStateChange({ isPlayingAudio: false });
    }
  }, [onAudioStateChange]);

  const stopAudio = useCallback(() => {
    console.log("Stopping all audio playback");
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    if (welcomeAudioElementRef.current) {
      welcomeAudioElementRef.current.pause();
      welcomeAudioElementRef.current.currentTime = 0;
    }
    
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }
    
    onAudioStateChange({ isPlayingAudio: false });
  }, [onAudioStateChange]);

  // Expose methods globally for other components
  useEffect(() => {
    (window as any).voiceAudioManager = {
      playWelcomeMessage,
      stopAudio,
      getCachedAudio,
      setCachedAudio
    };
  }, [playWelcomeMessage, stopAudio, getCachedAudio, setCachedAudio]);

  return null; // This is a logic-only component
};

export default VoiceAudioManager;