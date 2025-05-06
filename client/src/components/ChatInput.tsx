import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSend = () => {
    if (message.trim() && !isProcessing) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex-1 flex items-center">
      <input
        ref={inputRef}
        type="text"
        placeholder="Ask me about Cabernet Sauvignon..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isProcessing}
        className="w-full rounded-full py-3 px-4 pr-12 bg-white border 
                   border-gray-200 focus:outline-none focus:ring-2 
                   focus:ring-purple-500 focus:border-transparent 
                   shadow-sm text-sm sm:text-base transition-all"
      />
      <button
        onClick={handleSend}
        disabled={isProcessing || !message.trim()}
        className={`absolute right-3 p-1.5 rounded-full 
                    ${
                      message.trim() && !isProcessing
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default ChatInput;