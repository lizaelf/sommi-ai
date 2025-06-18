import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "./VoiceBottomSheet";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
} from "@/utils/microphonePermissions";
// Voice controller for wine platform

interface VoiceControllerProps {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isProcessing: boolean;
  wineKey?: string;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const isManuallyClosedRef = useRef(false);
  const welcomeAudioCacheRef = useRef<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Share state globally for CircleAnimation
  useEffect(() => {
    (window as any).voiceAssistantState = {
      isListening,
      isProcessing: isThinking,
      isResponding,
      showBottomSheet,
      isPlayingAudio
    };
  }, [isListening, isThinking, isResponding, showBottomSheet, isPlayingAudio]);

  // Initialize welcome message cache
  useEffect(() => {
    const initializeWelcomeCache = async () => {
      const globalCache = (window as any).globalWelcomeAudioCache;
      if (globalCache) {
        welcomeAudioCacheRef.current = globalCache;
        return;
      }

      const welcomeMessage = "Hello, I see you're looking at the 2021 Ridge Vineyards Lytton Springs, an excellent choice. Are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.";
      
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
        }
      } catch (error) {
        console.error("Failed to cache welcome message:", error);
      }
    };

    initializeWelcomeCache();
  }, []);

  // Handle voice assistant events
  useEffect(() => {
    const handleTriggerVoiceAssistant = () => {
      setShowBottomSheet(true);
      sessionStorage.setItem('voice_bottom_sheet_shown', 'true');
      setShowAskButton(false);
      setIsResponding(true);

      // Play welcome message
      if (welcomeAudioCacheRef.current) {
        const audio = new Audio(welcomeAudioCacheRef.current);
        currentAudioRef.current = audio;
        setIsPlayingAudio(true);
        
        audio.onended = () => {
          setIsPlayingAudio(false);
          currentAudioRef.current = null;
          if (!isManuallyClosedRef.current) {
            setIsResponding(false);
            setShowAskButton(true);
          }
        };
        
        audio.play().catch(error => {
          console.error("Audio playback failed:", error);
          setIsPlayingAudio(false);
          setIsResponding(false);
          setShowAskButton(true);
        });
      } else {
        setIsResponding(false);
        setShowAskButton(true);
      }
    };

    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);

    return () => {
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
    };
  }, []);

  const handleClose = () => {
    isManuallyClosedRef.current = true;
    setShowBottomSheet(false);
    setIsListening(false);
    setIsResponding(false);
    setIsThinking(false);
    setIsPlayingAudio(false);
    setShowUnmuteButton(false);
    setShowAskButton(false);

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  const handleAsk = async () => {
    try {
      const hasPermission = await getMicrophonePermission();
      if (!hasPermission && !shouldSkipPermissionPrompt()) {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          toast({
            title: "Microphone permission denied",
            description: "Please enable microphone access to use voice features",
            variant: "destructive",
          });
          return;
        }
      }

      setIsListening(true);
      setShowAskButton(false);
      
      // Start recording logic would go here
      // For now, simulate recording timeout
      setTimeout(() => {
        setIsListening(false);
        setShowAskButton(true);
      }, 5000);

    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleUnmute = async () => {
    if (welcomeAudioCacheRef.current) {
      const audio = new Audio(welcomeAudioCacheRef.current);
      currentAudioRef.current = audio;
      setIsPlayingAudio(true);
      setShowUnmuteButton(false);
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        currentAudioRef.current = null;
        if (!isManuallyClosedRef.current) {
          setShowAskButton(true);
        }
      };
      
      audio.play().catch(error => {
        console.error("Audio playback failed:", error);
        setIsPlayingAudio(false);
        setShowAskButton(true);
      });
    }
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsPlayingAudio(false);
    setShowUnmuteButton(false);
    setShowAskButton(true);
  };

  return (
    <>
      {/* Microphone Button */}
      <button
        onClick={() => setShowBottomSheet(true)}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "20px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }}
        title="Voice assistant"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
            fill="currentColor"
          />
          <path
            d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Voice Bottom Sheet */}
      <VoiceBottomSheet
        isOpen={showBottomSheet}
        onClose={handleClose}
        onMute={stopAudio}
        onAsk={handleAsk}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isThinking}
        showAskButton={showAskButton}
        showUnmuteButton={showUnmuteButton}
        isPlayingAudio={isPlayingAudio}
        wineKey={wineKey}
        onSuggestionClick={onSendMessage}
        onUnmute={handleUnmute}
        onStopAudio={stopAudio}
      />
    </>
  );
};

export default VoiceController;