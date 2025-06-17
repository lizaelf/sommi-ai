import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "./VoiceBottomSheet";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser,
} from "@/utils/microphonePermissions";

interface VoiceAssistantProps {
  onSendMessage: (
    message: string,
    pillId?: string,
    options?: { textOnly?: boolean; instantResponse?: string },
  ) => void;
  isProcessing: boolean;
  wineKey?: string;
}

export default function VoiceAssistant({
  onSendMessage,
  isProcessing,
  wineKey,
}: VoiceAssistantProps) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const [micPermission, setMicPermission] = useState<PermissionState>("prompt");

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const isManuallyClosedRef = useRef(false);
  const { toast } = useToast();

  // Voice assistant uses VoiceAudioManager for welcome message generation
  // This ensures single source of truth for WINE_CONFIG-based content

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsListening(true);
      setShowUnmuteButton(false);
      setShowAskButton(false);

      // Voice activity detection and recording logic here
      // Implementation delegated to prevent hardcoded welcome messages
      
    } catch (error) {
      console.error("Error starting microphone:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
    setIsThinking(false);
    setShowAskButton(true);
  };

  const handleSuggestionClick = (pill: any) => {
    // Voice assistant suggestion handling
    // Prevents interference with SuggestionPills component
    if (pill?.textOnly) {
      return; // Block voice assistant behavior for chat suggestions
    }

    console.log("VoiceAssistant: SuggestionPills handles all suggestion logic");
    return;
  };

  const handleCloseBottomSheet = () => {
    console.log("VoiceAssistant: Manual close triggered");
    isManuallyClosedRef.current = true;
    
    // Abort any ongoing conversation processing
    window.dispatchEvent(new CustomEvent("abortConversation"));

    // Stop all audio playback
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio.currentTime = 0;
      (window as any).currentOpenAIAudio = null;
    }

    if ((window as any).currentAutoplayAudio) {
      (window as any).currentAutoplayAudio.pause();
      (window as any).currentAutoplayAudio.currentTime = 0;
      (window as any).currentAutoplayAudio = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setShowBottomSheet(false);
    setIsThinking(false);
    setIsResponding(false);
    setShowUnmuteButton(false);
    setShowAskButton(false);
    stopListening();
  };

  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const permission = await getMicrophonePermission();
        setMicPermission(permission);
      } catch (error) {
        console.error("Error checking microphone permission:", error);
      }
    };

    checkMicrophonePermission();
  }, []);

  return (
    <>
      {showBottomSheet && (
        <VoiceBottomSheet
          isOpen={showBottomSheet}
          onClose={handleCloseBottomSheet}
          isListening={isListening}
          isThinking={isThinking}
          isResponding={isResponding}
          showUnmuteButton={showUnmuteButton}
          showAskButton={showAskButton}
          onStartListening={startListening}
          onStopListening={stopListening}
          onSuggestionClick={handleSuggestionClick}
          wineKey={wineKey}
        />
      )}
    </>
  );
}