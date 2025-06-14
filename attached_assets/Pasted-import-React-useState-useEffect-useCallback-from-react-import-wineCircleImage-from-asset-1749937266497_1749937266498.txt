import React, { useState, useEffect, useCallback } from 'react';
import wineCircleImage from '@assets/wine-circle.png';

interface CircleAnimationProps {
  isAnimating?: boolean;
  size?: number;
}

export default function CircleAnimation({ isAnimating = false, size = 300 }: CircleAnimationProps) {
  const [currentSize, setSize] = useState(size);
  const [opacity, setOpacity] = useState(0.6);
  const [isListening, setIsListening] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);

  // Voice volume handler - only thing that changes the circle size
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

  // Handle microphone status changes
  useEffect(() => {
    const handleMicStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      console.log('🎤 Mic status change:', status, 'at', new Date().toLocaleTimeString());
      
      if (status === 'listening') {
        console.log('🎤 ENTERING LISTENING MODE - Voice control activated');
        setIsListening(true);
        setOpacity(0.7);
      } else if (status === 'processing') {
        console.log('🎤 ENTERING PROCESSING MODE - Static display');
        setIsListening(false);
        setSize(size); // Reset to base size
        setOpacity(0.8);
      } else if (status === 'stopped') {
        console.log('🎤 ENTERING STOPPED MODE - Static display');
        setIsListening(false);
        setVoiceVolume(0);
        setSize(size); // Reset to base size
        setOpacity(0.6);
      }
    };

    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      console.log('🎵 Audio status:', status);
      
      if (status === 'playing') {
        setIsListening(false);
        setSize(size); // Reset to base size
        setOpacity(0.8);
      } else if (status === 'stopped' || status === 'paused') {
        setSize(size); // Reset to base size
        setOpacity(0.6);
      }
    };

    window.addEventListener('mic-status', handleMicStatusChange as EventListener);
    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    window.addEventListener('voice-volume', handleVoiceVolumeChange as EventListener);

    return () => {
      window.removeEventListener('mic-status', handleMicStatusChange as EventListener);
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      window.removeEventListener('voice-volume', handleVoiceVolumeChange as EventListener);
    };
  }, [handleVoiceVolumeChange, size]);

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
          filter: `blur(${isListening ? '5px' : '0px'}) brightness(${isListening ? Math.min(1 + voiceVolume / 20, 2.5) : 1}) saturate(${isListening ? Math.min(1 + voiceVolume / 25, 2) : 1}) contrast(${isListening ? Math.min(1 + voiceVolume / 30, 1.8) : 1})`,
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
      
      {/* Debug overlay - only shows when listening */}
      {isListening && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-3 py-2 rounded z-50 font-mono">
          <div>LISTENING MODE - Voice Responsive</div>
          <div>Voice: {voiceVolume.toFixed(1)} | Size: {currentSize.toFixed(0)}px</div>
          <div>Base: {size}px | Scale: {(currentSize / size).toFixed(2)}x</div>
        </div>
      )}
    </div>
  );
}