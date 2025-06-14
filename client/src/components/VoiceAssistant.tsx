import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "./VoiceBottomSheet";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser,
} from "@/utils/microphonePermissions";

interface VoiceAssistantProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isProcessing,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // Share state globally for CircleAnimation
  useEffect(() => {
    (window as any).voiceAssistantState = {
      isListening,
      isProcessing: isThinking,
      isResponding,
      showBottomSheet
    };
  }, [isListening, isThinking, isResponding, showBottomSheet]);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const [isManuallyClosedRef, setIsManuallyClosedRef] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Listen for suggestion playback events to show Stop button
  useEffect(() => {
    const handleSuggestionPlayback = () => {
      setIsResponding(true);
      setShowUnmuteButton(false);
      setShowAskButton(false);
    };

    const handleSuggestionPlaybackEnded = () => {
      setIsResponding(false);
      setShowUnmuteButton(false);
      setShowAskButton(true);
    };

    const handleTriggerVoiceAssistant = async () => {
      console.log("QR SCAN: Voice assistant triggered");
      // Don't reopen if manually closed
      if (isManuallyClosedRef) {
        console.log("QR SCAN: Voice assistant manually closed, ignoring trigger");
        return;
      }
      
      // DEPLOYMENT: Block welcome message until male voice is verified
      const isDeployment = window.location.hostname.includes('.replit.app') || 
                          window.location.hostname.includes('.repl.co') ||
                          window.location.hostname !== 'localhost';
      
      if (isDeployment) {
        // Check if voice is properly locked before speaking
        const voiceLocked = (window as any).VOICE_LOCK_VERIFIED && (window as any).GUARANTEED_MALE_VOICE;
        if (!voiceLocked) {
          console.log("🚫 DEPLOYMENT: Blocking welcome message - voice not verified");
          setShowBottomSheet(true);
          setShowAskButton(true);
          setIsResponding(false);
          return;
        }
      }
      
      setShowBottomSheet(true);
      setShowAskButton(false);
      setIsResponding(true);
      
      // Speak the welcome message immediately
      const welcomeMessage = "Hi and welcome to Somm.ai let me tell you about this wine?";
      
      // Always use the global voice script function for consistency
      if ((window as any).speakResponse) {
        console.log("QR SCAN: Using global speakResponse function");
        (window as any).speakResponse(welcomeMessage);
        
        // Set up completion handler
        setTimeout(() => {
          setIsResponding(false);
          setShowAskButton(true);
          console.log("QR SCAN: Welcome message completed");
        }, 4000); // Approximate duration
      } else {
        // If global function not available, use OpenAI TTS for consistency
        console.log("QR SCAN: Fallback - using OpenAI TTS");
        
        fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage })
        })
        .then(response => response.arrayBuffer())
        .then(buffer => {
          const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            setIsResponding(false);
            setShowAskButton(true);
            URL.revokeObjectURL(audioUrl);
            console.log("QR SCAN: Welcome message completed");
          };
          
          audio.onerror = () => {
            setIsResponding(false);
            setShowAskButton(true);
            URL.revokeObjectURL(audioUrl);
            console.error("QR SCAN: Audio playback error");
          };
          
          audio.play();
          console.log("QR SCAN: Playing welcome message via TTS");
        })
        .catch(error => {
          console.error("QR SCAN: TTS error:", error);
          setIsResponding(false);
          setShowAskButton(true);
        });
      }
    };

    // Custom audio playback handler for suggestion responses
    const handlePlayAudioResponse = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { audioBuffers } = customEvent.detail;
      if (audioBuffers && audioBuffers.length > 0) {
        setIsResponding(true);
        setShowUnmuteButton(false);
        setShowAskButton(false);
        
        try {
          for (const buffer of audioBuffers) {
            const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            await new Promise((resolve, reject) => {
              audio.onended = resolve;
              audio.onerror = reject;
              audio.play();
            });
            
            URL.revokeObjectURL(audioUrl);
          }
        } catch (error) {
          console.error('Error playing suggestion audio:', error);
        } finally {
          setIsResponding(false);
          setShowAskButton(true);
        }
      }
    };

    window.addEventListener('suggestionPlaybackStarted', handleSuggestionPlayback);
    window.addEventListener('suggestionPlaybackEnded', handleSuggestionPlaybackEnded);
    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
    window.addEventListener('playAudioResponse', handlePlayAudioResponse);
    
    return () => {
      window.removeEventListener('suggestionPlaybackStarted', handleSuggestionPlayback);
      window.removeEventListener('suggestionPlaybackEnded', handleSuggestionPlaybackEnded);
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
      window.removeEventListener('playAudioResponse', handlePlayAudioResponse);
    };
  }, []);
  
  // Audio cache for TTS responses to minimize fallback usage
  const audioCache = useRef<Map<string, Blob>>(new Map());
  
  const getCachedAudio = (text: string): Blob | null => {
    const cacheKey = btoa(text).slice(0, 50); // Create cache key from text
    return audioCache.current.get(cacheKey) || null;
  };
  
  const setCachedAudio = (text: string, audioBlob: Blob): void => {
    const cacheKey = btoa(text).slice(0, 50);
    audioCache.current.set(cacheKey, audioBlob);
    // Limit cache size to prevent memory issues
    if (audioCache.current.size > 10) {
      const firstKey = audioCache.current.keys().next().value;
      if (firstKey) {
        audioCache.current.delete(firstKey);
      }
    }
  };

  // Add global promise rejection handler for production stability
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log("Caught unhandled rejection:", event.reason);
      event.preventDefault(); // Prevent console error
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // Voice activity detection state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const lastVoiceDetectedRef = useRef<number>(0);
  const consecutiveSilenceCountRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);

  // Mobile-specific state management
  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const { toast } = useToast();

  // Voice activity detection functions
  const startVoiceDetection = (stream: MediaStream) => {
    try {
      console.log('🎤 Setting up voice detection...');
      
      // Create audio context for voice activity detection
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      console.log('🎤 Audio context created, state:', audioContextRef.current.state);
      
      // Resume audio context if suspended (required for some browsers)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('🎤 Audio context resumed');
        });
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Configure analyser for voice detection with more sensitive settings
      analyserRef.current.fftSize = 512; // Increased for better frequency resolution
      analyserRef.current.smoothingTimeConstant = 0.3; // Reduced for more responsive detection
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      source.connect(analyserRef.current);
      
      console.log('🎤 Audio pipeline connected, starting monitoring...');
      
      // Start monitoring voice activity with high frequency for immediate response
      voiceDetectionIntervalRef.current = setInterval(() => {
        checkVoiceActivity();
      }, 25); // Check every 25ms for maximum responsiveness
      
      console.log('🎤 Voice detection started successfully');
    } catch (error) {
      console.error("Failed to start voice detection:", error);
    }
  };

  const checkVoiceActivity = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate multiple audio metrics for debugging
    let sum = 0;
    let max = 0;
    let min = 255;
    let nonZeroValues = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i];
      sum += value;
      if (value > max) max = value;
      if (value < min) min = value;
      if (value > 0) nonZeroValues++;
    }
    const average = sum / bufferLength;
    
    // Try time domain data as well
    const timeDomainArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(timeDomainArray);
    
    let timeSum = 0;
    let timeMax = 0;
    for (let i = 0; i < bufferLength; i++) {
      const value = timeDomainArray[i];
      timeSum += value;
      if (value > timeMax) timeMax = value;
    }
    const timeAverage = timeSum / bufferLength;
    
    const voiceThreshold = 20; // Lower threshold for more sensitive voice detection
    const silenceThreshold = 10; // Much lower threshold to maintain voice state longer
    
    // Use hysteresis to prevent flapping between voice/silence
    const currentThreshold = isVoiceActive ? silenceThreshold : voiceThreshold;
    const isCurrentlyActive = average > currentThreshold;
    
    const now = Date.now();
    const recordingDuration = now - recordingStartTimeRef.current;
    
    // Dispatch real-time volume data for CircleAnimation
    window.dispatchEvent(
      new CustomEvent("voice-volume", {
        detail: { 
          volume: average,
          maxVolume: max,
          isActive: isCurrentlyActive
        },
      }),
    );
    
    // Reduced debug logging
    if (Math.random() < 0.01) { // 1% of volume updates
      console.log('🎤 Voice volume:', { average, max, isActive: isCurrentlyActive });
    }

    // Minimal debug logging only on errors
    if (average === 0 && max === 0 && timeAverage === 128 && consecutiveSilenceCountRef.current % 100 === 0) {
      console.log("Audio input issue detected");
    }
    
    if (isCurrentlyActive) {
      lastVoiceDetectedRef.current = now;
      consecutiveSilenceCountRef.current = 0;
      
      if (!isVoiceActive) {
        setIsVoiceActive(true);
        
        // Clear any existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
    } else {
      consecutiveSilenceCountRef.current++;
      
      if (isVoiceActive) {
        setIsVoiceActive(false);
        
        // Start silence timer with extended delay for natural speech patterns
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        silenceTimerRef.current = setTimeout(() => {
          // Check if minimum recording time has passed
          const canStopEarly = (window as any).canStopEarly;
          const currentRecordingDuration = Date.now() - recordingStartTimeRef.current;
          
          if (canStopEarly && currentRecordingDuration > 1500) {
            stopListening();
          } else {
            // Give more time if minimum duration not met
            silenceTimerRef.current = setTimeout(() => {
              stopListening();
            }, 2000);
          }
        }, 3000);
      }
      
      // Fallback: Only trigger if we've actually had voice activity AND been recording for at least 3 seconds
      if (lastVoiceDetectedRef.current > 0 && 
          recordingStartTimeRef.current > 0 &&
          now - recordingStartTimeRef.current > 3000 && // Must be recording for at least 3 seconds
          now - lastVoiceDetectedRef.current > 5000 && 
          consecutiveSilenceCountRef.current > 200) { // 200 * 25ms = 5 seconds
        stopListening();
      }
    }
  };

  const stopVoiceDetection = () => {
    // Clear voice detection interval
    if (voiceDetectionIntervalRef.current) {
      clearInterval(voiceDetectionIntervalRef.current);
      voiceDetectionIntervalRef.current = null;
    }
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setIsVoiceActive(false);
    // Voice detection stopped
  };

  // Cleanup audio resources when component unmounts
  useEffect(() => {
    return () => {
      stopListening();
      stopVoiceDetection();
    };
  }, []);

  // Keep bottom sheet open during processing and manage thinking state
  useEffect(() => {
    if (isProcessing) {
      setShowBottomSheet(true);
      setIsThinking(true);
      setShowUnmuteButton(false);
      // Keeping bottom sheet open
    } else {
      setIsThinking(false);
      // Show unmute button when response is ready
      setShowUnmuteButton(true);
      setShowAskButton(false);
    }
  }, [isProcessing]);

  // Handle audio status changes and page visibility
  useEffect(() => {
    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;

      if (status === "playing") {
        setIsResponding(true);
        setShowUnmuteButton(false);
      } else if (
        status === "stopped" ||
        status === "paused" ||
        status === "muted"
      ) {
        setIsResponding(false);
        setShowUnmuteButton(true);
      }
    };

    // Stop microphone when user leaves the page/tab
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - stopping microphone
        stopListening();
        setShowBottomSheet(false);

        // Stop any ongoing audio playback
        if ((window as any).currentOpenAIAudio) {
          (window as any).currentOpenAIAudio.pause();
          (window as any).currentOpenAIAudio = null;
        }

        setIsResponding(false);
      }
    };

    const handleShowUnmuteButton = () => {
      setShowUnmuteButton(true);
    };

    window.addEventListener(
      "audio-status",
      handleAudioStatusChange as EventListener,
    );
    window.addEventListener(
      "showUnmuteButton",
      handleShowUnmuteButton as EventListener,
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(
        "audio-status",
        handleAudioStatusChange as EventListener,
      );
      window.removeEventListener(
        "showUnmuteButton",
        handleShowUnmuteButton as EventListener,
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const startListening = async () => {
    console.log("🎤 DEPLOY DEBUG: Starting audio recording for Whisper transcription");

    // Check if manually closed - don't reopen if so
    if (isManuallyClosedRef) {
      console.log("🎤 DEPLOY DEBUG: Voice assistant manually closed, ignoring startListening");
      return;
    }

    // Immediately show bottom sheet and listening state for instant feedback
    console.log("🎤 DEPLOY DEBUG: Setting UI states - showBottomSheet: true, isListening: true");
    setShowBottomSheet(true);
    setIsListening(true);
    
    // Dispatch listening event immediately to ensure CircleAnimation responds
    console.log('🎤 VoiceAssistant: Dispatching mic-status "listening" event (early)');
    const micEvent = new CustomEvent("mic-status", {
      detail: { status: "listening" },
    });
    console.log('🎤 VoiceAssistant: Created event:', micEvent, 'detail:', micEvent.detail);
    window.dispatchEvent(micEvent);

    // Check deployment environment
    const isDeployment = window.location.hostname.includes('.replit.app') || window.location.hostname.includes('.repl.co');
    // Environment check completed

    // Direct stream request without intermediate permission check
    // Starting stream request
    return setupRecording();
  };

  const setupRecording = async () => {
    // Setup recording started
    
    try {
      // Clean up any existing streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Request fresh microphone stream
      // Requesting microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      // Stream created successfully
      streamRef.current = stream;

      // Initialize MediaRecorder with optimal settings for Whisper
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus', // Opus codec for better compression
        audioBitsPerSecond: 16000, // Lower bitrate for faster processing
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Audio data chunk received
        }
      };
      
      mediaRecorder.onstop = () => {
        // Wrap the async operation to prevent unhandled rejections
        (async () => {
          try {
            // Audio recording stopped, processing
            
            // Create audio blob from recorded chunks
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: 'audio/webm;codecs=opus' 
            });
            
            // Audio blob created
            
            // Check if audio blob has sufficient data
            if (audioBlob.size < 1000) { // Less than 1KB indicates no meaningful audio
              console.warn("Audio blob too small, skipping transcription");
              setIsThinking(false);
              // Don't close bottom sheet automatically - let user try again
              setShowAskButton(true);
              setIsListening(false);
              return;
            }
            
            // Send audio to Whisper transcription endpoint with timeout
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second client timeout
            
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Transcription failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            // Transcription completed
            
            // Handle fallback responses
            if (result.fallback) {
              // Using fallback transcription
              onSendMessage(result.text.trim());
              return;
            }
            
            if (result.text && result.text.trim()) {
              onSendMessage(result.text.trim());
            } else {
              console.warn("No transcription text received - using fallback");
              // Use fallback question instead of showing error
              onSendMessage("Tell me about this wine");
            }
          } catch (error) {
            console.error("Transcription error:", error);
            
            // Use fallback question instead of showing error
            // Using fallback question due to transcription error
            onSendMessage("Tell me about this wine");
          } finally {
            setIsThinking(false);
            if (!isProcessing) {
              setShowBottomSheet(false);
            }
            // Emit microphone status event for wine bottle animation
            console.log('🎤 VoiceAssistant: Dispatching mic-status "stopped" event');
            window.dispatchEvent(
              new CustomEvent("mic-status", {
                detail: { status: "stopped" },
              }),
            );
          }
        })().catch(error => {
          console.error("Caught unhandled rejection:", error);
          // Final fallback to prevent any unhandled promise rejections
          onSendMessage("Tell me about this wine");
          setIsThinking(false);
          setShowAskButton(true);
          setIsListening(false);
        });
      };
      
      // Recording state already set in startListening, just update UI
      recordingStartTimeRef.current = Date.now(); // Initialize recording start time
      lastVoiceDetectedRef.current = 0; // Reset voice detection
      consecutiveSilenceCountRef.current = 0; // Reset silence counter
      // Ensure stream stays active by preventing browser from terminating it
      stream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = true;
      });
      
      mediaRecorder.start(250); // Request data every 250ms for stability
      
      // Start voice activity detection immediately
      console.log('🎤 VoiceAssistant: Starting voice detection with stream');
      startVoiceDetection(stream);
      
      // Store stream globally for CircleAnimation access
      (window as any).currentMicrophoneStream = stream;
      
      // Force dispatch a second listening event to ensure CircleAnimation receives it
      setTimeout(() => {
        console.log('🎤 VoiceAssistant: Dispatching mic-status "listening" event (confirmation)');
        window.dispatchEvent(
          new CustomEvent("mic-status", {
            detail: { status: "listening" },
          }),
        );
      }, 100);
      
      // Emit microphone status event for wine bottle animation
      console.log('🎤 VoiceAssistant: Dispatching mic-status "listening" event');
      window.dispatchEvent(
        new CustomEvent("mic-status", {
          detail: { status: "listening", stream: stream },
        }),
      );
      
      console.log('VoiceAssistant: Dispatched mic-status event with stream:', {
        hasStream: !!stream,
        streamId: stream.id,
        audioTracks: stream.getAudioTracks().length
      });
      
      // Minimum recording duration to ensure we capture some audio and allow voice detection
      const minimumRecordingTime = 3000; // 3 seconds minimum to allow proper voice detection
      let canStopEarly = false;
      
      setTimeout(() => {
        canStopEarly = true;
        // Minimum recording time reached
      }, minimumRecordingTime);
      
      // Store the canStopEarly flag globally for voice detection
      (window as any).canStopEarly = false;
      setTimeout(() => {
        (window as any).canStopEarly = true;
      }, minimumRecordingTime);
      
      // Primary backup: stop after 8 seconds to allow more time for voice detection
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          console.log("Primary backup auto-stop after 8 seconds");
          stopListening();
        }
      }, 8000);
      
      // Secondary backup: stop after 10 seconds if silence detection completely fails
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          console.log("Secondary backup auto-stop after 10 seconds - silence detection failed");
          stopListening();
        }
      }, 10000);
    } catch (error) {
      console.error("🎤 DEPLOY DEBUG: Error in setupRecording:", error);
      console.error("🎤 DEPLOY DEBUG: Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack',
        type: typeof error
      });
      
      setIsListening(false);
      setShowBottomSheet(false);
      
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast({
          description: (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Microphone access denied
            </span>
          ),
          duration: 3000,
          className: "bg-white text-black border-none",
          style: {
            position: "fixed",
            top: "74px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            maxWidth: "none",
            padding: "8px 24px",
            borderRadius: "32px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
        });
      } else {
        toast({
          description: (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Failed to start voice recording
            </span>
          ),
          duration: 3000,
          className: "bg-white text-black border-none",
          style: {
            position: "fixed",
            top: "74px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            maxWidth: "none",
            padding: "8px 24px",
            borderRadius: "32px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
        });
      }
    }
  };

  const stopListening = () => {
    // Immediately stop voice detection to prevent any further timers
    stopVoiceDetection();
    
    // Show thinking state immediately
    setIsListening(false);
    setIsThinking(true);
    
    // Emit microphone status event for wine bottle animation
    console.log('🎤 VoiceAssistant: Dispatching mic-status "processing" event');
    window.dispatchEvent(
      new CustomEvent("mic-status", {
        detail: { status: "processing" },
      }),
    );
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Audio recording stopped
  };

  const toggleListening = async () => {
    if (isProcessing) {
      return;
    }

    if (isListening) {
      stopListening();
      setShowBottomSheet(false);
    } else {
      try {
        await startListening();
      } catch (error) {
        console.error("Microphone access failed:", error);
        setShowBottomSheet(false);
        setIsListening(false);
      }
    }
  };



  const handleSuggestionClick = (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    
    // Check if this is a precomputed suggestion - if so, don't trigger API call
    const precomputedSuggestions = ["Food pairing", "Tasting notes", "Serving"];
    const isPrecomputed = precomputedSuggestions.includes(suggestion);
    
    if (!isPrecomputed) {
      // Only call API for non-precomputed suggestions
      onSendMessage(suggestion);
    }
    
    setShowBottomSheet(false);
  };

  const handleCloseBottomSheet = () => {
    console.log("VoiceAssistant: Manual close triggered - setting flag to prevent reopening");
    
    // Set flag to prevent automatic reopening
    setIsManuallyClosedRef(true);
    
    // Abort any ongoing conversation processing
    window.dispatchEvent(new CustomEvent('abortConversation'));
    
    // Stop OpenAI TTS audio playback
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }
    
    // Stop any autoplay audio
    if ((window as any).currentAutoplayAudio) {
      (window as any).currentAutoplayAudio.pause();
      (window as any).currentAutoplayAudio.currentTime = 0;
      (window as any).currentAutoplayAudio = null;
    }
    
    // Stop browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setShowBottomSheet(false);
    setIsThinking(false);
    setIsResponding(false);
    setShowUnmuteButton(false);
    setShowAskButton(false);
    stopListening();
    
    // Reset the flag after a longer delay to prevent immediate reopening
    setTimeout(() => {
      setIsManuallyClosedRef(false);
      console.log("VoiceAssistant: Manual close flag reset - voice assistant can be triggered again");
    }, 10000); // Extended to 10 seconds to prevent accidental reopening
  };

  const handleMute = () => {
    // Stop all audio playback
    if ((window as any).currentOpenAIAudio) {
      // Stopping OpenAI TTS audio
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
      // Audio stopped
    }

    // Stop autoplay audio as well
    if ((window as any).currentAutoplayAudio) {
      // Stopping autoplay audio
      (window as any).currentAutoplayAudio.pause();
      (window as any).currentAutoplayAudio.currentTime = 0;
      (window as any).currentAutoplayAudio = null;
      // Autoplay stopped
    }

    // Stop browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      // Stopping speech synthesis
    }

    // Stop any ongoing recording
    stopListening();

    // Reset all states to show Ask button but keep bottom sheet open
    setIsResponding(false);
    setIsThinking(false);
    setIsListening(false);
    setShowUnmuteButton(false);
    setShowAskButton(true);
    // Keep setShowBottomSheet(true) to maintain voice assistant interface

    // Emit stop event for wine bottle animation
    window.dispatchEvent(
      new CustomEvent("mic-status", {
        detail: { status: "stopped" },
      }),
    );
  };

  const handleUnmute = async () => {
    console.log("Unmute button clicked - starting TTS playback");
    console.log("Current window.lastAssistantMessageText:", (window as any).lastAssistantMessageText);
    
    // Wrap entire function in try-catch to prevent unhandled rejections
    try {
      // Check if there's pending autoplay audio from mobile autoplay blocking
      const pendingAudio = (window as any).pendingAutoplayAudio;
    if (pendingAudio) {
      console.log("Playing pending autoplay audio that was blocked");

      // Use the already generated audio
      (window as any).currentOpenAIAudio = pendingAudio;
      (window as any).pendingAutoplayAudio = null;

      setIsResponding(true);

      // Set up event handlers for the pending audio
      pendingAudio.onplay = () => {
        setIsResponding(true);
        setShowUnmuteButton(false);
        setShowAskButton(false);
        console.log("Pending audio playback started successfully");
      };

      pendingAudio.onended = () => {
        setIsResponding(false);
        setShowUnmuteButton(false);
        setShowAskButton(true);
        console.log("Pending audio playback completed successfully - Ask button enabled");
      };

      pendingAudio.onerror = (e: any) => {
        console.error("Pending audio playback error:", e);
        setIsResponding(false);
        setShowUnmuteButton(false);
        setShowAskButton(true);
      };

      try {
        await pendingAudio.play();
        console.log("Pending audio started playing successfully");
        return;
      } catch (error) {
        console.error("Failed to play pending audio:", error);
        // Fall through to generate new audio
      }
    }

    // Fallback: generate new audio if no pending audio or it failed
    const lastAssistantMessage = (window as any).lastAssistantMessageText;
    console.log("Checking lastAssistantMessage:", lastAssistantMessage ? `"${lastAssistantMessage.substring(0, 50)}..."` : "null/undefined");

    if (!lastAssistantMessage) {
      console.warn("No assistant message available to play - attempting fallback");
      
      // Try to get the last assistant message from the messages in the UI
      const messageElements = document.querySelectorAll('[data-role="assistant"]');
      if (messageElements.length > 0) {
        const lastMessageElement = messageElements[messageElements.length - 1];
        const fallbackText = lastMessageElement.textContent || lastMessageElement.innerText;
        if (fallbackText && fallbackText.trim()) {
          console.log("Using fallback message from UI:", fallbackText.substring(0, 50) + "...");
          (window as any).lastAssistantMessageText = fallbackText.trim();
          // Continue with the TTS generation using the fallback text
        } else {
          console.warn("No assistant message available to play and no fallback found");
          setShowUnmuteButton(true);
          return;
        }
      } else {
        console.warn("No assistant message available to play and no message elements found");
        setShowUnmuteButton(true);
        return;
      }
    }

    console.log(
      "Generating new TTS audio for:",
      lastAssistantMessage.substring(0, 50) + "...",
    );

    setIsResponding(true);

    try {
      // Stop any existing audio first
      if ((window as any).currentOpenAIAudio) {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio = null;
      }
      if ((window as any).currentAutoplayAudio) {
        (window as any).currentAutoplayAudio.pause();
        (window as any).currentAutoplayAudio = null;
      }

      // Check for cached audio first to minimize fallback usage
      const cachedAudio = getCachedAudio(lastAssistantMessage);
      if (cachedAudio) {
        console.log("Using cached TTS audio");
        const audioUrl = URL.createObjectURL(cachedAudio);
        const audio = new Audio(audioUrl);
        
        // Store reference for stop functionality
        (window as any).currentOpenAIAudio = audio;

        audio.onplay = () => {
          setIsResponding(true);
          setShowUnmuteButton(false);
          setShowAskButton(false);
          console.log("Cached TTS playback started successfully");
        };

        audio.onended = () => {
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
          URL.revokeObjectURL(audioUrl);
          console.log("Cached TTS playback completed - Ask button enabled");
        };

        audio.onerror = () => {
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
          URL.revokeObjectURL(audioUrl);
          console.error("Cached TTS playback error");
        };

        await audio.play();
        console.log("Cached audio play promise resolved successfully");
        return;
      }

      // Try server TTS with optimized timeout, fallback to browser TTS
      console.log("Generating unmute TTS audio...");
      let audio: HTMLAudioElement | null = null;
      let audioUrl: string | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        // Create a safer Promise wrapper that prevents unhandled rejections
        const safeTimeout = (ms: number) => {
          return new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              console.log("TTS request timeout reached");
              reject(new Error('TTS_TIMEOUT'));
            }, ms);
          });
        };

        const safeFetch = async () => {
          const response = await fetch("/api/text-to-speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: lastAssistantMessage }),
          });
          
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          return response;
        };

        // Race between fetch and timeout with extended timeout for stability
        let response;
        try {
          response = await Promise.race([
            safeFetch().catch(err => {
              throw err;
            }),
            safeTimeout(60000).catch(err => {
              throw err;
            })
          ]);
        } catch (raceError) {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          throw raceError;
        }

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
          
          // Cache the successful audio response to minimize future fallbacks
          setCachedAudio(lastAssistantMessage, audioBlob);
          
          audioUrl = URL.createObjectURL(audioBlob);
          audio = new Audio(audioUrl);
          console.log("Using server TTS audio");
        } else {
          throw new Error(`TTS API error: ${response.status}`);
        }
      } catch (serverError) {
        console.log("Server TTS failed, using browser speech synthesis");
        console.log("Server error details:", {
          name: serverError instanceof Error ? serverError.name : 'Unknown',
          message: serverError instanceof Error ? serverError.message : String(serverError)
        });
        
        // Clear the timeout to prevent unhandled rejection
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Use browser's built-in speech synthesis as immediate fallback
        const utterance = new SpeechSynthesisUtterance(lastAssistantMessage);
        utterance.rate = 0.9; // Slightly slower for better clarity
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Log the full text being spoken for debugging
        console.log("Browser TTS: Full text length:", lastAssistantMessage.length);
        console.log("Browser TTS: Text content:", lastAssistantMessage);
        
        // CRITICAL: Use the same locked male voice across all components
        const selectVoice = () => {
          const voices = speechSynthesis.getVoices();
          
          // Priority 1: Use LOCKED voice URI for absolute consistency
          const lockedVoiceURI = localStorage.getItem('LOCKED_VOICE_URI');
          if (lockedVoiceURI) {
            const lockedVoice = voices.find(voice => voice.voiceURI === lockedVoiceURI);
            if (lockedVoice) {
              utterance.voice = lockedVoice;
              console.log("USING LOCKED VOICE:", lockedVoice.name, "URI:", lockedVoice.voiceURI);
              return;
            }
          }
          
          // Priority 2: Google UK English Male (exact match)
          let preferredVoice = voices.find(voice => 
            voice.name === 'Google UK English Male');
          
          // Priority 3: Google US English Male (exact match)
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => 
              voice.name === 'Google US English Male');
          }
          
          // Priority 4: Any Google male voice with English
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => 
              voice.name.includes('Google') && voice.name.includes('Male') && voice.lang.startsWith('en'));
          }
          
          // Priority 5: First available English male voice
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => 
              voice.name.includes('Male') && voice.lang.startsWith('en'));
          }
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
            // Lock this voice for consistent reuse
            localStorage.setItem('LOCKED_VOICE_URI', preferredVoice.voiceURI);
            localStorage.setItem('LOCKED_VOICE_NAME', preferredVoice.name);
            console.log("LOCKED VOICE FOR CONSISTENCY:", preferredVoice.name, "URI:", preferredVoice.voiceURI);
          }
        };
        
        // Handle voice loading
        if (speechSynthesis.getVoices().length > 0) {
          selectVoice();
        } else {
          speechSynthesis.onvoiceschanged = () => {
            selectVoice();
            speechSynthesis.onvoiceschanged = null;
          };
        }

        utterance.onstart = () => {
          setIsResponding(true);
          setShowUnmuteButton(false);
          setShowAskButton(false);
          console.log("Browser TTS playback started");
        };

        utterance.onend = () => {
          // Browser TTS completed
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
          // TTS state updated
          console.log("Browser TTS playback completed - Ask button enabled");
        };

        utterance.onerror = () => {
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
          console.error("Browser TTS playback error");
        };

        speechSynthesis.speak(utterance);
        console.log("Browser TTS initiated successfully");
        return; // Exit early for browser TTS
      }

      // Store reference for stop functionality
      (window as any).currentOpenAIAudio = audio;

      audio.onplay = () => {
        setIsResponding(true);
        setShowUnmuteButton(false);
        setShowAskButton(false);
        console.log("Manual unmute TTS playback started successfully");
      };

      audio.onended = () => {
        // Server TTS completed
        setIsResponding(false);
        setShowUnmuteButton(false);
        setShowAskButton(true);
        // Server TTS state updated
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        (window as any).currentOpenAIAudio = null;
        console.log("Manual unmute TTS playback completed successfully - Ask button enabled");
      };

      audio.onerror = (e) => {
        console.error("Manual unmute TTS playback error:", e);
        console.error("Audio error details:", {
          error: audio.error?.message,
          code: audio.error?.code,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });
        setIsResponding(false);
        setShowUnmuteButton(false);
        setShowAskButton(true);
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        (window as any).currentOpenAIAudio = null;

        toast({
          description: (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Failed to play audio - please try again
            </span>
          ),
          duration: 3000,
          className: "bg-white text-black border-none",
          style: {
            position: "fixed",
            top: "74px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            maxWidth: "none",
            padding: "8px 24px",
            borderRadius: "32px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
        });
      };

      audio.onabort = () => {
        console.log("Manual unmute audio playback aborted");
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        (window as any).currentOpenAIAudio = null;
      };

      // Set audio properties for better compatibility
      audio.preload = "auto";
      audio.volume = 0.8;

      console.log("Attempting to play manual unmute audio...");

      // Ensure audio context is ready for user-initiated playback
      if (typeof (window as any).initAudioContext === "function") {
        await (window as any).initAudioContext();
      }

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        try {
          await playPromise;
          console.log("Manual unmute audio play promise resolved successfully");
        } catch (playError: any) {
          console.error("Manual unmute audio play failed:", playError);

          if (playError.name === "NotAllowedError") {
            console.error("Manual audio playback blocked by browser");
            throw new Error(
              "Audio playback blocked - please check browser settings",
            );
          } else {
            throw playError;
          }
        }
      }

      audio.onerror = (e) => {
        console.error("Manual unmute TTS playback error:", e);
        setIsResponding(false);
        setShowUnmuteButton(false);
        setShowAskButton(true);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
      };

      // Audio is already playing from the promise above
      console.log("Manual unmute TTS playback initiated successfully");
    } catch (error) {
      console.error("Failed to generate or play unmute TTS audio:", error);
      setIsResponding(false);
      setShowUnmuteButton(false);
      setShowAskButton(true);

      // Provide more specific error messages
      let errorMessage = "Failed to play audio";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Audio generation timed out - please try again";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Audio service is slow - please try again";
        } else if (error.message.includes('500')) {
          errorMessage = "Audio service unavailable - please try again";
        }
      }

      toast({
        description: (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {errorMessage}
          </span>
        ),
        duration: 3000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
    } catch (globalError) {
      console.error("Unhandled error in handleUnmute:", globalError);
      setIsResponding(false);
      setShowUnmuteButton(true);
      setShowAskButton(true);
    }
  };

  const handleAsk = async () => {
    // Ask button clicked
    
    // Check if manually closed - don't reopen if so
    if (isManuallyClosedRef) {
      console.log("Voice assistant manually closed, ignoring ask button");
      return;
    }
    
    // Prevent multiple rapid clicks
    if (isListening || isProcessing) {
      // Already processing
      return;
    }
    
    // Stop any existing audio playback
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }
    
    if ((window as any).currentAutoplayAudio) {
      (window as any).currentAutoplayAudio.pause();
      (window as any).currentAutoplayAudio.currentTime = 0;
      (window as any).currentAutoplayAudio = null;
    }
    
    // Stop browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Clean up existing streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset UI state
    setShowUnmuteButton(false);
    setShowAskButton(false);
    setIsResponding(false);
    setIsThinking(false);
    setShowBottomSheet(true);
    setIsListening(true);
    
    try {
      // Request microphone access and start recording in one step
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      // Microphone stream obtained
      streamRef.current = stream;
      
      // Setup recording immediately
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Setup recording handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsThinking(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        
        if (audioBlob.size < 1000) {
          console.warn("Audio too small, using fallback");
          onSendMessage("Tell me about this wine");
          setIsThinking(false);
          setShowAskButton(true);
          setIsListening(false);
          if (!isProcessing) setShowBottomSheet(false);
          return;
        }
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.text && result.text.trim()) {
              onSendMessage(result.text.trim());
            } else {
              onSendMessage("Tell me about this wine");
            }
          } else {
            onSendMessage("Tell me about this wine");
          }
        } catch (error) {
          console.error("Transcription error:", error);
          onSendMessage("Tell me about this wine");
        } finally {
          setIsThinking(false);
          setIsListening(false);
          if (!isProcessing) setShowBottomSheet(false);
        }
      };
      
      // Start recording
      mediaRecorder.start(250);
      // Recording started
      
      // Start voice detection
      startVoiceDetection(stream);
      
      // Auto-stop after 4 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          stopListening();
        }
      }, 4000);
      
    } catch (error) {
      console.error("Microphone access failed:", error);
      setIsListening(false);
      setShowAskButton(true);
      
      toast({
        description: (
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 500 }}>
            {error instanceof Error && error.name === "NotAllowedError" 
              ? "Microphone access required for voice input" 
              : "Failed to start voice recording"}
          </span>
        ),
        duration: 3000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {!showBottomSheet && (
        <div
          onClick={toggleListening}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: isProcessing ? "default" : "pointer",
            border: "none",
            outline: "none",
            transition: "background-color 0.2s ease",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 20 20"
            style={{
              color: isProcessing
                ? "rgba(255, 255, 255, 0.5)"
                : "rgba(255, 255, 255, 1)",
            }}
          >
            <path
              fill="currentColor"
              d="M5.5 10a.5.5 0 0 0-1 0a5.5 5.5 0 0 0 5 5.478V17.5a.5.5 0 0 0 1 0v-2.022a5.5 5.5 0 0 0 5-5.478a.5.5 0 0 0-1 0a4.5 4.5 0 1 1-9 0m7.5 0a3 3 0 0 1-6 0V5a3 3 0 0 1 6 0z"
            />
          </svg>
        </div>
      )}

      <VoiceBottomSheet
        isOpen={showBottomSheet}
        onClose={handleCloseBottomSheet}
        onMute={handleMute}
        onUnmute={handleUnmute}
        onAsk={handleAsk}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isThinking}
        isVoiceActive={isVoiceActive}
        showSuggestions={showAskButton && !isListening && !isResponding && !isThinking}
        showUnmuteButton={
          showUnmuteButton && !isListening && !isResponding && !isThinking
        }
        showAskButton={
          showAskButton && !isListening && !isResponding && !isThinking
        }
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default VoiceAssistant;
