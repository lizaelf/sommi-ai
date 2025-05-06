import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

// Suggestions are now handled in the parent component

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing }) => {
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
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-10 sm:h-12 bg-white rounded-xl px-3 sm:px-6 outline-none text-gray-700 shadow-input text-sm sm:text-base"
              placeholder="Ask about Cabernet Sauvignon..."
              disabled={isProcessing}
            />

          </div>
          
          {/* Send button styled as a purple circle */}
          <button
            type="submit"
            className={`ml-1.5 sm:ml-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
              isProcessing || !message.trim() 
                ? 'border border-gray-300 text-gray-300 cursor-not-allowed' 
                : 'border border-[#6A53E7] text-[#6A53E7] hover:bg-purple-50'
            } transition-colors`}
            disabled={isProcessing || !message.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;