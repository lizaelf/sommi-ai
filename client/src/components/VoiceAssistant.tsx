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
  const [responseComplete, setResponseComplete] = useState(false); // Track if response is completely finished
  const [isVoiceThinking, setIsVoiceThinking] = useState(false); // Local thinking state for voice interactions
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false); // Track if user has asked at least one question
  const [showListenButton, setShowListenButton] = useState(false); // Show Listen Response button
 // Show Listen Response button when response is ready
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
        setResponseComplete(false);
        setIsVoiceThinking(false); // Clear thinking state when response starts
      } else if (status === 'stopped' || status === 'paused' || status === 'muted') {
        setIsResponding(false);
        setIsVoiceThinking(false); // Clear thinking state when stopped
        // Only mark response as complete if it was stopped naturally (not by user)
        if (status === 'stopped' && event.detail?.reason !== 'user_stopped') {
          setResponseComplete(true);
        }
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

      // Mobile: Test and enable audio during user interaction
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log("Mobile: Testing audio capability during user interaction");
        try {
          // Create and test audio element during user interaction
          const testAudio = new Audio();
          testAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2U3/PJeSsFJnvI8N2RQQoQZq7s7bBOEg5Nn+DyvmI=';
          testAudio.volume = 0.1;
          
          // Try to play to test if audio is enabled
          testAudio.play().then(() => {
            console.log("✅ Mobile audio enabled - TTS will work");
            (window as any).mobileAudioEnabled = true;
            (window as any).mobileTestAudio = testAudio;
          }).catch(() => {
            console.log("❌ Mobile audio blocked - will use text fallback");
            (window as any).mobileAudioEnabled = false;
          });
        } catch {
          console.log("❌ Audio not available on this mobile device");
          (window as any).mobileAudioEnabled = false;
        }
      }

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
                setIsVoiceThinking(true);
                setHasAskedQuestion(true); // Mark that user has asked a question
                
                // Add timeout only for thinking state, not for responding state
                console.log("Setting timeout for thinking state");
                const thinkingTimeout = setTimeout(() => {
                  // Only timeout if still thinking and not responding to speech
                  if (isVoiceThinking && !isResponding) {
                    console.log("Thinking timeout - no response received, showing suggestions");
                    setIsVoiceThinking(false);
                    setUsedVoiceInput(false);
                    setResponseComplete(true);
                    setHasReceivedFirstResponse(true);
                  }
                }, 20000); // 20 second timeout only for stuck thinking state
                
                // Store timeout to clear if speech starts
                (window as any).currentThinkingTimeout = thinkingTimeout;
                
                // Immediately clear listening state before stopping recognition
                setIsListening(false);
                
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
              console.log("No speech detected, restarting listening...");
              // Auto-restart listening for no-speech timeout without showing Ask button
              // Don't set isListening to false to avoid showing Ask button
              // Restart listening immediately
              setTimeout(() => {
                if (!isProcessing) {
                  startListening();
                }
              }, 50); // Shorter delay for smoother transition
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

  // If user receives a response and we're no longer processing, handle it
  useEffect(() => {
    console.log("Status check triggered, current status:", status, "isProcessing:", isProcessing);
    if (!isProcessing && status === 'Processing your question...') {
      console.log("✅ Status condition met - processing complete with correct status");
      // Reset the status
      setStatus('');
      
      // Clear thinking state immediately when response is ready
      setIsVoiceThinking(false);
      
      // Always handle voice response if voice input was used, regardless of bottom sheet state
      if (usedVoiceInput) {
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
                
                // Enable autoplay AND show Listen Response button for testing both
                console.log("Response ready - enabling autoplay with Listen Response button backup");
                
                // Clear thinking state first
                setIsVoiceThinking(false);
                setIsResponding(true); // Set responding state for autoplay
                
                // Store the message text for both autoplay and button
                (window as any).lastResponseText = messageText;
                
                // Start autoplay immediately (audio context is unlocked from mic interaction)
                console.log("Starting autoplay - audio context already unlocked from microphone interaction");
                playResponseAudio(messageText).then(() => {
                  console.log("Autoplay completed successfully");
                  
                  // After autoplay, just clean up states (no button)
                  setIsResponding(false);
                  setResponseComplete(true);
                  setHasReceivedFirstResponse(true);
                  setUsedVoiceInput(false);
                  // Don't show Listen Response button - autoplay only
                  setShowListenButton(false);
                  
                  console.log("Autoplay completed - ready for next interaction");
                }).catch((error: any) => {
                  console.log("Autoplay failed, cleaning up states:", error);
                  
                  // If autoplay fails, just clean up (no fallback button)
                  setIsResponding(false);
                  setResponseComplete(true);
                  setHasReceivedFirstResponse(true);
                  setUsedVoiceInput(false);
                  setShowListenButton(false);
                });
                
                // Ensure bottom sheet stays open during speech
                setShowBottomSheet(true);

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

  // Fallback effect to ensure Listen Response button appears when AI response is ready
  useEffect(() => {
    if (usedVoiceInput && !isProcessing && isVoiceThinking) {
      console.log("Fallback: AI response should be ready, checking for Listen Response button");
      
      // Wait a bit for DOM to update, then check for new messages
      const timeout = setTimeout(() => {
        const messagesContainer = document.getElementById('conversation');
        if (messagesContainer) {
          const messageElements = messagesContainer.querySelectorAll('[data-role="assistant"]');
          if (messageElements && messageElements.length > 0) {
            const lastMessage = messageElements[messageElements.length - 1];
            if (lastMessage && lastMessage.textContent) {
              const messageText = lastMessage.textContent || '';
              console.log("Fallback: Found new AI response, starting autoplay with button backup");
              
              // Clear thinking state and start autoplay
              setIsVoiceThinking(false);
              setIsResponding(true);
              setShowBottomSheet(true);
              
              // Store the message for both autoplay and button
              (window as any).lastResponseText = messageText;
              
              // Start autoplay (no fallback button)
              console.log("Fallback: Starting autoplay - audio context unlocked from mic interaction");
              playResponseAudio(messageText).then(() => {
                console.log("Fallback: Autoplay completed successfully");
                
                // After autoplay, just clean up states (no button)
                setIsResponding(false);
                setResponseComplete(true);
                setHasReceivedFirstResponse(true);
                setUsedVoiceInput(false);
                setShowListenButton(false);
                
                console.log("Fallback: Autoplay completed - ready for next interaction");
              }).catch((error: any) => {
                console.log("Fallback: Autoplay failed, cleaning up states:", error);
                
                // If autoplay fails, just clean up (no fallback button)
                setIsResponding(false);
                setResponseComplete(true);
                setHasReceivedFirstResponse(true);
                setUsedVoiceInput(false);
                setShowListenButton(false);
              });
            }
          }
        }
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [usedVoiceInput, isProcessing, isVoiceThinking]);

  // Function to play response audio using OpenAI TTS
  const playResponseAudio = async (text: string): Promise<void> => {
    console.log("Playing response audio with OpenAI TTS");
    
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('TTS request failed');
      }
      
      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          console.log("Audio playback completed");
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = () => {
          console.log("Audio playback failed");
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch(reject);
      });
      
    } catch (error) {
      console.error('Error playing TTS audio:', error);
      throw error;
    }
  };

  // Handle closing the bottom sheet
  const handleCloseBottomSheet = () => {
    // Stop any ongoing OpenAI TTS audio playback
    if ((window as any).currentOpenAIAudio) {
      const audio = (window as any).currentOpenAIAudio;
      audio.pause();
      audio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
      console.log("OpenAI TTS audio stopped when closing bottom sheet");
    }
    
    // Stop speech synthesis completely (fallback)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      console.log("Speech synthesis cancelled when closing");
    }
    
    // Reset audio-related states
    setIsResponding(false);
    setResponseComplete(true);
    
    // Show toast if user has asked at least one question
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
  
  // Handle the Ask button in the bottom sheet
  const handleAsk = async () => {
    // If already listening, do nothing to prevent flickering
    if (isListening) {
      console.log("Ask button clicked but already listening - ignoring");
      return;
    }
    
    console.log("Ask button clicked");
    
    // Reset response complete state when starting new interaction
    setResponseComplete(false);
    
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
    console.log("Stop button clicked - stopping OpenAI TTS audio playback");
    
    // Stop the current OpenAI TTS audio if it exists
    if ((window as any).currentOpenAIAudio) {
      const audio = (window as any).currentOpenAIAudio;
      audio.pause();
      audio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
      console.log("OpenAI TTS audio stopped successfully");
    }
    
    // Stop speech synthesis completely (fallback)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      console.log("Speech synthesis cancelled");
    }
    
    // Stop any other audio elements that might be playing
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        console.log("Additional audio element stopped");
      }
    });
    
    // Dispatch event to notify that audio has been stopped
    const audioStoppedEvent = new CustomEvent('audio-status', {
      detail: { status: 'stopped', reason: 'user_stopped' }
    });
    window.dispatchEvent(audioStoppedEvent);
    
    // Also dispatch the audioPaused event for the wine animation
    document.dispatchEvent(new CustomEvent('audioPaused'));
    
    // Reset responding state and mark response as complete to show suggestions
    setIsResponding(false);
    setResponseComplete(true);
    setHasReceivedFirstResponse(true);
    console.log("Stop button clicked - enabling suggestions after manual stop");
  };

  // Handle Listen Response button click
  const handleListenResponse = async () => {
    console.log("Listen Response button clicked");
    setShowListenButton(false); // Hide button while playing
    
    try {
      const messageText = (window as any).lastResponseText;
      if (!messageText) {
        console.error("No response text stored to play");
        return;
      }
      
      console.log("Playing stored response with OpenAI TTS");
      setIsResponding(true);
      
      // Use OpenAI TTS API
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText.substring(0, 300) })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Store reference for stop button
        (window as any).currentOpenAIAudio = audio;
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsResponding(false);
          setShowListenButton(true); // Show button again after playback
          (window as any).currentOpenAIAudio = null;
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsResponding(false);
          setShowListenButton(true); // Show button again on error
          (window as any).currentOpenAIAudio = null;
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing response:', error);
      setIsResponding(false);
      setShowListenButton(true); // Show button again on error
    }
  };

  // Handle suggestion clicks - send message and speak response
  const handleSuggestionClick = async (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    
    // Immediately hide suggestions and show thinking state to prevent Ask button flash
    setResponseComplete(false);
    setIsVoiceThinking(true);
    setShowListenButton(false); // Hide listen button when new interaction starts
    
    try {
      // Send the suggestion as a message
      await onSendMessage(suggestion);
      
      // Mark that this was a voice interaction to trigger auto-speak
      setUsedVoiceInput(true);
      setHasAskedQuestion(true); // Mark that user has asked a question
      
      console.log("Suggestion sent, waiting for response to speak it");
    } catch (error) {
      console.error("Error sending suggestion:", error);
      setIsVoiceThinking(false); // Reset thinking state on error
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
        isThinking={isProcessing || isVoiceThinking || status === 'Processing your question...'}
        showSuggestions={hasReceivedFirstResponse && !isListening && !isResponding && !isVoiceThinking && responseComplete && !showListenButton}
        showListenButton={showListenButton && hasReceivedFirstResponse && !isListening && !isResponding && !isVoiceThinking}
        onSuggestionClick={handleSuggestionClick}
        onListenResponse={handleListenResponse}
      />
    </div>
  );
};

export default VoiceAssistant;