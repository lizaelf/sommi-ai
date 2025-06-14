import React from 'react';

interface SuggestionButtonsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  responseMode?: 'text-only' | 'text-voice';
  className?: string;
}

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({
  suggestions,
  onSuggestionClick,
  responseMode = 'text-voice',
  className = ''
}) => {
  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick(suggestion);
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`suggestion-buttons-container ${className}`}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexWrap: 'nowrap',
        overflow: 'hidden'
      }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-button"
            onClick={() => handleSuggestionClick(suggestion)}
            data-response-mode={responseMode}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '32px',
              padding: '12px 16px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              outline: 'none',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 'fit-content',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionButtons;