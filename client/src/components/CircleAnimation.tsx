import React, { useRef, useState, useEffect } from 'react';
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
  const animationRef = useRef<number>(0);

  // Animation loop that only runs when there's an active state
  useEffect(() => {
    const animate = () => {
      const baseSize = size;
      let scale = 1.0;
      let hasActivity = false;

      if (isProcessing) {
        // Processing pulse animation
        const time = Date.now() * 0.003;
        scale = 1.0 + Math.sin(time) * 0.1;
        hasActivity = true;
      } else if (isListening) {
        // Listening pulse animation
        const time = Date.now() * 0.003;
        scale = 1.0 + Math.sin(time) * 0.15;
        hasActivity = true;
      } else if (isPlaying) {
        // Playing pulse animation
        const time = Date.now() * 0.002;
        scale = 1.0 + Math.sin(time) * 0.08;
        hasActivity = true;
      } else if (isAnimating) {
        // General animation
        const time = Date.now() * 0.004;
        scale = 1.0 + Math.sin(time) * 0.12;
        hasActivity = true;
      }
    
      const newSize = baseSize * scale;
      setSize(newSize);
      setOpacity(hasActivity ? 0.8 : 0.6);

      // Only continue animation if there's still activity
      if (hasActivity) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Only start animation if there's an active state
    const shouldAnimate = isAnimating || isListening || isProcessing || isPlaying;
    if (shouldAnimate) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Reset to default state when no animation is active
      setSize(size);
      setOpacity(0.6);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating, isListening, isProcessing, isPlaying, size]);

  // Handle audio and microphone status events
  useEffect(() => {
    const handleAudioStatusChange = (event: CustomEvent) => {
      const status = event.detail?.status;
      if (status === 'playing') {
        setIsPlaying(true);
        setIsProcessing(false);
        setIsListening(false);
      } else if (status === 'stopped' || status === 'paused') {
        setIsPlaying(false);
      }
    };

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
      }
    };

    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    window.addEventListener('mic-status', handleMicStatusChange as EventListener);

    return () => {
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      window.removeEventListener('mic-status', handleMicStatusChange as EventListener);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <img
        src={wineCircleImage}
        alt="Wine Circle"
        className="transition-all duration-200 ease-in-out"
        style={{
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          opacity: opacity,
          filter: `blur(${isListening || isProcessing || isPlaying ? '5px' : '0px'})`,
        }}
      />
    </div>
  );
}