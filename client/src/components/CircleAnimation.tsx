import React, { useState, useEffect, useCallback, useRef } from 'react';
import wineCircleImage from '@assets/wine-circle.png';

interface CircleAnimationProps {
  isAnimating?: boolean;
  size?: number;
}

export default function CircleAnimation({ isAnimating = false, size = 300 }: CircleAnimationProps) {
  const [currentSize, setSize] = useState(size);
  const [opacity, setOpacity] = useState(0.6);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const animationRef = useRef<number>(0);

  // Voice volume handler - only affects size during listening
  const handleVoiceVolumeChange = useCallback((event: CustomEvent) => {
    const { volume, maxVolume, isActive } = event.detail;
    
    setVoiceVolume(volume);
    
    // Only update size if currently listening
    if (isListening) {
      const baseSize = size;
      let scale = 1.0;
      
      // Voice-responsive scaling
      if (volume > 2) {
        const normalizedVolume = Math.min(volume / 35, 1.0);
        const volumeScale = Math.pow(normalizedVolume, 0.5) * 2.0;
        scale = 1.0 + volumeScale;
      }
      
      const newSize = baseSize * scale;
      setSize(newSize);
      setOpacity(isActive && volume > 2 ? 0.9 : 0.7);
      
      console.log('🎤 Voice scaling:', { volume, scale, newSize, isListening });
    }
  }, [isListening, size]);

  // Timer-based animations for processing/playing states
  useEffect(() => {
    // Only run timer animations for processing/playing, never for listening
    if (isListening) {
      return; // Voice volume events handle listening state
    }

    const animate = () => {
      const baseSize = size;
      let scale = 1.0;
      let newOpacity = 0.6;
      let shouldContinue = false;

      if (isProcessing) {
        const time = Date.now() * 0.003;
        scale = 1.0 + Math.sin(time) * 0.1;
        newOpacity = 0.8;
        shouldContinue = true;
      } else if (isPlaying) {
        const time = Date.now() * 0.002;
        scale = 1.0 + Math.sin(time) * 0.08;
        newOpacity = 0.8;
        shouldContinue = true;
      } else if (isAnimating) {
        const time = Date.now() * 0.004;
        scale = 1.0 + Math.sin(time) * 0.12;
        newOpacity = 0.7;
        shouldContinue = true;
      }

      if (shouldContinue) {
        const newSize = baseSize * scale;
        setSize(newSize);
        setOpacity(newOpacity);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Reset to default when idle
        setSize(size);
        setOpacity(0.6);
      }
    };

    // Start animation for processing/playing/general animation states
    if (isProcessing || isPlaying || isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Reset to base when completely idle
      setSize(size);
      setOpacity(0.6);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isProcessing, isPlaying, isAnimating, size, isListening]);

  // Handle status change events
  useEffect(() => {
    const handleMicStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      console.log('🎤 Mic status change:', status, 'at', new Date().toLocaleTimeString());
      
      if (status === 'listening') {
        console.log('🎤 ENTERING LISTENING MODE - Voice responsive');
        setIsListening(true);
        setIsProcessing(false);
        setIsPlaying(false);
        // Cancel any ongoing timer animation
        cancelAnimationFrame(animationRef.current);
      } else if (status === 'processing') {
        console.log('🎤 ENTERING PROCESSING MODE - Timer animation');
        setIsListening(false);
        setIsProcessing(true);
        setIsPlaying(false);
        setVoiceVolume(0);
      } else if (status === 'stopped') {
        console.log('🎤 ENTERING STOPPED MODE - Static');
        setIsListening(false);
        setIsProcessing(false);
        setIsPlaying(false);
        setVoiceVolume(0);
      }
    };

    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      console.log('🎵 Audio status:', status);
      
      if (status === 'playing') {
        setIsListening(false);
        setIsProcessing(false);
        setIsPlaying(true);
      } else if (status === 'stopped' || status === 'paused') {
        setIsPlaying(false);
      }
    };

    window.addEventListener('mic-status', handleMicStatusChange as EventListener);
    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    window.addEventListener('voice-volume', handleVoiceVolumeChange as EventListener);

    return () => {
      window.removeEventListener('mic-status', handleMicStatusChange as EventListener);
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      window.removeEventListener('voice-volume', handleVoiceVolumeChange as EventListener);
      cancelAnimationFrame(animationRef.current);
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
      
      {/* Voice volume visual ring - only shows when listening */}
      {isListening && voiceVolume > 3 && (
        <div 
          className="absolute inset-0 rounded-full border-2 border-green-400"
          style={{
            width: `${currentSize * (1 + Math.min(voiceVolume / 30, 1.2))}px`,
            height: `${currentSize * (1 + Math.min(voiceVolume / 30, 1.2))}px`,
            opacity: Math.min(voiceVolume / 40, 0.7),
            boxShadow: `0 0 ${voiceVolume * 1.5}px rgba(34, 197, 94, 0.5)`,
          }}
        />
      )}
      
      {/* Debug overlay - shows current mode */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-3 py-2 rounded z-50 font-mono">
        <div>Mode: {isListening ? 'LISTENING' : isProcessing ? 'PROCESSING' : isPlaying ? 'PLAYING' : 'IDLE'}</div>
        <div>Voice: {voiceVolume.toFixed(1)} | Size: {currentSize.toFixed(0)}px</div>
        <div>Base: {size}px | Opacity: {opacity.toFixed(2)}</div>
      </div>
    </div>
  );
}