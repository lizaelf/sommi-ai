import React, { useState, useRef, useEffect } from 'react';
import VoiceBottomSheet from '../VoiceBottomSheet';

interface VoiceControllerProps {
  onSendMessage?: (message: string, options?: any) => void;
  onAddMessage?: (message: any) => void;
  conversationId?: number;
  isProcessing?: boolean;
  wineKey?: string;
}

const VoiceController: React.FC<VoiceControllerProps> = ({
  onSendMessage,
  onAddMessage,
  conversationId,
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


  const handleWelcomeMessage = async () => {
    try {
      // Use cached welcome message if available
      if (welcomeAudioCacheRef.current) {
        const audio = new Audio(welcomeAudioCacheRef.current);
        audio.volume = 1.0;
        currentAudioRef.current = audio;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          
          audio.onended = () => {
            setIsPlayingAudio(false);
            setIsResponding(false);
            currentAudioRef.current = null;
          };
        }
      } else {
        // Generate welcome message if not cached
        const welcomeMessage = "Hello, I see you're looking at the 2021 Ridge Vineyards Lytton Springs, an excellent choice. Are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.";
        
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          welcomeAudioCacheRef.current = audioUrl;
          
          const audio = new Audio(audioUrl);
          audio.volume = 1.0;
          currentAudioRef.current = audio;
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            
            audio.onended = () => {
              setIsPlayingAudio(false);
              setIsResponding(false);
              currentAudioRef.current = null;
              URL.revokeObjectURL(audioUrl);
            };
          }
        }
      }
    } catch (error) {
      console.error("Failed to play welcome message:", error);
      setIsPlayingAudio(false);
      setIsResponding(false);
    }
  };

  const stopAudio = () => {
    console.log("🛑 VoiceController: Stopping all audio playback");
    
    // Clean up local audio reference
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
        console.log("🛑 VoiceController: Local audio stopped");
      } catch (error) {
        console.warn("Error stopping local audio reference:", error);
      }
    }
    
    // Stop any global audio references
    if ((window as any).currentOpenAIAudio) {
      try {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio.currentTime = 0;
        (window as any).currentOpenAIAudio = null;
        console.log("🛑 VoiceController: Global audio stopped");
      } catch (error) {
        console.warn("Error stopping global audio:", error);
      }
    }
    
    // Stop all audio elements in the document
    try {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      console.log("🛑 VoiceController: All DOM audio elements stopped");
    } catch (error) {
      console.warn("Error stopping DOM audio elements:", error);
    }
    
    // Reset all audio-related states
    setIsPlayingAudio(false);
    setIsResponding(false);
    setShowUnmuteButton(false);
    setShowAskButton(true);
    
    // Dispatch stop event for other components
    window.dispatchEvent(new CustomEvent("tts-audio-stop"));
    window.dispatchEvent(new CustomEvent("deploymentAudioStopped"));
    
    console.log("🛑 VoiceController: All audio stopped successfully");
  };

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
    // VOICE BUTTON: Complete flow with welcome message
    const handleTriggerVoiceAssistant = async () => {
      // Step 1: Open voice bottom sheet
      setShowBottomSheet(true);
      setShowAskButton(false);
      setIsListening(false);
      setIsResponding(true);
      setIsThinking(false);
      setIsPlayingAudio(true);
      setShowUnmuteButton(false);
      
      // Step 2: Immediately start welcome message with stop button
      await handleWelcomeMessage();
      
      // After welcome message completes, continue with listening phase
      setTimeout(() => {
        // Step 3: Show "Listening..." state with circle animation
        setIsResponding(false);
        setIsPlayingAudio(false);
        setIsListening(true);
        
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
        }, 150);
        
        // Step 4: Display listening state during speaking (3 seconds)
        setTimeout(() => {
          clearInterval(voiceVolumeInterval);
          
          // Step 5: Show "Thinking..." state
          setIsListening(false);
          setIsThinking(true);
          
          const processingEvent = new CustomEvent('mic-status', {
            detail: { status: 'processing' }
          });
          window.dispatchEvent(processingEvent);
          
          // Step 6: After thinking, start answer with Stop button
          setTimeout(() => {
            setIsThinking(false);
            setIsResponding(true);
            setIsPlayingAudio(true);
            
            const stoppedEvent = new CustomEvent('mic-status', {
              detail: { status: 'stopped' }
            });
            window.dispatchEvent(stoppedEvent);
            
            // Step 7: Generate and play response with Stop button
            handleVoiceResponse("Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses.");
            
          }, 2000); // 2 seconds thinking
        }, 3000); // 3 seconds listening
      }, 500); // Small delay after welcome message
    };

    // MIC BUTTON: Direct to listening without welcome message
    const handleTriggerMicButton = async () => {
      // Step 1: Open voice bottom sheet
      setShowBottomSheet(true);
      setShowAskButton(false);
      setIsListening(true);
      setIsResponding(false);
      setIsThinking(false);
      setIsPlayingAudio(false);
      setShowUnmuteButton(false);
      
      // Step 2: Immediately show "Listening..." state with circle animation
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
      }, 150);
      
      // Step 3: Display listening state during speaking (3 seconds)
      setTimeout(() => {
        clearInterval(voiceVolumeInterval);
        
        // Step 4: Show "Thinking..." state
        setIsListening(false);
        setIsThinking(true);
        
        const processingEvent = new CustomEvent('mic-status', {
          detail: { status: 'processing' }
        });
        window.dispatchEvent(processingEvent);
        
        // Step 5: After thinking, start answer with Stop button
        setTimeout(() => {
          setIsThinking(false);
          setIsResponding(true);
          setIsPlayingAudio(true);
          
          const stoppedEvent = new CustomEvent('mic-status', {
            detail: { status: 'stopped' }
          });
          window.dispatchEvent(stoppedEvent);
          
          // Step 6: Generate and play response with Stop button
          handleVoiceResponse("Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses.");
          
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
    window.addEventListener('triggerMicButton', handleTriggerMicButton);
    window.addEventListener('stopVoiceAudio', handleStopAudio);
    window.addEventListener('deploymentAudioStopped', handleDeploymentAudioStopped);

    return () => {
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
      window.removeEventListener('triggerMicButton', handleTriggerMicButton);
      window.removeEventListener('stopVoiceAudio', handleStopAudio);
      window.removeEventListener('deploymentAudioStopped', handleDeploymentAudioStopped);
    };
  }, []);

  const handleVoiceResponse = async (responseText: string) => {
    try {
      // Generate TTS audio for the response
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: responseText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioUrl && !isManuallyClosedRef.current) {
        const audio = new Audio(audioUrl);
        audio.volume = 1.0;
        audio.preload = 'auto';
        currentAudioRef.current = audio;
        setIsPlayingAudio(true);
        setIsResponding(true);
        setShowUnmuteButton(false);
        
        // Ensure audio context is unlocked for playback
        if (typeof window !== 'undefined' && window.AudioContext) {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContext.state === 'suspended') {
              audioContext.resume();
            }
          } catch (e) {
            // AudioContext not available, continue with direct play
          }
        }
        
        audio.play()
          .then(() => {
            audio.onended = () => {
              setIsPlayingAudio(false);
              currentAudioRef.current = null;
              URL.revokeObjectURL(audioUrl);
              if (!isManuallyClosedRef.current) {
                setIsResponding(false);
                setShowAskButton(true);
              }
            };
          })
          .catch(error => {
            console.error("Audio playback failed:", error);
            
            // Fallback: try to play again after a short delay
            setTimeout(() => {
              audio.play().catch(fallbackError => {
                console.error("Fallback audio play also failed:", fallbackError);
                setIsPlayingAudio(false);
                setIsResponding(false);
                setShowAskButton(true);
                URL.revokeObjectURL(audioUrl);
              });
            }, 100);
          });
      } else {
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
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    setShowBottomSheet(false);
    setIsListening(false);
    setIsResponding(false);
    setIsThinking(false);
    setIsPlayingAudio(false);
    setShowUnmuteButton(false);
    setShowAskButton(false);
    isManuallyClosedRef.current = true;
    
    // Reset manual close flag after a short delay
    setTimeout(() => {
      isManuallyClosedRef.current = false;
    }, 1000);
  };

  const handleAskRecording = () => {
    setShowAskButton(false);
    setIsListening(true);
    setIsResponding(false);
    setIsThinking(false);
    setIsPlayingAudio(false);
    setShowUnmuteButton(false);
    
    // Simulate manual voice recording flow (same as mic button)
    const micEvent = new CustomEvent('mic-status', {
      detail: { status: 'listening' }
    });
    window.dispatchEvent(micEvent);
    
    const voiceVolumeInterval = setInterval(() => {
      const volume = Math.random() * 40 + 20;
      const voiceVolumeEvent = new CustomEvent('voice-volume', {
        detail: { volume, maxVolume: 100, isActive: true }
      });
      window.dispatchEvent(voiceVolumeEvent);
    }, 150);
    
    setTimeout(() => {
      clearInterval(voiceVolumeInterval);
      setIsListening(false);
      setIsThinking(true);
      
      const processingEvent = new CustomEvent('mic-status', {
        detail: { status: 'processing' }
      });
      window.dispatchEvent(processingEvent);
      
      setTimeout(() => {
        setIsThinking(false);
        setIsResponding(true);
        setIsPlayingAudio(true);
        
        const stoppedEvent = new CustomEvent('mic-status', {
          detail: { status: 'stopped' }
        });
        window.dispatchEvent(stoppedEvent);
        
        handleVoiceResponse("Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses.");
        
      }, 2000);
    }, 3000);
  };

  return (
    <VoiceBottomSheet
      isOpen={showBottomSheet}
      onClose={handleClose}
      onMute={stopAudio}
      onAsk={handleAskRecording}
      isListening={isListening}
      isResponding={isResponding}
      isThinking={isThinking}
      isPlayingAudio={isPlayingAudio}
      showUnmuteButton={showUnmuteButton}
      showAskButton={showAskButton}
      showSuggestions={true}
      onStopAudio={stopAudio}
      onUnmute={stopAudio}
      wineKey={wineKey}
      onSuggestionClick={(suggestion: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => {
        console.log("VoiceController: Handling suggestion click:", suggestion);
        
        // Handle voice suggestion with TTS
        if (options?.instantResponse) {
          handleVoiceResponse(options.instantResponse);
        } else if (onSendMessage) {
          onSendMessage(suggestion);
        }
      }}
    />
  );
};

export default VoiceController;