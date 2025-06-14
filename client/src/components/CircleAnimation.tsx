import React, { useRef, useState, useEffect, useCallback } from 'react';
import wineCircleImage from '@assets/wine-circle.png';

// Type-safe event interfaces
interface MicStatusEvent extends CustomEvent<{ 
  status: 'listening' | 'processing' | 'stopped';
  stream?: MediaStream;
}> {}

interface VoiceVolumeEvent extends CustomEvent<{
  volume: number;
  maxVolume: number;
  isActive: boolean;
}> {}

interface CircleAnimationProps {
  isAnimating?: boolean;
  size?: number;
  showDebug?: boolean; // Control debug overlay visibility
}

export default function CircleAnimation({ 
  isAnimating = false, 
  size = 300, 
  showDebug = process.env.NODE_ENV === 'development' 
}: CircleAnimationProps) {
  const [currentSize, setSize] = useState(size);
  const [opacity, setOpacity] = useState(1.0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const statePollingRef = useRef<number | null>(null);

  // Store refs to current state for event handlers
  const stateRef = useRef({ isListening, isProcessing, isPlaying, size });
  useEffect(() => {
    stateRef.current = { isListening, isProcessing, isPlaying, size };
  }, [isListening, isProcessing, isPlaying, size]);

  // Voice volume handler with proper typing and enhanced sensitivity
  const handleVoiceVolumeChange = useCallback((event: VoiceVolumeEvent) => {
    const { volume, maxVolume, isActive } = event.detail;
    const currentState = stateRef.current;

    setVoiceVolume(volume);

    // ONLY update size if currently listening - enhanced sensitivity
    if (currentState.isListening) {
      const baseSize = currentState.size;
      let scale = 1.0;

      // Enhanced voice scaling with lower threshold and better responsiveness
      if (volume > 3) { // Lowered threshold from 5 to 3
        const volumeScale = Math.min(volume / 80, 0.4); // Increased max scaling to 40%
        scale = 1.0 + volumeScale;
      }

      const newSize = baseSize * scale;
      setSize(newSize);
      
      // Debug output for voice responsiveness
      if (showDebug && volume > 3) {
        console.log('CircleAnimation: Voice scaling', { volume, scale, newSize });
      }
    }
  }, [showDebug]);

  // Optimized state synchronization using requestAnimationFrame
  const syncVoiceAssistantState = useCallback(() => {
    const voiceAssistant = (window as any).voiceAssistantState;
    if (voiceAssistant) {
      let stateChanged = false;

      if (voiceAssistant.isListening && !isListening) {
        setIsListening(true);
        setIsProcessing(false);
        setIsPlaying(false);
        stateChanged = true;
      } else if (voiceAssistant.isProcessing && !isProcessing) {
        setIsListening(false);
        setIsProcessing(true);
        setIsPlaying(false);
        stateChanged = true;
      } else if (!voiceAssistant.isListening && !voiceAssistant.isProcessing && (isListening || isProcessing)) {
        setIsListening(false);
        setIsProcessing(false);
        setIsPlaying(false);
        stateChanged = true;
      }

      // Continue polling only if VoiceAssistant is active
      if (voiceAssistant.showBottomSheet || voiceAssistant.isListening || voiceAssistant.isProcessing) {
        animationFrameRef.current = requestAnimationFrame(syncVoiceAssistantState);
      } else {
        animationFrameRef.current = null;
      }
    }
  }, [isListening, isProcessing, isPlaying]);

  // Keep circle static for all non-listening states
  useEffect(() => {
    // Only allow voice-responsive scaling during listening
    if (!isListening) {
      setSize(size); // Always keep base size
      setOpacity(1.0); // Full opacity always
    }
  }, [isAnimating, isProcessing, isPlaying, size, isListening]);

  // Optimized communication with VoiceAssistant
  useEffect(() => {
    const handleMicStatusChange = (event: MicStatusEvent) => {
      const status = event.detail?.status;

      if (status === 'listening') {
        setIsListening(true);
        setIsProcessing(false);
        setIsPlaying(false);
        // Start optimized state sync when listening begins
        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(syncVoiceAssistantState);
        }
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
        // Stop state sync when stopped
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };

    // Initial state sync - only start if VoiceAssistant is active
    const voiceAssistant = (window as any).voiceAssistantState;
    if (voiceAssistant && (voiceAssistant.showBottomSheet || voiceAssistant.isListening || voiceAssistant.isProcessing)) {
      animationFrameRef.current = requestAnimationFrame(syncVoiceAssistantState);
    }

    window.addEventListener('mic-status', handleMicStatusChange as EventListener);
    window.addEventListener('voice-volume', handleVoiceVolumeChange as EventListener);

    return () => {
      // Cleanup animation frame and polling
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (statePollingRef.current) {
        clearInterval(statePollingRef.current);
        statePollingRef.current = null;
      }
      window.removeEventListener('mic-status', handleMicStatusChange as EventListener);
      window.removeEventListener('voice-volume', handleVoiceVolumeChange as EventListener);
    };
  }, [handleVoiceVolumeChange, syncVoiceAssistantState]);

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
            ? 'width 0.1s ease-out, height 0.1s ease-out' 
            : 'width 0.3s ease-out, height 0.3s ease-out',
        }}
      />

      {/* Voice volume visual ring - only shows when listening and volume is high enough */}
      {isListening && voiceVolume > 10 && (
        <div 
          className="absolute inset-0 rounded-full border-2 border-green-400"
          style={{
            width: `${currentSize * (1 + Math.min(voiceVolume / 80, 0.5))}px`,
            height: `${currentSize * (1 + Math.min(voiceVolume / 80, 0.5))}px`,
            opacity: Math.min(voiceVolume / 60, 0.6),
            boxShadow: `0 0 ${voiceVolume * 0.8}px rgba(34, 197, 94, 0.4)`,
            transition: 'width 0.08s ease-out, height 0.08s ease-out',
          }}
        />
      )}

      {/* Debug overlay - only shows in development or when explicitly enabled */}
      {showDebug && isListening && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded z-50 font-mono">
          <div>Voice: {voiceVolume.toFixed(0)} | Size: {currentSize.toFixed(0)}px</div>
        </div>
      )}
    </div>
  );
}