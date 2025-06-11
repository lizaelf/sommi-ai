import React, { useState, useRef } from 'react';
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";

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
            ? 'linear-gradient(#1C1C1C, #1C1C1C), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%)'
            : 'linear-gradient(#1C1C1C, #1C1C1C), linear-gradient(315deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.6))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          overflow: 'hidden',
          animation: !isFocused ? 'bg-opacity-idle 3s ease-in-out infinite' : 'none'
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
            background: isFocused ? 'transparent' : '#1C1C1C',
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
          placeholder="Ask me about..."
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
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1
              }}
              onClick={isProcessing ? undefined : (e) => {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M3.5 19.0004L20.5 12.0004L3.5 5.00037V10.0004L15.5 12.0004L3.5 14.0004V19.0004Z" 
                  fill="currentColor" 
                />
              </svg>
            </div>
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