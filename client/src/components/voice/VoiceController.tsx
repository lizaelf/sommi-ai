import React, { useState, useRef, useEffect } from 'react';
import VoiceAssistantBottomSheet from '../bottom-sheet/VoiceAssistantBottomSheet';

const SILENCE_THRESHOLD = 30;
const SILENCE_DURATION = 2000;

interface VoiceControllerProps {
  onSendMessage?: (message: string, options?: any) => void;
  onAddMessage?: (message: any) => void;
  conversationId?: number;
  isProcessing?: boolean;
  wineKey?: string;
}

const VoiceController: React.FC<VoiceControllerProps> = ({
  onSendMessage,
  onAddMessage,
  conversationId,
  isProcessing,
  wineKey = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const isManuallyClosedRef = useRef(false);
  const welcomeAudioCacheRef = useRef<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentTTSRequestRef = useRef<AbortController | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleWelcomeMessage = async () => {
    try {
      // Use cached welcome message if available
      if (welcomeAudioCacheRef.current) {
        const audio = new Audio(welcomeAudioCacheRef.current);
        audio.volume = 1.0;
        currentAudioRef.current = audio;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          
          audio.onended = () => {
            setIsPlayingAudio(false);
            setIsResponding(false);
            currentAudioRef.current = null;
          };
        }
      } else {
        // Generate welcome message if not cached
        const welcomeMessage = "Hello, I see you're looking at the 2021 Ridge Vineyards Lytton Springs, an excellent choice. Are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.";
        
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          welcomeAudioCacheRef.current = audioUrl;
          
          const audio = new Audio(audioUrl);
          audio.volume = 1.0;
          currentAudioRef.current = audio;
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            
            audio.onended = () => {
              setIsPlayingAudio(false);
              setIsResponding(false);
              currentAudioRef.current = null;
              URL.revokeObjectURL(audioUrl);
            };
          }
        }
      }
    } catch (error) {
      console.error("Failed to play welcome message:", error);
      setIsPlayingAudio(false);
      setIsResponding(false);
    }
  };

  const stopAudio = () => {
    console.log("🛑 VoiceController: Stopping all audio playback");
    
    // Clean up local audio reference
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
        console.log("🛑 VoiceController: Local audio stopped");
      } catch (error) {
        console.warn("Error stopping local audio reference:", error);
      }
    }
    
    // Stop any global audio references
    if ((window as any).currentOpenAIAudio) {
      try {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio.currentTime = 0;
        (window as any).currentOpenAIAudio = null;
        console.log("🛑 VoiceController: Global audio stopped");
      } catch (error) {
        console.warn("Error stopping global audio:", error);
      }
    }
    
    // Stop all audio elements in the document
    try {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      console.log("🛑 VoiceController: All DOM audio elements stopped");
    } catch (error) {
      console.warn("Error stopping DOM audio elements:", error);
    }
    
    // Clean up microphone streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Reset all audio-related states
    setIsPlayingAudio(false);
    setIsResponding(false);
    setIsListening(false);
    setIsThinking(false);
    setShowUnmuteButton(false);
    setShowAskButton(true);
    
    // Dispatch stop event for other components
    window.dispatchEvent(new CustomEvent("tts-audio-stop"));
    window.dispatchEvent(new CustomEvent("deploymentAudioStopped"));
    
    console.log("🛑 VoiceController: All audio stopped successfully");
  };

  // Share state globally for CircleAnimation and audio control
  useEffect(() => {
    (window as any).voiceAssistantState = {
      isListening,
      isProcessing: isThinking,
      isResponding,
      showBottomSheet,
      isPlayingAudio
    };
    
    // Expose global audio stop function for deployment compatibility
    (window as any).stopVoiceAudio = stopAudio;
  }, [isListening, isThinking, isResponding, showBottomSheet, isPlayingAudio]);

  // Initialize welcome message cache
  useEffect(() => {
    const initializeWelcomeCache = async () => {
      const globalCache = (window as any).globalWelcomeAudioCache;
      if (globalCache) {
        welcomeAudioCacheRef.current = globalCache;
        return;
      }

      const welcomeMessage = "Hello, I see you're looking at the 2021 Ridge Vineyards Lytton Springs, an excellent choice. Are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.";
      
      try {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          welcomeAudioCacheRef.current = audioUrl;
          (window as any).globalWelcomeAudioCache = audioUrl;
        }
      } catch (error) {
        console.warn("Failed to pre-cache welcome message:", error);
      }
    };

    initializeWelcomeCache();
  }, []);

  // Handle voice assistant events
  useEffect(() => {
    let isVoiceButtonTriggered = false;
    let isMicButtonTriggered = false;
    
    // VOICE BUTTON: Complete flow with welcome message
    const handleTriggerVoiceAssistant = async () => {
      if (isMicButtonTriggered) return; // Prevent conflict with mic button
      isVoiceButtonTriggered = true;
      
      setShowBottomSheet(true);
      setShowAskButton(false);
      setIsListening(false);
      setIsResponding(true);
      setIsThinking(false);
      setIsPlayingAudio(true);
      setShowUnmuteButton(false);
      
      await handleWelcomeMessage();
      
      // Reset flag after welcome message completes
      setTimeout(() => {
        isVoiceButtonTriggered = false;
      }, 3000);
    };

    // MIC BUTTON: Show bottom sheet and go directly to listening state
    const handleTriggerMicButton = async () => {
      if (isVoiceButtonTriggered) return; // Prevent conflict with voice button
      isMicButtonTriggered = true;
      
      console.log("🎤 VoiceController: handleTriggerMicButton called");
      setShowBottomSheet(true);
      setShowAskButton(false);
      setIsListening(true);
      setIsResponding(false);
      setIsThinking(false);
      setIsPlayingAudio(false);
      setShowUnmuteButton(false);
      console.log("🎤 VoiceController: States set - isListening should be true");
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Dispatch listening event
        console.log("🎤 VoiceController: Dispatching mic-status listening event");
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'listening' }
        }));
        
        let silenceStart = Date.now();
        
        const checkAudioLevel = () => {
          if (!isListening) return;
          
          analyser.getByteFrequencyData(dataArray);
          let volume = 0;
          for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > volume) {
              volume = dataArray[i];
            }
          }
          
          // Dispatch volume events for circle animation
          window.dispatchEvent(new CustomEvent('voice-volume', {
            detail: { volume, maxVolume: 100, isActive: volume > SILENCE_THRESHOLD }
          }));
          
          // Debug volume levels
          if (volume > SILENCE_THRESHOLD) {
            console.log("🎤 VoiceController: Voice detected, volume:", volume);
          }
          
          if (volume > SILENCE_THRESHOLD) {
            silenceStart = Date.now();
          } else if (Date.now() - silenceStart > SILENCE_DURATION) {
            console.log("🎤 User stopped speaking - starting thinking phase");
            
            // Clean up microphone
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
            streamRef.current = null;
            audioContextRef.current = null;
            
            // Start thinking phase
            setIsListening(false);
            setIsThinking(true);
            
            window.dispatchEvent(new CustomEvent('mic-status', {
              detail: { status: 'processing' }
            }));
            
            // After thinking, start response
            setTimeout(() => {
              setIsThinking(false);
              setIsResponding(true);
              setIsPlayingAudio(true);
              
              window.dispatchEvent(new CustomEvent('mic-status', {
                detail: { status: 'stopped' }
              }));
              
              handleVoiceResponse("Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses.");
            }, 2000);
            
            return;
          }
          
          requestAnimationFrame(checkAudioLevel);
        };
        
        checkAudioLevel();
        
      } catch (error) {
        console.error("🎤 VoiceController: Failed to access microphone:", error);
        console.log("🎤 VoiceController: Using fallback timer-based flow");
        
        // Dispatch listening event for fallback
        console.log("🎤 VoiceController: Dispatching fallback mic-status listening event");
        window.dispatchEvent(new CustomEvent('mic-status', {
          detail: { status: 'listening' }
        }));
        
        // Simulate voice volume events during fallback listening
        const fallbackVolumeInterval = setInterval(() => {
          const volume = Math.random() * 40 + 20;
          window.dispatchEvent(new CustomEvent('voice-volume', {
            detail: { volume, maxVolume: 100, isActive: true }
          }));
        }, 150);
        
        // Fallback to timer-based flow
        setTimeout(() => {
          clearInterval(fallbackVolumeInterval);
          setIsListening(false);
          setIsThinking(true);
          
          console.log("🎤 VoiceController: Dispatching mic-status processing event");
          window.dispatchEvent(new CustomEvent('mic-status', {
            detail: { status: 'processing' }
          }));
          
          setTimeout(() => {
            setIsThinking(false);
            setIsResponding(true);
            setIsPlayingAudio(true);
            
            console.log("🎤 VoiceController: Dispatching mic-status stopped event");
            window.dispatchEvent(new CustomEvent('mic-status', {
              detail: { status: 'stopped' }
            }));
            
            handleVoiceResponse("Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses.");
            
            // Reset mic button flag after response
            setTimeout(() => {
              isMicButtonTriggered = false;
            }, 1000);
          }, 2000);
        }, 3000);
      }
      
      // Reset mic button flag on error
      setTimeout(() => {
        isMicButtonTriggered = false;
      }, 8000);
    };

    const handleStopAudio = () => {
      console.log("🛑 VoiceController: Stop button clicked - aborting all audio");
      
      // Abort ongoing TTS request
      if (currentTTSRequestRef.current) {
        console.log("🛑 VoiceController: Aborting TTS request");
        currentTTSRequestRef.current.abort();
        currentTTSRequestRef.current = null;
      }
      
      // Stop audio playback
      if (currentAudioRef.current) {
        console.log("🛑 VoiceController: Stopping audio playback");
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      
      // Reset all states
      setIsPlayingAudio(false);
      setIsResponding(false);
      setShowUnmuteButton(false);
      setShowAskButton(true);
      
      // Call original stop function
      stopAudio();
      
      console.log("🛑 VoiceController: Stop button processing complete");
    };

    const handleDeploymentAudioStopped = () => {
      setIsPlayingAudio(false);
      setIsResponding(false);
      setShowUnmuteButton(false);
      setShowAskButton(true);
      currentAudioRef.current = null;
    };

    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
    window.addEventListener('triggerMicButton', handleTriggerMicButton);
    window.addEventListener('stopVoiceAudio', handleStopAudio);
    window.addEventListener('deploymentAudioStopped', handleDeploymentAudioStopped);

    return () => {
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
      window.removeEventListener('triggerMicButton', handleTriggerMicButton);
      window.removeEventListener('stopVoiceAudio', handleStopAudio);
      window.removeEventListener('deploymentAudioStopped', handleDeploymentAudioStopped);
    };
  }, [isListening]);

  const handleVoiceResponse = async (responseText: string) => {
    try {
      // Create AbortController for this TTS request
      const abortController = new AbortController();
      currentTTSRequestRef.current = abortController;
      
      console.log("🎤 VoiceController: Starting TTS request with abort controller");
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: responseText }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      console.log("🎤 VoiceController: Starting audio playback");
      await audio.play();

      audio.onended = () => {
        console.log("🎤 VoiceController: Audio playback ended naturally");
        setIsPlayingAudio(false);
        setIsResponding(false);
        setShowUnmuteButton(false);
        setShowAskButton(true);
        currentAudioRef.current = null;
        currentTTSRequestRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log("🛑 VoiceController: TTS request was aborted by stop button");
      } else {
        console.error('Error in voice response:', error);
      }
      setIsPlayingAudio(false);
      setIsResponding(false);
      setShowUnmuteButton(false);
      setShowAskButton(true);
      currentTTSRequestRef.current = null;
    }
  };

  const handleClose = () => {
    setShowBottomSheet(false);
    setIsListening(false);
    setIsResponding(false);
    setIsThinking(false);
    setIsPlayingAudio(false);
    setShowUnmuteButton(false);
    setShowAskButton(false);
    isManuallyClosedRef.current = true;
    stopRecording();
    setTimeout(() => {
      isManuallyClosedRef.current = false;
    }, 1000);
  };

  const handleAskRecording = () => {
    startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // --- Додаємо аналізатор для тиші ---
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.fftSize);

      // --- Функція перевірки тиші ---
      const checkSilence = () => {
        analyser.getByteTimeDomainData(dataArray);
        // Розрахунок середньої амплітуди
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += Math.abs(dataArray[i] - 128);
        }
        const avg = sum / dataArray.length;

        if (avg < SILENCE_THRESHOLD) {
          if (!silenceStartRef.current) silenceStartRef.current = Date.now();
          if (Date.now() - (silenceStartRef.current || 0) > SILENCE_DURATION) {
            // Тиша достатньо довго — зупиняємо запис
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
            return;
          }
        } else {
          silenceStartRef.current = null;
        }
        // Продовжуємо перевірку
        silenceTimeoutRef.current = setTimeout(checkSilence, 100);
      };

      // --- Запускаємо перевірку тиші ---
      checkSilence();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Очищаємо таймери та контексти
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        silenceStartRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        setIsThinking(true);
        setIsListening(false);

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          if (result.text && onSendMessage) {
            onSendMessage(result.text.trim());
          }
        } catch (err) {
          console.error("Transcribe error:", err);
        } finally {
          setIsThinking(false);
          setIsResponding(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setIsResponding(false);
      setIsThinking(false);
      setIsPlayingAudio(false);
      setShowUnmuteButton(false);
      setShowAskButton(false);

      // --- (Опціонально) Автостоп через 10 секунд як запасний варіант ---
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) audioContextRef.current.close();
      }, 10000);

    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsListening(false);
      setIsThinking(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <VoiceAssistantBottomSheet
      isOpen={showBottomSheet}
      onClose={handleClose}
      onMute={stopRecording}
      onAsk={handleAskRecording}
      isListening={isListening}
      isResponding={isResponding}
      isThinking={isThinking}
      isPlayingAudio={isPlayingAudio}
      showUnmuteButton={showUnmuteButton}
      showAskButton={showAskButton}
      showSuggestions={true}
      onStopAudio={stopRecording}
      onUnmute={stopRecording}
      wineKey={wineKey}
      onSuggestionClick={(suggestion: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => {
        if (onSendMessage) {
          onSendMessage(suggestion);
        }
      }}
    />
  );
};

export default VoiceController;