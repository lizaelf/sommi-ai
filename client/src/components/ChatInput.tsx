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
              {/* Voice button placed inside input on the left */}
              <div className="absolute left-3 z-10">
                {voiceButtonComponent}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => onFocus && onFocus()}
                onBlur={() => onBlur && onBlur()}
                className="w-full h-12 bg-[#1e1e1e] rounded-full pl-12 pr-4 outline-none text-white shadow-none text-sm placeholder-gray-400"
                placeholder="Ask me about..."
                disabled={isProcessing}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;