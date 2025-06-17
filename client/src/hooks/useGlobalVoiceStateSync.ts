import { useEffect, useCallback } from 'react';

interface VoiceState {
  isListening: boolean;
  isResponding: boolean;
  isThinking: boolean;
  isPlayingAudio: boolean;
  isVoiceActive: boolean;
  showBottomSheet: boolean;
  showUnmuteButton: boolean;
  showAskButton: boolean;
}

const useGlobalVoiceStateSync = (voiceState: VoiceState) => {
  // Sync state to window for CircleAnimation and other components
  useEffect(() => {
    (window as any).voiceAssistantState = {
      ...voiceState,
      isProcessing: voiceState.isThinking
    };
  }, [voiceState]);

  // Dispatch voice volume events for CircleAnimation
  const dispatchVoiceVolume = useCallback((volume: number, threshold: number = 3) => {
    window.dispatchEvent(new CustomEvent('voiceVolume', { 
      detail: { volume, threshold } 
    }));
  }, []);

  // Dispatch microphone status events
  const dispatchMicStatus = useCallback((status: 'idle' | 'listening' | 'processing' | 'thinking') => {
    console.log(`🎤 VoiceAssistant: Dispatching mic-status "${status}" event`);
    window.dispatchEvent(new CustomEvent('mic-status', { 
      detail: { status } 
    }));
  }, []);

  // Dispatch audio playback events
  const dispatchAudioEvent = useCallback((eventType: 'started' | 'ended' | 'error', data?: any) => {
    const eventName = `suggestionPlayback${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`;
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }, []);

  // Update mic status based on voice state
  useEffect(() => {
    if (voiceState.isListening) {
      dispatchMicStatus('listening');
    } else if (voiceState.isThinking) {
      dispatchMicStatus('processing');
    } else if (voiceState.isResponding || voiceState.isPlayingAudio) {
      dispatchMicStatus('thinking');
    } else {
      dispatchMicStatus('idle');
    }
  }, [voiceState.isListening, voiceState.isThinking, voiceState.isResponding, voiceState.isPlayingAudio, dispatchMicStatus]);

  // Expose utilities globally for other components
  useEffect(() => {
    (window as any).voiceStateSync = {
      dispatchVoiceVolume,
      dispatchMicStatus,
      dispatchAudioEvent
    };
  }, [dispatchVoiceVolume, dispatchMicStatus, dispatchAudioEvent]);

  return {
    dispatchVoiceVolume,
    dispatchMicStatus,
    dispatchAudioEvent
  };
};

export default useGlobalVoiceStateSync;