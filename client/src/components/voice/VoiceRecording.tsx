import { useState, useRef, useCallback } from "react";
import { useVoicePermissions } from "./VoicePermissions";

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;
  recordingDuration: number;
}

export interface VoiceRecordingHook {
  state: VoiceRecordingState;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  isSupported: boolean;
}

export const useVoiceRecording = (): VoiceRecordingHook => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    audioLevel: 0,
    recordingDuration: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { checkPermission, requestPermission } = useVoicePermissions();

  const checkSupported = useCallback(() => {
    return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  }, []);

  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const updateAudioLevel = () => {
        if (!analyserRef.current || !state.isRecording) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        
        setState(prev => ({ ...prev, audioLevel: normalizedLevel }));
        
        if (state.isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Audio analysis setup failed:', error);
    }
  }, [state.isRecording]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!checkSupported()) {
      console.error('Voice recording not supported');
      return false;
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      // Check permissions
      let permission = await checkPermission();
      if (permission !== 'granted') {
        permission = await requestPermission();
        if (permission !== 'granted') {
          setState(prev => ({ ...prev, isProcessing: false }));
          return false;
        }
      }

      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      setupAudioAnalysis(stream);

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Start duration tracking
      let duration = 0;
      durationIntervalRef.current = setInterval(() => {
        duration += 100;
        setState(prev => ({ ...prev, recordingDuration: duration }));
      }, 100);

      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isProcessing: false,
        recordingDuration: 0 
      }));

      // Dispatch mic status event for CircleAnimation
      window.dispatchEvent(new CustomEvent('mic-status', { detail: 'listening' }));

      return true;
    } catch (error) {
      console.error('Recording start failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      return false;
    }
  }, [checkPermission, requestPermission, setupAudioAnalysis]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !state.isRecording) {
      return null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          audioLevel: 0,
          recordingDuration: 0 
        }));

        // Dispatch mic status event
        window.dispatchEvent(new CustomEvent('mic-status', { detail: 'processing' }));

        resolve(audioBlob);
      };

      mediaRecorder.stop();
    });
  }, [state.isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      
      // Cleanup without returning blob
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        audioLevel: 0,
        recordingDuration: 0 
      }));

      // Dispatch mic status event
      window.dispatchEvent(new CustomEvent('mic-status', { detail: 'idle' }));
    }
  }, [state.isRecording]);

  return {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported: checkSupported()
  };
};