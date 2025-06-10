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
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
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
      // Create audio context for voice activity detection
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Configure analyser for voice detection
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      
      // Start monitoring voice activity with high frequency for immediate response
      voiceDetectionIntervalRef.current = setInterval(() => {
        checkVoiceActivity();
      }, 25); // Check every 25ms for maximum responsiveness
      
      console.log("Voice activity detection started");
    } catch (error) {
      console.error("Failed to start voice detection:", error);
    }
  };

  const checkVoiceActivity = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume for voice detection
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    const voiceThreshold = 35; // Higher threshold for voice activity
    const silenceThreshold = 20; // Lower threshold for silence detection
    
    // Use hysteresis to prevent flapping between voice/silence
    const currentThreshold = isVoiceActive ? silenceThreshold : voiceThreshold;
    const isCurrentlyActive = average > currentThreshold;
    
    const now = Date.now();
    
    if (isCurrentlyActive) {
      lastVoiceDetectedRef.current = now;
      consecutiveSilenceCountRef.current = 0;
      
      if (!isVoiceActive) {
        console.log(`Voice detected - Level: ${average.toFixed(2)}, threshold: ${currentThreshold}`);
        setIsVoiceActive(true);
        
        // Clear any existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
          console.log("Silence timer cleared - voice detected");
        }
      }
    } else {
      consecutiveSilenceCountRef.current++;
      
      if (isVoiceActive) {
        console.log(`Silence detected - Level: ${average.toFixed(2)}, threshold: ${currentThreshold}`);
        setIsVoiceActive(false);
        
        // Start 2-second silence timer
        console.log("Starting 2-second silence countdown");
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        silenceTimerRef.current = setTimeout(() => {
          console.log("2 seconds of silence completed - stopping recording now");
          stopListening();
        }, 2000);
      }
      
      // Fallback: Only trigger if we've actually had voice activity AND been recording for at least 2 seconds
      if (lastVoiceDetectedRef.current > 0 && 
          recordingStartTimeRef.current > 0 &&
          now - recordingStartTimeRef.current > 2000 && // Must be recording for at least 2 seconds
          now - lastVoiceDetectedRef.current > 5000 && 
          consecutiveSilenceCountRef.current > 200) { // 200 * 25ms = 5 seconds
        console.log("Fallback silence detection - forcing stop after 5 seconds of silence");
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
    console.log("Voice activity detection stopped");
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
      console.log("Keeping bottom sheet open during processing");
    } else {
      setIsThinking(false);
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
        console.log("Page hidden - stopping microphone access");
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
    console.log("Starting audio recording for Whisper transcription");

    // Request microphone permission
    console.log("Requesting microphone permission for voice recording");
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
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
            Microphone access required for voice input
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
      return;
    }

    try {
      // Get user media for audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for Whisper
        } 
      });
      
      streamRef.current = stream;

      // Initialize MediaRecorder with optimal settings for Whisper
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus', // Opus codec for better compression
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log("Audio recording stopped, processing...");
        setIsListening(false);
        setIsThinking(true);
        
        // Create audio blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        console.log(`Audio blob created: ${Math.round(audioBlob.size / 1024)}KB`);
        
        // Check if audio blob has sufficient data
        if (audioBlob.size < 1000) { // Less than 1KB indicates no meaningful audio
          console.warn("Audio blob too small, skipping transcription");
          setIsThinking(false);
          if (!isProcessing) {
            setShowBottomSheet(false);
          }
          return;
        }
        
        try {
          // Send audio to Whisper transcription endpoint
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Transcription failed: ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log("Whisper transcription result:", result.text);
          
          if (result.text && result.text.trim()) {
            onSendMessage(result.text.trim());
          } else {
            console.warn("No transcription text received");
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
                  Could not understand audio. Please try again.
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
        } catch (error) {
          console.error("Transcription error:", error);
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
                Failed to process audio. Please try again.
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
        } finally {
          setIsThinking(false);
          if (!isProcessing) {
            setShowBottomSheet(false);
          }
          // Emit microphone status event for wine bottle animation
          window.dispatchEvent(
            new CustomEvent("mic-status", {
              detail: { status: "stopped" },
            }),
          );
        }
      };
      
      // Start recording
      setIsListening(true);
      setShowBottomSheet(true);
      recordingStartTimeRef.current = Date.now(); // Initialize recording start time
      lastVoiceDetectedRef.current = 0; // Reset voice detection
      consecutiveSilenceCountRef.current = 0; // Reset silence counter
      mediaRecorder.start();
      console.log("Audio recording started");
      
      // Start voice activity detection
      startVoiceDetection(stream);
      
      // Emit microphone status event for wine bottle animation
      window.dispatchEvent(
        new CustomEvent("mic-status", {
          detail: { status: "listening" },
        }),
      );
      
      // Backup auto-stop recording after 15 seconds (increased to give silence detection priority)
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          console.log("Backup auto-stop after 15 seconds - silence detection may have failed");
          stopListening();
        }
      }, 15000);
    } catch (error) {
      console.error("Error starting audio recording:", error);
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
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsListening(false);
    console.log("Audio recording stopped immediately");
  };

  const toggleListening = () => {
    if (isProcessing) return;

    if (isListening) {
      stopListening();
      setShowBottomSheet(false);
    } else {
      startListening();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    onSendMessage(suggestion);
    setShowBottomSheet(false);
  };

  const handleCloseBottomSheet = () => {
    console.log("Closing bottom sheet - aborting conversation and stopping audio");
    
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
    
    setShowBottomSheet(false);
    setIsThinking(false);
    setIsResponding(false);
    stopListening();
  };

  const handleMute = () => {
    if ((window as any).currentOpenAIAudio) {
      console.log("Stop button clicked - stopping OpenAI TTS audio playback");
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
      console.log("OpenAI TTS audio stopped successfully");
    }

    // Stop autoplay audio as well
    if ((window as any).currentAutoplayAudio) {
      console.log("Stop button clicked - stopping autoplay TTS audio");
      (window as any).currentAutoplayAudio.pause();
      (window as any).currentAutoplayAudio.currentTime = 0;
      (window as any).currentAutoplayAudio = null;
      console.log("Autoplay TTS audio stopped successfully");
    }

    setIsResponding(false);
    setShowUnmuteButton(true);
    setShowAskButton(true);
  };

  const handleUnmute = async () => {
    console.log("Unmute button clicked - starting TTS playback");

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
        setShowUnmuteButton(true);
        setShowAskButton(true);
        console.log("Pending audio playback completed successfully");
      };

      pendingAudio.onerror = (e: any) => {
        console.error("Pending audio playback error:", e);
        setIsResponding(false);
        setShowUnmuteButton(true);
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

    if (!lastAssistantMessage) {
      console.warn("No assistant message available to play");
      setShowUnmuteButton(true);
      return;
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

      // Generate audio using server TTS
      console.log("Generating unmute TTS audio...");
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastAssistantMessage }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Store reference for stop functionality
      (window as any).currentOpenAIAudio = audio;

      audio.onplay = () => {
        setIsResponding(true);
        setShowUnmuteButton(false);
        setShowAskButton(false);
        console.log("Manual unmute TTS playback started successfully");
      };

      audio.onended = () => {
        setIsResponding(false);
        setShowUnmuteButton(true);
        setShowAskButton(true);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
        console.log("Manual unmute TTS playback completed successfully");
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
        setShowUnmuteButton(true);
        setShowAskButton(true);
        URL.revokeObjectURL(audioUrl);
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
        URL.revokeObjectURL(audioUrl);
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
        setShowUnmuteButton(true);
        setShowAskButton(true);
        URL.revokeObjectURL(audioUrl);
        (window as any).currentOpenAIAudio = null;
      };

      // Ensure audio plays immediately
      console.log("Starting manual unmute TTS playback...");
      await audio.play();
      console.log("Manual unmute TTS playback initiated successfully");
    } catch (error) {
      console.error("Failed to generate or play unmute TTS audio:", error);
      setIsResponding(false);
      setShowUnmuteButton(true);
      setShowAskButton(true);

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
            Failed to play audio
          </span>
        ),
        duration: 2000,
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

  const handleAsk = () => {
    setShowUnmuteButton(false);
    setShowAskButton(false);
    handleCloseBottomSheet();
    startListening();
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
        showSuggestions={false}
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
