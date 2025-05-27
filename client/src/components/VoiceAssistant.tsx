import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { initAudioContext } from '@/lib/audioContext';
import VoiceBottomSheet from './VoiceBottomSheet';

interface VoiceAssistantProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSendMessage, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [usedVoiceInput, setUsedVoiceInput] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false);
  const [responseComplete, setResponseComplete] = useState(false);
  const [isVoiceThinking, setIsVoiceThinking] = useState(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const [showListenButton, setShowListenButton] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Final transcript:', transcript);
        setIsListening(false);
        setIsVoiceThinking(true);
        
        if (transcript.trim()) {
          setUsedVoiceInput(true);
          setHasAskedQuestion(true);
          onSendMessage(transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsVoiceThinking(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [onSendMessage]);

  // Show Listen Response button when voice response is ready
  useEffect(() => {
    if (!isProcessing && usedVoiceInput && showBottomSheet && !isVoiceThinking) {
      console.log("Voice input was used - showing Listen Response button");
      setIsVoiceThinking(false);
      setIsResponding(false);
      setResponseComplete(true);
      setHasReceivedFirstResponse(true);
      setShowListenButton(true);
      setUsedVoiceInput(false); // Reset for next interaction
    }
  }, [isProcessing, usedVoiceInput, showBottomSheet, isVoiceThinking]);

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsListening(true);
      recognitionRef.current.start();
      console.log("Microphone permission granted");
    } catch (error) {
      console.error('Failed to start listening:', error);
      setIsListening(false);
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const handleMicrophone = async () => {
    await initAudioContext();
    setShowBottomSheet(true);
  };

  const handleCloseBottomSheet = () => {
    if (!isListening) {
      setShowBottomSheet(false);
      setResponseComplete(false);
      setIsVoiceThinking(false);
      setShowListenButton(false);
    }
  };

  const handleMute = () => {
    console.log("Mute button clicked");
  };

  const handleAsk = async () => {
    console.log("Ask button clicked");
    setResponseComplete(false);
    setShowListenButton(false);
    
    try {
      setIsListening(true);
      await startListening();
      console.log("Started listening from Ask button");
    } catch (error) {
      setIsListening(false);
      console.error("Failed to start listening from Ask button:", error);
      toast({
        title: "Error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    setResponseComplete(false);
    setIsVoiceThinking(true);
    setShowListenButton(false);
    
    onSendMessage(suggestion);
    setUsedVoiceInput(true);
    setHasAskedQuestion(true);
  };

  const handleListenResponse = async () => {
    console.log("Listen Response button clicked - playing last response");
    setShowListenButton(false);
    
    try {
      const messagesContainer = document.querySelector('[data-messages-container]');
      if (messagesContainer) {
        const assistantMessages = messagesContainer.querySelectorAll('[data-role="assistant"]');
        if (assistantMessages.length > 0) {
          const lastMessage = assistantMessages[assistantMessages.length - 1];
          const messageText = lastMessage.textContent || '';
          
          if (messageText) {
            console.log("Playing response:", messageText.substring(0, 50) + "...");
            setIsResponding(true);
            
            console.log("Requesting TTS from server...");
            const response = await fetch('/api/text-to-speech', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: messageText })
            });
            
            console.log("TTS response status:", response.status);
            
            if (response.ok) {
              console.log("TTS response successful, creating audio...");
              const audioBlob = await response.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              
              audio.onended = () => {
                console.log("Audio playback finished");
                URL.revokeObjectURL(audioUrl);
                setIsResponding(false);
                setShowListenButton(true);
              };
              
              audio.onerror = (e) => {
                console.error("Audio playback error:", e);
                URL.revokeObjectURL(audioUrl);
                setIsResponding(false);
                setShowListenButton(true);
              };
              
              console.log("Starting audio playback...");
              await audio.play();
            } else {
              console.error("TTS API error:", response.status, response.statusText);
              const errorText = await response.text();
              console.error("Error details:", errorText);
              throw new Error(`TTS API failed: ${response.status}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error playing response:', error);
      setIsResponding(false);
      setShowListenButton(true);
    }
  };

  return (
    <div>
      {/* Microphone Button */}
      <button
        onClick={handleMicrophone}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>

      <VoiceBottomSheet 
        isOpen={showBottomSheet} 
        onClose={handleCloseBottomSheet}
        onMute={handleMute}
        onAsk={handleAsk}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isProcessing || isVoiceThinking}
        showSuggestions={hasReceivedFirstResponse && !isListening && !isResponding && !isVoiceThinking && responseComplete && !showListenButton}
        showListenButton={showListenButton && !isListening && !isResponding && !isVoiceThinking}
        onSuggestionClick={handleSuggestionClick}
        onListenResponse={handleListenResponse}
      />
    </div>
  );
};

export default VoiceAssistant;