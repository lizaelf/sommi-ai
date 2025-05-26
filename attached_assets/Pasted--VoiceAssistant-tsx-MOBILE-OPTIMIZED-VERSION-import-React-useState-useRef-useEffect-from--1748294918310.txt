// VoiceAssistant.tsx - MOBILE-OPTIMIZED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  const [isResponding, setIsResponding] = useState(false);
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false);
  const [responseComplete, setResponseComplete] = useState(false);
  const [isVoiceThinking, setIsVoiceThinking] = useState(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  
  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const recognitionRef = useRef<any>(null);
  const thinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // SIMPLIFIED: Clear any timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Error cleaning up speech recognition:", e);
        }
      }
    };
  }, []);

  // MOBILE-FIRST: Simple thinking state timeout
  const setThinkingWithTimeout = (thinking: boolean) => {
    setIsVoiceThinking(thinking);
    
    // Clear existing timeout
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
    
    // Set aggressive timeout for mobile to prevent getting stuck
    if (thinking && isMobile) {
      console.log("📱 Mobile: Setting 10s thinking timeout to prevent stuck state");
      thinkingTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Mobile thinking timeout - forcing exit");
        setIsVoiceThinking(false);
        setIsResponding(false);
        setUsedVoiceInput(false);
        setResponseComplete(true);
        setHasReceivedFirstResponse(true);
      }, 10000); // Only 10 seconds for mobile to prevent stuck state
    }
  };

  const toggleListening = async () => {
    if (!isAudioContextInitialized()) {
      try {
        await initAudioContext();
        console.log("Audio context initialized");
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        toast({
          title: "Audio Error",
          description: "Could not initialize audio. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }
    
    console.log("Opening bottom sheet...");
    setShowBottomSheet(true);
  };
  
  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Try using Chrome.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log("Microphone permission granted");

      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 1;
        
        recognitionRef.current.onresult = (event: any) => {
          const results = event.results;
          let finalTranscript = '';
          
          for (let i = 0; i < results.length; i++) {
            if (results[i].isFinal) {
              finalTranscript = results[i][0].transcript;
              
              console.log("Final transcript:", finalTranscript);
              setStatus('Processing your question...');
              setUsedVoiceInput(true);
              setHasAskedQuestion(true);
              
              // MOBILE-FIRST: Use simplified thinking state with timeout
              setThinkingWithTimeout(true);
              
              setIsListening(false);
              
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
              
              onSendMessage(finalTranscript);
              break;
            }
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
          setStatus('');
        };
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          if (event.error === 'no-speech') {
            console.log("No speech detected, restarting...");
            setTimeout(() => {
              if (!isProcessing) {
                startListening();
              }
            }, 50);
            return;
          }
          
          setStatus(`Error: ${event.error}`);
          setIsListening(false);
          
          if (event.error !== 'no-speech') {
            toast({
              title: "Voice Recognition Error",
              description: `Error: ${event.error}. Please try again.`,
              variant: "destructive"
            });
          }
        };
        
        recognitionRef.current.start();
        setStatus('Listening for your question...');
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start speech recognition. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Microphone permission error:', error);
      toast({
        title: "Microphone Error", 
        description: "Cannot access your microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };

  // SIMPLIFIED: Mobile-optimized TTS with short timeout
  const speakResponse = async (text: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("📱 Mobile TTS timeout - aborting request");
        controller.abort();
      }, isMobile ? 8000 : 15000); // Much shorter timeout for mobile
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.substring(0, 300) }), // Limit text for faster processing
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Store reference for stop button
      (window as any).currentOpenAIAudio = audio;
      
      audio.onplay = () => {
        setIsResponding(true);
        console.log("Audio started playing");
      };
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsResponding(false);
        setResponseComplete(true);
        setHasReceivedFirstResponse(true);
        setUsedVoiceInput(false);
        (window as any).currentOpenAIAudio = null;
        console.log("Audio playback completed");
      };
      
      audio.onerror = (error: any) => {
        console.error("Audio playback error:", error);
        URL.revokeObjectURL(audioUrl);
        setIsResponding(false);
        setUsedVoiceInput(false);
        setResponseComplete(true);
        setHasReceivedFirstResponse(true);
        (window as any).currentOpenAIAudio = null;
      };
      
      await audio.play();
      console.log("Playing audio");
      
    } catch (error) {
      console.error("TTS error:", error);
      // MOBILE-FIRST: Always show suggestions on TTS error
      setIsResponding(false);
      setUsedVoiceInput(false);
      setResponseComplete(true);
      setHasReceivedFirstResponse(true);
    }
  };

  // SIMPLIFIED: Auto-speak response when processing completes
  useEffect(() => {
    if (!isProcessing && status === 'Processing your question...') {
      setStatus('');
      
      // Clear thinking timeout since processing is done
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current);
        thinkingTimeoutRef.current = null;
      }
      
      setIsVoiceThinking(false); // Clear thinking state immediately
      
      if (usedVoiceInput && showBottomSheet) {
        setHasReceivedFirstResponse(true);
        
        try {
          const messagesContainer = document.getElementById('conversation');
          if (messagesContainer) {
            const messageElements = messagesContainer.querySelectorAll('[data-role="assistant"]');
            if (messageElements && messageElements.length > 0) {
              const lastMessage = messageElements[messageElements.length - 1];
              
              if (lastMessage && lastMessage.textContent) {
                const messageText = lastMessage.textContent || '';
                console.log("Found message to speak:", messageText.substring(0, 50) + "...");
                
                // MOBILE-FIRST: Always try to speak, with quick fallback
                setTimeout(async () => {
                  try {
                    await speakResponse(messageText);
                  } catch (error) {
                    console.error('Auto-speak failed:', error);
                    // Immediate fallback to suggestions
                    setIsResponding(false);
                    setUsedVoiceInput(false);
                    setResponseComplete(true);
                    setHasReceivedFirstResponse(true);
                  }
                }, 100); // Very short delay
              }
            }
          }
        } catch (error) {
          console.error('Error finding message to speak:', error);
          setUsedVoiceInput(false);
          setShowBottomSheet(false);
        }
      } else {
        if (!hasReceivedFirstResponse) {
          setShowBottomSheet(false);
        }
        setUsedVoiceInput(false);
      }
    }
  }, [isProcessing, status, usedVoiceInput, showBottomSheet, hasReceivedFirstResponse]);

  const handleCloseBottomSheet = () => {
    // Stop any audio
    if ((window as any).currentOpenAIAudio) {
      const audio = (window as any).currentOpenAIAudio;
      audio.pause();
      audio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }
    
    // Clear timeouts
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
    
    setIsResponding(false);
    setResponseComplete(true);
    
    if (hasAskedQuestion) {
      toast({
        description: (
          <span style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            This conversation is saved in{' '}
            <a 
              href="/my-cellar" 
              style={{ 
                textDecoration: 'underline',
                color: 'inherit',
                fontWeight: 'inherit'
              }}
            >
              My cellar
            </a>
          </span>
        ),
        duration: 5000,
        className: "bg-white text-black border-none",
        style: {
          position: 'fixed',
          top: '74px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'fit-content',
          paddingTop: '8px',
          paddingBottom: '8px',
          paddingLeft: '20px',
          paddingRight: '20px',
          borderRadius: '24px',
          zIndex: 10000
        }
      });
    }
    setShowBottomSheet(false);
  };
  
  const handleAsk = async () => {
    if (isListening) {
      return;
    }
    
    console.log("Ask button clicked");
    setResponseComplete(false);
    
    try {
      setIsListening(true);
      await startListening();
      console.log("Started listening from Ask button");
    } catch (error) {
      setIsListening(false);
      console.error("Failed to start listening:", error);
      toast({
        title: "Error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleMute = () => {
    console.log("Stop button clicked");
    
    if ((window as any).currentOpenAIAudio) {
      const audio = (window as any).currentOpenAIAudio;
      audio.pause();
      audio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }
    
    setIsResponding(false);
    setResponseComplete(true);
    setHasReceivedFirstResponse(true);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    
    setResponseComplete(false);
    setThinkingWithTimeout(true); // Use timeout version
    
    try {
      await onSendMessage(suggestion);
      setUsedVoiceInput(true);
      setHasAskedQuestion(true);
    } catch (error) {
      console.error("Error sending suggestion:", error);
      setIsVoiceThinking(false);
      toast({
        title: "Error",
        description: "Failed to send suggestion. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center">
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          opacity: isProcessing ? 0.5 : 1
        }}
        onClick={isProcessing ? undefined : toggleListening}
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
      
      <VoiceBottomSheet 
        isOpen={showBottomSheet} 
        onClose={handleCloseBottomSheet}
        onMute={handleMute}
        onAsk={handleAsk}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isProcessing || isVoiceThinking}
        showSuggestions={hasReceivedFirstResponse && !isListening && !isResponding && !isVoiceThinking && responseComplete}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default VoiceAssistant;