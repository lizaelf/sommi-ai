import React, { useRef, useEffect } from "react";
import ChatInput from "@/components/ChatInput";
import { ShiningText } from "@/components/ShiningText";
import { ClientMessage } from "@/lib/types";
import typography from "@/styles/typography";

interface SelectedWine {
  id: number;
  name: string;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  location?: string;
  description?: string;
  foodPairing?: string[];
  buyAgainLink?: string;
}

interface WineChatSectionProps {
  wine: SelectedWine;
  messages: ClientMessage[];
  isTyping: boolean;
  hideSuggestions: boolean;
  showChatInput: boolean;
  isKeyboardFocused: boolean;
  currentConversationId: number | null;
  onSendMessage: (content: string) => Promise<void>;
  onSuggestionClick: (content: string) => Promise<void>;
  onKeyboardFocus: (focused: boolean) => void;
}

export const WineChatSection: React.FC<WineChatSectionProps> = ({
  wine,
  messages,
  isTyping,
  hideSuggestions,
  showChatInput,
  isKeyboardFocused,
  currentConversationId,
  onSendMessage,
  onSuggestionClick,
  onKeyboardFocus,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const formatContent = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        paddingTop: "0", // Remove extra padding since header is handled separately
      }}
    >
      {/* Chat Title */}
      <div
        style={{
          padding: "32px 16px 24px 16px",
          textAlign: "left",
        }}
      >
        <h1
          style={{
            ...typography.h1,
            marginBottom: "0",
          }}
        >
          Chat
        </h1>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px",
          paddingBottom: isKeyboardFocused ? "120px" : "160px",
          maxHeight: "calc(100vh - 200px)",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              borderRadius: "12px",
              backgroundColor:
                message.role === "user" ? "#1A1A1A" : "transparent",
              border:
                message.role === "user" ? "1px solid #333" : "none",
            }}
          >
            <div
              style={{
                ...typography.body1R,
                color: message.role === "user" ? "#FFFFFF" : "#CECECE",
              }}
            >
              {formatContent(message.content)}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              marginBottom: "12px",
              padding: "16px",
            }}
          >
            <ShiningText text="Thinking..." />
          </div>
        )}
      </div>

      {/* Chat Input */}
      {showChatInput && (
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            backgroundColor: "#0A0A0A",
            borderTop: "1px solid #333",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          <ChatInput
            onSendMessage={async (message: string) => {
              await onSendMessage(message);
            }}
            isProcessing={isTyping}
            onFocus={() => onKeyboardFocus(true)}
            onBlur={() => onKeyboardFocus(false)}
          />
        </div>
      )}
    </div>
  );
};