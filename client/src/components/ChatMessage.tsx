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

  // Function to detect wine information from content
  const formatWineInfo = (content: string) => {
    if (isUser) return formatContent(content); // Only apply special formatting to AI responses
    
    // Add wine-specific formatting
    try {
      // Convert content to paragraphs
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      
      return (
        <div className="space-y-4">
          {/* Format paragraphs with wine-specific styling */}
          {paragraphs.map((paragraph, idx) => {
            // Check if paragraph might be a header or section title
            if (paragraph.includes('Aromas') || paragraph.includes('Flavors') || 
                paragraph.includes('Region') || paragraph.includes('Pairs with') ||
                paragraph.includes('Story') || paragraph.includes('Origin')) {
              
              // It's a section header, format with wine emoji if appropriate
              const emoji = 
                paragraph.includes('Aromas') ? '🍷 ' :
                paragraph.includes('Flavors') ? '✨ ' :
                paragraph.includes('Pairs') ? '🍽️ ' :
                paragraph.includes('Region') || paragraph.includes('Origin') ? '🌍 ' : '';
              
              return (
                <div key={idx} className="mt-3">
                  <p className="font-medium text-gray-800">{emoji + paragraph}</p>
                </div>
              );
            }
            
            // Check if it's a list-like item
            if (paragraph.includes('- ')) {
              const items = paragraph.split('- ').filter(item => item.trim().length > 0);
              return (
                <div key={idx} className="space-y-1">
                  {items.map((item, i) => (
                    <p key={i} className="flex items-start">
                      <span className="text-gray-500 mr-2">◇</span>
                      <span>{item.trim()}</span>
                    </p>
                  ))}
                </div>
              );
            }
            
            // Regular paragraph
            return <p key={idx} className="text-gray-700">{paragraph}</p>;
          })}
        </div>
      );
    } catch (error) {
      console.error("Error formatting wine info:", error);
      return formatContent(content);
    }
  };

  return (
    <div className="w-full">
      {isUser ? (
        // User Message - Smaller and right-aligned
        <div className="flex justify-end mb-2">
          <div className="bg-purple-50 text-gray-800 rounded-lg py-2 px-4 max-w-[85%]">
            {formatContent(message.content)}
          </div>
        </div>
      ) : (
        // AI Message - Wine info style with special formatting
        <div className="bg-white rounded-lg shadow-sm p-4">
          {formatWineInfo(message.content)}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
