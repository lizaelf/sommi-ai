import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  apiConnected: boolean;
}

// Suggestion prompts for wine-focused chat
const promptSuggestions = [
  "Tell me about Cabernet Sauvignon",
  "Recommend a good Chardonnay",
  "Best wine for steak dinner",
  "Differences between red and white wine",
  "Popular Italian wine regions",
  "How to store wine properly",
  "Wine and cheese pairings",
  "What makes a wine full-bodied"
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing, apiConnected }) => {
  const [message, setMessage] = useState('');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
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

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Toggle showing all suggestions
  const toggleSuggestions = () => {
    setShowAllSuggestions(!showAllSuggestions);
  };

  // Display only 4 suggestions initially, or all if toggled
  const visibleSuggestions = showAllSuggestions 
    ? promptSuggestions 
    : promptSuggestions.slice(0, 4);

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Hidden Suggestion Chips - only shown on specific actions */}
        <div className={`${showAllSuggestions ? 'block' : 'hidden'} mb-3 px-4`}>
          <div className="flex flex-wrap gap-2 mb-2">
            {visibleSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="py-1 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200 transition-colors"
                disabled={isProcessing}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button 
            onClick={toggleSuggestions}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            Hide suggestions
          </button>
        </div>

        {/* Input styled like Somm.ai */}
        <form onSubmit={handleSubmit} className="flex items-center w-full px-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-12 bg-gray-100 rounded-full px-6 pr-14 outline-none text-gray-700"
              placeholder="Generate a name of ...."
              disabled={isProcessing}
            />
            {/* Microphone icon */}
            <button 
              type="button" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              title="Voice input"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            </button>
          </div>
          
          {/* Send button styled as a purple circle */}
          <button
            type="submit"
            className={`ml-2 w-12 h-12 rounded-full flex items-center justify-center ${
              isProcessing || !message.trim() 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } transition-colors`}
            disabled={isProcessing || !message.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
        
        {/* Show suggestions button and API status - only visible when suggestions are hidden */}
        {!showAllSuggestions && (
          <div className="px-4 mt-2 mb-1 flex justify-between items-center">
            <button 
              onClick={toggleSuggestions}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              Show suggestions
            </button>
            
            {/* API Status - subtle indicator */}
            <span className="text-xs text-gray-400 flex items-center">
              <span className={`inline-block h-2 w-2 rounded-full ${apiConnected ? 'bg-green-500' : 'bg-red-500'} mr-1`}></span>
              {apiConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
