import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "../VoiceBottomSheet";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
} from "@/utils/microphonePermissions";
import { deploymentAudioUtils } from "@/utils/deploymentAudioSync";
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

  // Share state globally for CircleAnimation and audio control
  useEffect(() => {
    (window as any).voiceAssistantState = {
      isListening,
      isProcessing: isThinking,
      isResponding,
      showBottomSheet,
      isPlayingAudio
    };
    
    // Expose global audio stop function for deployment compatibility
    (window as any).stopVoiceAudio = stopAudio;
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

      // Play welcome message with deployment synchronization
      if (welcomeAudioCacheRef.current) {
        deploymentAudioUtils.playAudio(welcomeAudioCacheRef.current)
          .then(audio => {
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
          })
          .catch(error => {
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

    const handleStopAudio = () => {
      stopAudio();
    };

    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
    window.addEventListener('stopVoiceAudio', handleStopAudio);

    return () => {
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
      window.removeEventListener('stopVoiceAudio', handleStopAudio);
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
    // Use deployment audio synchronization for consistent stopping
    deploymentAudioUtils.stopAllAudio();
    
    // Clean up local audio reference
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      } catch (error) {
        console.warn("Error stopping local audio reference:", error);
      }
    }
    
    // Reset all audio-related states
    setIsPlayingAudio(false);
    setIsResponding(false);
    setShowUnmuteButton(false);
    setShowAskButton(true);
    
    console.log("Audio stopped successfully via deployment sync");
  };

  return (
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
  );
};

export default VoiceController;