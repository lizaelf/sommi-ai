import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { IconButton } from "./ui/IconButton";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  voiceButtonComponent?: React.ReactNode;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isProcessing, 
  onFocus, 
  onBlur, 
  voiceButtonComponent 
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          className={`
            w-full h-16 px-6 pr-14 text-white text-base font-inter
            bg-[#1C1C1C] border border-[rgba(255,255,255,0.12)]
            rounded-3xl outline-none transition-all duration-200
            placeholder:text-[#999999]
            ${isFocused ? 'border-[rgba(74,144,226,0.6)] bg-[rgba(74,144,226,0.08)]' : ''}
          `}
          placeholder="Ask me about wine..."
          disabled={isProcessing}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {message.trim() ? (
            <IconButton
              icon={Send}
              onClick={() => {
                if (message.trim() && !isProcessing) {
                  onSendMessage(message);
                  setMessage('');
                }
              }}
              variant="ghost"
              size="md"
              disabled={isProcessing}
              title="Send message"
              className="text-white hover:bg-white/10"
            />
          ) : (
            voiceButtonComponent
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;