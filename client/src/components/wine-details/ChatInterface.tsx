import React, { useRef, useEffect } from 'react';
import ChatInput from '@/components/ChatInput';
import SuggestionPills from '@/components/SuggestionPills';
import { ShiningText } from '@/components/ShiningText';
import { ClientMessage } from '@/lib/types';
import typography from '@/styles/typography';

interface SelectedWine {
  id: number;
  name: string;
  year?: number;
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

interface ChatInterfaceProps {
  wine: SelectedWine | null;
  messages: ClientMessage[];
  isTyping: boolean;
  isKeyboardFocused: boolean;
  showScrollToBottom: boolean;
  onSendMessage: (message: string) => void;
  onTextOnlySuggestion: (prompt: string, pillId?: string, options?: any) => void;
  onScrollToBottom: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onMicClick?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  wine,
  messages,
  isTyping,
  isKeyboardFocused,
  showScrollToBottom,
  onSendMessage,
  onTextOnlySuggestion,
  onScrollToBottom,
  onFocus,
  onBlur,
  onMicClick,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom || messages.length === 1) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <>
      {/* Chat Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
        style={{
          padding: "0",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          paddingTop: messages.length > 0 ? "20px" : "0",
        }}
      >
        <div className={messages.length > 0 ? "max-w-3xl mx-auto w-full" : "w-full"}>
          {/* Chat Title - Only show when there are messages */}
          {messages.length > 0 && (
            <h1
              style={{
                ...typography.h1,
                color: "white",
                textAlign: "left",
                marginBottom: "24px",
                paddingLeft: "16px",
                paddingRight: "16px",
              }}
            >
              Chat
            </h1>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                paddingLeft: "16px",
                paddingRight: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  backgroundColor:
                    message.role === "user"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(255, 255, 255, 0.05)",
                  color: "white",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  ...typography.body,
                  lineHeight: "1.5",
                  wordWrap: "break-word",
                }}
              >
                {message.content}
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

        {/* Extra space at the bottom */}
        <div style={{ height: "80px" }}></div>
      </div>

      {/* Input Area - Fixed to Bottom */}
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
        <div className={messages.length > 0 ? "max-w-3xl mx-auto" : "w-full"}>
          {/* Dynamic Suggestion Pills - Wine-specific */}
          <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 w-full">
            <SuggestionPills
              wineKey={wine ? `wine_${wine.id}` : 'default_wine'}
              onSuggestionClick={onTextOnlySuggestion}
              isDisabled={isTyping}
              preferredResponseType="text"
              context="chat"
            />
          </div>
          <ChatInput
            onSendMessage={onSendMessage}
            isProcessing={isTyping}
            onFocus={onFocus}
            onBlur={onBlur}
            onMicClick={onMicClick}
          />
        </div>
      </div>

      {/* Scroll to Bottom Floating Button */}
      {showScrollToBottom && (
        <button
          onClick={onScrollToBottom}
          style={{
            position: "fixed",
            bottom: "100px",
            right: "20px",
            width: "48px",
            height: "48px",
            borderRadius: "24px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 16l-4-4h8l-4 4z" fill="white" />
            <path d="M12 20l-4-4h8l-4 4z" fill="white" opacity="0.6" />
          </svg>
        </button>
      )}
    </>
  );
};

export default ChatInterface;