import React from 'react';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';

interface ChatQuestionProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'brand' | 'error' | 'suggestion' | 'headerIcon' | 'secondaryIcon';
  className?: string;
}

const ChatQuestion: React.FC<ChatQuestionProps> = ({
  text,
  onClick,
  disabled = false,
  loading = false,
  variant = 'suggestion',
  className = ''
}) => {
  return (
    <Button
      variant={variant}
      disabled={disabled || loading}
      onClick={onClick}
      className={`chat-question-button react-button ${className} ${
        loading ? 'opacity-70' : 'opacity-100'
      }`}
      style={{
        ...typography.buttonPlus1,
        minWidth: "fit-content",
        transition: "opacity 0.2s ease",
        position: "relative",
      }}
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              border: "2px solid #e5e7eb",
              borderTop: "2px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          Loading...
        </div>
      ) : (
        text
      )}
    </Button>
  );
};

export default ChatQuestion;