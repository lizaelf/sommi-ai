import React, { useState, useRef, useEffect, useCallback } from "react";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";

import { Wine } from "@/types/wine";
import VoiceStateManager from './VoiceStateManager';
import VoiceAudioManager from './VoiceAudioManager';
import VoiceRecorder from './VoiceRecorder';

interface VoiceAssistantProps {
  onSendMessage: (
    message: string,
    pillId?: string,
    options?: { textOnly?: boolean; instantResponse?: string },
  ) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = "",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [wine, setWine] = useState<Wine | null>(null);
  const [loadingState, setLoadingState] = useState<
    "loading" | "loaded" | "error" | "notfound"
  >("loading");

  // Audio cache refs
  const welcomeAudioCacheRef = useRef<string | null>(null);
  const welcomeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Для контролю закриття асистента вручну
  const isManuallyClosedRef = useRef(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);

  // Завантаження даних про вино по wineKey
  useEffect(() => {
    if (!wineKey) return;
    let isMounted = true;
    const loadWineData = async () => {
      setLoadingState("loading");
      try {
        const response = await fetch(`/api/wines/${wineKey}`);
        if (!isMounted) return;
        if (response.ok) {
          const wineData = await response.json();
          setWine(wineData);
          setLoadingState("loaded");
        } else if (response.status === 404) {
          setWine(null);
          setLoadingState("notfound");
        } else {
          setWine(null);
          setLoadingState("error");
        }
      } catch (error) {
        if (isMounted) {
          setWine(null);
          setLoadingState("error");
        }
      }
    };
    loadWineData();
    return () => {
      isMounted = false;
    };
  }, [wineKey]);

  // Динамічний welcome message на основі даних з бази
  const getDynamicWelcomeMessage = useCallback(() => {
    if (!wine)
      return "Welcome! What would you like to know about this wine?";
    return `Ah, the ${wine.year} ${wine.name}—a stellar pick. This wine is brimming with character. Planning to pop the cork soon? I'd be delighted to offer serving tips or pairing ideas to make the most of it.`;
  }, [wine]);

  // Кешування welcome-аудіо при зміні вина
  const cacheWelcomeMessage = useCallback(async () => {
    if (welcomeAudioCacheRef.current) return; // Уже закешовано

    try {
      const welcomeMessage = getDynamicWelcomeMessage();

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: welcomeMessage }),
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const audioBlob = new Blob([buffer], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Pre-create audio element for instant playback
        const audioElement = new Audio(audioUrl);
        audioElement.preload = "auto";

        // Wait for audio to be fully loaded
        await new Promise((resolve, reject) => {
          audioElement.oncanplaythrough = resolve;
          audioElement.onerror = reject;
          audioElement.load();
        });

        welcomeAudioCacheRef.current = audioUrl;
        welcomeAudioElementRef.current = audioElement;
      }
    } catch (error) {
      console.error("Failed to cache welcome message:", error);
    }
  }, [getDynamicWelcomeMessage]);

  // Кешування welcome-аудіо при зміні вина
  useEffect(() => {
    // Очистити попередній кеш
    if (welcomeAudioCacheRef.current) {
      URL.revokeObjectURL(welcomeAudioCacheRef.current);
      welcomeAudioCacheRef.current = null;
    }
    if (welcomeAudioElementRef.current) {
      welcomeAudioElementRef.current.pause();
      welcomeAudioElementRef.current = null;
    }
    if (wine) {
      cacheWelcomeMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wine, cacheWelcomeMessage]);

  // --- Основний функціонал VoiceAssistant (мікрофон, аудіо, UI, обробники подій) ---

  // Відкрити асистент і програти welcome-аудіо
  const handleOpenAssistant = useCallback(async () => {
    setShowBottomSheet(true);
    setShowAskButton(false);
    setIsResponding(true);
    setIsThinking(false);
    setIsPlayingAudio(true);
    setShowUnmuteButton(false);

    // Відтворити закешоване welcome-аудіо
    if (welcomeAudioElementRef.current) {
      const audio = welcomeAudioElementRef.current;
      audio.currentTime = 0;
      audio.onended = () => {
        setIsResponding(false);
        setShowAskButton(true);
        setIsPlayingAudio(false);
      };
      try {
        await audio.play();
      } catch (e) {
        setIsResponding(false);
        setShowAskButton(true);
        setIsPlayingAudio(false);
      }
    } else {
      setIsResponding(false);
      setShowAskButton(true);
      setIsPlayingAudio(false);
    }
  }, []);

  // Закрити асистент
  const handleCloseBottomSheet = useCallback(() => {
    setShowBottomSheet(false);
    setIsResponding(false);
    setIsThinking(false);
    setIsPlayingAudio(false);
    setShowUnmuteButton(false);
    setShowAskButton(false);
    isManuallyClosedRef.current = true;
    if (welcomeAudioElementRef.current) {
      welcomeAudioElementRef.current.pause();
      welcomeAudioElementRef.current.currentTime = 0;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
  }, []);

  // Відкрити асистент при першому рендері (можете замінити на свою логіку)
  useEffect(() => {
    if (wine) {
      handleOpenAssistant();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wineKey]);

  const handleAsk = () => {
    if (window.voiceRecorder) {
      window.voiceRecorder.startRecording();
      setTimeout(() => {
        if (window.voiceRecorder) window.voiceRecorder.stopRecording();
      }, 4000);
    }
  };

  return (
    <VoiceStateManager>
      {({
        isListening, isResponding, isThinking, isPlayingAudio, isVoiceActive,
        showBottomSheet, showUnmuteButton, showAskButton, updateState, resetState
      }) => (
        <>
          <VoiceAudioManager
            onAudioStateChange={({ isPlayingAudio }) => updateState({ isPlayingAudio })}
          />
          <VoiceRecorder
            onRecordingStateChange={({ isListening, isVoiceActive }) => updateState({ isListening, isVoiceActive })}
            onRecordingComplete={async (audioBlob) => {
              updateState({ isThinking: true, isListening: false });
              // ...send to /api/transcribe, call onSendMessage...
              updateState({ isThinking: false, showAskButton: true });
            }}
            onRecordingError={(err) => {
              updateState({ isListening: false, showAskButton: true });
            }}
          />
        </>
      )}
    </VoiceStateManager>
  );
};

export default VoiceAssistant;
