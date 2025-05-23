import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  voiceButtonComponent?: React.ReactNode;
}

// Suggestions are now handled in the parent component

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing, onFocus, onBlur, voiceButtonComponent }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Suggestion click handler removed - now handled in parent component

  return (
    <div className="w-full bg-transparent">
      <div className="w-full bg-transparent">
        {/* Removed duplicate suggestion chips - now handled in the parent component */}

        {/* Input styled like Somm.ai */}
        <form onSubmit={handleSubmit} className="flex items-center w-full px-1 sm:px-2 bg-transparent">
          <div className="flex-1 relative bg-transparent">
            <div className="relative flex items-center bg-transparent">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => onFocus && onFocus()}
                onBlur={() => onBlur && onBlur()}
                style={{
                  display: 'flex',
                  padding: '8px 16px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  alignSelf: 'stretch',
                  borderRadius: '24px',
                  backgroundColor: '#292929',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  width: '100%',
                  height: '64px',
                  outline: 'none',
                  color: 'white',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: '#292929',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: 400,
                  paddingRight: '50px'
                }}
                className="text-sm pr-12 bg-[#292929] !bg-[#292929] placeholder-[#999999]"
                placeholder="Ask me about..."
                disabled={isProcessing}
              />
              {/* Voice button placed inside input on the right */}
              <div className="absolute right-2 z-10">
                {voiceButtonComponent}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;