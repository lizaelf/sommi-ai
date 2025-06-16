import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { IconButton } from "./ui/IconButton";
import typography from "@/styles/typography";

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

  // Suggestion click handler removed - now handled in parent component

  const inputContainer = (
    <div className="relative w-full">
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '64px',
          borderRadius: '24px',
          borderTop: '2px solid transparent',
          borderRight: '1px solid transparent',
          borderBottom: '1px solid transparent',
          borderLeft: '1px solid transparent',
          backgroundImage: isFocused 
            ? 'linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)), radial-gradient(circle at top center, rgba(74, 144, 226, 0.46) 0%, rgba(74, 144, 226, 0.16) 100%)'
            : 'linear-gradient(#1C1C1C, #1C1C1C), linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 25%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.3) 75%, transparent 100%)',
          backgroundSize: isFocused ? 'auto' : '400% 100%',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          overflow: 'hidden',
          animation: !isFocused ? 'bg-slide-idle 7.5s linear infinite' : 'none'
        }}
      >
        {isFocused && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-slide-lr"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/15 to-transparent animate-slide-lr-delayed"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-slide-lr-slow"></div>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            onFocus && onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur && onBlur();
          }}
          style={{
            display: 'flex',
            padding: '0 50px 4px 24px',
            justifyContent: 'flex-start',
            alignItems: 'center',
            alignSelf: 'stretch',
            borderRadius: '24px',
            backgroundColor: isFocused ? 'transparent' : '#1C1C1C',
            border: 'none',
            width: '100%',
            height: '64px',
            outline: 'none',
            color: 'white',
            WebkitAppearance: 'none',
            appearance: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 400,
            position: 'relative',
            zIndex: 10,
            left: 0,
            top: 0
          }}
          className={`text-sm pr-12 placeholder-[#999999] flex items-center ${isFocused ? '!bg-transparent' : 'bg-[#1C1C1C] !bg-[#1C1C1C]'}`}
          placeholder="Ask me about wine..."
          disabled={isProcessing}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        
        {/* Voice button or Send button based on input state */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
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
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                opacity: isProcessing ? 0.5 : 1
              }}
            />
          ) : (
            voiceButtonComponent
          )}
        </div>
      </div>
    </div>
  );

  return inputContainer;
};

export default ChatInput;