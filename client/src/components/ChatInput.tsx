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
          backgroundImage: 'linear-gradient(#292929, #292929), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0) 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box'
        }}
      >
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
            border: 'none',
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
            paddingRight: '50px',
            position: 'absolute',
            left: 0,
            top: 0
          }}
          className="text-sm pr-12 bg-[#292929] !bg-[#292929] placeholder-[#999999]"
          placeholder="Ask me about..."
          disabled={isProcessing}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        
        {/* Voice button placed inside input on the right */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
          {voiceButtonComponent}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;