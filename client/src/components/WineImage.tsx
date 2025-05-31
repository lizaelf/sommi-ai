import React, { useRef, useState, useEffect } from 'react';
import wineCircleImage from '@assets/wine-circle.png';

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

interface WineImageProps {
  isAnimating?: boolean;
  size?: number;
}

/**
 * Wine glass visualization with sound-reactive animation
 * Only animates when actively listening or playing audio
 */
const WineImage: React.FC<WineImageProps> = ({ isAnimating = false, size: initialSize = 180 }) => {
  const [size, setSize] = useState(initialSize);
  const [opacity, setOpacity] = useState(0.2);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTestAnimation, setShowTestAnimation] = useState(false);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const animationRef = useRef<number>(0);
  const frameCount = useRef(0);
  const baseSize = initialSize; // Base size in pixels from props
  const animationSpeed = 3; // 3x smoother animation as requested
  
  // Function to analyze audio and get frequency data
  const getAudioData = () => {
    if (!analyser) return [];
    
    // TypeScript safety - we already checked that analyser is not null
    const safeAnalyser = analyser as AnalyserNode;
    
    safeAnalyser.fftSize = 256; // Higher resolution for better frequency data
    const bufferLength = safeAnalyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    safeAnalyser.getByteFrequencyData(data);
    
    // Calculate average frequency values in several bands
    const bass = data.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10;
    const mid = data.slice(10, 30).reduce((sum, val) => sum + val, 0) / 20;
    const treble = data.slice(30, 60).reduce((sum, val) => sum + val, 0) / 30;
    
    return [bass, mid, treble];
  };

  // Function to handle smooth animation based on actual audio volume
  const animate = () => {
    let volumeLevel = 0;
    
    // Get real-time audio data for volume-based scaling
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume from frequency data with better sensitivity
      const sum = dataArray.reduce((a, b) => a + b, 0);
      volumeLevel = Math.min(sum / dataArray.length / 128, 1.0); // Normalize to 0-1 range with better sensitivity
      
      // Apply smoothing to reduce jitter
      volumeLevel = Math.pow(volumeLevel, 0.7); // Apply power curve for more natural response
    }
    
    // Scale from 60% to 150% based on audio level (90% range total)
    const minScale = 0.6;  // 60% minimum size
    const maxScale = 1.5;  // 150% maximum size (25% more than original 120%)
    const scaleRange = maxScale - minScale; // 0.9 (90% range)
    
    // Calculate target scale based on volume with enhanced sensitivity
    const enhancedVolume = Math.pow(volumeLevel, 0.5); // Make it more responsive to lower volumes
    const targetScale = minScale + (enhancedVolume * scaleRange);
    const targetSize = baseSize * targetScale;
    
    // More responsive interpolation for visible movement
    const currentSize = size;
    const lerpFactor = 0.25; // Increased smoothing factor for more visible changes
    const smoothedSize = currentSize + (targetSize - currentSize) * lerpFactor;
    
    // Update size with smooth scaling
    setSize(smoothedSize);
    
    // More dramatic opacity changes that follow the volume
    const targetOpacity = 0.2 + (enhancedVolume * 0.6); // Range from 0.2 to 0.8
    const currentOpacity = opacity;
    const smoothedOpacity = currentOpacity + (targetOpacity - currentOpacity) * lerpFactor;
    setOpacity(smoothedOpacity);
    
    // Continue animation if in any active state
    if (isListening || isProcessing || isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  // Initialize audio context and analyzer for frequency analysis
  useEffect(() => {
    // Create audio context if it doesn't exist
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.85; // Higher value for smoother transitions
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (err) {
        console.warn('AudioContext not supported or blocked by browser policy:', err);
      }
    }

    return () => {
      // Cleanup audio analysis resources
      if (source) {
        try {
          source.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
        source = null;
      }
    };
  }, []);

  // Monitor global window events for audio status and connect to audio sources
  useEffect(() => {
    // Function to handle audio playback status change
    const handleAudioStatusChange = (event: CustomEvent) => {
      console.log('WineImage: Audio status changed:', event.detail?.status);
      if (event.detail?.status === 'playing') {
        setIsPlaying(true);
        
        // Connect to audio element for frequency analysis
        if (audioContext && analyser && event.detail?.audioElement) {
          try {
            if (source) {
              source.disconnect();
            }
            
            // Create source from the audio element
            source = audioContext.createMediaElementSource(event.detail.audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
          } catch (err) {
            console.warn('Failed to connect audio element to analyzer:', err);
          }
        }
        
        // Reset frame counter for smooth animation start
        frameCount.current = 0;
      } else if (event.detail?.status === 'stopped') {
        setIsPlaying(false);
        
        // Disconnect source when audio stops
        if (source) {
          try {
            source.disconnect();
          } catch (e) {
            // Ignore disconnection errors
          }
          source = null;
        }
      }
    };

    // Function to handle microphone status change and connect to mic stream
    const handleMicStatusChange = (event: CustomEvent) => {
      console.log('WineImage: Mic status changed:', event.detail?.status);
      if (event.detail?.status === 'listening') {
        console.log('WineImage: Setting listening to true');
        setIsListening(true);
        setIsProcessing(false);
        
        // Connect to microphone stream for frequency analysis
        if (audioContext && analyser && event.detail?.stream) {
          try {
            if (source) {
              source.disconnect();
            }
            
            // Create source from the microphone stream
            source = audioContext.createMediaStreamSource(event.detail.stream);
            source.connect(analyser);
            // Don't connect to destination to avoid feedback loop
          } catch (err) {
            console.warn('Failed to connect mic stream to analyzer:', err);
          }
        }
        
        // Reset frame counter for smooth animation start
        frameCount.current = 0;
      } else if (event.detail?.status === 'processing') {
        setIsListening(false);
        setIsProcessing(true);
        
        // Disconnect source when processing
        if (source) {
          try {
            source.disconnect();
          } catch (e) {
            // Ignore disconnection errors
          }
          source = null;
        }
        
        // Reset frame counter for smooth animation start
        frameCount.current = 0;
      } else if (event.detail?.status === 'stopped') {
        setIsListening(false);
        setIsProcessing(false);
        
        // Disconnect source when stopped
        if (source) {
          try {
            source.disconnect();
          } catch (e) {
            // Ignore disconnection errors
          }
          source = null;
        }
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
      
      // Disconnect audio source
      if (source) {
        try {
          source.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
        source = null;
      }
    };
  }, []);

  // Add a test animation on mount to verify it's working
  useEffect(() => {
    // Start a brief test animation after 1 second to verify visibility
    const timer = setTimeout(() => {
      setShowTestAnimation(true);
      setTimeout(() => setShowTestAnimation(false), 3000); // 3 second test
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Start/stop animation when listening, processing, or playing changes
  useEffect(() => {
    console.log('WineImage: Animation state changed - listening:', isListening, 'processing:', isProcessing, 'playing:', isPlaying, 'test:', showTestAnimation);
    if (isListening || isProcessing || isPlaying || showTestAnimation) {
      console.log('WineImage: Starting animation');
      // Only start a new animation if there isn't one already running
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    } else {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
      
      // Smoothly return to base state when not active
      const returnToBase = () => {
        const currentSize = size;
        const currentOpacity = opacity;
        const targetSize = baseSize; // Return to full base size
        const targetOpacity = 0.6; // Higher opacity when inactive for better visibility
        
        const lerpFactor = 0.15; // Faster return to base
        const newSize = currentSize + (targetSize - currentSize) * lerpFactor;
        const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * lerpFactor;
        
        setSize(newSize);
        setOpacity(newOpacity);
        
        // Continue until we're close to target
        const sizeDiff = Math.abs(newSize - targetSize);
        const opacityDiff = Math.abs(newOpacity - targetOpacity);
        
        if (sizeDiff > 1 || opacityDiff > 0.01) {
          requestAnimationFrame(returnToBase);
        }
      };
      
      returnToBase();
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, isProcessing, isPlaying]);

  // Dynamic gradient color based on frequency data
  const getGradient = () => {
    // Different colors for different states
    if (isListening) {
      return `radial-gradient(circle, rgba(255, 255, 255, ${opacity * 1.5}) 0%, rgba(255, 255, 255, ${opacity * 0.8}) 70%, rgba(255, 255, 255, 0) 100%)`;
    } else if (isProcessing) {
      return `radial-gradient(circle, rgba(255, 255, 255, ${opacity * 1.2}) 0%, rgba(255, 255, 255, ${opacity * 0.6}) 80%, rgba(255, 255, 255, 0) 100%)`;
    } else if (isPlaying) {
      return `radial-gradient(circle, rgba(255, 255, 255, ${opacity * 1.3}) 0%, rgba(255, 255, 255, ${opacity * 0.7}) 75%, rgba(255, 255, 255, 0) 100%)`;
    }
    return `radial-gradient(circle, rgba(255, 255, 255, ${opacity}) 0%, rgba(255, 255, 255, ${opacity * 0.5}) 70%, rgba(255, 255, 255, 0) 100%)`;
  };

  return (
    <>
      {/* Wine circle image that scales with animation */}
      <img 
        src={wineCircleImage} 
        alt="Wine Circle"
        style={{
          width: `${size}px`, // Size changes with the animation
          height: `${size}px`,
          borderRadius: '50%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          opacity: 1 // Full opacity for the wine image
        }}
      />
      
      {/* Inner circle provides focused area - without background color */}
      {(isListening || isProcessing || isPlaying || showTestAnimation) && (
        <div 
          style={{
            width: `${size * 0.7}px`,
            height: `${size * 0.7}px`,
            borderRadius: '50%',
            border: `1px solid rgba(255, 255, 255, ${opacity * 0.3})`, // Subtle border instead of background
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            boxShadow: `0 0 ${opacity * 10}px rgba(255, 255, 255, ${opacity * 0.2})` // Subtle glow
          }}
        />
      )}
    </>
  );
};

export default WineImage;