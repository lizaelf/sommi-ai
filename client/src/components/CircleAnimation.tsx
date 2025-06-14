import React, { useRef, useState, useEffect } from 'react';
import wineCircleImage from '@assets/wine-circle.png';
import { 
  shouldSkipPermissionPrompt,
  requestMicrophonePermission 
} from '@/utils/microphonePermissions';

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
  isAnimating?: boolean;
  size?: number;
}

/**
 * Wine glass visualization with sound-reactive animation
 * Only animates when actively listening or playing audio
 */
const CircleAnimation: React.FC<CircleAnimationProps> = ({ isAnimating = false, size: initialSize = 180 }) => {
  const [size, setSize] = useState(initialSize);
  const [opacity, setOpacity] = useState(0.2);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTestAnimation, setShowTestAnimation] = useState(false);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const animationRef = useRef<number>(0);
  const frameCount = useRef(0);
  const currentScale = useRef<number>(1.0);
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

  const animate = () => {
    frameCount.current += 1;
    
    let scale = currentScale.current; // Use persistent scale
    let hasAudioActivity = false;
    
    // Try to get real audio data
    if (analyser && dataArray && (isAnimating || isListening)) {
      try {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate volume from frequency data with better smoothing
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        let volume = Math.min(average / 128, 1.0); // Normalize 0-1
        
        // Check if there's actual audio activity (very sensitive for speech)
        hasAudioActivity = volume > 0.005; // Ultra-sensitive threshold
        
        if (hasAudioActivity) {
          // Apply multiple smoothing layers for ultra-smooth animation
          volume = Math.pow(volume, 0.4); // Better sensitivity curve
          
          // Convert to scale: 1.0 (silence) to 2.5 (loud) - dramatic but not excessive
          const targetScale = 1.0 + (volume * 1.5);
          
          // Faster response for more immediate visual feedback
          const lerpFactor = 0.2; // Faster response to audio
          scale = scale + (targetScale - scale) * lerpFactor;
          
          // Log audio activity for debugging speech detection
          if (frameCount.current % 20 === 0) {
            console.log("CircleAnimation: ACTIVE - volume:", volume.toFixed(3), "scale:", scale.toFixed(3));
          }
        } else {
          // No audio activity - smoothly return to base scale
          const lerpFactor = 0.1;
          scale = scale + (1.0 - scale) * lerpFactor;
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
    } else if (isProcessing || (isAnimating && !analyser)) {
      // Fallback pulse animation during processing or when no audio analyzer
      const time = Date.now() * 0.003;
      scale = 1.0 + Math.sin(time) * 0.15;
      hasAudioActivity = true;
    } else {
      // No audio source and not processing - return to base
      const lerpFactor = 0.1;
      scale = scale + (1.0 - scale) * lerpFactor;
      hasAudioActivity = false;
    }
    
    // Update persistent scale reference
    currentScale.current = scale;
    
    const newSize = baseSize * scale;
    setSize(newSize);
    setOpacity(hasAudioActivity ? 0.8 : 0.6);
    
    // Continue animation if in any active state
    if (isAnimating || isListening || isProcessing || isPlaying || showTestAnimation) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // In silence, stop animation and return to base size
      setSize(baseSize);
      setOpacity(0.6);
    }
  };

  // Initialize audio context and connect microphone when listening starts
  useEffect(() => {
    const setupMicrophone = async () => {
      if (isAnimating && !source) {
        try {
          // Create audio context if it doesn't exist
          if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.3;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
          }

          // Check for existing microphone stream first
          let stream = (window as any).currentMicrophoneStream;
          
          if (!stream) {
            console.log('CircleAnimation: Requesting microphone permission');
            const hasPermission = await requestMicrophonePermission();
            if (!hasPermission) {
              console.log('CircleAnimation: Microphone permission denied');
              return;
            }
            stream = (window as any).currentMicrophoneStream;
          }

          if (!stream) {
            console.warn('No microphone stream available for wine animation');
            return;
          }

          source = audioContext.createMediaStreamSource(stream);
          if (analyser) {
            source.connect(analyser);
            console.log("CircleAnimation: Connected to microphone stream for real-time animation");
          }
        } catch (err) {
          console.warn('Could not connect microphone to analyzer:', err);
        }
      }
    };

    // Handle page visibility changes to stop microphone
    const handleVisibilityChange = () => {
      if (document.hidden && source) {
        console.log("Page hidden - stopping microphone stream");
        
        // Stop microphone stream
        const stream = (window as any).currentMicrophoneStream;
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
            console.log("Stopped microphone track");
          });
          (window as any).currentMicrophoneStream = null;
        }
        
        // Disconnect source
        try {
          source.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
        source = null;
      }
    };

    setupMicrophone();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Remove visibility change listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Cleanup when not animating
      if (!isAnimating && source) {
        // Stop microphone stream
        const stream = (window as any).currentMicrophoneStream;
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
          });
          (window as any).currentMicrophoneStream = null;
        }
        
        try {
          source.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }
        source = null;
      }
    };
  }, [isAnimating]);

  // Monitor global window events for audio status and connect to audio sources
  useEffect(() => {
    // Function to handle audio playback status change
    const handleAudioStatusChange = (event: CustomEvent) => {
      console.log('CircleAnimation: Audio status changed:', event.detail?.status);
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
      console.log('WineImage: Full event detail:', event.detail);
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
        
        // Keep microphone connected during processing for continuous animation
        // Don't disconnect source to maintain audio analysis during speech processing
        
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

    // Add event listeners with debug logging
    console.log('WineImage: Adding event listeners');
    const audioListener = (e: any) => handleAudioStatusChange(e);
    const micListener = (e: any) => handleMicStatusChange(e);
    
    window.addEventListener('audio-status', audioListener);
    window.addEventListener('mic-status', micListener);
    
    // Test that events are being received
    console.log('WineImage: Event listeners added');

    // Cleanup
    return () => {
      console.log('WineImage: Removing event listeners');
      window.removeEventListener('audio-status', audioListener);
      window.removeEventListener('mic-status', micListener);
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
    console.log('CircleAnimation: Animation state changed - animating:', isAnimating, 'listening:', isListening, 'processing:', isProcessing, 'playing:', isPlaying, 'test:', showTestAnimation);
    if (isAnimating || isListening || isProcessing || isPlaying || showTestAnimation) {
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
  }, [isAnimating, isListening, isProcessing, isPlaying]);

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
          opacity: 1, // Full opacity for the wine image
          // Keep original appearance - no color changes
          filter: 'none'
        }}
      />
      

    </>
  );
};

export default CircleAnimation;