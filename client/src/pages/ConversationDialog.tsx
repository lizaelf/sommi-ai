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

  // Simplified content formatter
  const formatContent = (content: string) => {
    if (!content) return null;
    
    const formatText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => 
        part.startsWith('**') && part.endsWith('**') 
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : part
      );
    };

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    lines.forEach((line, i) => {
      const isListItem = /^[-•*]\s|^\d+\.\s/.test(line.trim());
      
      if (isListItem) {
        listItems.push(line.trim().replace(/^[-•*]\s|^\d+\.\s/, ''));
      } else {
        if (listItems.length > 0) {
          elements.push(
            <div key={`list-${i}`} style={{ margin: '8px 0' }}>
              {listItems.map((item, j) => (
                <div key={j} style={{ display: 'flex', marginBottom: '4px', paddingLeft: '8px' }}>
                  <span style={{ color: '#6A53E7', marginRight: '8px' }}>•</span>
                  <span>{formatText(item)}</span>
                </div>
              ))}
            </div>
          );
          listItems = [];
        }
        
        if (line.trim()) {
          elements.push(
            <div key={i} style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
              {formatText(line)}
            </div>
          );
        }
      }
    });

    if (listItems.length > 0) {
      elements.push(
        <div key="final-list" style={{ margin: '8px 0' }}>
          {listItems.map((item, j) => (
            <div key={j} style={{ display: 'flex', marginBottom: '4px', paddingLeft: '8px' }}>
              <span style={{ color: '#6A53E7', marginRight: '8px' }}>•</span>
              <span>{formatText(item)}</span>
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

  const [scrolled, setScrolled] = useState(false);
  
  // Add scroll listener to detect when page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Clean up the listener when component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleBackClick = () => {
    setLocation('/wine/details');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1C1C1C',
      color: 'white'
    }}>
      {/* Fixed Header with back button navigation - matching WineDetails style */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          transition: 'all 0.3s ease',
          backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(4px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        }}
      >
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            style={{ color: 'white' }}
          >
            <path
              fill="currentColor"
              d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0"
            />
          </svg>
        </button>
        
        <h1 style={{
          fontSize: '18px',
          fontWeight: 500,
          color: 'white',
          margin: 0,
          textAlign: 'left',
          flex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}>
          {getWineDisplayName()}
        </h1>
        <div></div>
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
            (() => {
              // Group messages by date
              const messagesByDate = messages.reduce((groups: any, message: any, index: number) => {
                const messageDate = new Date(message.createdAt || Date.now());
                const dateKey = messageDate.toDateString();
                
                if (!groups[dateKey]) {
                  groups[dateKey] = [];
                }
                groups[dateKey].push({ ...message, originalIndex: index });
                return groups;
              }, {});

              return Object.entries(messagesByDate).map(([dateKey, dayMessages]: [string, any]) => (
                <div key={dateKey}>
                  {/* Sticky Date Header */}
                  <div
                    style={{
                      position: "sticky",
                      top: "75px", // Account for main header
                      zIndex: 10,
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "16px",
                      marginTop: Object.keys(messagesByDate).indexOf(dateKey) > 0 ? "24px" : "0px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "rgba(28, 28, 28, 0.9)",
                        backdropFilter: "blur(8px)",
                        borderRadius: "16px",
                        padding: "6px 12px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(255, 255, 255, 0.8)",
                          fontSize: "12px",
                          fontWeight: 500,
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        {new Date(dateKey).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {dayMessages.map((message: any, msgIndex: number) => (
                    <div key={`${message.id}-${message.originalIndex}`} style={{
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
                            {formatContent(message.content)}
                          </div>
                        ) : (
                          <div style={{
                            color: '#000000',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: '16px',
                            lineHeight: '1.6'
                          }}>
                            {formatContent(message.content)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()
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