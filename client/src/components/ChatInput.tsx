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
    <div className="w-full">
      <div className="w-full">
        {/* Removed duplicate suggestion chips - now handled in the parent component */}

        {/* Input styled like Somm.ai */}
        <form onSubmit={handleSubmit} className="flex items-center w-full px-1 sm:px-2">
          <div className="flex-1 relative">
            <div className="relative flex items-center">
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
                  padding: '8px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  alignSelf: 'stretch',
                  borderRadius: '24px',
                  backgroundColor: '#292929',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  width: '100%',
                  height: '56px',
                  outline: 'none',
                  color: 'white'
                }}
                className="text-sm placeholder-gray-400 pr-12"
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