// CircleAnimation Component - CODE FREEZE (June 14, 2025)
// No modifications allowed without explicit permission
import React, { useRef, useState, useEffect, useCallback } from 'react';
import wineCircleImage from '@assets/wine-circle.png';

interface CircleAnimationProps {
  isAnimating?: boolean;
  size?: number;
}

interface MicStatusEvent extends CustomEvent<{ status: 'listening' | 'processing' | 'stopped' }> {}
interface VoiceVolumeEvent extends CustomEvent<{ volume: number; maxVolume: number; isActive: boolean }> {}

export default function CircleAnimation({ isAnimating = false, size = 300 }: CircleAnimationProps) {
  const [currentSize, setSize] = useState(size);
  const [opacity, setOpacity] = useState(1.0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const stateRef = useRef({ isListening, isProcessing, isPlaying, size });

  // Update state ref on changes
  useEffect(() => {
    stateRef.current = { isListening, isProcessing, isPlaying, size };
  }, [isListening, isProcessing, isPlaying, size]);

  // Handle voice volume changes
  const handleVoiceVolumeChange = useCallback((event: VoiceVolumeEvent) => {
    const { volume } = event.detail;
    const currentState = stateRef.current;

    setVoiceVolume(volume);

    if (currentState.isListening) {
      const baseSize = currentState.size;
      let scale = 1.0;

      if (volume > 5) {
        const volumeScale = Math.min(volume / 100, 0.3); // Max 30%
        scale = 1.0 + volumeScale;
      }

      setSize(baseSize * scale);
    }
  }, []);

  // Maintain static circle when not listening
  useEffect(() => {
    if (!isListening) {
      setSize(size);
      setOpacity(1.0);
    }
  }, [isAnimating, isProcessing, isPlaying, size, isListening]);

  // Sync state with VoiceAssistant global state
  useEffect(() => {
    const checkVoiceAssistantState = () => {
      const voiceAssistant = (window as any).voiceAssistantState;
      if (voiceAssistant) {
        // Only log significant state changes to reduce console spam
        const hasChange = (voiceAssistant.isListening !== isListening) || (voiceAssistant.isProcessing !== isProcessing);
        if (hasChange) {
          console.log("🎯 CircleAnimation: State change detected:", {
            globalListening: voiceAssistant.isListening,
            globalProcessing: voiceAssistant.isProcessing,
            localListening: isListening,
            localProcessing: isProcessing
          });
        }
        
        if (voiceAssistant.isListening && !isListening) {
          console.log("🎯 CircleAnimation: Setting listening from global state");
          setIsListening(true);
          setIsProcessing(false);
          setIsPlaying(false);
        } else if (voiceAssistant.isProcessing && !isProcessing) {
          console.log("🎯 CircleAnimation: Setting processing from global state");
          setIsListening(false);
          setIsProcessing(true);
          setIsPlaying(false);
        } else if (!voiceAssistant.isListening && !voiceAssistant.isProcessing) {
          if (isListening || isProcessing) {
            console.log("🎯 CircleAnimation: Clearing states from global state");
            setIsListening(false);
            setIsProcessing(false);
            setIsPlaying(false);
          }
        }
      }
    };

    const intervalId = setInterval(checkVoiceAssistantState, 1000); // reduced to 1 second to prevent loops

    const handleMicStatusChange = (event: MicStatusEvent) => {
      const status = event.detail?.status;
      console.log("🎯 CircleAnimation: Received mic-status event:", status);
      if (status === 'listening') {
        console.log("🎯 CircleAnimation: Setting listening state to true");
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
      clearInterval(intervalId);
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
          transition: isListening 
            ? 'width 0.05s ease-out, height 0.05s ease-out' 
            : 'width 0.15s ease-out, height 0.15s ease-out',
        }}
      />


    </div>
  );
}