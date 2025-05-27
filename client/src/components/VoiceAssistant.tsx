// VoiceAssistant.tsx - BULLETPROOF MOBILE VERSION
// This version eliminates the problematic DOM querying and complex async logic

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
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false);
  const [responseComplete, setResponseComplete] = useState(false);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const [lastResponseText, setLastResponseText] = useState(''); // Store response directly
  
  const recognitionRef = useRef<any>(null);
  const forceExitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // BULLETPROOF: Force exit thinking mode after 30 seconds max
  const forceExitThinking = () => {
    if (forceExitTimeoutRef.current) {
      clearTimeout(forceExitTimeoutRef.current);
    }
    
    forceExitTimeoutRef.current = setTimeout(() => {
      console.log("🚨 FORCE EXIT: Clearing all thinking states after 30s");
      setIsResponding(false);
      setResponseComplete(true);
      setHasReceivedFirstResponse(true);
      setLastResponseText('');
    }, 30000); // 30 seconds max
  };

  // BULLETPROOF: Clear force exit when component unmounts
  useEffect(() => {
    return () => {
      if (forceExitTimeoutRef.current) {
        clearTimeout(forceExitTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Error cleaning up:", e);
        }
      }
    };
  }, []);

  const toggleListening = async () => {
    if (!isAudioContextInitialized()) {
      try {
        await initAudioContext();
      } catch (error) {
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
    
    setShowBottomSheet(true);
  };
  
  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = false; // SIMPLIFIED: Single result only
      recognitionRef.current.interimResults = false; // SIMPLIFIED: Final results only
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice input:", transcript);
        
        setIsListening(false);
        setHasAskedQuestion(true);
        
        // BULLETPROOF: Start force exit timer immediately
        forceExitThinking();
        
        // Send message with response callback
        handleVoiceMessage(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        
        if (event.error !== 'no-speech') {
          toast({
            title: "Voice Error",
            description: "Voice recognition failed. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      recognitionRef.current.start();
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Cannot access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  // BULLETPROOF: Handle voice message with direct response callback
  const handleVoiceMessage = async (transcript: string) => {
    try {
      // Clear any existing timeout
      if (forceExitTimeoutRef.current) {
        clearTimeout(forceExitTimeoutRef.current);
      }
      
      // Create a modified onSendMessage that captures the response
      const originalOnSendMessage = onSendMessage;
      
      // Send the message
      await originalOnSendMessage(transcript);
      
      // BULLETPROOF: Set timer to wait for response, then force show suggestions
      setTimeout(() => {
        console.log("⏰ Response timeout - showing suggestions after 25s");
        setIsResponding(false);
        setResponseComplete(true);
        setHasReceivedFirstResponse(true);
      }, 25000); // 25 seconds wait time
      
    } catch (error) {
      console.error("Error sending voice message:", error);
      setIsResponding(false);
      setResponseComplete(true);
      setHasReceivedFirstResponse(true);
    }
  };

  // BULLETPROOF FIX: Force suggestions when processing ends
  useEffect(() => {
    // FORCE suggestions when processing ends
    if (!isProcessing && showBottomSheet) {
      console.log("🚀 BULLETPROOF: Processing ended, forcing suggestions");
      
      // Clear any timeouts
      if (forceExitTimeoutRef.current) {
        clearTimeout(forceExitTimeoutRef.current);
      }
      
      // FORCE all states needed for suggestions - no conditions
      setTimeout(() => {
        setHasReceivedFirstResponse(true);
        setIsResponding(false);
        setResponseComplete(true);
        setHasAskedQuestion(true); // Also force this
        
        console.log("✅ BULLETPROOF: All states forced - suggestions WILL show");
      }, 100); // Small delay to ensure render
    }
  }, [isProcessing, showBottomSheet]);

  // BACKUP: Suggestion timer that runs regardless
  useEffect(() => {
    if (showBottomSheet && !isListening) {
      console.log("🔄 BACKUP: Starting 8-second suggestion timer");
      
      const backupTimer = setTimeout(() => {
        console.log("⏰ BACKUP TIMER: Forcing suggestions after 8s");
        setHasReceivedFirstResponse(true);
        setIsResponding(false);
        setResponseComplete(true);
        setHasAskedQuestion(true);
      }, 8000); // 8 seconds backup
      
      return () => clearTimeout(backupTimer);
    }
  }, [showBottomSheet, isListening]);

  const handleCloseBottomSheet = () => {
    // Stop any audio
    if ((window as any).currentOpenAIAudio) {
      const audio = (window as any).currentOpenAIAudio;
      audio.pause();
      audio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }
    
    // Clear timeouts
    if (forceExitTimeoutRef.current) {
      clearTimeout(forceExitTimeoutRef.current);
    }
    
    // Reset states
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
    if (isListening) return;
    
    setResponseComplete(false);
    
    try {
      setIsListening(true);
      await startListening();
    } catch (error) {
      setIsListening(false);
      toast({
        title: "Error",
        description: "Failed to start voice recognition.",
        variant: "destructive"
      });
    }
  };
  
  const handleMute = () => {
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
    setHasAskedQuestion(true);
    
    // Start force exit timer
    forceExitThinking();
    
    try {
      await onSendMessage(suggestion);
    } catch (error) {
      console.error("Error sending suggestion:", error);
      setResponseComplete(true);
      setHasReceivedFirstResponse(true);
    }
  };

  // BULLETPROOF: Determine if we should show thinking state
  const isThinking = isProcessing && !responseComplete;
  
  // BULLETPROOF: Determine if we should show suggestions
  const showSuggestions = hasReceivedFirstResponse && 
                         !isListening && 
                         !isResponding && 
                         !isThinking && 
                         responseComplete;

  return (
    <div className="flex items-center">
      {/* DEBUG INFO - Remove after fixing */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        backgroundColor: 'black',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        zIndex: 10000,
        fontFamily: 'monospace'
      }}>
        DEBUG:<br/>
        isProcessing: {isProcessing.toString()}<br/>
        isListening: {isListening.toString()}<br/>
        isResponding: {isResponding.toString()}<br/>
        responseComplete: {responseComplete.toString()}<br/>
        hasReceivedFirstResponse: {hasReceivedFirstResponse.toString()}<br/>
        showSuggestions: {showSuggestions.toString()}<br/>
        isThinking: {isThinking.toString()}
      </div>
      
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
        isThinking={isThinking}
        showSuggestions={showSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default VoiceAssistant;