import React from "react";
import { ShiningText } from "@/components/animations/ShiningText";
import typography from "@/styles/typography";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessageListProps {
  messages: Message[];
  isTyping: boolean;
  formatContent: (content: string) => React.ReactNode;
}

export default function ChatMessageList({ messages, isTyping, formatContent }: ChatMessageListProps) {
  return (
    <div id="conversation" className="space-y-4 mb-96" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
      {messages.length > 0 ? (
        <>
          {messages.map((message: Message, index: number) => (
            <div
              key={`${message.id}-${index}`}
              style={{
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                width: "100%",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  backgroundColor: message.role === "user" ? "#F5F5F5" : "transparent",
                  borderRadius: "16px",
                  padding: "16px",
                  width: message.role === "user" ? "fit-content" : "100%",
                  maxWidth: message.role === "user" ? "80%" : "100%",
                }}
              >
                {message.role === "assistant" ? (
                  <div
                    style={{
                      color: "#DBDBDB",
                      ...typography.body,
                    }}
                  >
                    {formatContent(message.content)}
                  </div>
                ) : (
                  <div
                    style={{
                      color: "#000000",
                      ...typography.body,
                    }}
                  >
                    {formatContent(message.content)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      ) : null}

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
  );
}

export type { Message };