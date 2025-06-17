import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "./VoiceBottomSheet";
import { WINE_CONFIG } from "../../../shared/wineConfig";

const getDynamicWelcomeMessage = () => {
  return `Ah, the ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard}—a stellar pick. This ${WINE_CONFIG.varietal} is brimming with red and black raspberries, laced with sage and a touch of dark chocolate on the nose. On the palate? Think ripe blackberry and plum wrapped in full-bodied richness, finishing with a lively acidity that lingers. Planning to pop the cork soon? I'd be delighted to offer serving tips or pairing ideas to make the most of it.`;
};

interface VoiceAssistantProps {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
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
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const { toast } = useToast();
  const isManuallyClosedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const welcomeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    cacheWelcomeAudio();
  }, []);

  const cacheWelcomeAudio = async () => {
    try {
      const welcomeMessage = getDynamicWelcomeMessage();
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomeMessage })
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(blobUrl);

        await new Promise<void>((resolve, reject) => {
          audio.oncanplaythrough = () => resolve();
          audio.onerror = () => reject(new Error("Audio failed to load"));
          audio.load();
        });

        welcomeAudioElementRef.current = audio;
        console.log("QR SCAN: fetched and cached welcome audio");
      }
    } catch (err) {
      console.error("QR SCAN: failed to cache welcome audio", err);
    }
  };

  const handleSuggestionClick = (suggestion: string, pillId?: string, options?: any) => {
    console.log("VoiceAssistant: Suggestion clicked:", suggestion, "with options:", options);
    console.log("🚀 VoiceAssistant: SuggestionPills handles all suggestion logic - voice assistant does nothing");
  };

  const stopAudio = () => {
    console.log("🛑 VoiceAssistant: Stopping all audio playback");
    
    const currentAudio = (window as any).currentOpenAIAudio;
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        console.log("🛑 VoiceAssistant: Stopped suggestion TTS audio");
      } catch (e) {
        console.warn("Error stopping OpenAI audio:", e);
      }
      (window as any).currentOpenAIAudio = null;
    }

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {
        console.warn("Error stopping current audio:", e);
      }
      currentAudioRef.current = null;
    }

    window.dispatchEvent(new CustomEvent("tts-audio-stop"));
    console.log("🎤 VoiceAssistant: TTS audio stopped from suggestion");
    console.log("🛑 VoiceAssistant: All audio stopped");
  };

  const handleCloseBottomSheet = () => {
    console.log("Closing bottom sheet");
    isManuallyClosedRef.current = true;
    setShowBottomSheet(false);
    setIsListening(false);
    setIsThinking(false);
    setIsResponding(false);
    setShowUnmuteButton(false);
    setShowAskButton(false);
    stopAudio();
  };

  const handleMute = () => {
    setShowBottomSheet(true);
    setIsThinking(false);
    setShowUnmuteButton(true);
    setIsResponding(false);
    setIsPlayingAudio(false);
    setShowAskButton(false);
  };

  const handleUnmute = async () => {
    if (isManuallyClosedRef.current) return;

    setShowBottomSheet(true);
    setIsListening(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setIsThinking(true);
        setShowAskButton(false);
        setIsListening(false);

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.wav");

          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          onSendMessage(result.text || "I didn't catch that. Could you please try again?");
          
          setIsThinking(false);
          setShowAskButton(true);
          setIsListening(false);
        } catch (error) {
          console.error("Speech recognition error:", error);
          toast({
            title: "Speech Recognition Error",
            description: "There was an issue processing your speech. Please try again.",
            variant: "destructive",
          });
        }

        audioChunksRef.current = [];
      };

      setIsListening(true);
      setShowBottomSheet(true);
    } catch (error) {
      console.error("Microphone access error:", error);
      setIsListening(false);
      setIsThinking(false);
    }
  };

  const handleAsk = () => {
    if (!isManuallyClosedRef.current) {
      setShowBottomSheet(true);
      setIsListening(true);
      setIsThinking(false);
      setIsResponding(false);
      setShowUnmuteButton(false);
      setShowAskButton(false);
    }
  };

  return (
    <div className="voice-assistant">
      <VoiceBottomSheet
        isOpen={showBottomSheet}
        onClose={handleCloseBottomSheet}
        onMute={handleMute}
        onUnmute={handleUnmute}
        onAsk={handleAsk}
        onStopAudio={stopAudio}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isThinking}
        isVoiceActive={isVoiceActive}
        isPlayingAudio={isPlayingAudio}
        wineKey={wineKey}
        showSuggestions={showAskButton && !isListening && !isResponding && !isThinking}
        showUnmuteButton={showUnmuteButton && !isListening && !isResponding && !isThinking}
        showAskButton={showAskButton && !isListening && !isResponding && !isThinking}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default VoiceAssistant;