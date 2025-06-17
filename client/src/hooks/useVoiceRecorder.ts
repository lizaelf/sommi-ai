import { useRef, useCallback, useState } from 'react';
import { getMicrophonePermission, requestMicrophonePermission, shouldSkipPermissionPrompt } from '@/lib/permissions';

interface RecordingState {
  isRecording: boolean;
  isVoiceActive: boolean;
  recordingDuration: number;
}

interface RecordingCallbacks {
  onRecordingStart?: () => void;
  onRecordingStop?: (audioBlob: Blob) => void;
  onRecordingError?: (error: string) => void;
  onVoiceActivity?: (isActive: boolean) => void;
}

const useVoiceRecorder = (callbacks: RecordingCallbacks = {}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isVoiceActive: false,
    recordingDuration: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Check microphone permission
      const hasPermission = await getMicrophonePermission();
      if (!hasPermission && !shouldSkipPermissionPrompt()) {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          callbacks.onRecordingError?.("Microphone permission denied");
          return;
        }
      }

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      streamRef.current = stream;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        callbacks.onRecordingStop?.(audioBlob);
        cleanup();
      };
      
      // Start recording
      mediaRecorder.start(100);
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        recordingDuration: 0
      }));

      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        const duration = Date.now() - recordingStartTimeRef.current;
        setRecordingState(prev => ({
          ...prev,
          recordingDuration: duration
        }));
      }, 100);
      
      callbacks.onRecordingStart?.();
      
    } catch (error) {
      console.error("Recording start failed:", error);
      callbacks.onRecordingError?.("Failed to start recording");
      cleanup();
    }
  }, [callbacks]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
      isVoiceActive: false
    }));
    
    cleanup();
  }, []);

  const cleanup = useCallback(() => {
    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset refs
    mediaRecorderRef.current = null;
    recordingStartTimeRef.current = 0;
    audioChunksRef.current = [];
  }, []);

  const updateVoiceActivity = useCallback((isActive: boolean) => {
    setRecordingState(prev => ({
      ...prev,
      isVoiceActive: isActive
    }));
    callbacks.onVoiceActivity?.(isActive);
  }, [callbacks]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    updateVoiceActivity,
    cleanup,
    stream: streamRef.current
  };
};

export default useVoiceRecorder;