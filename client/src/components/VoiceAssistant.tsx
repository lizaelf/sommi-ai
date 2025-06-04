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

  // Centralized function to stop all audio playback
  const stopAllAudio = (source = "unknown") => {
    console.log(`Audio stop requested from: ${source}`);
    
    // Set flag to track source of audio stop for Ask button logic
    (window as any).lastAudioStopSource = source;
    
    let audioStopped = false;
    
    // Stop OpenAI TTS audio
    if ((window as any).currentOpenAIAudio) {
      try {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio.currentTime = 0;
        (window as any).currentOpenAIAudio.onended = null;
        (window as any).currentOpenAIAudio.onerror = null;
        (window as any).currentOpenAIAudio.onplay = null;
        (window as any).currentOpenAIAudio = null;
        audioStopped = true;
      } catch (error) {
        console.warn("Error stopping OpenAI audio:", error);
        (window as any).currentOpenAIAudio = null;
      }
    }
    
    // Stop autoplay TTS audio
    if ((window as any).currentAutoplayAudio) {
      try {
        (window as any).currentAutoplayAudio.pause();
        (window as any).currentAutoplayAudio.currentTime = 0;
        (window as any).currentAutoplayAudio.onended = null;
        (window as any).currentAutoplayAudio.onerror = null;
        (window as any).currentAutoplayAudio.onplay = null;
        (window as any).currentAutoplayAudio = null;
        audioStopped = true;
      } catch (error) {
        console.warn("Error stopping autoplay audio:", error);
        (window as any).currentAutoplayAudio = null;
      }
    }
    
    // Stop any DOM audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach((audio, index) => {
      try {
        if (!audio.paused) {
          audio.pause();
          audioStopped = true;
        }
        audio.currentTime = 0;
        audio.volume = 0;
        // Remove from DOM if possible
        if (audio.parentNode) {
          audio.parentNode.removeChild(audio);
        }
      } catch (error) {
        console.warn(`Error stopping DOM audio element ${index}:`, error);
      }
    });
    
    // Force UI state reset
    setIsResponding(false);
    
    if (audioStopped) {
      console.log(`Audio stopped successfully from: ${source}`);
    }
    return audioStopped;
  };

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

    // Handle autoplay requests independent of button state
    const handleAutoplayRequest = (event: CustomEvent) => {
      try {
        const text = event.detail?.text;
        if (text && showBottomSheet) {
          console.log("Autoplay TTS requested via event:", text.substring(0, 50) + "...");
          startAutoplayTTS(text);
        }
      } catch (error) {
        console.error("Error handling autoplay request:", error);
      }
    };

    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    window.addEventListener('showUnmuteButton', handleShowUnmuteButton as EventListener);
    window.addEventListener('requestAutoplayTTS', handleAutoplayRequest as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      window.removeEventListener('showUnmuteButton', handleShowUnmuteButton as EventListener);
      window.removeEventListener('requestAutoplayTTS', handleAutoplayRequest as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const startListening = async () => {
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

    // Request microphone permission
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
        
        // Only start autoplay TTS when opening bottom sheet via wine glass click, NOT via Ask button
        // Check if this is from Ask button by checking if audio was recently stopped
        const isFromAskButton = (window as any).lastAudioStopSource === "Ask button";
        
        if (!isFromAskButton) {
          const lastAssistantMessage = (window as any).lastAssistantMessageText;
          if (lastAssistantMessage) {
            console.log("Voice bottom sheet opened via wine glass - starting autoplay TTS");
            startAutoplayTTS(lastAssistantMessage);
          }
        } else {
          console.log("Voice bottom sheet opened via Ask button - skipping autoplay TTS");
          // Clear the flag
          (window as any).lastAudioStopSource = null;
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

  const startAutoplayTTS = async (text: string) => {
    try {
      console.log("Starting autoplay TTS for voice bottom sheet...");
      
      // Prevent multiple simultaneous autoplay requests
      if ((window as any).currentAutoplayAudio) {
        console.log("Autoplay already in progress, skipping");
        return;
      }
      
      // Ensure audio context is initialized before attempting playback
      const audioContextInitialized = await (window as any).initAudioContext?.() || true;
      if (!audioContextInitialized) {
        console.warn("Audio context not initialized for autoplay");
      }

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg, audio/*'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS API error: ${response.status} - ${errorText}`);
      }

      console.log("TTS response received for autoplay, processing audio...");
      const audioBuffer = await response.arrayBuffer();
      
      if (audioBuffer.byteLength === 0) {
        throw new Error("Received empty audio buffer for autoplay");
      }

      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const autoplayAudio = new Audio(audioUrl);

      // Use separate reference for autoplay
      (window as any).currentAutoplayAudio = autoplayAudio;

      autoplayAudio.onplay = () => {
        console.log("Autoplay TTS started for voice bottom sheet");
        setIsResponding(true);
        // Keep buttons available during autoplay - don't hide them
      };

      autoplayAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        (window as any).currentAutoplayAudio = null;
        console.log("Autoplay TTS completed for voice bottom sheet");
        setIsResponding(false);
        // Always show both buttons after autoplay completes
        setShowUnmuteButton(true);
        setShowAskButton(true);
      };

      autoplayAudio.onerror = (e) => {
        console.error("Autoplay TTS playback error for voice bottom sheet:", e);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentAutoplayAudio = null;
        setIsResponding(false);
        // Always show both buttons even after autoplay error
        setShowUnmuteButton(true);
        setShowAskButton(true);
        
        // Show user-friendly error message
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
              Audio playback failed - please try again
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

      autoplayAudio.onabort = () => {
        console.log("Autoplay TTS aborted for voice bottom sheet");
        URL.revokeObjectURL(audioUrl);
        (window as any).currentAutoplayAudio = null;
      };

      // Set audio properties for better compatibility
      autoplayAudio.preload = 'auto';
      autoplayAudio.volume = 0.8;

      console.log("Attempting to play autoplay audio for voice bottom sheet...");
      
      // Add timeout for audio loading
      autoplayAudio.addEventListener('loadeddata', () => {
        console.log("Audio data loaded successfully");
      });
      
      autoplayAudio.addEventListener('canplaythrough', () => {
        console.log("Audio can play through without buffering");
      });
      
      // Wait for audio to be ready before playing
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Audio loading timeout"));
        }, 10000); // 10 second timeout
        
        autoplayAudio.oncanplay = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        
        autoplayAudio.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Audio loading failed"));
        };
        
        // Start loading the audio
        autoplayAudio.load();
      });
      
      console.log("Audio ready, attempting to play...");
      const playPromise = autoplayAudio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log("Autoplay audio started successfully for voice bottom sheet");
      }

    } catch (error) {
      console.error("Failed to generate or play autoplay TTS for voice bottom sheet:", error);
      setIsResponding(false);
      // Always show both buttons even when autoplay fails
      setShowUnmuteButton(true);
      setShowAskButton(true);
    }
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
    // Use centralized stop function
    stopAllAudio("Stop button");
    
    // Update UI state
    setShowUnmuteButton(true);
    setShowAskButton(true);
  };

  const handleUnmute = async () => {
    console.log("Unmute button clicked - starting TTS playback");
    const lastAssistantMessage = (window as any).lastAssistantMessageText;
    
    if (!lastAssistantMessage) {
      console.warn("No assistant message available to play");
      setShowUnmuteButton(true);
      return;
    }

    console.log("Playing audio response for:", lastAssistantMessage.substring(0, 50) + "...");
    
    // Don't hide unmute button immediately - wait for successful audio start
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
      audio.crossOrigin = 'anonymous';

      console.log("Attempting to play manual unmute audio...");
      
      // Add loading events for debugging
      audio.addEventListener('loadstart', () => {
        console.log("Manual unmute audio loading started");
      });
      
      audio.addEventListener('loadeddata', () => {
        console.log("Manual unmute audio data loaded");
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log("Manual unmute audio can play through");
      });
      
      // Wait for audio to be ready before playing
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Manual unmute audio loading timeout"));
        }, 8000); // 8 second timeout
        
        const onCanPlay = () => {
          clearTimeout(timeout);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve(true);
        };
        
        const onError = () => {
          clearTimeout(timeout);
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(new Error("Manual unmute audio loading failed"));
        };
        
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('error', onError);
        
        // Start loading the audio
        audio.load();
      });
      
      console.log("Manual unmute audio ready, attempting to play...");
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log("Manual unmute audio play promise resolved successfully");
        console.log("Manual unmute TTS playback completed");
      };

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

  // Listening function for Ask button that bypasses autoplay
  const startListeningFromAskButton = async () => {
    const hasPermission = await getMicrophonePermission();
    if (!hasPermission) {
      const shouldRequest = !shouldSkipPermissionPrompt();
      if (shouldRequest) {
        const granted = await requestMicrophonePermission();
        if (!granted) return;
      } else {
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
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mic-status', {
            detail: { status: 'listening' }
          }));
        }, 100);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'processing' }
        }));
        
        onSendMessage(transcript);
      };
      
      recognition.onerror = (event: any) => {
        setIsListening(false);
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'stopped' }
        }));
      };
      
      recognition.onend = () => {
        setIsListening(false);
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'stopped' }
        }));
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Speech recognition not supported:', error);
    }
  };

  const handleAsk = () => {
    // Force stop all audio immediately
    stopAllAudio("Ask button");
    
    // Update UI state
    setShowUnmuteButton(false);
    setShowAskButton(false);
    setIsResponding(false);
    
    // Start listening without autoplay
    setTimeout(() => {
      startListeningFromAskButton();
    }, 100);
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