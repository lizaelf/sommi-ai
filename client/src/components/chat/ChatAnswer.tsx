import React from 'react';
import typography from '@/styles/typography';
import { useConversation } from '@/hooks/UseConversation';

interface ChatAnswerProps {
  content: string;
  isUserMessage?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ChatAnswer: React.FC<ChatAnswerProps> = ({
  content,
  isUserMessage = false,
  className = '',
  style = {}
}) => {
  // Format content with bold text and lists
  const formatContent = (content: string, isUserMessage = false) => {
    if (!content) return null;

    const formatText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      );
    };

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    lines.forEach((line, i) => {
      const isListItem = /^[-•*]\s|^\d+\.\s/.test(line.trim());

      if (isListItem) {
        listItems.push(line.trim().replace(/^[-•*]\s|^\d+\.\s/, ""));
      } else {
        if (listItems.length > 0) {
          elements.push(
            <div key={`list-${i}`} style={{ margin: "8px 0" }}>
              {listItems.map((item, j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    marginBottom: "4px",
                    paddingLeft: "8px",
                  }}
                >
                  <span style={{ color: "#6A53E7", marginRight: "8px" }}>
                    •
                  </span>
                  <span>{formatText(item)}</span>
                </div>
              ))}
            </div>,
          );
          listItems = [];
        }

        if (line.trim()) {
          elements.push(
            <div
              key={i}
              style={{
                marginBottom: isUserMessage ? "0px" : "8px",
                whiteSpace: "pre-wrap",
                color: isUserMessage ? "#000000" : "rgba(255, 255, 255, 0.8)",
                ...typography.body,
              }}
            >
              {formatText(line)}
            </div>,
          );
        }
      }
    });

    if (listItems.length > 0) {
      elements.push(
        <div key="final-list" style={{ margin: "8px 0" }}>
          {listItems.map((item, j) => (
            <div
              key={j}
              style={{
                display: "flex",
                marginBottom: "4px",
                paddingLeft: "8px",
              }}
            >
              <span style={{ color: "#6A53E7", marginRight: "8px" }}>•</span>
              <span>{formatText(item)}</span>
            </div>
          ))}
        </div>,
      );
    }

    return <>{elements}</>;
  };

  return (
    <div className={`chat-answer ${className}`} style={style}>
      {formatContent(content, isUserMessage)}
    </div>
  );
};

export default ChatAnswer;