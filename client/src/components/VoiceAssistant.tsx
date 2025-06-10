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
      // Create audio context for voice activity detection
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (required for some browsers)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log("🎧 DEBUG: Audio context resumed");
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
      
      // Debug the audio stream
      console.log("🎧 DEBUG: Stream tracks:", stream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      })));
      
      console.log("🎧 DEBUG: Audio context state:", audioContextRef.current.state);
      console.log("🎧 DEBUG: Sample rate:", audioContextRef.current.sampleRate);
      
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
    
    const voiceThreshold = 30; // Threshold for voice activity
    const silenceThreshold = 20; // Lower threshold for silence detection
    
    // Use hysteresis to prevent flapping between voice/silence
    const currentThreshold = isVoiceActive ? silenceThreshold : voiceThreshold;
    const isCurrentlyActive = average > currentThreshold;
    
    const now = Date.now();
    const recordingDuration = now - recordingStartTimeRef.current;
    
    // Enhanced debug logging every 500ms
    if (consecutiveSilenceCountRef.current % 20 === 0) {
      console.log(`🔊 VOICE DEBUG: FreqAvg=${average.toFixed(1)}, FreqMax=${max}, NonZero=${nonZeroValues}, TimeAvg=${timeAverage.toFixed(1)}, TimeMax=${timeMax}, Threshold=${currentThreshold}, Active=${isCurrentlyActive}, Duration=${recordingDuration}ms`);
      
      // Additional debugging for persistent zero levels
      if (average === 0 && max === 0 && timeAverage === 128) {
        console.log(`🎧 AUDIO DEBUG: No audio input detected - checking stream and context state`);
        console.log(`🎧 AUDIO DEBUG: Audio context state: ${audioContextRef.current?.state}`);
        console.log(`🎧 AUDIO DEBUG: Analyser connected: ${analyserRef.current ? 'YES' : 'NO'}`);
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          // Enable all audio tracks explicitly
          tracks.forEach(track => {
            if (track.kind === 'audio' && !track.enabled) {
              track.enabled = true;
              console.log(`🎧 AUDIO DEBUG: Enabled audio track: ${track.label}`);
            }
          });
          console.log(`🎧 AUDIO DEBUG: Stream tracks: ${tracks.length}, Active tracks: ${tracks.filter(t => t.readyState === 'live' && t.enabled).length}`);
          tracks.forEach(track => {
            console.log(`🎧 TRACK DEBUG: ${track.kind} - enabled:${track.enabled}, readyState:${track.readyState}, label:${track.label}`);
          });
        }
      }
    }
    
    if (isCurrentlyActive) {
      lastVoiceDetectedRef.current = now;
      consecutiveSilenceCountRef.current = 0;
      
      if (!isVoiceActive) {
        console.log(`🔊 Voice detected - Level: ${average.toFixed(2)}, threshold: ${currentThreshold}`);
        setIsVoiceActive(true);
        
        // Clear any existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
          console.log("🔕 Silence timer cleared - voice detected");
        }
      }
    } else {
      consecutiveSilenceCountRef.current++;
      
      if (isVoiceActive) {
        console.log(`🔕 Silence detected - Level: ${average.toFixed(2)}, threshold: ${currentThreshold}`);
        setIsVoiceActive(false);
        
        // Start silence timer immediately after any voice activity
        console.log(`⏱️ Starting 1.5-second silence countdown (recorded for ${recordingDuration}ms)`);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        silenceTimerRef.current = setTimeout(() => {
          console.log("⏰ 1.5 seconds of silence completed - stopping recording now");
          stopListening();
        }, 1500);
      } else {
        // Log ongoing silence detection
        if (consecutiveSilenceCountRef.current % 40 === 0) { // Every 1 second
          console.log(`🔕 Ongoing silence - Level: ${average.toFixed(2)}, Duration: ${recordingDuration}ms, Count: ${consecutiveSilenceCountRef.current}`);
        }
      }
      
      // Fallback: Only trigger if we've actually had voice activity AND been recording for at least 3 seconds
      if (lastVoiceDetectedRef.current > 0 && 
          recordingStartTimeRef.current > 0 &&
          now - recordingStartTimeRef.current > 3000 && // Must be recording for at least 3 seconds
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
      setShowUnmuteButton(false);
      console.log("Keeping bottom sheet open during processing");
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
    console.log("🎤 DEPLOY DEBUG: Starting audio recording for Whisper transcription");

    // Immediately show bottom sheet and listening state for instant feedback
    console.log("🎤 DEPLOY DEBUG: Setting UI states - showBottomSheet: true, isListening: true");
    setShowBottomSheet(true);
    setIsListening(true);

    // Check deployment environment
    const isDeployment = window.location.hostname.includes('.replit.app') || window.location.hostname.includes('.repl.co');
    console.log("🎤 DEPLOY DEBUG: Environment check", {
      hostname: window.location.hostname,
      isDeployment,
      protocol: window.location.protocol,
      isSecure: window.location.protocol === 'https:'
    });

    // Check if we already have permission or can skip the prompt
    const shouldSkip = shouldSkipPermissionPrompt();
    console.log("🎤 DEPLOY DEBUG: Permission check", { shouldSkip });
    
    if (shouldSkip) {
      console.log("🎤 DEPLOY DEBUG: Using existing microphone permission for voice recording");
      const hasPermission = await requestMicrophonePermission();
      console.log("🎤 DEPLOY DEBUG: Existing permission result:", hasPermission);
      
      if (!hasPermission) {
        console.log("🎤 DEPLOY DEBUG: Existing permission invalid, setting states and returning");
        setIsListening(false);
        setShowBottomSheet(false);
        console.log("🎤 DEPLOY DEBUG: States set - requesting fresh permission");
        // Don't return here, fall through to request fresh permission
      } else {
        // Permission exists, continue with recording setup
        console.log("🎤 DEPLOY DEBUG: Permission valid, calling setupRecording");
        return setupRecording();
      }
    }

    // Request microphone permission
    console.log("🎤 DEPLOY DEBUG: Requesting fresh microphone permission for voice recording");
    const hasPermission = await requestMicrophonePermission();
    console.log("🎤 DEPLOY DEBUG: Fresh permission result:", hasPermission);
    
    if (!hasPermission) {
      console.log("🎤 DEPLOY DEBUG: Permission denied - closing bottom sheet and showing toast");
      setIsListening(false);
      setShowBottomSheet(false);
      
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

    console.log("🎤 DEPLOY DEBUG: Permission granted - calling setupRecording");
    return setupRecording();
  };

  const setupRecording = async () => {
    console.log("🎤 DEPLOY DEBUG: setupRecording started");
    
    try {
      // Check if existing stream is active, otherwise get fresh stream
      let stream = (window as any).currentMicrophoneStream;
      let needNewStream = true;
      
      if (stream) {
        const tracks = stream.getAudioTracks();
        const isStreamActive = tracks.length > 0 && tracks[0].readyState === 'live';
        console.log("🎤 DEPLOY DEBUG: Existing stream check", { 
          hasExistingStream: true,
          tracksCount: tracks.length,
          firstTrackState: tracks[0]?.readyState,
          isStreamActive
        });
        
        if (isStreamActive) {
          needNewStream = false;
          console.log("🎤 DEPLOY DEBUG: Using existing active stream");
        } else {
          console.log("🎤 DEPLOY DEBUG: Existing stream is ended/inactive, requesting new one");
          // Clean up the ended stream
          tracks.forEach(track => track.stop());
          (window as any).currentMicrophoneStream = null;
        }
      } else {
        console.log("🎤 DEPLOY DEBUG: No existing stream found");
      }
      
      if (needNewStream) {
        console.log("🎤 DEPLOY DEBUG: Requesting new getUserMedia stream");
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000, // Optimal for Whisper
          } 
        });
        console.log("🎤 DEPLOY DEBUG: getUserMedia successful", { 
          streamId: stream.id,
          tracks: stream.getAudioTracks().length 
        });
        
        // Store the new active stream
        (window as any).currentMicrophoneStream = stream;
      }
      
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
          console.log(`Audio data chunk: ${event.data.size} bytes`);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log("Audio recording stopped, processing...");
        
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
          console.log("Whisper transcription result:", result.text);
          
          // Handle fallback responses
          if (result.fallback) {
            console.log("Using fallback transcription:", result.text);
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
          console.log("Using fallback question due to transcription error");
          onSendMessage("Tell me about this wine");
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
      
      // Recording state already set in startListening, just update UI
      recordingStartTimeRef.current = Date.now(); // Initialize recording start time
      lastVoiceDetectedRef.current = 0; // Reset voice detection
      consecutiveSilenceCountRef.current = 0; // Reset silence counter
      mediaRecorder.start(100); // Request data every 100ms to ensure we get audio chunks
      console.log("Audio recording started");
      
      // Start voice activity detection
      startVoiceDetection(stream);
      
      // Emit microphone status event for wine bottle animation
      window.dispatchEvent(
        new CustomEvent("mic-status", {
          detail: { status: "listening", stream: stream },
        }),
      );
      
      // Primary backup: stop after 4 seconds regardless of voice detection
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          console.log("Primary backup auto-stop after 4 seconds");
          stopListening();
        }
      }, 4000);
      
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
    
    console.log("Audio recording stopped immediately");
  };

  const toggleListening = async () => {
    console.log("🎤 DEPLOY DEBUG: toggleListening called", {
      isProcessing,
      isListening,
      showBottomSheet,
      userAgent: navigator.userAgent,
      location: window.location.href
    });

    if (isProcessing) {
      console.log("🎤 DEPLOY DEBUG: Blocking - processing in progress");
      return;
    }

    if (isListening) {
      console.log("🎤 DEPLOY DEBUG: Stopping listening and closing bottom sheet");
      stopListening();
      setShowBottomSheet(false);
    } else {
      console.log("🎤 DEPLOY DEBUG: Starting listening - will show bottom sheet");
      try {
        await startListening();
        console.log("🎤 DEPLOY DEBUG: startListening completed successfully");
      } catch (error) {
        console.error("🎤 DEPLOY DEBUG: startListening failed:", error);
        setShowBottomSheet(false);
        setIsListening(false);
      }
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

      // Try server TTS first with short timeout, fallback to browser TTS
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

        // Race between fetch and timeout with comprehensive error handling
        let response;
        try {
          response = await Promise.race([
            safeFetch().catch(err => {
              throw err;
            }),
            safeTimeout(15000).catch(err => {
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
        
        // Select the same consistent male voice
        const selectVoice = () => {
          const voices = speechSynthesis.getVoices();
          
          // Priority 1: Use the globally selected voice if available
          if (window.selectedVoice && voices.includes(window.selectedVoice)) {
            utterance.voice = window.selectedVoice;
            console.log("Using consistent global voice:", window.selectedVoice.name);
            return;
          }
          
          // Priority 2: Google UK English Male for consistency
          let preferredVoice = voices.find(voice => 
            voice.name.includes('Google UK English Male'));
          
          // Priority 3: Other Google male voices
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => 
              voice.name.includes('Google') && voice.name.includes('Male'));
          }
          
          // Priority 4: Any male voice
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => 
              voice.name.includes('Male'));
          }
          
          // Priority 5: Named male voices
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => 
              voice.name.includes('David') || voice.name.includes('James') || 
              voice.name.includes('Thomas') || voice.name.includes('Daniel'));
          }
          
          // Fallback
          if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
          }
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
            window.selectedVoice = preferredVoice; // Store for consistency
            console.log("Selected consistent male voice:", preferredVoice.name);
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
          console.log("🔍 DEBUG: Browser TTS playback completed");
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
          console.log("🔍 DEBUG: State after TTS end - isResponding: false, showUnmuteButton: false, showAskButton: true");
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
        console.log("🔍 DEBUG: Server TTS playback completed");
        setIsResponding(false);
        setShowUnmuteButton(false);
        setShowAskButton(true);
        console.log("🔍 DEBUG: State after server TTS end - isResponding: false, showUnmuteButton: false, showAskButton: true");
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
    }
    } catch (globalError) {
      console.error("Unhandled error in handleUnmute:", globalError);
      setIsResponding(false);
      setShowUnmuteButton(true);
      setShowAskButton(true);
    }
  };

  const handleAsk = async () => {
    console.log("🔍 DEBUG: Ask button clicked - starting new voice recording");
    console.log("🔍 DEBUG: Current states before Ask - isListening:", isListening, "isResponding:", isResponding, "isThinking:", isThinking);
    console.log("🔍 DEBUG: Current button states - showAskButton:", showAskButton, "showUnmuteButton:", showUnmuteButton);
    
    // Stop any existing audio playback
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
      console.log("🔍 DEBUG: Stopped existing OpenAI audio");
    }
    
    if ((window as any).currentAutoplayAudio) {
      (window as any).currentAutoplayAudio.pause();
      (window as any).currentAutoplayAudio.currentTime = 0;
      (window as any).currentAutoplayAudio = null;
      console.log("🔍 DEBUG: Stopped existing autoplay audio");
    }
    
    // Clean up any existing streams to ensure fresh microphone access
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log("🔍 DEBUG: Stopping track:", track.kind, track.readyState);
        track.stop();
      });
      streamRef.current = null;
      console.log("🔍 DEBUG: Cleaned up existing stream");
    }
    
    // Reset global stream to force fresh access
    (window as any).currentMicrophoneStream = null;
    console.log("🔍 DEBUG: Reset global microphone stream");
    
    // Reset UI state and start listening without closing bottom sheet
    setShowUnmuteButton(false);
    setShowAskButton(false);
    setIsResponding(false);
    setIsThinking(false);
    console.log("🔍 DEBUG: Reset UI states");
    
    // Keep bottom sheet open explicitly
    setShowBottomSheet(true);
    console.log("🔍 DEBUG: Set showBottomSheet to true");
    
    // Start listening directly - this will keep the bottom sheet open
    console.log("🔍 DEBUG: About to call startListening()");
    try {
      await startListening();
      console.log("🔍 DEBUG: startListening() completed successfully");
    } catch (error) {
      console.error("🔍 DEBUG: Error in startListening():", error);
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
