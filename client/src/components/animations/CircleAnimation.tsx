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
    const { volume, isActive } = event.detail;
    const currentState = stateRef.current;

    setVoiceVolume(volume);

    if (currentState.isListening && isActive) {
      const baseSize = currentState.size;
      let scale = 1.0;

      // More sensitive volume detection with better scaling
      if (volume > 10) {
        // Use logarithmic scaling for more natural response
        const normalizedVolume = Math.min(volume / 255, 1.0); // Normalize to 0-1
        const volumeScale = Math.pow(normalizedVolume, 0.5) * 0.4; // Max 40% scaling with square root for smoother response
        scale = 1.0 + volumeScale;
        
        console.log(`🎯 CircleAnimation: Volume ${volume} -> Scale ${scale.toFixed(2)}`);
      }

      setSize(baseSize * scale);
    } else if (currentState.isListening && !isActive) {
      // Return to base size when no voice detected
      setSize(currentState.size);
    }
  }, []);

  // Maintain static circle when not listening
  useEffect(() => {
    if (!isListening) {
      setSize(size);
      setOpacity(1.0);
    }
  }, [isAnimating, isProcessing, isPlaying, size, isListening]);

  // Event-based state management only - no global state polling
  useEffect(() => {
    console.log("🎯 CircleAnimation: Using pure event-based state management");

    const handleMicStatusChange = (event: MicStatusEvent) => {
      const status = event.detail?.status;
      console.log("🎯 CircleAnimation: Received mic-status event:", status);
      if (status === 'listening') {
        console.log("🎯 CircleAnimation: Setting listening state to true");
        setIsListening(true);
        setIsProcessing(false);
        setIsPlaying(false);
      } else if (status === 'processing') {
        console.log("🎯 CircleAnimation: Setting processing state to true");
        setIsListening(false);
        setIsProcessing(true);
        setIsPlaying(false);
      } else if (status === 'stopped') {
        console.log("🎯 CircleAnimation: Stopping all states");
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
            ? 'width 0.08s ease-out, height 0.08s ease-out' 
            : 'width 0.2s ease-out, height 0.2s ease-out',
        }}
      />


    </div>
  );
}