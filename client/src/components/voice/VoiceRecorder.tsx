import { useCallback } from "react";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser,
} from "@/utils/microphonePermissions";
import { VoiceRefs, VoiceState } from "./VoiceStateManager";

export const useVoiceRecorder = (
  refs: VoiceRefs,
  state: VoiceState,
  updateState: (updates: Partial<VoiceState>) => void,
  toast: any,
  onSendMessage?: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void
) => {
  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Voice activity detection
  const startVoiceDetection = useCallback(() => {
    if (!refs.streamRef.current || !refs.audioContextRef.current) return;

    refs.analyserRef.current = refs.audioContextRef.current.createAnalyser();
    refs.analyserRef.current.fftSize = 256;
    
    const source = refs.audioContextRef.current.createMediaStreamSource(refs.streamRef.current);
    source.connect(refs.analyserRef.current);

    const bufferLength = refs.analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const detectVoice = () => {
      if (!refs.analyserRef.current) return;

      refs.analyserRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      const currentTime = Date.now();
      const volume = Math.round(average);

      // Voice detection threshold
      if (volume > 5) {
        refs.lastVoiceDetectedRef.current = currentTime;
        refs.consecutiveSilenceCountRef.current = 0;
        refs.silenceStartTimeRef.current = null;
        updateState({ isVoiceActive: true });

        // Dispatch volume event for CircleAnimation
        window.dispatchEvent(new CustomEvent('voiceVolume', { 
          detail: { volume, timestamp: currentTime }
        }));
      } else {
        if (refs.silenceStartTimeRef.current === null) {
          refs.silenceStartTimeRef.current = currentTime;
        }

        const silenceDuration = currentTime - refs.silenceStartTimeRef.current;
        if (silenceDuration > 2000) { // 2 seconds of silence
          updateState({ isVoiceActive: false });
          refs.consecutiveSilenceCountRef.current++;
        }
      }

      if (state.isListening) {
        requestAnimationFrame(detectVoice);
      }
    };

    detectVoice();
  }, [refs, state.isListening, updateState]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log("🎤 VoiceAssistant: Starting recording");
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      refs.streamRef.current = stream;

      // Initialize audio context for voice detection
      if (!refs.audioContextRef.current) {
        refs.audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (refs.audioContextRef.current.state === 'suspended') {
        await refs.audioContextRef.current.resume();
      }

      // Start voice activity detection
      startVoiceDetection();

      // Setup media recorder
      refs.mediaRecorderRef.current = new MediaRecorder(stream);
      refs.audioChunksRef.current = [];
      refs.recordingStartTimeRef.current = Date.now();

      refs.mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          refs.audioChunksRef.current.push(event.data);
        }
      };

      refs.mediaRecorderRef.current.onstop = () => {
        console.log("🎤 VoiceAssistant: Recording stopped");
        const audioBlob = new Blob(refs.audioChunksRef.current, { type: 'audio/wav' });
        processRecording(audioBlob);
      };

      refs.mediaRecorderRef.current.start();
      updateState({ isListening: true });

      // Dispatch mic status event
      window.dispatchEvent(new CustomEvent('micStatus', { 
        detail: { status: 'listening', timestamp: Date.now() }
      }));

    } catch (error) {
      console.error("🎤 VoiceAssistant: Failed to start recording:", error);
      toast({
        title: "Microphone Access Failed",
        description: "Please allow microphone access to use voice features.",
        variant: "destructive",
      });
    }
  }, [refs, updateState, startVoiceDetection, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("🎤 VoiceAssistant: Stopping recording");

    if (refs.mediaRecorderRef.current && refs.mediaRecorderRef.current.state !== 'inactive') {
      refs.mediaRecorderRef.current.stop();
    }

    if (refs.streamRef.current) {
      refs.streamRef.current.getTracks().forEach(track => track.stop());
      refs.streamRef.current = null;
    }

    updateState({ isListening: false, isVoiceActive: false });

    // Dispatch mic status event
    window.dispatchEvent(new CustomEvent('micStatus', { 
      detail: { status: 'idle', timestamp: Date.now() }
    }));
  }, [refs, updateState]);

  // Process recorded audio
  const processRecording = useCallback(async (audioBlob: Blob) => {
    console.log("🎤 VoiceAssistant: Processing recording");
    updateState({ isThinking: true });

    try {
      // Create FormData for audio upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Send audio to backend for transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      const transcribedText = data.text;

      if (transcribedText && transcribedText.trim()) {
        console.log("🎤 VoiceAssistant: Transcribed text:", transcribedText);
        
        // Send the transcribed message
        if (onSendMessage) {
          onSendMessage(transcribedText);
        }
      } else {
        console.log("🎤 VoiceAssistant: No speech detected");
        toast({
          title: "No Speech Detected",
          description: "Please try speaking again.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("🎤 VoiceAssistant: Failed to process recording:", error);
      toast({
        title: "Voice Processing Failed",
        description: "Failed to process your voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      updateState({ isThinking: false });
    }
  }, [updateState, toast, onSendMessage]);

  // Auto-stop recording after silence
  const setupAutoStop = useCallback(() => {
    if (refs.silenceTimerRef.current) {
      clearTimeout(refs.silenceTimerRef.current);
    }

    refs.silenceTimerRef.current = setTimeout(() => {
      if (state.isListening && refs.consecutiveSilenceCountRef.current > 3) {
        console.log("🎤 VoiceAssistant: Auto-stopping due to prolonged silence");
        stopRecording();
      }
    }, 3000); // Auto-stop after 3 seconds of silence
  }, [refs, state.isListening, stopRecording]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (refs.streamRef.current) {
      refs.streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (refs.silenceTimerRef.current) {
      clearTimeout(refs.silenceTimerRef.current);
    }
    
    if (refs.voiceDetectionIntervalRef.current) {
      clearTimeout(refs.voiceDetectionIntervalRef.current);
    }
  }, [refs]);

  return {
    startRecording,
    stopRecording,
    setupAutoStop,
    cleanup,
    isMobileDevice,
  };
};