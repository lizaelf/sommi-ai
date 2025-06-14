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
    
    // Debug all volume events to understand the data range
    console.log('🎤 Voice volume event:', { volume, maxVolume, isActive, isListening: currentState.isListening });
    
    // ONLY update size if currently listening
    if (currentState.isListening) {
      const baseSize = currentState.size;
      let scale = 1.0;
      
      // Much more sensitive scaling - respond to any voice input
      if (volume > 0.5) {
        // Linear scaling that's immediately visible
        const volumeScale = Math.min(volume / 15, 2.0); // Very sensitive scaling
        scale = 1.0 + volumeScale;
      }
      
      const newSize = baseSize * scale;
      setSize(newSize);
      // Keep opacity constant - no changes based on voice
      
      console.log('🎤 Voice scaling applied:', { volume, scale, newSize, baseSize });
    }
  }, []);

  // Keep circle static for all non-listening states
  useEffect(() => {
    // Only allow voice-responsive scaling during listening
    if (!isListening) {
      console.log('🎤 Non-listening mode: Circle size locked to base');
      setSize(size); // Always keep base size
      setOpacity(1.0); // Full opacity always
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating, isProcessing, isPlaying, size, isListening]);

  // Direct communication with VoiceAssistant - check global state
  useEffect(() => {
    const checkVoiceAssistantState = () => {
      // Access VoiceAssistant state directly if events aren't working
      const voiceAssistant = (window as any).voiceAssistantState;
      if (voiceAssistant) {
        console.log('🎤 CircleAnimation: Direct state check:', voiceAssistant);
        if (voiceAssistant.isListening && !isListening) {
          console.log('🎤 CircleAnimation: Direct state - ENTERING LISTENING MODE');
          setIsListening(true);
          setIsProcessing(false);
          setIsPlaying(false);
        } else if (voiceAssistant.isProcessing && !isProcessing) {
          console.log('🎤 CircleAnimation: Direct state - ENTERING PROCESSING MODE');
          setIsListening(false);
          setIsProcessing(true);
          setIsPlaying(false);
        } else if (!voiceAssistant.isListening && !voiceAssistant.isProcessing) {
          console.log('🎤 CircleAnimation: Direct state - ENTERING IDLE MODE');
          setIsListening(false);
          setIsProcessing(false);
          setIsPlaying(false);
        }
      }
    };

    // Check state every 100ms for real-time updates
    const stateChecker = setInterval(checkVoiceAssistantState, 100);

    // Also keep event listeners as backup
    const handleMicStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      console.log('🎤 CircleAnimation: Event received:', status, event.detail);
      
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
          filter: `blur(${isListening || isProcessing || isPlaying ? '5px' : '0px'}) brightness(${isListening ? Math.min(1 + voiceVolume / 20, 2.5) : 1}) saturate(${isListening ? Math.min(1 + voiceVolume / 25, 2) : 1}) contrast(${isListening ? Math.min(1 + voiceVolume / 30, 1.8) : 1})`,
          boxShadow: isListening && voiceVolume > 3 ? `0 0 ${voiceVolume * 2}px rgba(255, 255, 255, ${Math.min(voiceVolume / 50, 0.6)})` : 'none',
        }}
      />
      
      {/* Voice volume visual ring */}
      {isListening && voiceVolume > 3 && (
        <div 
          className="absolute inset-0 rounded-full border-2 border-green-400"
          style={{
            width: `${currentSize * (1 + Math.min(voiceVolume / 30, 1.2))}px`,
            height: `${currentSize * (1 + Math.min(voiceVolume / 30, 1.2))}px`,
            opacity: Math.min(voiceVolume / 40, 0.7),
            boxShadow: `0 0 ${voiceVolume * 1.5}px rgba(34, 197, 94, 0.5)`,
            animation: voiceVolume > 15 ? 'pulse 0.3s ease-in-out' : 'none',
          }}
        />
      )}
      
      {/* Enhanced debug overlay - shows actual state */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-3 py-2 rounded z-50 font-mono">
        <div>Mode: {isListening ? 'LISTENING' : isProcessing ? 'PROCESSING' : isPlaying ? 'PLAYING' : 'IDLE'}</div>
        <div>Voice: {voiceVolume.toFixed(1)} | Size: {currentSize.toFixed(0)}px</div>
        <div>Base: {size}px | Opacity: {opacity.toFixed(2)}</div>
      </div>
    </div>
  );
}