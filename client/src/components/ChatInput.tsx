import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  apiConnected: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing, apiConnected }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Adjust textarea height based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
              placeholder="Type your message..."
              rows={1}
              disabled={isProcessing}
            />
            <button 
              type="button" 
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" 
              title="Upload file"
            >
              <i className="fas fa-paperclip"></i>
            </button>
          </div>
          <button
            type="submit"
            className={`${
              isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            } text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center transition-colors`}
            disabled={isProcessing || !message.trim()}
          >
            <i className="fas fa-paper-plane mr-2"></i>
            Send
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center">
              <i className="fas fa-info-circle mr-1"></i>
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
          <div>
            {/* API Status */}
            <span className="inline-flex items-center">
              <span className={`inline-block h-2 w-2 rounded-full ${apiConnected ? 'bg-green-500' : 'bg-red-500'} mr-1`}></span>
              {apiConnected ? 'API Connected' : 'API Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
