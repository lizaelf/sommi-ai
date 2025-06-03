import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { initAudioContext, isAudioContextInitialized } from '@/lib/audioContext';
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
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Don't request mic permission on mount - only when user clicks mic button

  // Handle audio status changes and page visibility
  useEffect(() => {
    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      
      if (status === 'playing') {
        setIsResponding(true);
      } else if (status === 'stopped' || status === 'paused' || status === 'muted') {
        setIsResponding(false);
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
        
        // Cancel speech synthesis
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        
        setIsResponding(false);
        setIsLoadingAudio(false);
      }
    };

    // Stop microphone when user navigates away
    const handleBeforeUnload = () => {
      console.log("Page unloading - stopping microphone access");
      stopListening();
    };

    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Error cleaning up speech recognition:", e);
        }
      }
    };
  }, []);

  // Show listen button when AI responds
  useEffect(() => {
    if (!isProcessing && !isListening && !isResponding) {
      setShowListenButton(true);
    } else {
      setShowListenButton(false);
    }
  }, [isProcessing, isListening, isResponding]);

  const toggleListening = async () => {
    if (!isAudioContextInitialized()) {
      try {
        await initAudioContext();
        console.log("Audio context initialized on microphone click");
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
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
              Failed to initialize audio system
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
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = async () => {
    console.log('startListening called');
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
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
                Please try again
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
      
      recognition.onend = () => {
        setIsListening(false);
        
        // Dispatch stopped event for animation
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'stopped' }
        }));
      };
      
      recognitionRef.current = recognition;
      console.log('Starting speech recognition...');
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
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
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleCloseBottomSheet = () => {
    // Stop any playing audio when closing
    if ((window as any).currentOpenAIAudio) {
      console.log("Closing bottom sheet - stopping OpenAI TTS audio playback");
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Reset all states
    setIsResponding(false);
    setShowListenButton(false);
    setIsLoadingAudio(false);
    setShowAskButton(false);
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
    
    // Also call the voice assistant mute function
    if (window.voiceAssistant?.muteAndSavePosition) {
      window.voiceAssistant.muteAndSavePosition();
    }
    
    setIsResponding(false);
    setShowListenButton(false); // Hide listen button after stop
    setIsLoadingAudio(false);
    setShowAskButton(true); // Show ask button after stopping audio
  };

  const handleUnmute = () => {
    console.log("Unmute button clicked");
    if (window.voiceAssistant?.resumeFromMute) {
      window.voiceAssistant.resumeFromMute();
    }
    setIsResponding(true);
    setShowAskButton(false);
  };

  const handleAsk = () => {
    setShowAskButton(false); // Hide ask button when starting new question
    handleCloseBottomSheet();
    startListening();
  };

  const handleListenResponse = async () => {
    console.log("Listen Response button clicked - checking for assistant message");
    const lastAssistantMessage = (window as any).lastAssistantMessageText;
    
    console.log("Last assistant message found:", lastAssistantMessage ? "Yes" : "No");
    console.log("Message preview:", lastAssistantMessage ? lastAssistantMessage.substring(0, 100) + "..." : "None");
    
    if (!lastAssistantMessage) {
      console.log("No assistant message available for TTS");
      setShowListenButton(true);
      return;
    }
    
    console.log("Listen Response button clicked");
    setIsLoadingAudio(true);
    setShowListenButton(false);
    
    try {
      console.log("Playing stored response with OpenAI TTS");
      setIsResponding(true);
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lastAssistantMessage })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        (window as any).currentOpenAIAudio = audio;
        
        audio.onplay = () => {
          setIsLoadingAudio(false);
        };
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsResponding(false);
          setShowListenButton(true);
          (window as any).currentOpenAIAudio = null;
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsResponding(false);
          setIsLoadingAudio(false);
          setShowListenButton(true);
          (window as any).currentOpenAIAudio = null;
        };
        
        await audio.play();
      } else {
        console.error("Failed to generate text-to-speech");
        setIsResponding(false);
        setIsLoadingAudio(false);
        setShowListenButton(true);
      }
    } catch (error) {
      console.error("Error in handleListenResponse:", error);
      setIsResponding(false);
      setIsLoadingAudio(false);
      setShowListenButton(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
    setShowBottomSheet(false);
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
        showSuggestions={!isListening && !isResponding && !isProcessing}
        showListenButton={showListenButton && !isListening && !isResponding}
        showAskButton={showAskButton && !isListening && !isResponding}
        showUnmuteButton={!isResponding && !isListening && !isProcessing}
        isLoadingAudio={isLoadingAudio}
        onSuggestionClick={handleSuggestionClick}
        onListenResponse={handleListenResponse}
      />
    </div>
  );
};

export default VoiceAssistant;