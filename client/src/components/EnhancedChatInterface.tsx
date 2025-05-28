import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import VoiceAssistant from './VoiceAssistant';
import WineBottleImage from './WineBottleImage';
import USFlagImage from './USFlagImage';
import { useConversation } from '@/hooks/useConversation';
import { ClientMessage } from '@/lib/types';
import typography from '@/styles/typography';
import { getWineDisplayName, getWineRegion, WINE_CONFIG } from '@shared/wineConfig';
import { ShiningText } from '@/components/ShiningText';
import { TextGenerateEffect } from './ui/text-generate-effect';

// Extend Window interface to include voiceAssistant
declare global {
  interface Window {
    voiceAssistant?: {
      speakResponse: (text: string) => Promise<void>;
      playLastAudio: () => void;
      speakLastAssistantMessage: () => void;
      muteAndSavePosition: () => void;
      resumeFromMute: () => void;
    };
  }
}

// Create an enhanced chat interface that uses IndexedDB for persistence
interface EnhancedChatInterfaceProps {
  showBuyButton?: boolean;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({ showBuyButton = false }) => {
  // Use our enhanced conversation hook
  const {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations,
    createNewConversation,
    clearConversation,
    refetchMessages
  } = useConversation();

  // Basic states 
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [showFullConversation, setShowFullConversation] = useState(false);
  const [latestMessageId, setLatestMessageId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added (only for suggestion clicks)
  const scrollToBottom = (forSuggestion = false) => {
    if (forSuggestion && conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle sending messages
  const handleSendMessage = async (message: string, fromSuggestion = false) => {
    if (message.trim() === '' || isTyping) return;

    try {
      setIsTyping(true);
      
      // Create a temporary user message for immediate UI feedback
      const tempUserMessage: ClientMessage = {
        id: Date.now(),
        conversationId: currentConversationId || 0,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString()
      };

      // Add user message to conversation
      await addMessage(tempUserMessage);
      
      // Only scroll for suggestion clicks
      if (fromSuggestion) {
        setTimeout(() => scrollToBottom(true), 100);
      }
      
      // Send to AI and get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response) {
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          conversationId: data.conversationId || currentConversationId || 0,
          role: 'assistant',
          content: data.response,
          createdAt: new Date().toISOString()
        };

        // Update conversation ID if needed
        if (data.conversationId && data.conversationId !== currentConversationId) {
          await setCurrentConversationId(data.conversationId);
        }

        // Add assistant response to conversation
        await addMessage(assistantMessage);
        setLatestMessageId(assistantMessage.id);
        
        // Only scroll for suggestion clicks
        if (fromSuggestion) {
          setTimeout(() => scrollToBottom(true), 100);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1C1C1C',
      color: 'white',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '768px',
          margin: '0 auto',
          width: '100%',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '120px'
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              padding: '40px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <WineBottleImage />
              </div>
              
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                marginBottom: '8px',
                color: 'white'
              }}>
                {getWineDisplayName()}
              </h1>
              
              <div style={{
                fontSize: '16px',
                color: '#DBDBDB',
                marginBottom: '16px'
              }}>
                {getWineRegion()}
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <USFlagImage />
                <span style={{ fontSize: '14px', color: '#DBDBDB' }}>
                  Available in US
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div style={{
              flex: 1,
              padding: '32px 0'
            }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                marginBottom: '32px',
                color: 'white',
                textAlign: 'left'
              }}>
                Summary
              </h1>
              
              {/* Conversation Content */}
              <div id="conversation" className="space-y-4 mb-96">
                {messages.length > 0 ? (
                  showBuyButton ? (
                    // Show summary for WineDetails page
                    <div style={{ color: '#DBDBDB', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'white', fontWeight: '600' }}>
                            Tasting Profile
                          </h3>
                          <p style={{ fontSize: '14px', color: '#DBDBDB', lineHeight: '1.5', margin: 0 }}>
                            Discover the complex flavors and aromas that make this wine unique, from initial notes to the lingering finish.
                          </p>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'white', fontWeight: '600' }}>
                            Food Pairing
                          </h3>
                          <p style={{ fontSize: '14px', color: '#DBDBDB', lineHeight: '1.5', margin: 0 }}>
                            Learn which dishes complement this wine best and how to create perfect pairings for your dining experience.
                          </p>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'white', fontWeight: '600' }}>
                            Wine Origin
                          </h3>
                          <p style={{ fontSize: '14px', color: '#DBDBDB', lineHeight: '1.5', margin: 0 }}>
                            Explore the terroir, region, and winemaking traditions that shaped this bottle's distinctive character.
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <button 
                          onClick={() => setLocation('/wine/conversation')}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '32px',
                            height: '56px',
                            minHeight: '56px',
                            maxHeight: '56px',
                            padding: '0 16px',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            color: 'white',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '16px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            outline: 'none',
                            width: '100%',
                            maxWidth: '320px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            boxSizing: 'border-box',
                            lineHeight: '1'
                          }}
                        >
                          Show whole dialog
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Show full conversation for Home page
                    <>
                      {messages.map((message, index) => (
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
                      ))}
                    </>
                  )
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#888',
                    padding: '40px 20px',
                    fontSize: '16px'
                  }}>
                    No conversation history yet. Start asking questions about wine to see your conversation here.
                  </div>
                )}
                
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
              
              {/* Hidden Audio Controls - kept for compatibility */}
              <div id="audio-controls" style={{display: 'none', visibility: 'hidden'}}>
                <button id="play-audio-btn">Play Response Audio</button>
              </div>
            </div>
          </div>
          
          {/* Extra space at the bottom */}
          <div style={{ height: '80px' }}></div>
        </main>
        
        {/* Input Area or Buy Button - Fixed to Bottom */}
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
            {showBuyButton ? (
              // Show Buy Again Button for WineDetails page
              <button 
                onClick={() => {
                  // Handle buy again functionality
                  console.log('Buy again clicked');
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '32px',
                  height: '56px',
                  minHeight: '56px',
                  maxHeight: '56px',
                  padding: '0 16px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  lineHeight: '1'
                }}
              >
                Buy again
              </button>
            ) : (
              // Show suggestions and input for Home page
              <>
                {/* Suggestion chips - always visible above input */}
                <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                  <button 
                    onClick={() => handleSendMessage("Tasting notes", true)}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                  >
                    Tasting notes
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Simple recipes for this wine", true)}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                  >
                    Simple recipes
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Where is this wine from?", true)}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                  >
                    Where it's from
                  </button>
                </div>
                
                <div className="relative flex items-center">
                  <ChatInput 
                    onSendMessage={(message) => handleSendMessage(message, false)} 
                    isProcessing={isTyping}
                    onFocus={() => setIsKeyboardFocused(true)}
                    onBlur={() => setIsKeyboardFocused(false)}
                    voiceButtonComponent={
                      <VoiceAssistant
                        onSendMessage={(message) => handleSendMessage(message, false)}
                        isProcessing={isTyping}
                      />
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div ref={conversationEndRef} />
    </div>
  );
};

export default EnhancedChatInterface;