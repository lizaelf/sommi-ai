import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  voiceButtonComponent?: React.ReactNode;
  isFocused?: boolean;
}

// Suggestions are now handled in the parent component

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing, onFocus, onBlur, voiceButtonComponent, isFocused }) => {
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
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
    <div className="relative w-full">
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '64px',
          borderRadius: '24px',
          background: isActive 
            ? 'linear-gradient(to bottom, #9D0000, #BB0000)' 
            : 'linear-gradient(#1C1C1C, #1C1C1C), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: isActive ? 'border-box' : 'padding-box, border-box',
          border: isActive ? 'none' : '2px solid transparent',
          overflow: 'hidden'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsActive(true);
            onFocus && onFocus();
          }}
          onBlur={() => {
            setIsActive(false);
            onBlur && onBlur();
          }}
          style={{
            display: 'flex',
            padding: '0 50px 4px 24px',
            justifyContent: 'flex-start',
            alignItems: 'center',
            alignSelf: 'stretch',
            borderRadius: '24px',
            backgroundColor: '#1C1C1C',
            border: 'none',
            width: '100%',
            height: '64px',
            outline: 'none',
            color: 'white',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: '#1C1C1C',
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 400,
            position: 'absolute',
            left: 0,
            top: 0
          }}
          className="text-sm pr-12 bg-[#1C1C1C] !bg-[#1C1C1C] placeholder-[#999999] flex items-center"
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
};

export default ChatInput;