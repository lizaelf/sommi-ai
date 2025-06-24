import React, { useRef, useCallback } from "react";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser,
} from "@/utils/microphonePermissions";

interface VoiceRecorderProps {
  onRecordingStateChange: (state: { 
    isListening: boolean; 
    isVoiceActive: boolean;
  }) => void;
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingError: (error: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingStateChange,
  onRecordingComplete,
  onRecordingError
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const lastVoiceDetectedRef = useRef<number>(0);
  const consecutiveSilenceCountRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);

  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Сначала объявляем cleanup
  const cleanup = useCallback(() => {
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (voiceDetectionIntervalRef.current) {
      clearInterval(voiceDetectionIntervalRef.current);
      voiceDetectionIntervalRef.current = null;
    }
    
    // Close audio context safely
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    audioContextRef.current = null;
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset refs
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    silenceStartTimeRef.current = null;
    lastVoiceDetectedRef.current = 0;
    consecutiveSilenceCountRef.current = 0;
    recordingStartTimeRef.current = 0;
  }, []);

  const setupVoiceDetection = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      voiceDetectionIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        const isVoiceDetected = average > 5;
        
        // Dispatch voice volume for CircleAnimation
        window.dispatchEvent(new CustomEvent('voiceVolume', { 
          detail: { volume: average, threshold: 3 } 
        }));
        
        if (isVoiceDetected) {
          lastVoiceDetectedRef.current = Date.now();
          consecutiveSilenceCountRef.current = 0;
          silenceStartTimeRef.current = null;
          
          onRecordingStateChange({ 
            isListening: true, 
            isVoiceActive: true 
          });
        } else {
          if (silenceStartTimeRef.current === null) {
            silenceStartTimeRef.current = Date.now();
          }
          
          const silenceDuration = Date.now() - silenceStartTimeRef.current;
          
          if (silenceDuration > 1500) {
            consecutiveSilenceCountRef.current++;
            
            if (consecutiveSilenceCountRef.current >= 3) {
              stopRecording();
            }
          }
          
          onRecordingStateChange({ 
            isListening: true, 
            isVoiceActive: false 
          });
        }
      }, 100);
      
    } catch (error) {
      console.error("Voice detection setup failed:", error);
    }
  }, [onRecordingStateChange]);

  const startRecording = useCallback(async () => {
    try {
      // Check microphone permission
      const hasPermission = await getMicrophonePermission();
      if (!hasPermission && !shouldSkipPermissionPrompt()) {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          onRecordingError("Microphone permission denied");
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
        onRecordingComplete(audioBlob);
        cleanup();
      };
      
      // Start recording
      mediaRecorder.start(100);
      setupVoiceDetection(stream);
      
      onRecordingStateChange({ 
        isListening: true, 
        isVoiceActive: false 
      });
      
    } catch (error) {
      console.error("Recording start failed:", error);
      onRecordingError("Failed to start recording");
      cleanup();
    }
  }, [onRecordingStateChange, onRecordingComplete, onRecordingError, setupVoiceDetection, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // If recorder is not active, cleanup directly
      cleanup();
    }
    
    onRecordingStateChange({ 
      isListening: false, 
      isVoiceActive: false 
    });
  }, [onRecordingStateChange, cleanup]);

  // Expose methods globally
  React.useEffect(() => {
    (window as any).voiceRecorder = {
      startRecording,
      stopRecording,
      cleanup
    };
    
    return cleanup;
  }, [startRecording, stopRecording, cleanup]);

  return null; // Logic-only component
};

export default VoiceRecorder;