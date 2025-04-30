import React from 'react';
import { Message } from '@shared/schema';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Function to format code blocks in messages
  const formatContent = (content: string) => {
    // Handle undefined or empty content
    if (!content) {
      return <p>Empty message</p>;
    }
    
    // Simple markdown-like code block formatting
    const codeBlockRegex = /```(.+?)```/gs;
    
    try {
      // Split the content by code blocks
      const parts = content.split(codeBlockRegex);
      
      if (parts.length === 1) {
        // No code blocks, just return the plain text
        return <p>{content}</p>;
      }
      
      return (
        <>
          {parts.map((part, index) => {
            // Even indices are regular text, odd indices are code
            if (index % 2 === 0) {
              return <p key={index}>{part}</p>;
            } else {
              return (
                <pre key={index} className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                  {part}
                </pre>
              );
            }
          })}
        </>
      );
    } catch (error) {
      console.error("Error formatting message content:", error);
      return <p>{content}</p>;
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {isUser ? (
        <div className="flex items-start space-x-3 justify-end">
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm max-w-3xl">
            <div className="text-gray-700">
              <p className="mb-2"><span className="font-medium text-blue-600">You</span></p>
              {formatContent(message.content)}
            </div>
          </div>
          <div className="min-w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <i className="fas fa-user"></i>
          </div>
        </div>
      ) : (
        <div className="flex items-start space-x-3">
          <div className="min-w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <i className="fas fa-robot"></i>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm max-w-3xl">
            <div className="text-gray-700">
              <p className="mb-2"><span className="font-medium text-blue-500">ChatGPT</span></p>
              {formatContent(message.content)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
