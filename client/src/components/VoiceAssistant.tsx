import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import VoiceBottomSheet from './VoiceBottomSheet';
import { 
  getMicrophonePermission, 
  requestMicrophonePermission, 
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser 
} from '@/utils/microphonePermissions';

interface VoiceAssistantProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSendMessage, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Handle audio status changes and page visibility
  useEffect(() => {
    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      
      if (status === 'playing') {
        setIsResponding(true);
        setShowUnmuteButton(false);
      } else if (status === 'stopped' || status === 'paused' || status === 'muted') {
        setIsResponding(false);
        setShowUnmuteButton(true);
      }
    };

    // Stop microphone when user leaves the page/tab
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden - stopping microphone access");
        stopListening();
        setShowBottomSheet(false);
        
        // Stop any ongoing audio playback
        if ((window as any).currentOpenAIAudio) {
          (window as any).currentOpenAIAudio.pause();
          (window as any).currentOpenAIAudio = null;
        }
        
        setIsResponding(false);
      }
    };

    const handleShowUnmuteButton = () => {
      setShowUnmuteButton(true);
    };

    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    window.addEventListener('showUnmuteButton', handleShowUnmuteButton as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      window.removeEventListener('showUnmuteButton', handleShowUnmuteButton as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const startListening = async () => {
    // Mobile-specific: Ensure this is triggered by user interaction
    console.log('Starting voice recognition - user interaction detected');
    
    // Check speech recognition support with mobile-specific detection
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported on this device/browser');
      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Voice input not supported on this device
          </span>
        ),
        duration: 3000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
      return;
    }

    // Initialize audio context for mobile compatibility
    try {
      if (typeof (window as any).initAudioContext === 'function') {
        const audioInitialized = await (window as any).initAudioContext();
        console.log('Audio context initialized for mobile:', audioInitialized);
      }
    } catch (audioError) {
      console.warn('Audio context initialization failed:', audioError);
    }

    // Request microphone permission with mobile-specific handling
    console.log('Requesting microphone permission for voice recognition');
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Microphone access required for voice input
          </span>
        ),
        duration: 3000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
      return;
    }

    try {
      // Mobile-specific speech recognition setup
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error("Speech recognition not supported on this device");
        toast({
          description: (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Voice input not supported on this device
            </span>
          ),
          duration: 3000,
          className: "bg-white text-black border-none",
          style: {
            position: "fixed",
            top: "74px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            maxWidth: "none",
            padding: "8px 24px",
            borderRadius: "32px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
        });
        return;
      }

      // Mobile-specific: Pre-set listening state immediately
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        console.log("Mobile device detected - pre-setting listening state");
        setIsListening(true);
        setShowBottomSheet(true);
      }

      const recognition = new SpeechRecognition();
      
      // Mobile-optimized settings
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Mobile-specific: Additional settings for mobile browsers
      if (isMobile) {
        // Force immediate state update for mobile
        recognition.grammars = new (window as any).SpeechGrammarList();
      }
      
      // Mobile-specific timeout settings
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        console.log("Mobile device detected - applying mobile-specific settings");
        // Shorter timeout for mobile devices
        setTimeout(() => {
          if (recognitionRef.current && isListening) {
            console.log("Mobile timeout - stopping recognition");
            recognition.stop();
          }
        }, 8000); // 8 seconds instead of default
      }
      
      recognition.onstart = () => {
        console.log("Voice recognition onstart event triggered");
        setIsListening(true);
        setShowBottomSheet(true);
        console.log("Voice recognition started - state updated");
        
        // Mobile-specific: Force state update
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          console.log("Mobile device - forcing listening state update");
          // Multiple attempts to ensure state is set on mobile
          setTimeout(() => {
            setIsListening(true);
            setShowBottomSheet(true);
          }, 50);
          
          setTimeout(() => {
            setIsListening(true);
            setShowBottomSheet(true);
          }, 150);
        }
        
        // Dispatch mic-status event for animation
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mic-status', {
            detail: { status: 'listening' }
          }));
        }, 100);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Final transcript:", transcript);
        
        setIsListening(false);
        
        // Dispatch processing event for animation
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'processing' }
        }));
        
        onSendMessage(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Mobile-specific: Ensure state is properly reset on mobile
        if (isMobile) {
          console.log("Mobile device - forcing error state reset");
          setTimeout(() => {
            setIsListening(false);
            setShowBottomSheet(false);
          }, 100);
        }
        
        // Dispatch stopped event for animation on error
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'stopped' }
        }));
        
        // Enhanced mobile error handling
        let errorMessage = "Voice recognition failed";
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = "Microphone permission denied";
            break;
          case 'no-speech':
            errorMessage = "No speech detected - please try again";
            break;
          case 'network':
            errorMessage = "Network error - check your connection";
            break;
          case 'audio-capture':
            errorMessage = "Microphone not accessible";
            break;
          case 'aborted':
            console.log("Voice recognition was stopped by user");
            return; // Don't show error toast for user-initiated stops
          default:
            console.error('Unhandled speech recognition error:', event.error);
        }
        
        // Only show error toast for actual errors (not user-initiated stops)
        if (event.error !== 'aborted') {
          toast({
            description: (
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {errorMessage}
              </span>
            ),
            duration: 3000,
            className: "bg-white text-black border-none",
            style: {
              position: "fixed",
              top: "74px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "auto",
              maxWidth: "none",
              padding: "8px 24px",
              borderRadius: "32px",
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
              zIndex: 9999,
            },
          });
        }
      };
      
      recognition.onend = () => {
        console.log("Voice recognition ended");
        setIsListening(false);
        
        // Mobile-specific: Ensure state is properly reset on mobile
        if (isMobile) {
          console.log("Mobile device - forcing end state reset");
          setTimeout(() => {
            setIsListening(false);
            setShowBottomSheet(false);
          }, 100);
        }
        
        // Dispatch stopped event for animation
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'stopped' }
        }));
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
      
      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Failed to start voice recognition
          </span>
        ),
        duration: 2000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isProcessing) return;
    
    if (isListening) {
      stopListening();
      setShowBottomSheet(false);
    } else {
      startListening();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    onSendMessage(suggestion);
    setShowBottomSheet(false);
  };

  const handleCloseBottomSheet = () => {
    console.log("Closing bottom sheet - stopping OpenAI TTS audio playback");
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }
    setShowBottomSheet(false);
    stopListening();
  };

  const handleMute = () => {
    if ((window as any).currentOpenAIAudio) {
      console.log("Stop button clicked - stopping OpenAI TTS audio playback");
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
      console.log("OpenAI TTS audio stopped successfully");
    }
    
    // Stop autoplay audio as well
    if ((window as any).currentAutoplayAudio) {
      console.log("Stop button clicked - stopping autoplay TTS audio");
      (window as any).currentAutoplayAudio.pause();
      (window as any).currentAutoplayAudio.currentTime = 0;
      (window as any).currentAutoplayAudio = null;
      console.log("Autoplay TTS audio stopped successfully");
    }
    
    setIsResponding(false);
    setShowUnmuteButton(true);
    setShowAskButton(true);
  };

  const handleUnmute = async () => {
    console.log("Unmute button clicked - starting TTS playback");
    
    // Check if there's pending autoplay audio from mobile autoplay blocking
    const pendingAudio = (window as any).pendingAutoplayAudio;
    if (pendingAudio) {
      console.log("Playing pending autoplay audio that was blocked");
      
      // Use the already generated audio
      (window as any).currentOpenAIAudio = pendingAudio;
      (window as any).pendingAutoplayAudio = null;
      
      setIsResponding(true);
      
      // Set up event handlers for the pending audio
      pendingAudio.onplay = () => {
        setIsResponding(true);
        setShowUnmuteButton(false);
        setShowAskButton(false);
        console.log("Pending audio playback started successfully");
      };

      pendingAudio.onended = () => {
        setIsResponding(false);
        setShowUnmuteButton(true);
        setShowAskButton(true);
        console.log("Pending audio playback completed successfully");
      };

      pendingAudio.onerror = (e: any) => {
        console.error("Pending audio playback error:", e);
        setIsResponding(false);
        setShowUnmuteButton(true);
        setShowAskButton(true);
      };

      try {
        await pendingAudio.play();
        console.log("Pending audio started playing successfully");
        return;
      } catch (error) {
        console.error("Failed to play pending audio:", error);
        // Fall through to generate new audio
      }
    }
    
    // Fallback: generate new audio if no pending audio or it failed
    const lastAssistantMessage = (window as any).lastAssistantMessageText;
    
    if (!lastAssistantMessage) {
      console.warn("No assistant message available to play");
      setShowUnmuteButton(true);
      return;
    }

    console.log("Generating new TTS audio for:", lastAssistantMessage.substring(0, 50) + "...");
    
    setIsResponding(true);

    try {
      // Stop any existing audio first
      if ((window as any).currentOpenAIAudio) {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio = null;
      }
      if ((window as any).currentAutoplayAudio) {
        (window as any).currentAutoplayAudio.pause();
        (window as any).currentAutoplayAudio = null;
      }

      // Generate audio using server TTS
      console.log("Generating unmute TTS audio...");
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lastAssistantMessage })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Store reference for stop functionality
      (window as any).currentOpenAIAudio = audio;

      audio.onplay = () => {
        setIsResponding(true);
        setShowUnmuteButton(false);
        setShowAskButton(false);
        console.log("Manual unmute TTS playback started successfully");
      };

      audio.onended = () => {
        setIsResponding(false);
        setShowUnmuteButton(true);
        setShowAskButton(true);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
        console.log("Manual unmute TTS playback completed successfully");
      };

      audio.onerror = (e) => {
        console.error("Manual unmute TTS playback error:", e);
        console.error("Audio error details:", {
          error: audio.error?.message,
          code: audio.error?.code,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        setIsResponding(false);
        setShowUnmuteButton(true);
        setShowAskButton(true);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
        
        toast({
          description: (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Failed to play audio - please try again
            </span>
          ),
          duration: 3000,
          className: "bg-white text-black border-none",
          style: {
            position: "fixed",
            top: "74px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            maxWidth: "none",
            padding: "8px 24px",
            borderRadius: "32px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
        });
      };

      audio.onabort = () => {
        console.log("Manual unmute audio playback aborted");
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
      };

      // Set audio properties for better compatibility
      audio.preload = 'auto';
      audio.volume = 0.8;

      console.log("Attempting to play manual unmute audio...");
      
      // Ensure audio context is ready for user-initiated playback
      if (typeof (window as any).initAudioContext === 'function') {
        await (window as any).initAudioContext();
      }
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        try {
          await playPromise;
          console.log("Manual unmute audio play promise resolved successfully");
        } catch (playError: any) {
          console.error("Manual unmute audio play failed:", playError);
          
          if (playError.name === 'NotAllowedError') {
            console.error("Manual audio playback blocked by browser");
            throw new Error("Audio playback blocked - please check browser settings");
          } else {
            throw playError;
          }
        }
      }

      audio.onerror = (e) => {
        console.error("Manual unmute TTS playback error:", e);
        setIsResponding(false);
        setShowUnmuteButton(true);
        setShowAskButton(true);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
      };

      // Ensure audio plays immediately
      console.log("Starting manual unmute TTS playback...");
      await audio.play();
      console.log("Manual unmute TTS playback initiated successfully");

    } catch (error) {
      console.error("Failed to generate or play unmute TTS audio:", error);
      setIsResponding(false);
      setShowUnmuteButton(true);
      setShowAskButton(true);
      
      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Failed to play audio
          </span>
        ),
        duration: 2000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
    }
  };

  const handleAsk = () => {
    setShowUnmuteButton(false);
    setShowAskButton(false);
    handleCloseBottomSheet();
    startListening();
  };

  return (
    <div style={{ position: 'relative' }}>
      {!showBottomSheet && (
        <div
          onClick={toggleListening}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: isProcessing ? 'default' : 'pointer',
            border: 'none',
            outline: 'none',
            transition: 'background-color 0.2s ease',
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 20 20"
            style={{
              color: isProcessing ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 1)'
            }}
          >
            <path fill="currentColor" d="M5.5 10a.5.5 0 0 0-1 0a5.5 5.5 0 0 0 5 5.478V17.5a.5.5 0 0 0 1 0v-2.022a5.5 5.5 0 0 0 5-5.478a.5.5 0 0 0-1 0a4.5 4.5 0 1 1-9 0m7.5 0a3 3 0 0 1-6 0V5a3 3 0 0 1 6 0z"/>
          </svg>
        </div>
      )}
      
      <VoiceBottomSheet 
        isOpen={showBottomSheet} 
        onClose={handleCloseBottomSheet}
        onMute={handleMute}
        onUnmute={handleUnmute}
        onAsk={handleAsk}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isProcessing}
        showSuggestions={false}
        showUnmuteButton={showUnmuteButton && !isListening && !isResponding && !isProcessing}
        showAskButton={showAskButton && !isListening && !isResponding && !isProcessing}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default VoiceAssistant;