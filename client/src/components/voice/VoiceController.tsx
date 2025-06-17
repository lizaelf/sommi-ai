import React, { useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "../VoiceBottomSheet";
import { useVoiceState } from "./VoiceStateManager";
import { useVoiceAudioManager } from "./VoiceAudioManager";
import { useVoiceRecorder } from "./VoiceRecorder";

interface VoiceControllerProps {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceController: React.FC<VoiceControllerProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = '',
}) => {
  const { toast } = useToast();
  const { state, refs, updateState } = useVoiceState();
  
  const audioManager = useVoiceAudioManager(refs, updateState);
  const recorder = useVoiceRecorder(refs, state, updateState, toast);

  // Initialize welcome audio on mount
  useEffect(() => {
    audioManager.cacheWelcomeMessage();
  }, [audioManager]);

  // Set up TTS audio event listeners
  useEffect(() => {
    const handleTTSStart = () => audioManager.handleTTSAudioStart();
    const handleTTSStop = () => audioManager.handleTTSAudioStop();

    window.addEventListener("tts-audio-start", handleTTSStart);
    window.addEventListener("tts-audio-stop", handleTTSStop);

    return () => {
      window.removeEventListener("tts-audio-start", handleTTSStart);
      window.removeEventListener("tts-audio-stop", handleTTSStop);
    };
  }, [audioManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recorder.cleanup();
      audioManager.stopAllAudio();
    };
  }, [recorder, audioManager]);

  // Handle microphone button click
  const handleMicrophoneClick = async () => {
    if (refs.isManuallyClosedRef.current) {
      console.log("VoiceAssistant: Permanently closed - no automatic reopening until page refresh");
      return;
    }

    if (state.isListening) {
      recorder.stopRecording();
    } else {
      if (!state.showBottomSheet) {
        updateState({ showBottomSheet: true });
        
        // Auto-play welcome message after showing bottom sheet
        setTimeout(() => {
          audioManager.playWelcomeMessage();
        }, 300);
      } else {
        await recorder.startRecording();
      }
    }
  };

  // Handle voice/text choice
  const handleChoice = async (choice: "voice" | "text") => {
    if (choice === "voice") {
      await recorder.startRecording();
    } else {
      updateState({ showBottomSheet: false });
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (prompt: string, pillId?: string, options?: any) => {
    console.log("VoiceBottomSheet: Suggestion clicked:", prompt, "options:", options);
    console.log("VoiceAssistant: Suggestion clicked:", prompt, "with options:", options);
    console.log("🚀 VoiceAssistant: SuggestionPills handles all suggestion logic - voice assistant does nothing");
    
    // Let SuggestionPills handle everything
    // The voice assistant doesn't need to do anything here
  };

  // Handle manual close
  const handleClose = () => {
    console.log("VoiceAssistant: Manual close triggered - setting flag to prevent reopening");
    
    refs.isManuallyClosedRef.current = true;
    updateState({ showBottomSheet: false, isListening: false });
    
    recorder.stopRecording();
    audioManager.stopAllAudio();

    console.log("🎤 VoiceAssistant: Dispatching mic-status \"processing\" event");
    window.dispatchEvent(new CustomEvent('micStatus', { 
      detail: { status: 'processing', timestamp: Date.now() }
    }));

    console.log("VoiceAssistant: Permanently closed - no automatic reopening until page refresh");
  };

  // Handle stop button click
  const handleStopClick = () => {
    console.log("🛑 VoiceAssistant: Stop button clicked");
    audioManager.stopAllAudio();
    recorder.stopRecording();
  };

  return (
    <>
      {/* Microphone Button */}
      <button
        onClick={handleMicrophoneClick}
        disabled={refs.isManuallyClosedRef.current || isProcessing}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: state.isListening ? "#ef4444" : "#3b82f6",
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          transition: "all 0.2s ease",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {state.isListening ? (
            <rect x="6" y="4" width="4" height="16" />
          ) : (
            <>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          )}
        </svg>
      </button>

      {/* Voice Bottom Sheet */}
      {state.showBottomSheet && (
        <VoiceBottomSheet
          isOpen={state.showBottomSheet}
          onClose={handleClose}
          onChoice={handleChoice}
          onSuggestionClick={handleSuggestionClick}
          isListening={state.isListening}
          isProcessing={state.isThinking}
          isResponding={state.isResponding}
          isPlayingAudio={state.isPlayingAudio}
          showUnmuteButton={state.showUnmuteButton}
          showAskButton={state.showAskButton}
          onStopClick={handleStopClick}
          wineKey={wineKey}
        />
      )}
    </>
  );
};

export default VoiceController;