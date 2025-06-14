import React, { useRef, useState, useEffect, useCallback } from 'react';
import wineCircleImage from '@assets/wine-circle.png';

interface CircleAnimationProps {
  isAnimating?: boolean;
  size?: number;
}

export default function CircleAnimation({ isAnimating = false, size = 300 }: CircleAnimationProps) {
  const [currentSize, setSize] = useState(size);
  const [opacity, setOpacity] = useState(1.0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const animationRef = useRef<number>(0);
  
  // Store refs to current state for event handlers
  const stateRef = useRef({ isListening, isProcessing, isPlaying, size });
  useEffect(() => {
    stateRef.current = { isListening, isProcessing, isPlaying, size };
  }, [isListening, isProcessing, isPlaying, size]);

  // Voice volume handler that updates size immediately
  const handleVoiceVolumeChange = useCallback((event: CustomEvent) => {
    const { volume, maxVolume, isActive } = event.detail;
    const currentState = stateRef.current;
    
    setVoiceVolume(volume);
    
    // ONLY update size if currently listening
    if (currentState.isListening) {
      const baseSize = currentState.size;
      let scale = 1.0;
      
      // Voice scaling with 30% maximum increase - smoother response
      if (volume > 3) {
        const volumeScale = Math.min(volume / 80, 0.3); // 30% maximum scaling
        scale = 1.0 + volumeScale;
      }
      
      const newSize = baseSize * scale;
      setSize(newSize);
    }
  }, []);

  // Keep circle static for all non-listening states
  useEffect(() => {
    // Only allow voice-responsive scaling during listening
    if (!isListening) {
      setSize(size); // Always keep base size
      setOpacity(1.0); // Full opacity always
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating, isProcessing, isPlaying, size, isListening]);

  // Communication with VoiceAssistant
  useEffect(() => {
    const checkVoiceAssistantState = () => {
      const voiceAssistant = (window as any).voiceAssistantState;
      if (voiceAssistant) {
        if (voiceAssistant.isListening && !isListening) {
          setIsListening(true);
          setIsProcessing(false);
          setIsPlaying(false);
        } else if (voiceAssistant.isProcessing && !isProcessing) {
          setIsListening(false);
          setIsProcessing(true);
          setIsPlaying(false);
        } else if (!voiceAssistant.isListening && !voiceAssistant.isProcessing) {
          setIsListening(false);
          setIsProcessing(false);
          setIsPlaying(false);
        }
      }
    };

    const stateChecker = setInterval(checkVoiceAssistantState, 100);

    const handleMicStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      
      if (status === 'listening') {
        setIsListening(true);
        setIsProcessing(false);
        setIsPlaying(false);
      } else if (status === 'processing') {
        setIsListening(false);
        setIsProcessing(true);
        setIsPlaying(false);
      } else if (status === 'stopped') {
        setIsListening(false);
        setIsProcessing(false);
        setIsPlaying(false);
        setVoiceVolume(0);
        setOpacity(1.0);
      }
    };

    window.addEventListener('mic-status', handleMicStatusChange as EventListener);
    window.addEventListener('voice-volume', handleVoiceVolumeChange as EventListener);

    return () => {
      clearInterval(stateChecker);
      window.removeEventListener('mic-status', handleMicStatusChange as EventListener);
      window.removeEventListener('voice-volume', handleVoiceVolumeChange as EventListener);
    };
  }, [handleVoiceVolumeChange]);

  return (
    <div className="relative flex items-center justify-center">
      <img
        src={wineCircleImage}
        alt="Wine Circle"
        className="transition-none"
        style={{
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          opacity: opacity,
          transition: 'width 0.1s ease-out, height 0.1s ease-out',
        }}
      />
      

    </div>
  );
}