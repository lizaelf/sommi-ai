import React, { useRef, useState, useEffect } from 'react';

// Audio analysis helper
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array | null = null;
let source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;

// Type declarations for Web Audio API
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface CircleAnimationProps {
  isListening?: boolean;
  isProcessing?: boolean;
  isPlaying?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Circle animation component with sound-reactive visualization
 * Animates based on microphone input or processing states
 */
const CircleAnimation: React.FC<CircleAnimationProps> = ({ 
  isListening = false,
  isProcessing = false,
  isPlaying = false,
  size: initialSize = 180,
  className = '',
  style = {},
  children
}) => {
  const [animatedSize, setAnimatedSize] = useState(initialSize);
  const [opacity, setOpacity] = useState(0.6);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const animationRef = useRef<number>(0);
  const frameCount = useRef(0);
  const baseSize = initialSize;
  const animationSpeed = 3;
  
  // Function to analyze audio and get frequency data
  const getAudioData = () => {
    if (!analyser) return [];
    
    const safeAnalyser = analyser as AnalyserNode;
    safeAnalyser.fftSize = 256;
    
    if (!dataArray) {
      dataArray = new Uint8Array(safeAnalyser.frequencyBinCount);
    }
    
    safeAnalyser.getByteFrequencyData(dataArray);
    
    // Convert to array and normalize
    const normalizedData = Array.from(dataArray).map(value => value / 255);
    return normalizedData;
  };

  // Animation loop
  const animate = () => {
    frameCount.current += 1;
    
    let scale = 1.0;
    let hasAudioActivity = false;
    
    // Only sample audio every few frames for performance
    if (frameCount.current % animationSpeed === 0) {
      try {
        const audioData = getAudioData();
        setFrequencyData(audioData);
        
        if (audioData.length > 0) {
          // Calculate average amplitude across frequency bins
          const average = audioData.reduce((sum, val) => sum + val, 0) / audioData.length;
          
          // Scale based on audio input with smooth scaling
          if (average > 0.01) {
            scale = 1.0 + (average * 0.5);
            hasAudioActivity = true;
          }
        }
      } catch (error) {
        // If audio fails and we're processing, use gentle pulse
        if (isProcessing) {
          const time = Date.now() * 0.003;
          scale = 1.0 + Math.sin(time) * 0.1;
          hasAudioActivity = true;
        } else {
          scale = 1.0;
          hasAudioActivity = false;
        }
      }
    } else if (isProcessing) {
      // Fallback pulse animation only during processing
      const time = Date.now() * 0.003;
      scale = 1.0 + Math.sin(time) * 0.1;
      hasAudioActivity = true;
    } else {
      // No audio source and not processing - static
      scale = 1.0;
      hasAudioActivity = false;
    }
    
    const newSize = baseSize * scale;
    setAnimatedSize(newSize);
    setOpacity(hasAudioActivity ? 0.8 : 0.6);
    
    // Continue animation if in any active state
    if (isListening || isProcessing || isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // In silence, stop animation and return to base size
      setAnimatedSize(baseSize);
      setOpacity(0.6);
    }
  };

  // Initialize audio context and connect microphone when listening starts
  useEffect(() => {
    const setupMicrophone = async () => {
      if (isListening && !source) {
        try {
          // Create audio context if it doesn't exist
          if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.3;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
          }

          // Get existing microphone stream
          const stream = (window as any).currentMicrophoneStream;
          if (!stream) {
            console.warn('No microphone stream available for circle animation');
            return;
          }

          source = audioContext.createMediaStreamSource(stream);
          if (analyser) {
            source.connect(analyser);
          }
          
          console.log("Circle animation connected to audio analyzer");
        } catch (err) {
          console.warn('Could not connect microphone to circle animation:', err);
        }
      }
    };

    if (isListening) {
      setupMicrophone();
    }

    return () => {
      if (source) {
        try {
          source.disconnect();
          source = null;
        } catch (e) {
          console.log('Audio source already disconnected');
        }
      }
    };
  }, [isListening]);

  // Start/stop animation based on states
  useEffect(() => {
    if (isListening || isProcessing || isPlaying) {
      console.log("Circle animation: Starting animation");
      animationRef.current = requestAnimationFrame(animate);
    } else {
      console.log("Circle animation: Animation state changed - stopping");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
      
      // Reset to base state
      setAnimatedSize(baseSize);
      setOpacity(0.6);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };
  }, [isListening, isProcessing, isPlaying, baseSize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (source) {
        try {
          source.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        width: `${animatedSize}px`,
        height: `${animatedSize}px`,
        opacity,
        transition: 'opacity 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export default CircleAnimation;