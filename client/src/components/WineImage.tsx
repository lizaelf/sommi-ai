import React, { useRef, useState, useEffect } from 'react';

interface WineImageProps {
  isAnimating?: boolean;
  size?: number;
}

/**
 * Wine glass visualization with sound-reactive animation
 * Only animates when actively listening or playing audio
 */
const WineImage: React.FC<WineImageProps> = ({ isAnimating = false, size: initialSize = 200 }) => {
  const [size, setSize] = useState(initialSize);
  const [opacity, setOpacity] = useState(0.2);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number>(0);
  const frameCount = useRef(0);
  const baseSize = initialSize; // Base size in pixels from props
  
  // Function to handle animation
  const animate = () => {
    frameCount.current += 1;
    
    // Different animation behavior based on source (mic vs playback vs processing)
    if (isListening) {
      // More dramatic random fluctuations for microphone input
      // Uses noise + sine wave for natural feel
      const random = Math.random() * 0.5;
      const wave = Math.sin(frameCount.current * 0.1) * 0.5;
      const combined = random + wave;
      
      // Size fluctuates between 180px and 220px
      const newSize = baseSize + (combined * 40);
      
      // Opacity pulses between 0.15 and 0.25
      const newOpacity = 0.2 + (combined * 0.05);
      
      setSize(newSize);
      setOpacity(newOpacity);
    } else if (isProcessing) {
      // Slow, subtle pulsing for processing state
      // Consistent sine-wave pattern for a "thinking" effect
      const pulse = Math.sin(frameCount.current * 0.05) * 0.5;
      
      // Size fluctuates gently between 195px and 205px (smallest range)
      const newSize = baseSize + (pulse * 10);
      
      // Opacity pulses very subtly between 0.19 and 0.21
      const newOpacity = 0.2 + (pulse * 0.01);
      
      setSize(newSize);
      setOpacity(newOpacity);
    } else if (isPlaying) {
      // Smoother, gentler pulsing for audio playback
      // Primarily sine-wave based for a clean pulsing effect
      const pulse = Math.sin(frameCount.current * 0.08) * 0.7;
      
      // Size fluctuates between 190px and 210px (medium range)
      const newSize = baseSize + (pulse * 20);
      
      // Opacity pulses between 0.17 and 0.23
      const newOpacity = 0.2 + (pulse * 0.03);
      
      setSize(newSize);
      setOpacity(newOpacity);
    }
    
    // Continue animation if in any active state
    if (isListening || isProcessing || isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  // Monitor global window events for audio status
  useEffect(() => {
    // Function to handle audio playback status change
    const handleAudioStatusChange = (event: CustomEvent) => {
      if (event.detail?.status === 'playing') {
        setIsPlaying(true);
        // Reset frame counter for smooth animation start
        frameCount.current = 0;
      } else if (event.detail?.status === 'stopped') {
        setIsPlaying(false);
      }
    };

    // Function to handle microphone status change
    const handleMicStatusChange = (event: CustomEvent) => {
      if (event.detail?.status === 'listening') {
        setIsListening(true);
        setIsProcessing(false);
        // Reset frame counter for smooth animation start
        frameCount.current = 0;
      } else if (event.detail?.status === 'processing') {
        setIsListening(false);
        setIsProcessing(true);
        // Reset frame counter for smooth animation start
        frameCount.current = 0;
      } else if (event.detail?.status === 'stopped') {
        setIsListening(false);
        setIsProcessing(false);
      }
    };

    // Add event listeners
    window.addEventListener('audio-status', handleAudioStatusChange as EventListener);
    window.addEventListener('mic-status', handleMicStatusChange as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('audio-status', handleAudioStatusChange as EventListener);
      window.removeEventListener('mic-status', handleMicStatusChange as EventListener);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Start/stop animation when listening or playing changes
  useEffect(() => {
    if (isListening || isPlaying) {
      // Only start a new animation if there isn't one already running
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    } else {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
      // Reset to base size and opacity when not active
      setSize(baseSize);
      setOpacity(0.2);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, isPlaying]);

  return (
    <>
      {/* Main circle with reactive size and opacity */}
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: `rgba(255, 255, 255, ${opacity})`, // Dynamic opacity
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Optional inner circle for visual depth - only shown during audio activity */}
      {(isListening || isPlaying) && (
        <div 
          style={{
            width: `${size * 0.7}px`,
            height: `${size * 0.7}px`,
            borderRadius: '50%',
            background: `rgba(255, 255, 255, ${opacity * 0.5})`,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </>
  );
};

export default WineImage;