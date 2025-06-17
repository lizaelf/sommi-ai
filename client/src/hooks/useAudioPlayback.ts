import { useRef, useCallback, useState } from 'react';

interface AudioState {
  isPlaying: boolean;
  currentAudio: string | null;
  volume: number;
}

interface AudioPlaybackConfig {
  defaultVolume: number;
  fadeOutDuration: number;
}

const useAudioPlayback = (config: AudioPlaybackConfig = {
  defaultVolume: 1.0,
  fadeOutDuration: 300
}) => {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentAudio: null,
    volume: config.defaultVolume
  });

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const playAudio = useCallback(async (audioSource: string | Blob, onEnded?: () => void) => {
    // Stop any currently playing audio
    stopAudio();

    try {
      const audioUrl = typeof audioSource === 'string' 
        ? audioSource 
        : URL.createObjectURL(audioSource);

      const audio = new Audio(audioUrl);
      audio.volume = audioState.volume;
      currentAudioRef.current = audio;

      setAudioState(prev => ({
        ...prev,
        isPlaying: true,
        currentAudio: audioUrl
      }));

      audio.onended = () => {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          currentAudio: null
        }));
        
        if (typeof audioSource === 'object') {
          URL.revokeObjectURL(audioUrl);
        }
        
        currentAudioRef.current = null;
        onEnded?.();
      };

      audio.onerror = () => {
        console.error('Audio playback failed');
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          currentAudio: null
        }));
        
        if (typeof audioSource === 'object') {
          URL.revokeObjectURL(audioUrl);
        }
        
        currentAudioRef.current = null;
      };

      await audio.play();
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      setAudioState(prev => ({
        ...prev,
        isPlaying: false,
        currentAudio: null
      }));
    }
  }, [audioState.volume]);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      
      // Clean up object URL if it exists
      if (audioState.currentAudio && audioState.currentAudio.startsWith('blob:')) {
        URL.revokeObjectURL(audioState.currentAudio);
      }
      
      currentAudioRef.current = null;
    }

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    setAudioState(prev => ({
      ...prev,
      isPlaying: false,
      currentAudio: null
    }));
  }, [audioState.currentAudio]);

  const pauseAudio = useCallback(() => {
    if (currentAudioRef.current && !currentAudioRef.current.paused) {
      currentAudioRef.current.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (currentAudioRef.current && currentAudioRef.current.paused) {
      currentAudioRef.current.play();
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const fadeOut = useCallback(() => {
    if (!currentAudioRef.current) return;

    const audio = currentAudioRef.current;
    const startVolume = audio.volume;
    const fadeStep = startVolume / (config.fadeOutDuration / 50);

    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume > fadeStep) {
        audio.volume -= fadeStep;
      } else {
        audio.volume = 0;
        stopAudio();
      }
    }, 50);
  }, [config.fadeOutDuration, stopAudio]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    setAudioState(prev => ({ ...prev, volume: clampedVolume }));
    
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = clampedVolume;
    }
  }, []);

  return {
    audioState,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    fadeOut,
    setVolume,
    isPlaying: audioState.isPlaying
  };
};

export default useAudioPlayback;