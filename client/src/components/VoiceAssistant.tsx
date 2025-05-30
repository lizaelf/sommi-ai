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
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false);
  const [responseComplete, setResponseComplete] = useState(false);
  const [isVoiceThinking, setIsVoiceThinking] = useState(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const [showListenButton, setShowListenButton] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false); // Loading state for TTS
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
      
      // Auto-restart logic
      if (autoRestartEnabled && usedVoiceInput && !isProcessing && !showBottomSheet && hasReceivedFirstResponse) {
        if (status === 'stopped' && event.detail?.reason !== 'user_stopped') {
          setTimeout(() => {
            if (usedVoiceInput && !isProcessing && !isVoiceThinking) {
              console.log("Auto-restarting voice recognition after audio finished");
              startListening();
            }
          }, 500);
        }
      }
    };

    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    return () => window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
  }, [autoRestartEnabled, usedVoiceInput, isProcessing, showBottomSheet, hasReceivedFirstResponse, isVoiceThinking]);

  // Effect to handle status changes and show Listen Response button
  useEffect(() => {
    console.log("Status check triggered, current status:", status, "isProcessing:", isProcessing);
    
    if (!status && !isProcessing && usedVoiceInput && responseComplete && !isVoiceThinking && !isResponding) {
      console.log("✅ Status condition met - processing complete with correct status");
      console.log("Voice input was used and in voice mode - finding message to speak automatically...");
      
      // Get the stored message text
      const storedMessageText = (window as any).storedAssistantMessage;
      if (storedMessageText) {
        console.log("Found stored message text:", storedMessageText.substring(0, 50) + "...");
        console.log("🎯 AI RESPONSE READY - Forcing Listen Response button to appear");
        
        setIsVoiceThinking(false);
        setResponseComplete(true);
        setShowListenButton(true);
        console.log("✅ Listen Response button state set to TRUE");
        
        // Preload TTS audio for instant playback
        console.log("🔊 Preloading TTS audio for instant playback...");
        preloadTTSAudio(storedMessageText);
      }
    }
    
    // Fallback mechanism if thinking gets stuck
    if (!isProcessing && usedVoiceInput && isVoiceThinking) {
      console.log("Fallback: AI response should be ready, checking for Listen Response button");
      setTimeout(() => {
        console.log("Auto-restarting voice recognition after audio finished");
        if (isVoiceThinking && !isResponding) {
          console.log("🚨 Forcing fallback: AI responded but thinking is stuck");
          setIsVoiceThinking(false);
          setResponseComplete(true);
          setShowListenButton(true);
        }
      }, 2000);
    }
  }, [status, isProcessing, usedVoiceInput, responseComplete, isVoiceThinking, isResponding]);

  // Show debug information for Listen Response button
  useEffect(() => {
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
  }, [showListenButton, isListening, isResponding, isVoiceThinking, responseComplete, hasReceivedFirstResponse, usedVoiceInput, isProcessing, status]);

  // Preload TTS audio function
  const preloadTTSAudio = async (text: string) => {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Cache the audio URL for instant playback
        (window as any).cachedAudioUrl = audioUrl;
        console.log("✅ TTS audio preloaded and cached successfully");
      }
    } catch (error) {
      console.error("Failed to preload TTS audio:", error);
    }
  };

  const initializeSpeechRecognition = async () => {
    // Initialize audio context on mobile devices
    if (!isAudioContextInitialized()) {
      try {
        await initAudioContext();
        console.log("Audio context created");
      } catch (error) {
        console.log("❌ Audio context failed to initialize");
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
          
          // Update status with interim results to show activity
          if (interimTranscript.trim()) {
            setStatus(`Listening: "${interimTranscript.trim()}"`);
          }
          
          // Only process when we have a final result
          if (finalTranscript.trim()) {
            finalTranscript = finalTranscript.trim();
            
            console.log("Final transcript:", finalTranscript);
            setStatus('Processing your question...');
            setUsedVoiceInput(true);
            setIsVoiceThinking(true);
            setHasAskedQuestion(true);
            
            (window as any).lastUserQuestion = finalTranscript;
            
            console.log("Setting timeout for thinking state");
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
          
          const micStoppedEvent = new CustomEvent('mic-status', {
            detail: { status: 'stopped' }
          });
          window.dispatchEvent(micStoppedEvent);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setStatus('');
          
          if (event.error === 'not-allowed') {
            toast({
              title: "Permission needed",
              description: "Please allow microphone access to use voice features.",
              variant: "destructive",
            });
          }
        };

      } else {
        console.log('Speech recognition not supported');
        toast({
          title: "Not supported",
          description: "Speech recognition is not supported in this browser.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      await initializeSpeechRecognition();
    }

    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        setStatus('Listening for your question...');
        recognitionRef.current.start();
        
        // Open bottom sheet when starting to listen
        setShowBottomSheet(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
        setStatus('');
        toast({
          title: "Error",
          description: "Failed to start voice recognition. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('');
    }
  };

  const handleMute = () => {
    console.log("Stop button clicked - stopping OpenAI TTS audio playback");
    
    // Stop OpenAI TTS audio
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      console.log("OpenAI TTS audio stopped successfully");
      (window as any).currentOpenAIAudio = null;
    }
    
    // Stop Web Speech API
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      console.log("Speech synthesis cancelled");
    }
    
    setIsResponding(false);
    setResponseComplete(true);
    
    if (!hasAskedQuestion) {
      toast({
        title: "Welcome!",
        description: "Ask me anything about Ridge \"Lytton Springs\" Dry Creek Zinfandel.",
      });
    }
    
    // Auto-restart logic
    if (autoRestartEnabled && usedVoiceInput) {
      setTimeout(() => {
        console.log("Auto-restarting voice recognition after audio finished");
        startListening();
      }, 500);
    } else {
      console.log("Stop button clicked - enabling suggestions after manual stop");
      setHasReceivedFirstResponse(true);
      setShowBottomSheet(true);
    }
  };

  const handleAsk = () => {
    if (isListening) {
      stopListening();
    } else {
      setResponseComplete(false);
      startListening();
    }
  };

  const handleCloseBottomSheet = () => {
    if (!isListening) {
      setShowBottomSheet(false);
    }
  };

  const handleListenResponse = async () => {
    console.log("Listen Response button clicked");
    
    // Check if we have cached audio
    const cachedAudioUrl = (window as any).cachedAudioUrl;
    if (cachedAudioUrl) {
      console.log("Using cached audio for instant playback");
      setIsLoadingAudio(false);
      setIsResponding(true);
      
      const audio = new Audio(cachedAudioUrl);
      (window as any).currentOpenAIAudio = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(cachedAudioUrl);
        setIsResponding(false);
        setShowListenButton(true);
        (window as any).currentOpenAIAudio = null;
        (window as any).cachedAudioUrl = null;
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(cachedAudioUrl);
        setIsResponding(false);
        setShowListenButton(true);
        (window as any).currentOpenAIAudio = null;
        (window as any).cachedAudioUrl = null;
      };
      
      await audio.play();
      return;
    }
    
    // No cached audio available, generate it
    const storedMessage = (window as any).storedAssistantMessage;
    if (!storedMessage) {
      console.error("No assistant message found to play");
      setShowListenButton(true);
      return;
    }
    
    console.log("No cached audio available, generating text-to-speech...");
    setIsLoadingAudio(true);
    
    try {
      console.log("Playing stored response with OpenAI TTS");
      setIsResponding(true);
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: storedMessage }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        (window as any).currentOpenAIAudio = audio;
        
        audio.onplay = () => {
          setIsLoadingAudio(false); // Clear loading state when audio starts
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
    setResponseComplete(false);
    setIsVoiceThinking(false);
    setShowListenButton(false);
    
    onSendMessage(suggestion);
    
    setUsedVoiceInput(false);
    setHasAskedQuestion(true);
    
    // Clear thinking timeout
    if ((window as any).currentThinkingTimeout) {
      clearTimeout((window as any).currentThinkingTimeout);
      setIsVoiceThinking(false);
      toast({
        title: "Processing...",
        description: "Getting your answer ready.",
      });
    }
  };

  // Effect to show bottom sheet when conditions are met
  useEffect(() => {
    const shouldShowBottomSheet = 
      (isListening) || 
      (usedVoiceInput && !isProcessing && (isVoiceThinking || responseComplete || showListenButton || hasReceivedFirstResponse));
    
    if (shouldShowBottomSheet) {
      console.log("Opening bottom sheet...");
      setShowBottomSheet(true);
    }
  }, [isListening, usedVoiceInput, isProcessing, isVoiceThinking, responseComplete, showListenButton, hasReceivedFirstResponse]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Microphone button removed */}
      
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