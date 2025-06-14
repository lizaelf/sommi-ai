import React, { useState, useEffect } from 'react';
import wineCircleImage from '@assets/wine-circle.png';
import CircleAnimation from './CircleAnimation';

interface WineImageProps {
  isAnimating?: boolean;
  size?: number;
}

/**
 * Wine glass visualization with sound-reactive animation
 */
const WineImage: React.FC<WineImageProps> = ({ isAnimating = false, size = 180 }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Monitor global window events for audio status changes
  useEvent(() => {
    const handleAudioStatusChange = (event: CustomEvent) => {
      console.log('WineImage: Audio status changed:', event.detail?.status);
      if (event.detail?.status === 'playing') {
        setIsPlaying(true);
      } else if (event.detail?.status === 'stopped') {
        setIsPlaying(false);
      }
    };

    const handleMicStatusChange = (event: CustomEvent) => {
      console.log('WineImage: Mic status changed:', event.detail?.status);
      console.log('WineImage: Full event detail:', event.detail);
      if (event.detail?.status === 'listening') {
        console.log('WineImage: Setting listening to true');
        setIsListening(true);
        setIsProcessing(false);
      } else if (event.detail?.status === 'processing') {
        setIsListening(false);
        setIsProcessing(true);
      } else if (event.detail?.status === 'stopped') {
        setIsListening(false);
        setIsProcessing(false);
      }
    };

    // Add event listeners
    console.log('WineImage: Adding event listeners');
    const audioListener = (e: any) => handleAudioStatusChange(e);
    const micListener = (e: any) => handleMicStatusChange(e);
    
    window.addEventListener('audio-status', audioListener);
    window.addEventListener('mic-status', micListener);
    
    console.log('WineImage: Event listeners added');

    // Cleanup
    return () => {
      console.log('WineImage: Removing event listeners');
      window.removeEventListener('audio-status', audioListener);
      window.removeEventListener('mic-status', micListener);
    };
  }, []);

  // Log animation state changes
  useEffect(() => {
    console.log('WineImage: Animation state changed - listening:', isListening, 'processing:', isProcessing, 'playing:', isPlaying, 'test:', false);
  }, [isListening, isProcessing, isPlaying]);

  return (
    <CircleAnimation
      isListening={isListening}
      isProcessing={isProcessing}
      isPlaying={isPlaying}
      size={size}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
      }}
    >
      <img 
        src={wineCircleImage} 
        alt="Wine Circle"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          opacity: 1,
          filter: 'none'
        }}
      />
    </CircleAnimation>
  );
};

export default WineImage;