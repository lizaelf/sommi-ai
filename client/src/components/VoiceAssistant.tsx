import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "./VoiceBottomSheet";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser,
} from "@/utils/microphonePermissions";
import { WINE_CONFIG } from "../../../shared/wineConfig";

// ✅ Centralized dynamic welcome message generator
const getDynamicWelcomeMessage = () => {
  const wineName = `${WINE_CONFIG.vintage} ${WINE_CONFIG.winery} "${WINE_CONFIG.vineyard}"`;
  return `Ah, the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard}—a stellar pick. This ${WINE_CONFIG.varietal} is brimming with red and black raspberries, laced with sage and a touch of dark chocolate on the nose. On the palate? Think ripe blackberry and plum wrapped in full-bodied richness, finishing with a lively acidity that lingers. Planning to pop the cork soon? I'd be delighted to offer serving tips or pairing ideas to make the most of it.`;
};

interface VoiceAssistantProps {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Share state globally for CircleAnimation
  useEffect(() => {
    (window as any).voiceAssistantState = {
      isListening,
      isProcessing: isThinking,
      isResponding,
      showBottomSheet,
      isPlayingAudio
    };
  }, [isListening, isThinking, isResponding, showBottomSheet, isPlayingAudio]);

  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const isManuallyClosedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const lastVoiceDetectedRef = useRef<number>(0);
  const consecutiveSilenceCountRef = useRef<number>(0);
  const welcomeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Initialize welcome message cache
  useEffect(() => {
    const initializeWelcomeCache = async () => {
      // Check if we already have a global cache
      const globalCache = (window as any).globalWelcomeAudioCache;
      if (globalCache) {
        // Use existing cached audio
        welcomeAudioElementRef.current = new Audio(globalCache);
        return;
      }

      // Generate welcome message and cache it
      const welcomeMessage = getDynamicWelcomeMessage();
      console.log("QR SCAN: Initializing welcome cache with message:", welcomeMessage);
      
      try {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage })
        });
        
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Cache both globally and locally
          welcomeAudioElementRef.current = new Audio(audioUrl);
          (window as any).globalWelcomeAudioCache = audioUrl;
          console.log("QR SCAN: Welcome message cached successfully");
        }
      } catch (error) {
        console.error("QR SCAN: Failed to cache welcome message:", error);
      }
    };

    initializeWelcomeCache();
  }, []);

  // Handle trigger event from QR scan or other sources
  useEffect(() => {
    const handleTriggerVoiceAssistant = () => {
      console.log("QR SCAN: Voice assistant triggered");
      
      // Check if bottom sheet was already shown in this session
      const alreadyShown = sessionStorage.getItem('voice_bottom_sheet_shown') === 'true';
      if (alreadyShown) {
        console.log("QR SCAN: Bottom sheet already shown this session, skipping");
        return;
      }

      // Show bottom sheet immediately for instant response
      setShowBottomSheet(true);
      sessionStorage.setItem('voice_bottom_sheet_shown', 'true');
      setShowAskButton(false);
      setIsResponding(true);

      // Play preloaded welcome message instantly
      if (welcomeAudioElementRef.current) {
        console.log("QR SCAN: Playing preloaded welcome message instantly");
        const audio = welcomeAudioElementRef.current;

        // Reset audio to beginning for replay
        audio.currentTime = 0;

        // Store reference for potential stopping
        currentAudioRef.current = audio;
        setIsPlayingAudio(true);

        audio.onended = () => {
          setIsPlayingAudio(false);
          currentAudioRef.current = null;
          if (!isManuallyClosedRef.current) {
            setIsResponding(false);
            setShowAskButton(true);
          }
        };

        // Play audio immediately
        try {
          audio.play().then(() => {
            console.log("QR SCAN: Welcome audio playing successfully");
          }).catch((error) => {
            console.error("QR SCAN: Audio playback failed, generating fresh audio:", error);
            
            // Generate fresh audio immediately if cached fails
            const welcomeMessage = getDynamicWelcomeMessage();

            fetch('/api/text-to-speech', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: welcomeMessage })
            })
            .then(response => response.arrayBuffer())
            .then(buffer => {
              const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
              const freshAudio = new Audio(audioUrl);
              currentAudioRef.current = freshAudio;

              freshAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                if (!isManuallyClosedRef.current) {
                  setIsResponding(false);
                  setShowAskButton(true);
                }
              };

              freshAudio.play().then(() => {
                console.log("QR SCAN: Fresh audio playing successfully");
              }).catch(() => {
                // If all audio fails, just show suggestions
                setIsResponding(false);
                setShowAskButton(true);
              });
            }).catch(() => {
              // If fetch fails, show suggestions
              setIsResponding(false);
              setShowAskButton(true);
            });
          });
        } catch (error) {
          console.error("QR SCAN: Preloaded audio playback error");
          setIsResponding(false);
          setShowAskButton(true);
        }
      } else {
        // Fallback to generating audio if cache is not ready
        console.log("QR SCAN: Cache not ready, generating welcome message");
        const welcomeMessage = getDynamicWelcomeMessage();

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
          currentAudioRef.current = audio;
          setIsPlayingAudio(true);

          // Store reference for potential stopping
          (window as any).currentOpenAIAudio = audio;

          audio.onended = () => {
            setIsPlayingAudio(false);
            currentAudioRef.current = null;
            if (!isManuallyClosedRef.current) {
              setIsResponding(false);
              setShowAskButton(true);
            }
          };

          audio.play().then(() => {
            console.log("QR SCAN: Generated welcome audio playing successfully");
          }).catch(() => {
            setIsResponding(false);
            setShowAskButton(true);
          });
        })
        .catch(() => {
          console.log("QR SCAN: Failed to generate welcome message, showing suggestions");
          setIsResponding(false);
          setShowAskButton(true);
        });
      }
    };

    // Listen for trigger events
    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);

    return () => {
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
    };
  }, []);

  const handleClose = () => {
    console.log('🔄 VoiceAssistant: Closing voice assistant');
    isManuallyClosedRef.current = true;
    setShowBottomSheet(false);
    setIsListening(false);
    setIsResponding(false);
    setIsThinking(false);
    setIsPlayingAudio(false);
    setShowUnmuteButton(false);
    setShowAskButton(false);

    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Stop any OpenAI audio
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio = null;
    }

    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear global stream reference
    if ((window as any).currentMicrophoneStream) {
      (window as any).currentMicrophoneStream.getTracks().forEach((track: any) => track.stop());
      (window as any).currentMicrophoneStream = null;
    }

    // Emit stop event for CircleAnimation
    window.dispatchEvent(
      new CustomEvent("mic-status", {
        detail: { status: "idle" },
      })
    );
  };

  const handleAsk = async () => {
    console.log('🎤 VoiceAssistant: Ask button clicked');
    
    try {
      // Get microphone permission
      const hasPermission = await getMicrophonePermission();
      console.log('🎤 VoiceAssistant: Current microphone permission:', hasPermission);

      if (!hasPermission && !shouldSkipPermissionPrompt()) {
        console.log('🎤 VoiceAssistant: Requesting microphone permission');
        const granted = await requestMicrophonePermission();
        if (!granted) {
          console.log('🎤 VoiceAssistant: Microphone permission denied');
          toast({
            title: "Microphone permission denied",
            description: "Please enable microphone access to use voice features",
            variant: "destructive",
          });
          return;
        }
      }

      console.log('🎤 VoiceAssistant: Starting voice recording');
      setIsListening(true);
      setShowAskButton(false);
      
      // Start listening logic
      startListening();

    } catch (error) {
      console.error('🎤 VoiceAssistant: Error in handleAsk:', error);
      toast({
        title: "Recording failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const startListening = async () => {
    try {
      console.log('🎤 VoiceAssistant: Getting user media');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎤 VoiceAssistant: Recording stopped, processing audio');
        setIsListening(false);
        setIsThinking(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        
        // Process audio recording
        await processRecording(audioBlob);
        
        setIsThinking(false);
        setShowAskButton(true);
      };

      recordingStartTimeRef.current = Date.now();
      lastVoiceDetectedRef.current = 0;
      consecutiveSilenceCountRef.current = 0;

      stream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = true;
      });

      mediaRecorder.start(250);

      // Store stream globally for CircleAnimation access
      (window as any).currentMicrophoneStream = stream;

      // Emit microphone status event
      window.dispatchEvent(
        new CustomEvent("mic-status", {
          detail: { status: "listening" },
        })
      );

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 30000);

    } catch (error) {
      console.error('🎤 VoiceAssistant: Error starting recording:', error);
      setIsListening(false);
      setShowAskButton(true);
      
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const transcript = result.transcript || result.text;
        
        if (transcript && transcript.trim()) {
          console.log('🎤 VoiceAssistant: Transcript received:', transcript);
          onSendMessage(transcript);
        } else {
          console.log('🎤 VoiceAssistant: No speech detected');
          toast({
            title: "No speech detected",
            description: "Please try speaking again",
            variant: "default",
          });
        }
      } else {
        throw new Error('Speech recognition failed');
      }
    } catch (error) {
      console.error('🎤 VoiceAssistant: Error processing recording:', error);
      toast({
        title: "Processing failed",
        description: "Could not process your voice",
        variant: "destructive",
      });
    }
  };

  const handleUnmute = async () => {
    console.log("🔊 VoiceAssistant: Unmute button clicked");
    setShowUnmuteButton(false);
    setIsResponding(true);

    if (welcomeAudioElementRef.current) {
      const audio = welcomeAudioElementRef.current;
      audio.currentTime = 0;
      currentAudioRef.current = audio;
      setIsPlayingAudio(true);

      audio.onended = () => {
        setIsPlayingAudio(false);
        currentAudioRef.current = null;
        if (!isManuallyClosedRef.current) {
          setIsResponding(false);
          setShowAskButton(true);
        }
      };

      try {
        await audio.play();
        console.log("🔊 VoiceAssistant: Unmute audio playing");
      } catch (error) {
        console.error("🔊 VoiceAssistant: Unmute audio failed:", error);
        setIsPlayingAudio(false);
        setIsResponding(false);
        setShowAskButton(true);
      }
    } else {
      console.log("🔊 VoiceAssistant: No cached audio, generating welcome message");
      const welcomeMessage = getDynamicWelcomeMessage();

      try {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage })
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          setIsPlayingAudio(true);

          audio.onended = () => {
            setIsPlayingAudio(false);
            currentAudioRef.current = null;
            URL.revokeObjectURL(audioUrl);
            if (!isManuallyClosedRef.current) {
              setIsResponding(false);
              setShowAskButton(true);
            }
          };

          await audio.play();
          console.log("🔊 VoiceAssistant: Generated unmute audio playing");
        } else {
          throw new Error('TTS failed');
        }
      } catch (error) {
        console.error("🔊 VoiceAssistant: Failed to generate unmute audio:", error);
        setIsPlayingAudio(false);
        setIsResponding(false);
        setShowAskButton(true);
      }
    }
  };

  const stopAudio = () => {
    console.log("🛑 VoiceAssistant: Stop audio clicked");
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio = null;
    }

    setIsPlayingAudio(false);
    setShowUnmuteButton(false);
    setIsResponding(false);
    setShowAskButton(true);
  };

  return (
    <VoiceBottomSheet
      isOpen={showBottomSheet}
      onClose={handleClose}
      onMute={stopAudio}
      onAsk={handleAsk}
      isListening={isListening}
      isResponding={isResponding}
      isThinking={isThinking}
      showAskButton={showAskButton}
      showUnmuteButton={showUnmuteButton}
      isPlayingAudio={isPlayingAudio}
      wineKey={wineKey}
      onSuggestionClick={onSendMessage}
      onUnmute={handleUnmute}
      onStopAudio={stopAudio}
    />
  );
};

export default VoiceAssistant;