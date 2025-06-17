import { useRef, useCallback } from 'react';

interface VoiceDetectionConfig {
  silenceThreshold: number;
  voiceThreshold: number;
  silenceDuration: number;
  consecutiveSilenceLimit: number;
}

interface VoiceDetectionCallbacks {
  onVoiceDetected: () => void;
  onSilenceDetected: () => void;
  onRecordingComplete: () => void;
  onVolumeChange: (volume: number) => void;
}

const useVoiceDetection = (config: VoiceDetectionConfig = {
  silenceThreshold: 5,
  voiceThreshold: 5,
  silenceDuration: 1500,
  consecutiveSilenceLimit: 3
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const voiceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const lastVoiceDetectedRef = useRef<number>(0);
  const consecutiveSilenceCountRef = useRef<number>(0);

  const setupVoiceDetection = useCallback((
    stream: MediaStream,
    callbacks: VoiceDetectionCallbacks
  ) => {
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
        
        // Notify volume change for visual feedback
        callbacks.onVolumeChange(average);
        
        // Dispatch voice volume for CircleAnimation
        window.dispatchEvent(new CustomEvent('voiceVolume', { 
          detail: { volume: average, threshold: config.voiceThreshold } 
        }));
        
        const isVoiceDetected = average > config.voiceThreshold;
        
        if (isVoiceDetected) {
          lastVoiceDetectedRef.current = Date.now();
          consecutiveSilenceCountRef.current = 0;
          silenceStartTimeRef.current = null;
          callbacks.onVoiceDetected();
        } else {
          if (silenceStartTimeRef.current === null) {
            silenceStartTimeRef.current = Date.now();
          }
          
          const silenceDuration = Date.now() - silenceStartTimeRef.current;
          
          if (silenceDuration > config.silenceDuration) {
            consecutiveSilenceCountRef.current++;
            
            if (consecutiveSilenceCountRef.current >= config.consecutiveSilenceLimit) {
              callbacks.onRecordingComplete();
              return;
            }
          }
          
          callbacks.onSilenceDetected();
        }
      }, 100);
      
    } catch (error) {
      console.error("Voice detection setup failed:", error);
    }
  }, [config]);

  const stopVoiceDetection = useCallback(() => {
    if (voiceDetectionIntervalRef.current) {
      clearInterval(voiceDetectionIntervalRef.current);
      voiceDetectionIntervalRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    // Reset state
    analyserRef.current = null;
    silenceStartTimeRef.current = null;
    lastVoiceDetectedRef.current = 0;
    consecutiveSilenceCountRef.current = 0;
  }, []);

  return {
    setupVoiceDetection,
    stopVoiceDetection,
    isActive: !!voiceDetectionIntervalRef.current
  };
};

export default useVoiceDetection;