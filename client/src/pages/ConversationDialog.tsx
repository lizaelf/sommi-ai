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

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setLatestMessageId(lastMessage.id);
      }
    }
  }, [messages]);

  const handleBackClick = () => {
    setLocation('/wine-details');
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
                    message.id === latestMessageId ? (
                      <TextGenerateEffect
                        words={message.content}
                        className="text-[#DBDBDB] font-normal text-base leading-relaxed"
                        filter={true}
                        duration={0.3}
                      />
                    ) : (
                      <div style={{
                        color: '#DBDBDB',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '16px',
                        lineHeight: '1.6'
                      }}>
                        {message.content}
                      </div>
                    )
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