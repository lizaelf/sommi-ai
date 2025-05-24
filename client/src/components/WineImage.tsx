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

  // Function to handle animation with improved smoothness - simplified for reliability
  const animate = () => {
    // Use 3x faster frame count for smoother animation
    frameCount.current += 3;
    
    // Different animation behavior based on source (mic vs playback vs processing)
    if (isListening) {
      // Microphone input animation - more dynamic
      // Create a simulated frequency response based on natural speech patterns
      const cycle = frameCount.current * 0.05;
      
      // Multiple overlapping sine waves at different frequencies to simulate voice patterns
      const wave1 = Math.sin(cycle) * 0.5;                     // Base frequency
      const wave2 = Math.sin(cycle * 1.7) * 0.3;               // Higher frequency component
      const wave3 = Math.sin(cycle * 0.5) * 0.2;               // Lower frequency component
      const noise = (Math.random() - 0.5) * 0.4;               // Random component (simulates unpredictability in voice)
      
      // Combine waves with weights to create a natural voice-like pattern
      // This creates a pattern that mimics the natural cadence of speech
      const combinedWave = wave1 + wave2 + wave3 + noise;
      
      // Scale the combined wave to appropriate size range (using base size ±20%)
      const newSize = baseSize + (combinedWave * baseSize * 0.2);
      const newOpacity = 0.4 + (combinedWave * 0.2);
      
      setSize(newSize);
      setOpacity(newOpacity);
    } else if (isProcessing) {
      // Processing animation - gentle pulsing
      const processingPulse = Math.sin(frameCount.current * 0.03) * 0.5;
      
      // Very subtle size changes (±5% of base size)
      const newSize = baseSize + (processingPulse * baseSize * 0.05);
      // Subtle opacity changes
      const newOpacity = 0.3 + (processingPulse * 0.05);
      
      setSize(newSize);
      setOpacity(newOpacity);
    } else if (isPlaying) {
      // Voice playback animation - medium activity
      // Use a mix of frequencies to simulate voice playback
      const cycle = frameCount.current * 0.04;
      
      // Create a pattern that mimics AI voice cadence (more regular than human speech)
      const wave1 = Math.sin(cycle) * 0.6;                     // Primary wave
      const wave2 = Math.sin(cycle * 2.2) * 0.2;               // Secondary frequency
      const wave3 = Math.sin(cycle * 3.4) * 0.1;               // Tertiary frequency
      const noise = (Math.random() - 0.5) * 0.1;               // Minimal noise for smoother appearance
      
      // Combine waves to create AI voice-like pattern - more regular than human speech
      const combinedWave = wave1 + wave2 + wave3 + noise;
      
      // Scale the combined wave to medium size range (±15% of base size)
      const newSize = baseSize + (combinedWave * baseSize * 0.15);
      const newOpacity = 0.35 + (combinedWave * 0.15);
      
      setSize(newSize);
      setOpacity(newOpacity);
    }
    
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
      if (event.detail?.status === 'listening') {
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

  // Start/stop animation when listening, processing, or playing changes
  useEffect(() => {
    if (isListening || isProcessing || isPlaying) {
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
      {/* Main circle with reactive size and opacity - the animation happens on this div */}
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: `rgba(255, 255, 255, ${opacity})`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          // Remove transition to allow for more fluid animation directly from frame updates
        }}
      />
      
      {/* Inner circle provides layered effect */}
      {(isListening || isProcessing || isPlaying) && (
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
            // Remove transition to allow for more fluid animation directly from frame updates
          }}
        />
      )}
    </>
  );
};

export default WineImage;