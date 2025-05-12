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
  const [usedVoiceInput, setUsedVoiceInput] = useState(false); // Track if last question was via voice
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudioContext = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.resume().then(() => {
          console.log('Audio context started on user interaction');
        });
      } catch (e) {
        console.warn('Unable to initialize AudioContext:', e);
      }
    };

    // Add click listener to document to enable audio on first interaction
    document.addEventListener('click', initAudioContext, { once: true });
    
    return () => {
      document.removeEventListener('click', initAudioContext);
    };
  }, []);

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
          setUsedVoiceInput(true); // Set flag to indicate voice input was used
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

  // Function to handle text-to-speech using server API with robust audio handling
  const speakResponse = async (text: string) => {
    try {
      setStatus('Getting voice response...');
      console.log("Requesting TTS for:", text.substring(0, 30) + "...");
      
      // Create an AudioContext to enable audio (requires user interaction)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        await audioContext.resume();
        console.log('Audio context started');
      } catch (e) {
        console.warn('Unable to initialize AudioContext:', e);
      }
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      console.log("Audio response received, size:", response.headers.get('content-length'));
      
      // Get the audio data
      const audioBlob = await response.blob();
      console.log("Audio blob created, size:", audioBlob.size, "type:", audioBlob.type);
      
      // Create URL and audio element
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio();
      
      // Set up events before setting source
      audio.addEventListener('canplaythrough', () => {
        console.log("Audio ready to play");
        setStatus('Speaking...');
        
        // Use user interaction to trigger play
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("Audio playback started");
          }).catch(error => {
            console.error("Audio playback failed:", error);
            // Fall back to browser TTS as a backup
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(text);
              window.speechSynthesis.speak(utterance);
              console.log("Fallback to browser TTS");
            }
          });
        }
      });
      
      audio.addEventListener('ended', () => {
        console.log("Audio playback complete");
        setStatus('');
        URL.revokeObjectURL(audioUrl); // Clean up
      });
      
      audio.addEventListener('error', (e) => {
        console.error("Audio error:", e);
        setStatus('Error playing audio');
        toast({
          title: "Audio Playback Error",
          description: "There was an error playing the audio response.",
          variant: "destructive"
        });
      });
      
      // Set the source last (after events are set up)
      audio.src = audioUrl;
      console.log("Audio source set to:", audioUrl);
      
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      setStatus('');
      toast({
        title: "Text-to-Speech Error",
        description: (error as any)?.message || "Failed to generate speech",
        variant: "destructive"
      });
      
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
        console.log("Fallback to browser TTS after error");
      }
    }
  };

  // Test the text-to-speech directly when the microphone button is clicked
  const testTTS = async () => {
    try {
      const testText = "This is a test of the Cabernet Sauvignon wine assistant voice. I hope you can hear me clearly now.";
      console.log("Testing TTS directly with text:", testText);
      await speakResponse(testText);
    } catch (error) {
      console.error("TTS Test failed:", error);
      toast({
        title: "Voice Test Failed",
        description: "Could not test the text-to-speech functionality.",
        variant: "destructive"
      });
    }
  };

  // If user receives a response and we're no longer processing, speak it
  useEffect(() => {
    if (!isProcessing && status === 'Processing your question...') {
      // Reset the status
      setStatus('');
      
      // Only speak the response automatically if voice input was used
      if (usedVoiceInput) {
        try {
          console.log("Voice input was used - finding message to speak automatically...");
          
          // Find the last assistant message
          const messagesContainer = document.getElementById('conversation');
          console.log("Messages container found:", !!messagesContainer);
          
          if (messagesContainer) {
            // Get all the chat messages
            const messageElements = messagesContainer.querySelectorAll('[data-role="assistant"]');
            console.log("Assistant message elements found:", messageElements.length);
            
            if (messageElements && messageElements.length > 0) {
              // Get the last message
              const lastMessage = messageElements[messageElements.length - 1];
              
              if (lastMessage && lastMessage.textContent) {
                const messageText = lastMessage.textContent || '';
                console.log("Found message to speak:", messageText.substring(0, 50) + "...");
                
                // Speak the response with a small delay to ensure message is fully rendered
                setTimeout(() => {
                  speakResponse(messageText);
                  // Reset the voice input flag after speaking
                  setUsedVoiceInput(false);
                }, 300);
              } else {
                console.log("Last message has no text content");
                setUsedVoiceInput(false);
              }
            } else {
              setUsedVoiceInput(false);
            }
          } else {
            setUsedVoiceInput(false);
          }
        } catch (error) {
          console.error('Error finding assistant message to speak:', error);
          setUsedVoiceInput(false);
        }
      } else {
        console.log("Not auto-speaking response because voice input wasn't used");
      }
    }
  }, [isProcessing, status, usedVoiceInput]);

  return (
    <div className="flex items-center ml-1 gap-1">
      {status ? (
        // Status Indicator
        <div className="flex items-center text-xs font-medium text-[#6A53E7] bg-purple-50 px-2 py-1 rounded-full border border-[#6A53E7]/20">
          <span className="animate-pulse mr-1">●</span>
          {status}
        </div>
      ) : (
        <>
          {/* Voice Button */}
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
          
          {/* Sound Test Button */}
          <button
            onClick={testTTS}
            disabled={isProcessing}
            className="p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#6A53E7]/30 bg-[#F5F3FF] text-[#6A53E7] hover:bg-[#6A53E7]/10"
            aria-label="Test voice"
            title="Test voice output"
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
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default VoiceAssistant;