import React from "react";
import { CircleAnimation } from "@/components/animations";
import { ShiningText } from "@/components/animations";
import Button from "@/components/ui/buttons/Button";
import SuggestionPills from "@/components/chat/SuggestionPills";

interface VoiceBottomSheetProps {
  isOpen: boolean;
  isListening: boolean;
  isThinking: boolean;
  isResponding: boolean;
  isPlayingAudio: boolean;
  showUnmuteButton: boolean;
  showAskButton: boolean;
  showSuggestions: boolean;
  onClose: () => void;
  onStop: () => void;
  onAsk: () => void;
  onUnmute: () => void;
  onSuggestionClick: (suggestion: string) => void;
  wineKey?: string;
}

const VoiceBottomSheet: React.FC<VoiceBottomSheetProps> = ({
  isOpen,
  isListening,
  isThinking,
  isResponding,
  isPlayingAudio,
  showUnmuteButton,
  showAskButton,
  showSuggestions,
  onClose,
  onStop,
  onAsk,
  onUnmute,
  onSuggestionClick,
  wineKey = "",
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          width: "100%",
          maxWidth: "500px",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          padding: "32px 0 48px 0",
          minHeight: "380px",
          maxHeight: "80vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 10,
            background: "none",
            border: "none",
            color: "white",
            fontSize: 24,
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          ×
        </button>

        {/* Circle animation */}
        <div style={{ width: 156, height: 156, marginBottom: 24 }}>
          <CircleAnimation isAnimating={isListening || isResponding} size={156} />
        </div>

        {/* Status */}
        {isListening && (
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <ShiningText text="Listening..." />
            <div style={{ color: "#CECECE", fontSize: 16 }}>Please, speak</div>
          </div>
        )}
        {isThinking && (
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <ShiningText text="Thinking..." />
          </div>
        )}

        {/* Кнопки */}
        {(isResponding || isPlayingAudio) && (
          <Button
            onClick={onStop}
            variant="error"
            className="w-full mt-4"
            style={{ width: "90%", margin: "16px auto 0 auto" }}
          >
            <img src="/icons/stop.svg" alt="Stop" width={20} height={20} />
            Stop
          </Button>
        )}
        {showUnmuteButton && (
          <Button
            onClick={onUnmute}
            variant="secondary"
            className="w-full mt-4"
            style={{ width: "90%", margin: "16px auto 0 auto" }}
          >
            <img src="/icons/volume-2.svg" alt="Unmute" width={20} height={20} />
            Unmute
          </Button>
        )}
        {showAskButton && (
          <Button
            onClick={onAsk}
            variant="secondary"
            className="w-full mt-4"
            style={{ width: "90%", margin: "16px auto 0 auto" }}
          >
            <img src="/icons/mic.svg" alt="Ask" width={20} height={20} />
            Ask
          </Button>
        )}

        {/* Suggestion Pills */}
        {showSuggestions && (
          <div style={{ width: "100%", marginTop: 24, padding: "0 16px" }}>
            <SuggestionPills
              wineKey={wineKey}
              onSuggestionClick={onSuggestionClick}
              isDisabled={isListening || isThinking || isResponding || isPlayingAudio}
              preferredResponseType="voice"
              context="voice-assistant"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceBottomSheet;