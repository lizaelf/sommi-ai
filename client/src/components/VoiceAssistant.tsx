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
  const [usedVoiceInput, setUsedVoiceInput] = useState(false); // Track if last question was via voice
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [autoRestartEnabled, setAutoRestartEnabled] = useState(true); // Enable auto-restart by default
  const [isResponding, setIsResponding] = useState(false);
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false); // Track if AI has responded at least once
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Audio context is now initialized globally in main.tsx

  // Effect to handle audio status changes for auto-restart
  useEffect(() => {
    // Function to handle audio playback ending - auto-restart listening
    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      
      // Track when AI is responding
      if (status === 'playing') {
        setIsResponding(true);
      } else if (status === 'stopped' || status === 'paused' || status === 'muted') {
        setIsResponding(false);
      }
      
      // Auto-restart logic
      if (status === 'stopped' && autoRestartEnabled && !isListening && usedVoiceInput) {
        console.log("Auto-restarting voice recognition after audio finished");
        // Small delay to ensure everything is ready before restarting
        setTimeout(() => {
          // Auto-restart listening mode
          toggleListening();
        }, 500);
      }
    };

    // Add event listener for audio status
    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    
    // Cleanup
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
  }, [autoRestartEnabled, isListening, usedVoiceInput]);

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
    
    // If we're already listening, stop the recognition
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }
    
    // Show the bottom sheet explicitly
    console.log("Opening bottom sheet...");
    setShowBottomSheet(true);
  };
  
  // Function to start listening (used by the bottom sheet "Ask" button)
  const startListening = async () => {
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
          recognitionRef.current.continuous = true; // Enable continuous recognition to prevent quick timeout
          recognitionRef.current.interimResults = true; // Show interim results for better UX
          recognitionRef.current.maxAlternatives = 1; // Only return best match
          
          // Re-attach event handlers to the fresh instance
          recognitionRef.current.onresult = (event: any) => {
            // Get final results only to avoid duplicates
            const results = event.results;
            let finalTranscript = '';
            
            for (let i = 0; i < results.length; i++) {
              if (results[i].isFinal) {
                finalTranscript = results[i][0].transcript;
                
                // We have a final result, process it
                console.log("Final transcript:", finalTranscript);
                setStatus('Processing your question...');
                setUsedVoiceInput(true);
                
                // Stop recognition to prevent multiple submissions
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                }
                
                // Send the message to be processed
                onSendMessage(finalTranscript);
                
                // Dispatch event when microphone transitions to processing state
                const micProcessingEvent = new CustomEvent('mic-status', {
                  detail: { status: 'processing' }
                });
                window.dispatchEvent(micProcessingEvent);
                
                // Break out after processing the first final result
                break;
              }
            }
          };
          
          recognitionRef.current.onend = () => {
            setIsListening(false);
            setStatus('');
            
            // Dispatch event when microphone stops listening
            const micStoppedEvent = new CustomEvent('mic-status', {
              detail: { status: 'stopped' }
            });
            window.dispatchEvent(micStoppedEvent);
          };
          
          recognitionRef.current.onstart = () => {
            setIsListening(true);
            
            // Capture the stream again specifically for audio visualization
            navigator.mediaDevices.getUserMedia({ audio: true })
              .then(stream => {
                // Dispatch event when microphone starts listening - include the stream for frequency analysis
                const micListeningEvent = new CustomEvent('mic-status', {
                  detail: { 
                    status: 'listening',
                    stream: stream  // Pass the microphone stream for frequency analysis
                  }
                });
                window.dispatchEvent(micListeningEvent);
              })
              .catch(err => {
                console.error("Error capturing audio stream for visualization:", err);
                // Fall back to basic event without stream
                const micListeningEvent = new CustomEvent('mic-status', {
                  detail: { status: 'listening' }
                });
                window.dispatchEvent(micListeningEvent);
              });
          };
          
          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            
            // Handle specific errors
            if (event.error === 'no-speech') {
              console.log("No speech detected, continuing to listen...");
              // Don't stop listening for this error - just keep going
              return;
            }
            
            setStatus(`Error: ${event.error}`);
            setIsListening(false);
            
            // Dispatch event to stop visualization on error
            const micStoppedEvent = new CustomEvent('mic-status', {
              detail: { status: 'stopped' }
            });
            window.dispatchEvent(micStoppedEvent);
            
            // Only show toast for errors other than no-speech
            if (event.error !== 'no-speech') {
              toast({
                title: "Voice Recognition Error",
                description: `Error: ${event.error}. Please try again.`,
                variant: "destructive"
              });
            }
          };
        }
        
        // Just start the recognition - state is already set by handleAsk
        // This prevents duplicate state updates that can cause UI flicker
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
    
    // Dispatch event when audio starts playing - include the audio element for frequency analysis
    const dispatchPlayingEvent = () => {
      console.log("Audio playback started");
      const audioPlayingEvent = new CustomEvent('audio-status', {
        detail: { 
          status: 'playing',
          audioElement: audio  // Pass the audio element for frequency analysis
        }
      });
      window.dispatchEvent(audioPlayingEvent);
    };
    
    // Dispatch event when audio stops playing
    const dispatchStoppedEvent = () => {
      console.log("Audio playback ended - dispatching stopped event");
      const audioStoppedEvent = new CustomEvent('audio-status', {
        detail: { status: 'stopped' }
      });
      window.dispatchEvent(audioStoppedEvent);
      URL.revokeObjectURL(url);
    };
    
    audio.onplay = dispatchPlayingEvent;
    audio.onended = dispatchStoppedEvent;
    audio.onpause = dispatchStoppedEvent;
    audio.onerror = dispatchStoppedEvent;
    
    audio.play().catch(err => {
      console.error("Playback error:", err);
      dispatchStoppedEvent();
      // Just log errors, don't display them
    });
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
      
      // Only speak the response automatically if voice input was used AND the bottom sheet is still visible
      if (usedVoiceInput && showBottomSheet) {
        // Mark that we've received the first response
        setHasReceivedFirstResponse(true);
        
        try {
          console.log("Voice input was used and in voice mode - finding message to speak automatically...");
          
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
                  
                  // Keep the bottom sheet open to show suggestions after first response
                  // No longer auto-closing after 2 seconds
                }, 300);
              } else {
                console.log("Last message has no text content");
                setUsedVoiceInput(false);
                setShowBottomSheet(false);
              }
            } else {
              setUsedVoiceInput(false);
              setShowBottomSheet(false);
            }
          } else {
            setUsedVoiceInput(false);
            setShowBottomSheet(false);
          }
        } catch (error) {
          console.error('Error finding assistant message to speak:', error);
          setUsedVoiceInput(false);
          setShowBottomSheet(false);
        }
      } else {
        console.log("Not auto-speaking response - either voice input wasn't used or not in voice mode");
        // Only close if we haven't received first response yet
        if (!hasReceivedFirstResponse) {
          setShowBottomSheet(false);
        }
        setUsedVoiceInput(false);
      }
    }
  }, [isProcessing, status, usedVoiceInput, showBottomSheet, hasReceivedFirstResponse]);

  // Handle closing the bottom sheet
  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
  };
  
  // Handle the Ask button in the bottom sheet
  const handleAsk = async () => {
    // If already listening, do nothing to prevent flickering
    if (isListening) {
      console.log("Ask button clicked but already listening - ignoring");
      return;
    }
    
    console.log("Ask button clicked");
    // Keep bottom sheet open to show visualization
    // Start listening immediately
    try {
      // Set listening state immediately to prevent multiple clicks
      setIsListening(true);
      await startListening();
      console.log("Started listening from Ask button");
    } catch (error) {
      // Reset listening state on error
      setIsListening(false);
      console.error("Failed to start listening from Ask button:", error);
      toast({
        title: "Error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle the Stop button in the bottom sheet
  const handleMute = () => {
    console.log("Stop button clicked - stopping audio playback");
    
    // Stop speech synthesis completely
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      console.log("Speech synthesis cancelled");
    }
    
    // Stop any audio elements that might be playing
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        console.log("Audio element stopped");
      }
    });
    
    // Dispatch event to notify that audio has been stopped
    const audioStoppedEvent = new CustomEvent('audio-status', {
      detail: { status: 'stopped', reason: 'user_stopped' }
    });
    window.dispatchEvent(audioStoppedEvent);
    
    // Also dispatch the audioPaused event for the wine animation
    document.dispatchEvent(new CustomEvent('audioPaused'));
    
    // Reset responding state
    setIsResponding(false);
  };

  // Handle suggestion clicks - send message and speak response
  const handleSuggestionClick = async (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    
    try {
      // Send the suggestion as a message
      await onSendMessage(suggestion);
      
      // Mark that this was a voice interaction to trigger auto-speak
      setUsedVoiceInput(true);
      
      console.log("Suggestion sent, waiting for response to speak it");
    } catch (error) {
      console.error("Error sending suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to send suggestion. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center">
      {false ? (
        // Disabled the text status indicator in favor of the visualization in the bottom sheet
        <div id="status" className="flex items-center text-xs font-medium text-[#6A53E7] bg-purple-50 px-2 py-1 rounded-full border border-[#6A53E7]/20">
          <span className="animate-pulse mr-1">●</span>
          {status}
        </div>
      ) : (
        <>
          {/* Voice Button */}
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
          
          {/* Sound Test Button - hidden as requested */}
        </>
      )}
      
      {/* Voice Bottom Sheet */}
      <VoiceBottomSheet 
        isOpen={showBottomSheet} 
        onClose={handleCloseBottomSheet}
        onMute={handleMute}
        onAsk={handleAsk}
        isListening={isListening}
        isResponding={isResponding}
        showSuggestions={hasReceivedFirstResponse && !isListening && !isResponding}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default VoiceAssistant;