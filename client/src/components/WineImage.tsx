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

  // Function to handle animation with improved smoothness
  const animate = () => {
    frameCount.current += animationSpeed; // 3x faster animation frame count
    
    // Different animation behavior based on source (mic vs playback vs processing)
    if (isListening) {
      // Use a combination of audio frequency data and smoother animation
      // Get audio data or fallback to algorithm if not available
      const audioData = getAudioData();
      let energyLevel = 0;
      
      if (audioData.length > 0) {
        // Use actual frequency data when available
        const [bass, mid, treble] = audioData;
        // Normalize the values (0-255) to a 0-1 scale
        const normalizedBass = bass / 255;
        const normalizedMid = mid / 255;
        // Give more weight to bass frequencies which create better visual feedback
        energyLevel = (normalizedBass * 0.7) + (normalizedMid * 0.3);
      } else {
        // Fallback to improved algorithm if no audio data
        const random = Math.random() * 0.3; // Reduced randomness for smoother motion
        const wave = Math.sin(frameCount.current * 0.033) * 0.7; // Slower wave for smoother motion
        energyLevel = 0.5 + ((random + wave) * 0.5); // Center around 0.5 for better range
      }
      
      // Apply lerp (linear interpolation) for smoother transitions between states
      const targetSize = baseSize + (energyLevel * 60); // Larger range for more dynamic visual
      const currentSize = parseFloat(size.toString());
      const newSize = currentSize + ((targetSize - currentSize) * 0.3); // Smooth transition
      
      // Smooth opacity changes too
      const targetOpacity = 0.15 + (energyLevel * 0.1);
      const currentOpacity = parseFloat(opacity.toString());
      const newOpacity = currentOpacity + ((targetOpacity - currentOpacity) * 0.3);
      
      setSize(newSize);
      setOpacity(newOpacity);
    } else if (isProcessing) {
      // Enhanced processing animation - smoother pulsing
      // Uses cubic easing instead of linear sine wave
      const t = (Math.sin(frameCount.current * 0.02) + 1) / 2; // Normalized 0-1 range
      const smoothPulse = t * t * (3 - 2 * t); // Cubic smoothing
      
      // Apply smoothing for transitions
      const targetSize = baseSize + (smoothPulse * 15); // Subtle size change
      const currentSize = parseFloat(size.toString());
      const newSize = currentSize + ((targetSize - currentSize) * 0.15);
      
      // Very subtle opacity changes for processing state
      const targetOpacity = 0.19 + (smoothPulse * 0.02);
      const currentOpacity = parseFloat(opacity.toString());
      const newOpacity = currentOpacity + ((targetOpacity - currentOpacity) * 0.15);
      
      setSize(newSize);
      setOpacity(newOpacity);
    } else if (isPlaying) {
      // Voice playback animation with frequency response
      const audioData = getAudioData();
      let energyLevel = 0;
      
      if (audioData.length > 0) {
        // Use actual frequency data for playback visualization
        const [bass, mid, treble] = audioData;
        // Use a weighted average of frequencies, favoring bass for visual impact
        energyLevel = ((bass / 255) * 0.6) + ((mid / 255) * 0.3) + ((treble / 255) * 0.1);
      } else {
        // Enhanced fallback if no audio data is available
        // Multi-frequency sine waves for richer motion
        const wave1 = Math.sin(frameCount.current * 0.027) * 0.5; // Base frequency
        const wave2 = Math.sin(frameCount.current * 0.054) * 0.25; // Double frequency, half amplitude
        const wave3 = Math.sin(frameCount.current * 0.081) * 0.125; // Triple frequency, quarter amplitude
        energyLevel = 0.5 + (wave1 + wave2 + wave3); // Combined wave forms
      }
      
      // Apply smoother transitions
      const targetSize = baseSize + (energyLevel * 30); // Moderate size fluctuation
      const currentSize = parseFloat(size.toString());
      const newSize = currentSize + ((targetSize - currentSize) * 0.2); // Smooth transition
      
      const targetOpacity = 0.17 + (energyLevel * 0.06);
      const currentOpacity = parseFloat(opacity.toString());
      const newOpacity = currentOpacity + ((targetOpacity - currentOpacity) * 0.2);
      
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
      
      {/* Optional inner circle for visual depth - only shown during active states */}
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
          }}
        />
      )}
    </>
  );
};

export default WineImage;