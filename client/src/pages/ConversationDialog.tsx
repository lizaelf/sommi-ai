import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { useConversation } from '../hooks/useConversation';
import { getWineDisplayName } from '../../../shared/wineConfig';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { useState, useEffect } from 'react';

export default function ConversationDialog() {
  const [, setLocation] = useLocation();
  const { messages } = useConversation();
  const [latestMessageId, setLatestMessageId] = useState<number | null>(null);

  // Function to format bold text with **text**
  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} style={{ fontWeight: 'bold', color: '#DBDBDB' }}>{boldText}</strong>;
      }
      return part;
    });
  };

  // Function to format content with proper list handling and bold text
  const formatListContent = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentListItems: string[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if line is a list item (starts with -, •, *, or number.)
      const isBulletPoint = /^[-•*]\s/.test(trimmedLine);
      const isNumberedItem = /^\d+\.\s/.test(trimmedLine);
      
      if (isBulletPoint || isNumberedItem) {
        // Add to current list
        const itemText = trimmedLine.replace(/^[-•*]\s|^\d+\.\s/, '');
        currentListItems.push(itemText);
        inList = true;
      } else {
        // If we were in a list and now we're not, render the list
        if (inList && currentListItems.length > 0) {
          elements.push(
            <div key={`list-${index}`} style={{ margin: '8px 0' }}>
              {currentListItems.map((item, itemIndex) => (
                <div key={itemIndex} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  marginBottom: '4px',
                  paddingLeft: '8px'
                }}>
                  <span style={{ 
                    color: '#6A53E7', 
                    marginRight: '8px',
                    fontSize: '14px',
                    marginTop: '2px'
                  }}>•</span>
                  <span style={{ color: '#DBDBDB' }}>{formatBoldText(item)}</span>
                </div>
              ))}
            </div>
          );
          currentListItems = [];
          inList = false;
        }
        
        // Add regular paragraph if it's not empty
        if (trimmedLine) {
          elements.push(
            <div key={`para-${index}`} style={{ 
              marginBottom: '8px',
              color: '#DBDBDB',
              whiteSpace: 'pre-wrap'
            }}>
              {formatBoldText(line)}
            </div>
          );
        }
      }
    });

    // Handle any remaining list items
    if (inList && currentListItems.length > 0) {
      elements.push(
        <div key="final-list" style={{ margin: '8px 0' }}>
          {currentListItems.map((item, itemIndex) => (
            <div key={itemIndex} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              marginBottom: '4px',
              paddingLeft: '8px'
            }}>
              <span style={{ 
                color: '#6A53E7', 
                marginRight: '8px',
                fontSize: '14px',
                marginTop: '2px'
              }}>•</span>
              <span style={{ color: '#DBDBDB' }}>{formatBoldText(item)}</span>
            </div>
          ))}
        </div>
      );
    }

    return <>{elements}</>;
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setLatestMessageId(lastMessage.id);
      }
    }
  }, [messages]);

  const handleBackClick = () => {
    setLocation('/wine/details');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1C1C1C',
      color: 'white'
    }}>
      {/* Header with back button and wine name */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1C1C1C',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 1000
      }}>
        <button
          onClick={handleBackClick}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowLeft size={24} />
        </button>
        
        <h2 style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '20px',
          fontWeight: 500,
          color: 'white',
          margin: 0
        }}>
          {getWineDisplayName()}
        </h2>
      </div>

      {/* Conversation Content */}
      <div style={{
        padding: '20px',
        paddingTop: '90px',
        paddingBottom: '40px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div key={`${message.id}-${index}`} style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%',
                marginBottom: '16px'
              }}>
                <div 
                  style={{
                    backgroundColor: message.role === 'user' ? '#F5F5F5' : 'transparent',
                    borderRadius: '16px',
                    padding: '16px',
                    width: message.role === 'user' ? 'fit-content' : '100%',
                    maxWidth: message.role === 'user' ? '80%' : '100%'
                  }}
                  data-role={message.role}
                >
                  {message.role === 'assistant' ? (
                    <div style={{
                      color: '#DBDBDB',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: '16px',
                      lineHeight: '1.6'
                    }}>
                      {formatListContent(message.content)}
                    </div>
                  ) : (
                    <div style={{
                      color: '#000000',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: '16px',
                      lineHeight: '1.6'
                    }}>
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#888',
              padding: '40px 20px',
              fontSize: '16px'
            }}>
              No conversation history available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}