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
  const [showListenButton, setShowListenButton] = useState(false); // Show Listen Response button when response is ready
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
                
                // Mobile: Add aggressive timeout to prevent getting stuck
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                  console.log("Mobile: Setting aggressive timeout for thinking state");
                  setTimeout(() => {
                    console.log("Mobile thinking timeout - forcing exit");
                    setIsVoiceThinking(false);
                    setIsResponding(false);
                    setUsedVoiceInput(false);
                    setResponseComplete(true);
                    setHasReceivedFirstResponse(true);
                  }, 3000); // 3 second timeout for mobile
                }
                
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
                
                // Disable browser speech synthesis to force OpenAI TTS usage
                console.log("Disabling browser speech synthesis to use OpenAI TTS");
                if (window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
                
                // Always show Listen Response button initially, then proceed with TTS attempt
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                console.log("Response ready - showing Listen Response button");
                setIsVoiceThinking(false);
                
                // Always show Listen Response button when response is ready
                setIsResponding(false);
                setUsedVoiceInput(false);
                setResponseComplete(true);
                setHasReceivedFirstResponse(true);
                setShowListenButton(true); // Always show Listen Response button
                return;
                
                // Desktop: Full TTS experience
                setIsVoiceThinking(false);
                console.log("Desktop browser - preparing full TTS experience");
                
                // Add timeout fallback for mobile browsers
                const mobileTimeout = setTimeout(() => {
                  console.log("Mobile timeout - forcing suggestions to appear");
                  setIsResponding(false);
                  setUsedVoiceInput(false);
                  setResponseComplete(true);
                  setHasReceivedFirstResponse(true);
                }, 15000); // 15 second timeout
                
                setTimeout(async () => {
                  try {
                    console.log("Auto-speaking the assistant's response using OpenAI TTS");
                    
                    // Use OpenAI TTS API with mobile timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for mobile networks
                    
                    const response = await fetch('/api/text-to-speech', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: messageText }),
                      signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                      const audioBlob = await response.blob();
                      const audioUrl = URL.createObjectURL(audioBlob);
                      
                      // Use tested audio element for mobile or create new one for desktop
                      const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                      let audio;
                      
                      if (isMobileBrowser && (window as any).mobileTestAudio) {
                        console.log("Mobile: Using tested audio element (autoplay enabled)");
                        audio = (window as any).mobileTestAudio;
                        audio.src = audioUrl;
                        audio.volume = 1; // Reset volume for actual playback
                      } else {
                        console.log("Desktop: Creating new audio element");
                        audio = new Audio(audioUrl);
                      }
                      
                      // Store audio reference globally so stop button can access it
                      (window as any).currentOpenAIAudio = audio;
                      
                      audio.onplay = () => {
                        // Clear the mobile timeout since audio started successfully
                        clearTimeout(mobileTimeout);
                        // Set responding state only when audio actually starts playing
                        setIsResponding(true);
                        console.log("OpenAI TTS audio started playing - showing stop button");
                      };
                      
                      audio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        console.log("OpenAI TTS audio playback completed - enabling suggestions");
                        
                        // Mark response as complete and enable suggestions
                        setIsResponding(false);
                        setResponseComplete(true);
                        setHasReceivedFirstResponse(true);
                        setUsedVoiceInput(false);
                        
                        // Clear the global reference
                        (window as any).currentOpenAIAudio = null;
                        
                        console.log("State updated: isResponding=false, responseComplete=true, hasReceivedFirstResponse=true");
                      };
                      
                      audio.onerror = (error: any) => {
                        console.error("Audio playback error:", error);
                        clearTimeout(mobileTimeout);
                        URL.revokeObjectURL(audioUrl);
                        setIsResponding(false);
                        setUsedVoiceInput(false);
                        setResponseComplete(true);
                        setHasReceivedFirstResponse(true);
                        
                        // Clear the global reference
                        (window as any).currentOpenAIAudio = null;
                      };
                      
                      try {
                        await audio.play();
                        console.log("Playing OpenAI TTS audio");
                      } catch (playError) {
                        console.error("Failed to play audio on mobile:", playError);
                        clearTimeout(mobileTimeout);
                        // Fallback for mobile - just show suggestions
                        setIsResponding(false);
                        setUsedVoiceInput(false);
                        setResponseComplete(true);
                        setHasReceivedFirstResponse(true);
                        URL.revokeObjectURL(audioUrl);
                        (window as any).currentOpenAIAudio = null;
                      }
                    } else {
                      console.error("Failed to get audio from TTS API");
                      setIsResponding(false);
                      setUsedVoiceInput(false);
                      setResponseComplete(true);
                      setHasReceivedFirstResponse(true);
                    }
                  } catch (error) {
                    console.error('Error with OpenAI TTS:', error);
                    clearTimeout(mobileTimeout);
                    
                    // Handle different types of errors
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    const errorName = error instanceof Error ? error.name : '';
                    if (errorName === 'AbortError') {
                      console.log("Request timed out - showing suggestions");
                    } else {
                      console.error('Network or TTS error:', errorMsg);
                    }
                    
                    // Always show suggestions on error
                    setIsResponding(false);
                    setUsedVoiceInput(false);
                    setResponseComplete(true);
                    setHasReceivedFirstResponse(true);
                  }
                  
                  // Keep the bottom sheet open to show suggestions after first response
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

  // Handle Listen Response button click
  const handleListenResponse = async () => {
    console.log("Listen Response button clicked - playing last response");
    setShowListenButton(false); // Hide button while playing
    
    try {
      // Find the last assistant message to speak
      const messagesContainer = document.querySelector('[data-messages-container]');
      if (messagesContainer) {
        const assistantMessages = messagesContainer.querySelectorAll('[data-role="assistant"]');
        if (assistantMessages.length > 0) {
          const lastMessage = assistantMessages[assistantMessages.length - 1];
          const messageText = lastMessage.textContent || '';
          
          if (messageText) {
            console.log("Playing response:", messageText.substring(0, 50) + "...");
            setIsResponding(true);
            
            // Use OpenAI TTS API
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
                setShowListenButton(true); // Show button again after playback
              };
              
              audio.onerror = (e) => {
                console.error("Audio playback error:", e);
                URL.revokeObjectURL(audioUrl);
                setIsResponding(false);
                setShowListenButton(true); // Show button again on error
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
      setShowListenButton(true); // Show button again on error
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
        showListenButton={showListenButton && !isListening && !isResponding && !isVoiceThinking}
        onSuggestionClick={handleSuggestionClick}
        onListenResponse={handleListenResponse}
      />
    </div>
  );
};

export default VoiceAssistant;