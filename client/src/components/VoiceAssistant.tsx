import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { initAudioContext, isAudioContextInitialized } from '@/lib/audioContext';
import VoiceBottomSheet from './VoiceBottomSheet';

interface VoiceAssistantProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSendMessage, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const [usedVoiceInput, setUsedVoiceInput] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false);
  const [responseComplete, setResponseComplete] = useState(false);
  const [isVoiceThinking, setIsVoiceThinking] = useState(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const [showListenButton, setShowListenButton] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Effect to handle audio status changes for auto-restart
  useEffect(() => {
    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      
      if (status === 'playing') {
        setIsResponding(true);
        setResponseComplete(false);
        setIsVoiceThinking(false);
      } else if (status === 'stopped' || status === 'paused' || status === 'muted') {
        setIsResponding(false);
        setIsVoiceThinking(false);
        if (status === 'stopped' && event.detail?.reason !== 'user_stopped') {
          setResponseComplete(true);
        }
      }
      
      // Auto-restart logic after audio ends
      if (status === 'stopped' && autoRestartEnabled && usedVoiceInput && !isProcessing) {
        console.log("Auto-restarting voice recognition after audio finished");
        setTimeout(() => {
          if (!isListening && !isProcessing && !showBottomSheet && hasReceivedFirstResponse) {
            console.log("Auto-restart conditions met - starting listening");
            startListening();
          } else if (usedVoiceInput && !isProcessing && !isVoiceThinking) {
            setShowBottomSheet(true);
          }
        }, 500);
      }
    };

    const handleMicStatusChange = (event: CustomEvent) => {
      const micStatus = event.detail?.status;
      
      if (micStatus === 'processing') {
        setIsVoiceThinking(true);
        setResponseComplete(false);
        setShowListenButton(false);
        setShowBottomSheet(true);
      } else if (micStatus === 'ready' && hasAskedQuestion) {
        toast({
          title: "Microphone ready",
          description: "You can ask your question now",
          variant: "default",
        });
      }
    };

    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    window.addEventListener('mic-status', handleMicStatusChange as EventListener);
    
    return () => {
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      window.removeEventListener('mic-status', handleMicStatusChange as EventListener);
    };
  }, [autoRestartEnabled, usedVoiceInput, isProcessing, isListening, showBottomSheet, hasReceivedFirstResponse, isVoiceThinking, hasAskedQuestion, toast]);

  // Effect to check if Listen Response button should be shown after AI responds
  useEffect(() => {
    if (!isProcessing && usedVoiceInput && !isVoiceThinking) {
      console.log("Status check triggered, current status:", status, "isProcessing:", isProcessing);
      
      if (!isListening && !isResponding && !isVoiceThinking && !responseComplete) {
        console.log("Fallback: AI response should be ready, checking for Listen Response button");
        
        setTimeout(() => {
          if (!isListening && !isResponding && !isVoiceThinking) {
            console.log("🚨 Forcing fallback: AI responded but thinking is stuck");
            setIsVoiceThinking(false);
            setResponseComplete(true);
            setShowListenButton(true);
            setShowBottomSheet(true);
          }
        }, 2000);
      }
    }

    console.log("🔍 LISTEN BUTTON DEBUG:", {
      showListenButton,
      isListening,
      isResponding,
      isVoiceThinking,
      responseComplete,
      hasReceivedFirstResponse,
      usedVoiceInput,
      isProcessing,
      status,
      finalCondition: showListenButton && !isListening && !isResponding
    });

  }, [usedVoiceInput, isProcessing, isVoiceThinking, status, showListenButton, isListening, isResponding, responseComplete, hasReceivedFirstResponse]);

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      console.log("Speech synthesis cancelled when closing");
    }
    
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
    setStatus('');

    if (!hasAskedQuestion) {
      toast({
        title: "Voice Assistant",
        description: "Tap the microphone to ask me anything about this wine!",
        variant: "default",
      });
    }
  };

  const startListening = async () => {
    if (!isAudioContextInitialized() && typeof window !== 'undefined') {
      try {
        await initAudioContext();
      } catch (error) {
        console.error("Failed to initialize audio context:", error);
      }
    }

    setIsListening(true);
    setStatus('Listening for your question...');
    setResponseComplete(false);

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        stream.getTracks().forEach(track => track.stop());
        (window as any).mobileAudioEnabled = true;
        console.log("✅ Mobile audio permissions granted");
      } catch {
        console.log("❌ Mobile audio blocked - will use text fallback");
        (window as any).mobileAudioEnabled = false;
      }
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 1;
        
        // Extended timeout settings to prevent cutting off speech
        if ('speechTimeout' in recognitionRef.current) {
          recognitionRef.current.speechTimeout = 15000;
        }
        if ('speechTimeoutBuffer' in recognitionRef.current) {
          recognitionRef.current.speechTimeoutBuffer = 8000;
        }
        if ('noSpeechTimeout' in recognitionRef.current) {
          recognitionRef.current.noSpeechTimeout = 20000;
        }
        
        recognitionRef.current.onresult = (event: any) => {
          const results = event.results;
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = 0; i < results.length; i++) {
            if (results[i].isFinal) {
              finalTranscript = results[i][0].transcript;
            } else {
              interimTranscript += results[i][0].transcript;
            }
          }
          
          if (interimTranscript && !finalTranscript) {
            console.log("Interim transcript:", interimTranscript);
            setStatus('Listening...');
          }
          
          if (finalTranscript) {
            console.log("Final transcript:", finalTranscript);
            setStatus('Processing your question...');
            setUsedVoiceInput(true);
            setIsVoiceThinking(true);
            setHasAskedQuestion(true);
            
            (window as any).lastUserQuestion = finalTranscript;
            
            const thinkingTimeout = setTimeout(() => {
              if (isVoiceThinking && !isResponding) {
                console.log("Thinking timeout - no response received, showing suggestions");
                setIsVoiceThinking(false);
                setUsedVoiceInput(false);
                setResponseComplete(true);
                setHasReceivedFirstResponse(true);
              }
            }, 20000);
            
            (window as any).currentThinkingTimeout = thinkingTimeout;
            setIsListening(false);
            
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
            
            onSendMessage(finalTranscript);
            
            const micProcessingEvent = new CustomEvent('mic-status', {
              detail: { status: 'processing' }
            });
            window.dispatchEvent(micProcessingEvent);
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
          setStatus('');
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          setStatus('');
          
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone Access Required",
              description: "Please allow microphone access to use voice features.",
              variant: "destructive",
            });
          }
        };
        
        recognitionRef.current.start();
      } else {
        console.log("Speech recognition not supported");
        setIsListening(false);
        
        toast({
          title: "Voice Recognition Not Supported",
          description: "Your browser doesn't support voice recognition. Please type your question instead.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsListening(false);
      setStatus('');
    }
  };

  const handleMute = () => {
    if ((window as any).currentOpenAIAudio) {
      console.log("Stop button clicked - stopping OpenAI TTS audio playback");
      try {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio.currentTime = 0;
        (window as any).currentOpenAIAudio = null;
        console.log("OpenAI TTS audio stopped successfully");
      } catch (error) {
        console.error("Error stopping OpenAI TTS audio:", error);
      }
    }
    
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      console.log("Speech synthesis cancelled");
    }
    
    setIsResponding(false);
    setResponseComplete(true);
    setHasReceivedFirstResponse(true);
    
    console.log("Auto-restarting voice recognition after audio finished");
    setTimeout(() => {
      if (autoRestartEnabled && usedVoiceInput) {
        console.log("Stop button clicked - enabling suggestions after manual stop");
        setShowBottomSheet(true);
      }
    }, 300);
  };

  const handleAsk = () => {
    setShowBottomSheet(false);
    setTimeout(() => {
      startListening();
    }, 100);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShowBottomSheet(false);
    setTimeout(() => {
      onSendMessage(suggestion);
      setUsedVoiceInput(false);
      setHasAskedQuestion(true);
    }, 100);
  };

  const handleListenResponse = async () => {
    console.log("Listen Response button clicked");
    
    if ((window as any).cachedResponseAudio) {
      console.log("Playing cached audio response");
      try {
        const audio = (window as any).cachedResponseAudio;
        (window as any).currentOpenAIAudio = audio;
        setIsResponding(true);
        
        audio.onended = () => {
          setIsResponding(false);
          setShowListenButton(true);
          (window as any).currentOpenAIAudio = null;
        };
        
        audio.onerror = () => {
          setIsResponding(false);
          setShowListenButton(true);
          (window as any).currentOpenAIAudio = null;
        };
        
        await audio.play();
        return;
      } catch (error) {
        console.error("Error playing cached audio:", error);
      }
    }

    const lastAssistantMessage = (window as any).storedAssistantText;
    
    if (!lastAssistantMessage) {
      console.error("No assistant message found to speak");
      setIsResponding(false);
      setShowListenButton(true);
      return;
    }
    
    try {
      console.log("No cached audio available, generating text-to-speech...");
      setIsLoadingAudio(true);
      console.log("Playing stored response with OpenAI TTS");
      setIsResponding(true);
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: lastAssistantMessage }),
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
      console.error("Error in text-to-speech:", error);
      setIsResponding(false);
      setIsLoadingAudio(false);
      setShowListenButton(true);
    }
  };

  useEffect(() => {
    if (usedVoiceInput && !isProcessing && !isVoiceThinking) {
      console.log("Fallback: AI response should be ready, checking for Listen Response button");
      
      setTimeout(() => {
        if (!isListening && !isResponding && !isVoiceThinking) {
          setIsVoiceThinking(false);
          setResponseComplete(true);
          setShowListenButton(true);
          setShowBottomSheet(true);
        }
      }, 1000);
    }
  }, [usedVoiceInput, isProcessing, isVoiceThinking, isListening, isResponding]);

  return (
    <div style={{ position: 'relative' }}>
      {!isListening && !showBottomSheet && (
        <div 
          onClick={() => {
            if (!isListening) {
              setShowBottomSheet(true);
            }
          }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            backgroundColor: isProcessing ? '#666666' : '#333333',
            border: isProcessing ? '2px solid #999999' : '2px solid #FFFFFF',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: isProcessing ? 'default' : 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
            pointerEvents: isProcessing ? 'none' : 'auto'
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 20 20"
            style={{
              color: isProcessing ? '#999999' : 'white'
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
        onAsk={handleAsk}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isProcessing || (isVoiceThinking && !showListenButton && !responseComplete) || status === 'Processing your question...'}
        showSuggestions={hasReceivedFirstResponse && !isListening && !isResponding && !isVoiceThinking && responseComplete && !showListenButton}
        showListenButton={showListenButton && !isListening && !isResponding}
        isLoadingAudio={isLoadingAudio}
        onSuggestionClick={handleSuggestionClick}
        onListenResponse={handleListenResponse}
      />
    </div>
  );
};

export default VoiceAssistant;