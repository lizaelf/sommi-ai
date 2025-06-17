import { useEffect, useCallback } from 'react';

interface VoiceAssistantEventCallbacks {
  onTriggerVoiceAssistant?: () => void;
  onPlayAudioResponse?: (audioBlob: Blob) => void;
  onSuggestionPlaybackStarted?: () => void;
  onSuggestionPlaybackEnded?: () => void;
  onCachedResponseEnded?: () => void;
}

const useVoiceAssistantEvents = (callbacks: VoiceAssistantEventCallbacks = {}) => {
  const handleTriggerVoiceAssistant = useCallback(() => {
    callbacks.onTriggerVoiceAssistant?.();
  }, [callbacks]);

  const handlePlayAudioResponse = useCallback((event: any) => {
    const { audioBlob } = event.detail;
    if (audioBlob) {
      callbacks.onPlayAudioResponse?.(audioBlob);
    }
  }, [callbacks]);

  const handleSuggestionPlaybackStarted = useCallback(() => {
    callbacks.onSuggestionPlaybackStarted?.();
  }, [callbacks]);

  const handleSuggestionPlaybackEnded = useCallback(() => {
    callbacks.onSuggestionPlaybackEnded?.();
  }, [callbacks]);

  const handleCachedResponseEnded = useCallback(() => {
    callbacks.onCachedResponseEnded?.();
  }, [callbacks]);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
    window.addEventListener('playAudioResponse', handlePlayAudioResponse);
    window.addEventListener('suggestionPlaybackStarted', handleSuggestionPlaybackStarted);
    window.addEventListener('suggestionPlaybackEnded', handleSuggestionPlaybackEnded);
    window.addEventListener('cachedResponseEnded', handleCachedResponseEnded);

    return () => {
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
      window.removeEventListener('playAudioResponse', handlePlayAudioResponse);
      window.removeEventListener('suggestionPlaybackStarted', handleSuggestionPlaybackStarted);
      window.removeEventListener('suggestionPlaybackEnded', handleSuggestionPlaybackEnded);
      window.removeEventListener('cachedResponseEnded', handleCachedResponseEnded);
    };
  }, [
    handleTriggerVoiceAssistant,
    handlePlayAudioResponse,
    handleSuggestionPlaybackStarted,
    handleSuggestionPlaybackEnded,
    handleCachedResponseEnded
  ]);

  // Utility functions to trigger events
  const triggerVoiceAssistant = useCallback(() => {
    window.dispatchEvent(new CustomEvent('triggerVoiceAssistant'));
  }, []);

  const playAudioResponse = useCallback((audioBlob: Blob) => {
    window.dispatchEvent(new CustomEvent('playAudioResponse', { 
      detail: { audioBlob } 
    }));
  }, []);

  const notifySuggestionPlayback = useCallback((started: boolean) => {
    const eventName = started ? 'suggestionPlaybackStarted' : 'suggestionPlaybackEnded';
    window.dispatchEvent(new CustomEvent(eventName));
  }, []);

  const notifyCachedResponseEnded = useCallback(() => {
    window.dispatchEvent(new CustomEvent('cachedResponseEnded'));
  }, []);

  return {
    triggerVoiceAssistant,
    playAudioResponse,
    notifySuggestionPlayback,
    notifyCachedResponseEnded
  };
};

export default useVoiceAssistantEvents;