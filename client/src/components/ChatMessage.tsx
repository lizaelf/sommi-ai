import React from 'react';
import { Message } from '@shared/schema';
import { User, Wine } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

// Function to process markdown bold text (e.g., **text**)
function processMarkdownBold(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Function to process markdown italics (e.g., *text*)
function processMarkdownItalics(text: string) {
  return text.replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Function to process markdown code blocks
function processMarkdownCodeBlocks(text: string) {
  // Replace ```language code``` blocks
  text = text.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  
  // Replace inline `code` blocks
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  return text;
}

// Function to process markdown lists
function processMarkdownLists(text: string) {
  // Split text into lines
  const lines = text.split('\n');
  let inList = false;
  let listType = '';
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    // Check for unordered list items
    if (lines[i].match(/^[\s]*[-*+][\s]+/)) {
      const listItem = lines[i].replace(/^[\s]*[-*+][\s]+/, '');
      
      // Start a new list or continue the current one
      if (!inList || listType !== 'ul') {
        lines[i] = inList ? '</ul><ul><li>' + listItem + '</li>' : '<ul><li>' + listItem + '</li>';
        inList = true;
        listType = 'ul';
      } else {
        lines[i] = '<li>' + listItem + '</li>';
      }
    } 
    // Check for ordered list items
    else if (lines[i].match(/^[\s]*\d+\.[\s]+/)) {
      const listItem = lines[i].replace(/^[\s]*\d+\.[\s]+/, '');
      
      // Start a new list or continue the current one
      if (!inList || listType !== 'ol') {
        lines[i] = inList ? '</ol><ol><li>' + listItem + '</li>' : '<ol><li>' + listItem + '</li>';
        inList = true;
        listType = 'ol';
      } else {
        lines[i] = '<li>' + listItem + '</li>';
      }
    } 
    // End the list if we encounter a non-list line
    else if (inList && lines[i].trim() !== '') {
      lines[i] = listType === 'ul' ? '</ul>' + lines[i] : '</ol>' + lines[i];
      inList = false;
    }
  }
  
  // Close any open list at the end
  if (inList) {
    lines.push(listType === 'ul' ? '</ul>' : '</ol>');
  }
  
  return lines.join('\n');
}

// Main function to process markdown
function processMarkdown(text: string) {
  let processed = text;
  
  // Process lists first
  processed = processMarkdownLists(processed);
  
  // Process code blocks
  processed = processMarkdownCodeBlocks(processed);
  
  // Process bold and italics
  processed = processMarkdownBold(processed);
  processed = processMarkdownItalics(processed);
  
  // Process paragraphs (consecutive lines)
  processed = processed.replace(/\n\s*\n/g, '</p><p>');
  
  // Wrap in paragraph tags if not already wrapped
  if (!processed.startsWith('<')) {
    processed = '<p>' + processed + '</p>';
  }
  
  return processed;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Process the message content to handle markdown
  const processedContent = processMarkdown(message.content);
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div 
        className={`max-w-[85%] md:max-w-[75%] rounded-lg p-3 sm:p-4 ${
          isUser 
            ? 'bg-purple-600 text-white' 
            : 'bg-white text-gray-800 shadow-sm'
        }`}
        style={{ 
          boxShadow: isUser 
            ? 'none' 
            : '0 4px 15px rgba(0, 0, 0, 0.1)' 
        }}
      >
        {/* Message header */}
        <div className="flex items-center mb-2">
          <div className={`p-1 rounded-full ${isUser ? 'bg-purple-700' : 'bg-purple-100'}`}>
            {isUser ? (
              <User size={16} className="text-white" />
            ) : (
              <Wine size={16} className="text-purple-600" />
            )}
          </div>
          <span className={`ml-2 text-sm font-medium ${isUser ? 'text-purple-100' : 'text-purple-800'}`}>
            {isUser ? 'You' : 'Cabernet AI'}
          </span>
        </div>
        
        {/* Message content */}
        <div 
          className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </div>
    </div>
  );
};

export default ChatMessage;