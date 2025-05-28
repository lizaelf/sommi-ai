import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import ChatInput from '../components/ChatInput';
import VoiceAssistant from '../components/VoiceAssistant';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { ShiningText } from '../components/ShiningText';
import { useConversation } from '../hooks/useConversation';
import { getWineDisplayName } from '../../../shared/wineConfig';

export default function ConversationDialog() {
  const [, setLocation] = useLocation();
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [latestMessageId, setLatestMessageId] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    addMessage,
    currentConversationId
  } = useConversation();

  // Handle sending messages with full AI integration
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isTyping) return;
    setIsTyping(true);
    
    try {
      // Add user message to conversation
      const userMessage = {
        id: Date.now(),
        role: 'user' as const,
        content: message.trim(),
        timestamp: new Date(),
        conversationId: currentConversationId || 0
      };
      
      await addMessage(userMessage);
      setLatestMessageId(null);

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          conversationId: currentConversationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add AI response to conversation
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant' as const,
        content: data.response,
        timestamp: new Date(),
        conversationId: currentConversationId || 0
      };
      
      setLatestMessageId(assistantMessage.id);
      await addMessage(assistantMessage);
      
      // Scroll to bottom after adding message
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0C0C0C',
      color: 'white',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <main className="flex-1 relative overflow-hidden">
            {/* Header with back button and wine name */}
            <div style={{
              backgroundColor: '#1C1C1C',
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={() => setLocation('/wine/details')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '24px',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ←
              </button>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                color: 'white'
              }}>
                {getWineDisplayName()}
              </h1>
            </div>

            {/* Conversation messages */}
            <div style={{
              height: 'calc(100vh - 200px)',
              overflowY: 'auto',
              padding: '20px',
              paddingBottom: '100px'
            }}>
              <div ref={chatContainerRef} className="space-y-4">
                {messages.length > 0 && 
                  messages.map((message, index) => (
                    <div key={`${message.id}-${index}`} style={{
                      display: 'flex',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                      width: '100%',
                      marginBottom: '12px'
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
                }
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: '12px',
                    padding: '16px'
                  }}>
                    <ShiningText text="Thinking..." />
                  </div>
                )}
              </div>
            </div>

            {/* Input Area - Fixed to Bottom */}
            <div style={{
              backgroundColor: '#1C1C1C',
              padding: '16px',
              zIndex: 50,
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div className="max-w-3xl mx-auto">
                {/* Suggestion chips */}
                <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                  <button 
                    onClick={() => handleSendMessage("Tasting notes")}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Tasting notes
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Simple recipes for this wine")}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Simple recipes
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Where is this wine from?")}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Where it's from
                  </button>
                </div>
                
                <div className="relative flex items-center">
                  <ChatInput 
                    onSendMessage={handleSendMessage} 
                    isProcessing={isTyping}
                    onFocus={() => setIsKeyboardFocused(true)}
                    onBlur={() => setIsKeyboardFocused(false)}
                    voiceButtonComponent={
                      <VoiceAssistant
                        onSendMessage={handleSendMessage}
                        isProcessing={isTyping}
                      />
                    }
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}