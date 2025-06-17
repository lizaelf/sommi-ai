import React, { useState, useRef, useEffect, useCallback } from "react";
import { VoiceBottomSheet } from "./VoiceBottomSheet";
import { WINE_CONFIG } from "../shared/wineConfig";

interface VoiceAssistantProps {
  onClose?: () => void;
  wineKey?: string;
  conversationId?: number;
  onMessageAdd?: (message: any) => void;
  isScannedPage?: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onClose,
  wineKey = "wine_1",
  conversationId,
  onMessageAdd,
  isScannedPage = false,
}) => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);

  const welcomeAudioCacheRef = useRef<string | null>(null);
  const welcomeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const isManuallyClosedRef = useRef(false);

  // Cache welcome message on component mount
  const cacheWelcomeMessage = useCallback(async () => {
    // Check if global cache is available first
    const globalCache = (window as any).globalWelcomeAudioCache;
    if (globalCache && globalCache.url && globalCache.element) {
      console.log("Using global welcome audio cache for instant playback");
      welcomeAudioCacheRef.current = globalCache.url;
      welcomeAudioElementRef.current = globalCache.element;
      return;
    }

    console.log("Caching dynamic welcome message for instant playback");

    try {
      // Generate dynamic welcome message using actual wine data
      const wineName = `${WINE_CONFIG.vintage} ${WINE_CONFIG.winery} "${WINE_CONFIG.vineyard}"`;

      const welcomeMessage = `Ah, the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard}—a stellar pick. This ${WINE_CONFIG.varietal} is brimming with red and black raspberries, laced with sage and a touch of dark chocolate on the nose. On the palate? Think ripe blackberry and plum wrapped in full-bodied richness, finishing with a lively acidity that lingers. Planning to pop the cork soon? I'd be delighted to offer serving tips or pairing ideas to make the most of it.`;

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: welcomeMessage }),
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const audioBlob = new Blob([buffer], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Pre-create audio element for instant playback
        const audioElement = new Audio(audioUrl);
        audioElement.preload = "auto";

        // Wait for audio to be fully loaded
        await new Promise((resolve, reject) => {
          audioElement.oncanplaythrough = resolve;
          audioElement.onerror = reject;
          audioElement.load();
        });

        welcomeAudioCacheRef.current = audioUrl;
        welcomeAudioElementRef.current = audioElement;
        console.log(
          "Welcome message audio cached and preloaded for instant playback",
        );
      }
    } catch (error) {
      console.error("Failed to cache welcome message:", error);
    }
  }, []);

  // Cache welcome message on component mount and warm cache early
  useEffect(() => {
    // Immediately start caching
    cacheWelcomeMessage();

    // Also set up global cache warming for early initialization
    if (!(window as any).welcomeAudioGlobalCache) {
      (window as any).welcomeAudioGlobalCache = cacheWelcomeMessage;
      // Try to warm cache after a short delay to allow page to settle
      setTimeout(() => {
        if (!welcomeAudioCacheRef.current) {
          console.log("Warming welcome audio cache early");
          cacheWelcomeMessage();
        }
      }, 1000);
    }
  }, [cacheWelcomeMessage]);

  const handleSuggestionClick = useCallback(async (suggestionText: string) => {
    // Handle suggestion click logic
    console.log("Suggestion clicked:", suggestionText);
  }, []);

  const handleClose = useCallback(() => {
    isManuallyClosedRef.current = true;
    setShowBottomSheet(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <div>
      <VoiceBottomSheet
        isOpen={showBottomSheet}
        onClose={handleClose}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isThinking}
        isVoiceActive={isVoiceActive}
        isPlayingAudio={isPlayingAudio}
        wineKey={wineKey}
        showSuggestions={
          showAskButton && !isListening && !isResponding && !isThinking
        }
        showUnmuteButton={
          showUnmuteButton && !isListening && !isResponding && !isThinking
        }
        showAskButton={
          showAskButton && !isListening && !isResponding && !isThinking
        }
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default VoiceAssistant;