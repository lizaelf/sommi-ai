import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface VoiceAssistantProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSendMessage, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      // TypeScript definition for SpeechRecognition API
      const SpeechRecognition: any = (window as any).SpeechRecognition || 
                                     (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setStatus('Processing your question...');
          onSendMessage(transcript);
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
          setStatus(`Error: ${event.error}`);
          setIsListening(false);
          
          toast({
            title: "Voice Recognition Error",
            description: `Error: ${event.error}. Please try again.`,
            variant: "destructive"
          });
        };
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onSendMessage, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Try using Chrome.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
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
    }
  };

  // Function to handle text-to-speech
  const speakResponse = async (text: string) => {
    try {
      // Check if browser supports speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported in this browser');
      }
    } catch (error) {
      console.error('Error converting text to speech:', error);
    }
  };

  // If user receives a response and we're no longer processing, speak it
  useEffect(() => {
    if (!isProcessing && status === 'Processing your question...') {
      // This is a hacky way to get the last message - in a real app, you'd pass this as a prop
      setTimeout(() => {
        const messages = document.querySelectorAll('.message');
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.classList.contains('ai')) {
            speakResponse(lastMessage.textContent || '');
          }
        }
      }, 500);
      
      setStatus('');
    }
  }, [isProcessing, status]);

  return (
    <div className="flex flex-col items-center mt-2 mb-2">
      <button
        className={`bg-[#6A53E7] text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
          isListening ? 'animate-pulse' : ''
        }`}
        onClick={toggleListening}
        disabled={isProcessing}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" x2="12" y1="19" y2="22"></line>
        </svg>
      </button>
      {status && (
        <div className="mt-2 text-xs text-gray-500">{status}</div>
      )}
    </div>
  );
};

export default VoiceAssistant;