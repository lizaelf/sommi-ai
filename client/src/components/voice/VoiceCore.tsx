import React, { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/UseToast";
import { WINE_CONFIG } from "../../../../shared/wineConfig";

// Core voice functionality with clean state management
export interface VoiceState {
  isListening: boolean;
  isThinking: boolean;
  isResponding: boolean;
  isPlayingAudio: boolean;
  showBottomSheet: boolean;
  showUnmuteButton: boolean;
  showAskButton: boolean;
}

export interface VoiceCallbacks {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  onStateChange?: (state: VoiceState) => void;
}

export interface VoiceCoreProps extends VoiceCallbacks {
  wineKey?: string;
  isProcessing?: boolean;
}

export const useVoiceCore = ({ onSendMessage, onStateChange, wineKey = '', isProcessing = false }: VoiceCoreProps) => {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isThinking: false,
    isResponding: false,
    isPlayingAudio: false,
    showBottomSheet: false,
    showUnmuteButton: false,
    showAskButton: false
  });

  const isManuallyClosedRef = useRef(false);
  const welcomeAudioCacheRef = useRef<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Update global state for CircleAnimation
  useEffect(() => {
    (window as any).voiceAssistantState = {
      ...state,
      isProcessing: state.isThinking
    };
    onStateChange?.(state);
  }, [state, onStateChange]);

  const updateState = useCallback((updates: Partial<VoiceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const playWelcomeMessage = useCallback(async () => {
    try {
      console.log("Caching dynamic welcome message for instant playback");
      
      // Check for cached audio first
      const globalCache = (window as any).globalWelcomeAudioCache;
      if (globalCache) {
        welcomeAudioCacheRef.current = globalCache;
        const audio = new Audio(globalCache);
        currentAudioRef.current = audio;
        
        updateState({ isPlayingAudio: true });
        await audio.play();
        
        audio.onended = () => {
          updateState({ isPlayingAudio: false, showUnmuteButton: true, showAskButton: true });
        };
        return;
      }

      // Generate dynamic welcome message using WINE_CONFIG
      const wineName = `${WINE_CONFIG.vintage} ${WINE_CONFIG.winery} "${WINE_CONFIG.vineyard}"`;
      const welcomeMessage = `Hello, I see you're looking at the ${wineName}, an excellent choice. This ${WINE_CONFIG.varietal} expresses a nose of red and black raspberry, sage, and dark chocolate, followed by mid-palate that is full bodied and features flavors of blackberry and ripe plum, ending with juicy acidity and a lengthy finish. Are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.`;
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomeMessage })
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Cache for future use
        welcomeAudioCacheRef.current = audioUrl;
        (window as any).globalWelcomeAudioCache = audioUrl;
        
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        updateState({ isPlayingAudio: true });
        await audio.play();
        
        audio.onended = () => {
          updateState({ isPlayingAudio: false, showUnmuteButton: true, showAskButton: true });
        };
      }
    } catch (error) {
      console.error('Welcome message playback failed:', error);
      updateState({ isPlayingAudio: false, showUnmuteButton: true, showAskButton: true });
    }
  }, [updateState]);

  const handleVoiceActivation = useCallback(async () => {
    if (isManuallyClosedRef.current) {
      console.log("VoiceCore: Permanently closed - no automatic reopening until page refresh");
      return;
    }

    console.log("User chose Voice option");
    updateState({ showBottomSheet: true });
    
    // Play welcome message immediately
    await playWelcomeMessage();
  }, [playWelcomeMessage, updateState]);

  const handleClose = useCallback(() => {
    console.log("VoiceCore: Manual close triggered - setting flag to prevent reopening");
    isManuallyClosedRef.current = true;
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    
    updateState({
      showBottomSheet: false,
      isListening: false,
      isPlayingAudio: false,
      isResponding: false,
      isThinking: false,
      showUnmuteButton: false,
      showAskButton: false
    });
    
    console.log("VoiceCore: Permanently closed - no automatic reopening until page refresh");
  }, [updateState]);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    updateState({ isPlayingAudio: false });
  }, [updateState]);

  return {
    state,
    updateState,
    handleVoiceActivation,
    handleClose,
    stopAudio,
    playWelcomeMessage,
    isManuallyClosedRef
  };
};