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
      return <p>What would you like to know about Cabernet Sauvignon?</p>;
    }
    
    try {
      // Process bold text indicated by ** markers
      const processBoldText = (text: string) => {
        if (!text.includes('**')) return text;
        
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return <strong key={i} className="font-bold">{boldText}</strong>;
          }
          return part;
        });
      };
      
      // Process numbered or bulleted lists
      const processLists = (text: string) => {
        // Check for numbered lists (1. 2. 3. etc.)
        if (/^\d+\.\s.+/m.test(text)) {
          const items = text.split('\n')
            .filter(line => /^\d+\.\s.+/.test(line))
            .map(line => line.replace(/^\d+\.\s/, '').trim());
          
          if (items.length > 0) {
            return (
              <ol className="list-decimal pl-5 space-y-1">
                {items.map((item, i) => (
                  <li key={i}>{processBoldText(item)}</li>
                ))}
              </ol>
            );
          }
        }
        
        // Check for bullet lists (• * - etc.)
        if (/^[•*-]\s.+/m.test(text)) {
          const items = text.split('\n')
            .filter(line => /^[•*-]\s.+/.test(line))
            .map(line => line.replace(/^[•*-]\s/, '').trim());
          
          if (items.length > 0) {
            return (
              <ul className="list-disc pl-5 space-y-1">
                {items.map((item, i) => (
                  <li key={i}>{processBoldText(item)}</li>
                ))}
              </ul>
            );
          }
        }
        
        // Return original with bold processing if no lists found
        return <p>{processBoldText(text)}</p>;
      };
      
      // Check if there are any code blocks
      if (!content.includes('```')) {
        // No code blocks, just process for lists and bold text
        return processLists(content);
      }
      
      // Split content by code block markers and process each part
      const segments = [];
      let isCodeBlock = false;
      let buffer = '';
      
      // Split by newline to process line by line
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('```')) {
          // We found a code block delimiter
          // Add the current buffer as the appropriate type
          if (buffer) {
            segments.push({
              type: isCodeBlock ? 'code' : 'text',
              content: buffer.trim()
            });
            buffer = '';
          }
          // Toggle the code block state
          isCodeBlock = !isCodeBlock;
          // Skip the delimiter line
          continue;
        }
        
        // Add the line to our buffer with the appropriate separator
        if (buffer) {
          buffer += '\n' + line;
        } else {
          buffer = line;
        }
      }
      
      // Add any remaining content
      if (buffer) {
        segments.push({
          type: isCodeBlock ? 'code' : 'text',
          content: buffer.trim()
        });
      }
      
      // Render the segments
      return (
        <>
          {segments.map((segment, index) => (
            segment.type === 'text' ? 
              <div key={index}>{processLists(segment.content)}</div> : 
              <pre key={index} className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                {segment.content}
              </pre>
          ))}
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
      // Process bold text indicated by ** markers
      const processBoldText = (text: string) => {
        if (!text.includes('**')) return text;
        
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return <strong key={i} className="font-bold">{boldText}</strong>;
          }
          return part;
        });
      };
      
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
                  <p className="font-medium text-gray-800">
                    {emoji}{processBoldText(paragraph)}
                  </p>
                </div>
              );
            }
            
            // Check for numbered lists (1. 2. 3. etc.)
            if (/^\d+\.\s.+/m.test(paragraph)) {
              const items = paragraph.split('\n')
                .filter(line => /^\d+\.\s.+/.test(line))
                .map(line => line.replace(/^\d+\.\s/, '').trim());
              
              if (items.length > 0) {
                return (
                  <div key={idx}>
                    <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                      {items.map((item, i) => (
                        <li key={i}>{processBoldText(item)}</li>
                      ))}
                    </ol>
                  </div>
                );
              }
            }
            
            // Check for bullet lists
            if (/^[•*-]\s.+/m.test(paragraph)) {
              const items = paragraph.split('\n')
                .filter(line => /^[•*-]\s.+/.test(line))
                .map(line => line.replace(/^[•*-]\s/, '').trim());
              
              if (items.length > 0) {
                return (
                  <div key={idx}>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-[#6A53E7] mr-2">✧</span>
                          <span className="text-gray-700">{processBoldText(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
            }
            
            // Check if it's the old format list-like item
            if (paragraph.includes('- ')) {
              const items = paragraph.split('- ').filter(item => item.trim().length > 0);
              return (
                <div key={idx} className="space-y-1">
                  {items.map((item, i) => (
                    <p key={i} className="flex items-start">
                      <span className="text-[#6A53E7] mr-2">✧</span>
                      <span className="text-gray-700">{processBoldText(item.trim())}</span>
                    </p>
                  ))}
                </div>
              );
            }
            
            // Regular paragraph
            return <p key={idx} className="text-gray-700">{processBoldText(paragraph)}</p>;
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
          <div className="bg-[#F5F3FF] text-gray-800 rounded-lg py-2 px-4 max-w-[85%] border border-[#6A53E7]/10">
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
