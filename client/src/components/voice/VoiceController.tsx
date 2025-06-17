import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "../VoiceBottomSheet";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
} from "@/utils/microphonePermissions";

interface VoiceControllerProps {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isProcessing: boolean;
  wineKey?: string;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const isManuallyClosedRef = useRef(false);
  const welcomeAudioCacheRef = useRef<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Share state globally for CircleAnimation
  useEffect(() => {
    (window as any).voiceAssistantState = {
      isListening,
      isProcessing: isThinking,
      isResponding,
      showBottomSheet,
      isPlayingAudio
    };
  }, [isListening, isThinking, isResponding, showBottomSheet, isPlayingAudio]);

  // Initialize welcome message cache - handled by VoiceAudioManager
  useEffect(() => {
    const initializeWelcomeCache = async () => {
      const globalCache = (window as any).globalWelcomeAudioCache;
      if (globalCache) {
        welcomeAudioCacheRef.current = globalCache;
        return;
      }

      // Welcome message generation delegated to VoiceAudioManager using WINE_CONFIG
      console.log('VoiceController: Welcome audio handled by VoiceAudioManager');
    };

    initializeWelcomeCache();
  }, []);

  const handleUnmute = async () => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      setShowUnmuteButton(false);
      setIsPlayingAudio(false);
      setShowAskButton(true);

      // Use cached welcome audio if available
      if (welcomeAudioCacheRef.current) {
        const audio = new Audio(welcomeAudioCacheRef.current);
        currentAudioRef.current = audio;
        
        audio.addEventListener('ended', () => {
          setIsPlayingAudio(false);
          setShowAskButton(true);
          console.log('Welcome audio completed');
        });

        setIsPlayingAudio(true);
        await audio.play();
        return;
      }

      // Fallback to browser TTS if no cached audio
      console.log('Using fallback browser TTS for welcome message');
      const fallbackMessage = "Welcome to your wine exploration experience. I'm here to help you discover more about your wine collection.";
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(fallbackMessage);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => {
          setIsPlayingAudio(true);
        };
        
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setShowAskButton(true);
        };
        
        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Failed to play welcome audio:', error);
      setShowUnmuteButton(false);
      setIsPlayingAudio(false);
      setShowAskButton(true);
    }
  };

  const handleMicrophoneClick = async () => {
    console.log('Voice button clicked - showing bottom sheet');
    setShowBottomSheet(true);
  };

  const handleBottomSheetClose = () => {
    setShowBottomSheet(false);
    isManuallyClosedRef.current = true;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {showUnmuteButton && (
          <button
            onClick={handleUnmute}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            aria-label="Unmute welcome message"
          >
            🔊
          </button>
        )}
        
        {showAskButton && (
          <button
            onClick={handleMicrophoneClick}
            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
            aria-label="Ask voice assistant"
          >
            🎤
          </button>
        )}
      </div>

      <VoiceBottomSheet
        isOpen={showBottomSheet}
        onClose={handleBottomSheetClose}
        onSendMessage={onSendMessage}
        isProcessing={isProcessing}
        wineKey={wineKey}
      />
    </>
  );
};

export default VoiceController;