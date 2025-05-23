import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { initAudioContext, isAudioContextInitialized } from '@/lib/audioContext';

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

  // Audio context is now initialized globally in main.tsx

  useEffect(() => {
    // Don't initialize speech recognition automatically
    // It will be created on-demand when the microphone is clicked
    
    // Just setup cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Error cleaning up speech recognition:", e);
        }
      }
    };
  }, []);

  const toggleListening = async () => {
    // Ensure audio context is initialized
    if (!isAudioContextInitialized()) {
      try {
        await initAudioContext();
        console.log("Audio context initialized on microphone click");
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
    
    // Check if speech recognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Try using Chrome.",
        variant: "destructive"
      });
      return;
    }

    // Request microphone permissions explicitly before starting
    try {
      if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
        throw new Error('getUserMedia not supported');
      }
      
      // Request permission first before toggling
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately, we just needed the permission
      stream.getTracks().forEach(track => track.stop());
      
      console.log("Microphone permission granted");

      // Now toggle the recognition
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        try {
          // Create a fresh instance to avoid issues with reusing
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRecognition) {
            // Create a new instance to avoid stale state
            if (recognitionRef.current) {
              recognitionRef.current.abort(); // Force cleanup
            }
            
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            // Re-attach event handlers to the fresh instance
            recognitionRef.current.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setStatus('Processing your question...');
              setUsedVoiceInput(true);
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
          
          // Start the recognition
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
    } catch (error) {
      console.error('Microphone permission error:', error);
      toast({
        title: "Microphone Error",
        description: "Cannot access your microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };

  // Variable to store the last audio blob for playback
  let lastAudioBlob: Blob | null = null;

  // Function to handle text-to-speech using server API with simplified implementation
  const speakResponse = async (text: string) => {
    try {
      // Don't show status for audio processing - operate silently
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      
      // Save the audio blob for later use
      lastAudioBlob = await response.blob();
      console.log("Audio received:", lastAudioBlob.size, "bytes");
      
      // Auto-play the audio immediately
      playLastAudio();
      
      // No status messages or visible controls needed
    } catch (error) {
      console.error("Error:", error);
      // Don't show error in UI, just log to console
    }
  };

  // Function to play the last audio blob
  const playLastAudio = () => {
    if (!lastAudioBlob) {
      console.error("No audio available");
      return;
    }
    
    const url = URL.createObjectURL(lastAudioBlob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
    };
    
    audio.play().catch(err => {
      console.error("Playback error:", err);
      // Just log errors, don't display them
    });
    
    // Don't update status for audio playing
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
    <div className="flex items-center">
      {status === 'Listening for your question...' ? (
        // Only show status when listening for voice input
        <div id="status" className="flex items-center text-xs font-medium text-[#6A53E7] bg-purple-50 px-2 py-1 rounded-full border border-[#6A53E7]/20">
          <span className="animate-pulse mr-1">●</span>
          {status}
        </div>
      ) : (
        <>
          {/* Voice Button */}
          <button
            id="mic-button"
            onClick={toggleListening}
            disabled={isProcessing}
            style={{
              padding: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            className={`w-10 h-10 rounded-full transition-all focus:outline-none ${
              isProcessing 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-white opacity-70 hover:opacity-100'
            } ${isListening ? 'animate-pulse' : ''}`}
            aria-label="Start voice input"
            title="Use voice to ask questions"
          >
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'%3E%3C!-- Icon from Fluent UI System Icons by Microsoft Corporation - https://github.com/microsoft/fluentui-system-icons/blob/main/LICENSE --%3E%3Cpath fill='currentColor' d='M18.25 11a.75.75 0 0 1 .743.648l.007.102v.5a6.75 6.75 0 0 1-6.249 6.732l-.001 2.268a.75.75 0 0 1-1.493.102l-.007-.102v-2.268a6.75 6.75 0 0 1-6.246-6.496L5 12.25v-.5a.75.75 0 0 1 1.493-.102l.007.102v.5a5.25 5.25 0 0 0 5.034 5.246l.216.004h.5a5.25 5.25 0 0 0 5.246-5.034l.004-.216v-.5a.75.75 0 0 1 .75-.75M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4'/%3E%3C/svg%3E"
              alt="Microphone"
              width="20"
              height="20"
              className="invert"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </button>
          
          {/* Sound Test Button - hidden as requested */}
        </>
      )}
    </div>
  );
};

export default VoiceAssistant;