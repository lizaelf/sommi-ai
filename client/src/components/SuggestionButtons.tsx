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
        overflowX: 'auto'
      }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-button"
            onClick={() => handleSuggestionClick(suggestion)}
            data-response-mode={responseMode}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionButtons;