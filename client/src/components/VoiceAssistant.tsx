import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
        // Clean up the text for better speech synthesis
        // Remove markdown-like formatting if any
        const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1')
                             .replace(/\*(.*?)\*/g, '$1')
                             .replace(/#+\s/g, '')
                             .replace(/\n\n/g, '. ');
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Optional: Choose a different voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || voice.name.includes('Female') || voice.name.includes('Natural')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        window.speechSynthesis.speak(utterance);
        
        // Show status while speaking
        setStatus('Speaking...');
        
        utterance.onend = () => {
          setStatus('');
        };
      } else {
        console.warn('Speech synthesis not supported in this browser');
        toast({
          title: "Speech Synthesis Not Supported",
          description: "Your browser doesn't support text-to-speech functionality.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error converting text to speech:', error);
      setStatus('');
    }
  };

  // If user receives a response and we're no longer processing, speak it
  useEffect(() => {
    if (!isProcessing && status === 'Processing your question...') {
      try {
        // Find the last assistant message
        const messagesContainer = document.getElementById('conversation');
        
        if (messagesContainer) {
          // Get all the chat messages
          const messageElements = messagesContainer.querySelectorAll('[data-role="assistant"]');
          
          if (messageElements && messageElements.length > 0) {
            // Get the last message
            const lastMessage = messageElements[messageElements.length - 1];
            
            if (lastMessage && lastMessage.textContent) {
              // Speak the response with a small delay to ensure message is fully rendered
              setTimeout(() => {
                speakResponse(lastMessage.textContent || '');
              }, 300);
            }
          }
        }
      } catch (error) {
        console.error('Error finding assistant message to speak:', error);
      }
      
      setStatus('');
    }
  }, [isProcessing, status]);

  return (
    <div className="flex items-center ml-1">
      {status ? (
        // Status Indicator
        <div className="flex items-center text-xs font-medium text-[#6A53E7] bg-purple-50 px-2 py-1 rounded-full border border-[#6A53E7]/20">
          <span className="animate-pulse mr-1">●</span>
          {status}
        </div>
      ) : (
        // Voice Button
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#6A53E7]/30 ${
            isProcessing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-[#F5F3FF] text-[#6A53E7] hover:bg-[#6A53E7]/10'
          } ${isListening ? 'bg-[#6A53E7] text-white animate-pulse' : ''}`}
          aria-label="Start voice input"
          title="Use voice to ask questions"
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
      )}
    </div>
  );
};

export default VoiceAssistant;