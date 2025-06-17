import { useRef, useCallback, useEffect } from 'react';
import { getDynamicWelcomeMessage } from '../../../shared/wineConfig';

interface WelcomeMessageCache {
  audioUrl: string | null;
  text: string | null;
  isLoading: boolean;
}

const useWelcomeMessage = () => {
  const cacheRef = useRef<WelcomeMessageCache>({
    audioUrl: null,
    text: null,
    isLoading: false
  });

  const initializeWelcomeCache = useCallback(async () => {
    // Check if global cache exists
    const globalCache = (window as any).globalWelcomeAudioCache;
    if (globalCache) {
      cacheRef.current.audioUrl = globalCache;
      return globalCache;
    }

    if (cacheRef.current.isLoading) {
      return null;
    }

    cacheRef.current.isLoading = true;

    try {
      // Get dynamic welcome message
      const welcomeMessage = getDynamicWelcomeMessage();
      cacheRef.current.text = welcomeMessage;
      
      // Generate audio
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomeMessage })
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        cacheRef.current.audioUrl = audioUrl;
        (window as any).globalWelcomeAudioCache = audioUrl;
        
        console.log("Welcome message cached successfully");
        return audioUrl;
      }
    } catch (error) {
      console.error("Failed to cache welcome message:", error);
    } finally {
      cacheRef.current.isLoading = false;
    }

    return null;
  }, []);

  const getWelcomeAudio = useCallback(() => {
    return cacheRef.current.audioUrl;
  }, []);

  const getWelcomeText = useCallback(() => {
    if (!cacheRef.current.text) {
      cacheRef.current.text = getDynamicWelcomeMessage();
    }
    return cacheRef.current.text;
  }, []);

  const generateFreshWelcomeAudio = useCallback(async () => {
    const welcomeMessage = getDynamicWelcomeMessage();
    
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomeMessage })
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Update cache
        if (cacheRef.current.audioUrl && cacheRef.current.audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(cacheRef.current.audioUrl);
        }
        
        cacheRef.current.audioUrl = audioUrl;
        (window as any).globalWelcomeAudioCache = audioUrl;
        
        return audioUrl;
      }
    } catch (error) {
      console.error("Fresh welcome audio generation failed:", error);
    }
    
    return null;
  }, []);

  const clearCache = useCallback(() => {
    if (cacheRef.current.audioUrl && cacheRef.current.audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cacheRef.current.audioUrl);
    }
    
    cacheRef.current = {
      audioUrl: null,
      text: null,
      isLoading: false
    };
    
    delete (window as any).globalWelcomeAudioCache;
  }, []);

  // Initialize cache on mount
  useEffect(() => {
    initializeWelcomeCache();
  }, [initializeWelcomeCache]);

  return {
    initializeWelcomeCache,
    getWelcomeAudio,
    getWelcomeText,
    generateFreshWelcomeAudio,
    clearCache,
    isLoading: cacheRef.current.isLoading
  };
};

export default useWelcomeMessage;