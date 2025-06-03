import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { initAudioContext, isAudioContextInitialized, unlockAudioForSession } from '@/lib/audioContext';
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
  const [showListenButton, setShowListenButton] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const [hasAutoPlayPermission, setHasAutoPlayPermission] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [isFirstResponse, setIsFirstResponse] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Check if user has already given auto-play permission
  useEffect(() => {
    const permission = localStorage.getItem('voiceAutoPlayPermission');
    if (permission === 'granted') {
      setHasAutoPlayPermission(true);
      setIsFirstResponse(false);
    }
  }, []);

  // Auto-play response when ready if user has given permission
  useEffect(() => {
    if (!isProcessing && !isListening && !isResponding && hasAutoPlayPermission && !isFirstResponse) {
      const lastAssistantMessage = (window as any).lastAssistantMessageText;
      if (lastAssistantMessage && showBottomSheet && !showAskButton) {
        // Small delay to ensure UI is ready
        setTimeout(() => {
          handleListenResponse();
        }, 500);
      }
    }
  }, [isProcessing, isListening, isResponding, hasAutoPlayPermission, isFirstResponse, showBottomSheet, showAskButton]);

  // Handle audio status changes and page visibility
  useEffect(() => {
    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      
      if (status === 'playing') {
        setIsResponding(true);
        setShowListenButton(false);
        setShowAskButton(false);
        setShowUnmuteButton(false);
      } else if (status === 'stopped' || status === 'paused' || status === 'muted') {
        setIsResponding(false);
        setShowListenButton(false);
        setIsLoadingAudio(false);
        setShowAskButton(true);
        setShowUnmuteButton(false);
      }
    };

    const handlePageVisibility = () => {
      if (document.hidden && isListening) {
        console.log('Page hidden - stopping microphone access');
        stopListening();
        setShowBottomSheet(false);
      }
    };

    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    document.addEventListener('visibilitychange', handlePageVisibility);

    return () => {
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      document.removeEventListener('visibilitychange', handlePageVisibility);
    };
  }, [isListening]);

  const startListening = async () => {
    // Ensure audio context is available and ready before starting microphone
    if (!isAudioContextInitialized()) {
      console.log('Initializing audio context before microphone access');
      await initAudioContext();
      await unlockAudioForSession();
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
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
            Speech recognition not supported
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
      return;
    }

    // Check if we can skip permission prompt
    if (shouldSkipPermissionPrompt()) {
      console.log('Using saved microphone permission');
      // Try to get microphone access directly using saved permission
      try {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          console.log('Saved permission invalid, requesting fresh permission');
        }
      } catch (error) {
        console.log('Error with saved permission, requesting fresh permission');
      }
    } else {
      // Request fresh permission
      console.log('Requesting fresh microphone permission');
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
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setShowBottomSheet(true);
        console.log("Voice recognition started");
        
        // Dispatch mic-status event for animation
        console.log('VoiceAssistant: Dispatching listening event');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mic-status', {
            detail: { status: 'listening' }
          }));
        }, 100); // Small delay to ensure event listeners are ready
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
        
        // Dispatch stopped event for animation on error
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'stopped' }
        }));
        
        if (event.error === 'not-allowed') {
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
                Microphone permission denied
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
        setIsListening(false);
        console.log("Voice recognition ended");
        
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
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      console.log("Speech synthesis cancelled");
    }
    
    setIsResponding(false);
    setShowListenButton(false); // Hide listen button after stop
    setIsLoadingAudio(false);
    setShowAskButton(true); // Show ask button after stopping audio
    setShowUnmuteButton(true); // Show unmute button after stopping
  };

  const handleUnmute = () => {
    console.log("Unmute button clicked - attempting to play last response");
    setShowUnmuteButton(false);
    setShowAskButton(false);
    handleListenResponse();
  };

  const handleAsk = () => {
    setShowAskButton(false); // Hide ask button when starting new question
    setShowUnmuteButton(false); // Hide unmute button when starting new question
    handleCloseBottomSheet();
    startListening();
  };

  const handleListenResponse = async () => {
    console.log("Listen Response button clicked - checking for assistant message");
    const lastAssistantMessage = (window as any).lastAssistantMessageText;
    
    if (!lastAssistantMessage) {
      console.warn("No assistant message available to play");
      setShowAskButton(true);
      return;
    }

    console.log("Playing audio response for:", lastAssistantMessage.substring(0, 50) + "...");
    setIsLoadingAudio(true);
    setShowListenButton(false);
    setShowAskButton(false);
    setShowUnmuteButton(false);

    try {
      // Request auto-play permission on first use
      if (isFirstResponse && !hasAutoPlayPermission) {
        const userConfirmed = confirm(
          "Would you like to enable automatic voice responses? This will allow the AI to speak its answers without clicking a button each time."
        );
        
        if (userConfirmed) {
          setHasAutoPlayPermission(true);
          setIsFirstResponse(false);
          localStorage.setItem('voiceAutoPlayPermission', 'granted');
          console.log("Auto-play permission granted by user");
        } else {
          setIsFirstResponse(false);
          localStorage.setItem('voiceAutoPlayPermission', 'denied');
          console.log("Auto-play permission denied by user");
        }
      }

      // Generate audio using server TTS
      console.log("Generating audio...");
      const response = await fetch('/api/tts', {
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

      audio.onloadstart = () => {
        setIsLoadingAudio(true);
        console.log("Audio loading started");
      };

      audio.oncanplaythrough = () => {
        setIsLoadingAudio(false);
        console.log("Audio ready to play");
      };

      audio.onplay = () => {
        setIsResponding(true);
        setIsLoadingAudio(false);
        setShowListenButton(false);
        setShowAskButton(false);
        setShowUnmuteButton(false);
        console.log("Manual audio playback started - suggestions already hidden");
      };

      audio.onended = () => {
        setIsResponding(false);
        setShowAskButton(true);
        setShowUnmuteButton(false);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
        console.log("Audio playback completed");
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsResponding(false);
        setIsLoadingAudio(false);
        setShowAskButton(true);
        setShowUnmuteButton(true);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
      };

      await audio.play();

    } catch (error) {
      console.error("Failed to generate or play TTS audio:", error);
      setIsLoadingAudio(false);
      setIsResponding(false);
      setShowAskButton(true);
      setShowUnmuteButton(true);
    }
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
        showSuggestions={!isListening && !isResponding && !isProcessing && !showAskButton && !showUnmuteButton}
        showListenButton={showListenButton && !isListening && !isResponding}
        showAskButton={showAskButton && !isListening && !isResponding}
        showUnmuteButton={showUnmuteButton && !isListening && !isResponding}
        isLoadingAudio={isLoadingAudio}
        onSuggestionClick={handleSuggestionClick}
        onListenResponse={handleListenResponse}
      />
    </div>
  );
};

export default VoiceAssistant;