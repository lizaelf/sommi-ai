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
    const handleTriggerVoiceAssistant = async () => {
      setShowBottomSheet(true);
      setShowAskButton(false);
      setIsListening(true);
      setIsResponding(false);
      setIsThinking(false);
      setIsPlayingAudio(false);
      setShowUnmuteButton(false);
      
      // Dispatch mic status event for CircleAnimation
      const micEvent = new CustomEvent('mic-status', {
        detail: { status: 'listening' }
      });
      window.dispatchEvent(micEvent);
      
      // Simulate voice volume events during listening for circle animation
      const voiceVolumeInterval = setInterval(() => {
        const volume = Math.random() * 40 + 20; // Random volume between 20-60
        const voiceVolumeEvent = new CustomEvent('voice-volume', {
          detail: { volume, maxVolume: 100, isActive: true }
        });
        window.dispatchEvent(voiceVolumeEvent);
      }, 150); // Update every 150ms for smooth animation
      
      // Step 1: Show listening state for 3 seconds (user speaking)
      setTimeout(() => {
        // Clear voice volume simulation
        clearInterval(voiceVolumeInterval);
        // Step 2: Show thinking state
        setIsListening(false);
        setIsThinking(true);
        
        // Dispatch processing status event
        const processingEvent = new CustomEvent('mic-status', {
          detail: { status: 'processing' }
        });
        window.dispatchEvent(processingEvent);
        
        // Step 3: After 2 seconds of thinking, start response
        setTimeout(() => {
          setIsThinking(false);
          setIsResponding(true);
          setIsPlayingAudio(true);
          
          // Dispatch stopped status event (audio is playing, not listening)
          const stoppedEvent = new CustomEvent('mic-status', {
            detail: { status: 'stopped' }
          });
          window.dispatchEvent(stoppedEvent);
          
          // Generate and play a sample response
          handleVoiceResponse("Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses.");
          
          // Step 4: After response finishes, show Ask button and suggestions
          setTimeout(() => {
            setIsResponding(false);
            setIsPlayingAudio(false);
            setShowAskButton(true);
            setShowUnmuteButton(false);
          }, 8000); // 8 seconds for response playback
          
        }, 2000); // 2 seconds thinking
      }, 3000); // 3 seconds listening
    };

    const handleStopAudio = () => {
      stopAudio();
    };

    const handleDeploymentAudioStopped = () => {
      setIsPlayingAudio(false);
      setIsResponding(false);
      setShowUnmuteButton(false);
      setShowAskButton(true);
      currentAudioRef.current = null;
    };

    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
    window.addEventListener('stopVoiceAudio', handleStopAudio);
    window.addEventListener('deploymentAudioStopped', handleDeploymentAudioStopped);

    return () => {
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
      window.removeEventListener('stopVoiceAudio', handleStopAudio);
      window.removeEventListener('deploymentAudioStopped', handleDeploymentAudioStopped);
    };
  }, []);

  const handleVoiceResponse = async (responseText: string) => {
    console.log("🎵 Starting voice response for text:", responseText);
    try {
      // Generate TTS audio for the response
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: responseText }),
      });

      console.log("🎵 TTS API response status:", response.status);

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      console.log("🎵 Audio blob size:", audioBlob.size);
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log("🎵 Audio URL created:", audioUrl);
      
      if (audioUrl && !isManuallyClosedRef.current) {
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        setIsPlayingAudio(true);
        setIsResponding(true);
        setShowUnmuteButton(false);
        
        console.log("🎵 Starting audio playback...");
        
        audio.play()
          .then(() => {
            console.log("🎵 Audio playback started successfully");
            audio.onended = () => {
              console.log("🎵 Audio playback ended");
              setIsPlayingAudio(false);
              currentAudioRef.current = null;
              URL.revokeObjectURL(audioUrl); // Clean up blob URL
              if (!isManuallyClosedRef.current) {
                setIsResponding(false);
                setShowAskButton(true);
              }
            };
          })
          .catch(error => {
            console.error("🎵 Audio playback failed:", error);
            setIsPlayingAudio(false);
            setIsResponding(false);
            setShowAskButton(true);
            URL.revokeObjectURL(audioUrl);
          });
      } else {
        console.log("🎵 No audio URL or manually closed");
        setIsResponding(false);
        setShowAskButton(true);
      }
    } catch (error) {
      console.error("Failed to generate voice response:", error);
      setIsResponding(false);
      setShowAskButton(true);
    }
  };

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

      // Start listening state
      setIsListening(true);
      setShowAskButton(false);
      setIsThinking(false);
      setIsResponding(false);
      
      // Dispatch mic status event for CircleAnimation
      const micEvent = new CustomEvent('mic-status', {
        detail: { status: 'listening' }
      });
      window.dispatchEvent(micEvent);
      
      // Simulate voice recording for 3 seconds
      setTimeout(() => {
        // Stop listening, start thinking
        setIsListening(false);
        setIsThinking(true);
        
        // Dispatch processing status event
        const processingEvent = new CustomEvent('mic-status', {
          detail: { status: 'processing' }
        });
        window.dispatchEvent(processingEvent);
        
        // Simulate processing for 2 seconds
        setTimeout(() => {
          // Stop thinking, start responding
          setIsThinking(false);
          setIsResponding(true);
          setIsPlayingAudio(true);
          
          // Dispatch stopped status event (audio is playing, not listening)
          const stoppedEvent = new CustomEvent('mic-status', {
            detail: { status: 'stopped' }
          });
          window.dispatchEvent(stoppedEvent);
          
          // Generate and play a sample response
          handleVoiceResponse("This is a sample wine response based on your voice question.");
        }, 2000);
      }, 3000);

    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Please try again",
        variant: "destructive",
      });
      setIsListening(false);
      setIsThinking(false);
      setShowAskButton(true);
      
      // Dispatch stopped status event on error
      const errorEvent = new CustomEvent('mic-status', {
        detail: { status: 'stopped' }
      });
      window.dispatchEvent(errorEvent);
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