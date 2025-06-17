import React, { useState, useRef, useEffect, useCallback } from "react";

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

interface VoiceStateManagerProps {
  children: (state: VoiceState & {
    updateState: (updates: Partial<VoiceState>) => void;
    resetState: () => void;
  }) => React.ReactNode;
}

export const VoiceStateManager: React.FC<VoiceStateManagerProps> = ({ children }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isResponding: false,
    isThinking: false,
    isPlayingAudio: false,
    isVoiceActive: false,
    showBottomSheet: false,
    showUnmuteButton: false,
    showAskButton: false,
  });

  const isManuallyClosedRef = useRef(false);

  // Share state globally for CircleAnimation and other components
  useEffect(() => {
    (window as any).voiceAssistantState = {
      ...voiceState,
      isProcessing: voiceState.isThinking
    };
  }, [voiceState]);

  const updateState = useCallback((updates: Partial<VoiceState>) => {
    setVoiceState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setVoiceState({
      isListening: false,
      isResponding: false,
      isThinking: false,
      isPlayingAudio: false,
      isVoiceActive: false,
      showBottomSheet: false,
      showUnmuteButton: false,
      showAskButton: false,
    });
    isManuallyClosedRef.current = false;
  }, []);

  // Handle voice assistant events
  useEffect(() => {
    const handleSuggestionPlayback = () => {
      updateState({ 
        isResponding: true, 
        isPlayingAudio: true, 
        showUnmuteButton: true, 
        showAskButton: false 
      });
    };

    const handleSuggestionPlaybackEnded = () => {
      if (!isManuallyClosedRef.current) {
        updateState({ 
          isResponding: false, 
          isPlayingAudio: false, 
          showUnmuteButton: false, 
          showAskButton: true 
        });
      }
    };

    const handleTriggerVoiceAssistant = () => {
      // Show bottom sheet immediately for instant response
      updateState({
        showBottomSheet: true,
        showAskButton: false,
        isResponding: true
      });
      sessionStorage.setItem('voice_bottom_sheet_shown', 'true');
    };

    const handlePlayAudioResponse = (event: any) => {
      const { audioBlob } = event.detail;
      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        updateState({ 
          isPlayingAudio: true, 
          showUnmuteButton: true, 
          showAskButton: false 
        });

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (!isManuallyClosedRef.current) {
            updateState({ 
              isResponding: false, 
              isPlayingAudio: false, 
              showUnmuteButton: false, 
              showAskButton: true 
            });
          }
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (!isManuallyClosedRef.current) {
            updateState({ 
              isResponding: false, 
              isPlayingAudio: false, 
              showUnmuteButton: false, 
              showAskButton: true 
            });
          }
        };

        audio.play();
      }
    };

    const handleCachedResponseEnded = () => {
      console.log("Cached response playback ended - resetting to Ask button");
      if (!isManuallyClosedRef.current) {
        updateState({
          isResponding: false,
          showUnmuteButton: false,
          showAskButton: true,
          isThinking: false
        });
      }
    };

    // Event listeners
    window.addEventListener('suggestionPlaybackStarted', handleSuggestionPlayback);
    window.addEventListener('suggestionPlaybackEnded', handleSuggestionPlaybackEnded);
    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
    window.addEventListener('playAudioResponse', handlePlayAudioResponse);
    window.addEventListener('cachedResponseEnded', handleCachedResponseEnded);

    return () => {
      window.removeEventListener('suggestionPlaybackStarted', handleSuggestionPlayback);
      window.removeEventListener('suggestionPlaybackEnded', handleSuggestionPlaybackEnded);
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant);
      window.removeEventListener('playAudioResponse', handlePlayAudioResponse);
      window.removeEventListener('cachedResponseEnded', handleCachedResponseEnded);
    };
  }, [updateState]);

  // Handle close button
  const handleClose = useCallback(() => {
    isManuallyClosedRef.current = true;
    updateState({
      showBottomSheet: false,
      isListening: false,
      isResponding: false,
      isThinking: false,
      isPlayingAudio: false,
      showUnmuteButton: false,
      showAskButton: false
    });

    // Stop any playing audio
    if ((window as any).voiceAudioManager) {
      (window as any).voiceAudioManager.stopAudio();
    }

    // Stop recording
    if ((window as any).voiceRecorder) {
      (window as any).voiceRecorder.stopRecording();
    }
  }, [updateState]);

  // Expose close handler globally
  useEffect(() => {
    (window as any).voiceAssistantClose = handleClose;
  }, [handleClose]);

  return children({
    ...voiceState,
    updateState,
    resetState
  });
};

export default VoiceStateManager;