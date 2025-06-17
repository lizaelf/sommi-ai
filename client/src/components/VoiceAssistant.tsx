import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "./VoiceBottomSheet";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser,
} from "@/utils/microphonePermissions";
import { WINE_CONFIG } from "../../../shared/wineConfig";

interface VoiceAssistantProps {
  onSendMessage: (
    message: string,
    pillId?: string,
    options?: { textOnly?: boolean; instantResponse?: string },
  ) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = "",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const { toast } = useToast();
  const microphoneRef = useRef<MediaRecorder | null>(null);
  const isManuallyClosedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const welcomeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const welcomeAudioCacheRef = useRef<string | null>(null);

  // Cache welcome message with dynamic wine data
  const cacheWelcomeMessage = async () => {
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
        console.log("Welcome message audio cached and preloaded for instant playback");
      }
    } catch (error) {
      console.error("Failed to cache welcome message:", error);
    }
  };

  // Cache welcome message on component mount
  useEffect(() => {
    cacheWelcomeMessage();
  }, []);

  const handleTriggerVoiceAssistant = async () => {
    console.log("Voice assistant triggered");
    
    if (isManuallyClosedRef.current) {
      console.log("Voice assistant manually closed, ignoring trigger");
      return;
    }

    console.log("Voice button clicked - proceeding with voice assistant");

    // Show bottom sheet immediately
    setShowBottomSheet(true);
    setShowAskButton(false);
    setIsResponding(true);

    // Play preloaded welcome message instantly if available
    if (welcomeAudioElementRef.current) {
      console.log("Playing preloaded welcome message instantly");
      const audio = welcomeAudioElementRef.current;

      // Reset audio to beginning for replay
      audio.currentTime = 0;

      // Store reference for potential stopping
      (window as any).currentOpenAIAudio = audio;

      audio.onended = () => {
        if (!isManuallyClosedRef.current) {
          setIsResponding(false);
          setShowAskButton(true);
          setShowUnmuteButton(false);
          setIsThinking(false);
          console.log("Welcome message completed - showing suggestions");
        }
        (window as any).currentOpenAIAudio = null;
        console.log("Preloaded welcome message completed");
      };

      audio.onerror = () => {
        if (!isManuallyClosedRef.current) {
          setIsResponding(false);
          setShowAskButton(true);
          setShowUnmuteButton(false);
          setIsThinking(false);
          console.log("Audio error - showing suggestions");
        }
        (window as any).currentOpenAIAudio = null;
        console.error("Preloaded audio playback error");
      };

      // Play audio immediately
      audio
        .play()
        .then(() => {
          console.log("Welcome audio playing successfully");
        })
        .catch((error) => {
          console.error("Audio playback failed, generating fresh audio:", error);
          
          // Generate fresh audio immediately if cached fails - using dynamic wine data
          const welcomeMessage = `Ah, the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard}—a stellar pick. This ${WINE_CONFIG.varietal} is brimming with red and black raspberries, laced with sage and a touch of dark chocolate on the nose. On the palate? Think ripe blackberry and plum wrapped in full-bodied richness, finishing with a lively acidity that lingers. Planning to pop the cork soon? I'd be delighted to offer serving tips or pairing ideas to make the most of it.`;

          fetch("/api/text-to-speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: welcomeMessage }),
          })
            .then((response) => response.arrayBuffer())
            .then((buffer) => {
              const audioBlob = new Blob([buffer], { type: "audio/mpeg" });
              const audioUrl = URL.createObjectURL(audioBlob);
              const freshAudio = new Audio(audioUrl);
              (window as any).currentOpenAIAudio = freshAudio;

              freshAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                if (!isManuallyClosedRef.current) {
                  setIsResponding(false);
                  setShowAskButton(true);
                }
              };

              freshAudio
                .play()
                .then(() => {
                  console.log("Fresh audio playing successfully");
                })
                .catch(() => {
                  // If all audio fails, just show suggestions
                  setIsResponding(false);
                  setShowAskButton(true);
                });
            })
            .catch(() => {
              // If fetch fails, show suggestions
              setIsResponding(false);
              setShowAskButton(true);
            });
        });
    } else {
      console.log("Cache not ready, generating welcome message");
      
      // Generate dynamic welcome message using actual wine data
      const welcomeMessage = `Ah, the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard}—a stellar pick. This ${WINE_CONFIG.varietal} is brimming with red and black raspberries, laced with sage and a touch of dark chocolate on the nose. On the palate? Think ripe blackberry and plum wrapped in full-bodied richness, finishing with a lively acidity that lingers. Planning to pop the cork soon? I'd be delighted to offer serving tips or pairing ideas to make the most of it.`;

      fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: welcomeMessage }),
      })
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
          const audioBlob = new Blob([buffer], { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          setIsPlayingAudio(true);

          // Store reference for potential stopping
          (window as any).currentOpenAIAudio = audio;

          audio.onended = () => {
            setIsPlayingAudio(false);
            currentAudioRef.current = null;
            if (!isManuallyClosedRef.current) {
              setIsResponding(false);
              setShowAskButton(true);
              setShowUnmuteButton(false);
              setIsThinking(false);
              console.log("Fallback welcome message completed - showing suggestions");
            }
            URL.revokeObjectURL(audioUrl);
            (window as any).currentOpenAIAudio = null;
            console.log("Welcome message completed");
          };

          audio.onerror = () => {
            setIsPlayingAudio(false);
            currentAudioRef.current = null;
            if (!isManuallyClosedRef.current) {
              setIsResponding(false);
              setShowAskButton(true);
              setShowUnmuteButton(false);
              setIsThinking(false);
              console.log("Fallback audio error - showing suggestions");
            }
            URL.revokeObjectURL(audioUrl);
            (window as any).currentOpenAIAudio = null;
            console.error("Audio playback error");
          };

          audio.play();
          console.log("Playing welcome message via OpenAI TTS");
        })
        .catch((error) => {
          console.error("Failed to generate welcome message:", error);
          setIsResponding(false);
          setShowAskButton(true);
        });
    }
  };

  const handleCloseBottomSheet = () => {
    console.log("VoiceAssistant: Manual close triggered - setting flag to prevent reopening");
    
    // Stop any playing audio immediately
    if ((window as any).currentOpenAIAudio) {
      try {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio.currentTime = 0;
      } catch (error) {
        console.log("Error stopping audio:", error);
      }
      (window as any).currentOpenAIAudio = null;
    }

    // Dispatch mic-status processing event to update CircleAnimation
    const micStatusEvent = new CustomEvent("mic-status", {
      detail: { status: "processing" },
    });
    window.dispatchEvent(micStatusEvent);
    console.log('VoiceAssistant: Dispatching mic-status "processing" event');

    // Set manual close flag and hide bottom sheet
    isManuallyClosedRef.current = true;
    setShowBottomSheet(false);
    setIsListening(false);
    setIsResponding(false);
    setIsThinking(false);
    setShowAskButton(false);
    setShowUnmuteButton(false);
    setIsVoiceActive(false);
    setIsPlayingAudio(false);

    console.log("VoiceAssistant: Permanently closed - no automatic reopening until page refresh");
  };

  const handleSuggestionClick = (suggestion: string, pillId?: string) => {
    // Use the parent's onSendMessage to handle suggestion clicks
    onSendMessage(suggestion, pillId, { textOnly: false });
  };

  // Expose trigger function globally for QR scan integration
  useEffect(() => {
    (window as any).triggerVoiceAssistant = handleTriggerVoiceAssistant;
    
    return () => {
      delete (window as any).triggerVoiceAssistant;
    };
  }, []);

  return (
    <VoiceBottomSheet
      showBottomSheet={showBottomSheet}
      onClose={handleCloseBottomSheet}
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
  );
};

export default VoiceAssistant;