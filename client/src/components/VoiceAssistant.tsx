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
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showListenButton, setShowListenButton] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Handle audio status changes
  useEffect(() => {
    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      
      if (status === 'playing') {
        setIsResponding(true);
      } else if (status === 'stopped' || status === 'paused' || status === 'muted') {
        setIsResponding(false);
      }
    };

    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    
    return () => {
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
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
          title: "Audio Error",
          description: "Failed to initialize audio system",
          variant: "destructive",
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

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
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
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Final transcript:", transcript);
        
        setIsListening(false);
        onSendMessage(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error !== 'aborted') {
          toast({
            title: "Voice Recognition Error",
            description: "Please try again",
            variant: "destructive",
          });
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Voice Recognition Error",
        description: "Failed to start voice recognition",
        variant: "destructive",
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
    setShowListenButton(true);
  };

  const handleAsk = () => {
    handleCloseBottomSheet();
    startListening();
  };

  const handleListenResponse = async () => {
    const lastAssistantMessage = (window as any).lastAssistantMessageText;
    
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
            backgroundColor: isProcessing ? '#444444' : '#666666',
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
              color: isProcessing ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.12)'
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
        isThinking={isProcessing}
        showSuggestions={!isListening && !isResponding && !isProcessing}
        showListenButton={showListenButton && !isListening && !isResponding}
        isLoadingAudio={isLoadingAudio}
        onSuggestionClick={handleSuggestionClick}
        onListenResponse={handleListenResponse}
      />
    </div>
  );
};

export default VoiceAssistant;