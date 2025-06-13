import React from "react";
import ChatInput from "./ChatInput";
import VoiceAssistant from "./VoiceAssistant";
import Button from "./ui/Button";

interface ChatInputAreaProps {
  showBuyButton: boolean;
  showChatInput: boolean;
  currentWine?: any;
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  onKeyboardFocus: (focused: boolean) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export default function ChatInputArea({
  showBuyButton,
  showChatInput,
  currentWine,
  onSendMessage,
  isTyping,
  onKeyboardFocus,
  onSuggestionClick,
}: ChatInputAreaProps) {
  return (
    <div
      style={{
        backgroundColor: "#1C1C1C",
        padding: "16px",
        zIndex: 50,
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {showBuyButton && !showChatInput ? (
          <Button
            onClick={() => {
              if (currentWine?.buyAgainLink) {
                window.open(currentWine.buyAgainLink, "_blank");
              } else {
                console.log("No buy again link available");
              }
            }}
            variant="primary"
            style={{
              margin: 0,
              width: "100%",
            }}
          >
            Buy again
          </Button>
        ) : (
          <>
            {/* Suggestion chips */}
            <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
              <Button
                onClick={() => onSuggestionClick("Tasting notes")}
                variant="secondary"
                style={{ height: "32px" }}
              >
                Tasting notes
              </Button>
              <Button
                onClick={() => onSuggestionClick("Simple recipes for this wine")}
                variant="secondary"
                style={{ height: "32px" }}
              >
                Simple recipes
              </Button>
              <Button
                onClick={() => onSuggestionClick("Where is this wine from?")}
                variant="secondary"
                style={{ height: "32px" }}
              >
                Where it's from
              </Button>
            </div>
            <ChatInput
              onSendMessage={onSendMessage}
              isProcessing={isTyping}
              onFocus={() => onKeyboardFocus(true)}
              onBlur={() => onKeyboardFocus(false)}
              voiceButtonComponent={
                <VoiceAssistant
                  onSendMessage={onSendMessage}
                  isProcessing={isTyping}
                />
              }
            />
          </>
        )}
      </div>
    </div>
  );
}