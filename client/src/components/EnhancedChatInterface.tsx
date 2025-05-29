import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useConversation } from '../hooks/useConversation';
import ChatInput from './ChatInput';
import ChatInterface from './ChatInterface';
import VoiceAssistant from './VoiceAssistant';
import VoiceBottomSheet from './VoiceBottomSheet';
import WineBottleImage from './WineBottleImage';
import { ShiningText } from './ShiningText';
import { getWineDisplayName, getWineVintage } from '../../../shared/wineConfig';

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

interface EnhancedChatInterfaceProps {
  showBuyButton?: boolean;
}

interface ClientMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  conversationId: number;
  createdAt: Date;
}

export default function EnhancedChatInterface({ showBuyButton = false }: EnhancedChatInterfaceProps) {
  const [, setLocation] = useLocation();
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showListenButton, setShowListenButton] = useState(false);
  const [showFullConversation, setShowFullConversation] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    currentConversationId,
    messages,
    addMessage,
    refetchMessages
  } = useConversation();

  // Check if user has shared contact information
  const [hasSharedContact, setHasSharedContact] = useState(() => {
    return localStorage.getItem('hasSharedContact') === 'true';
  });

  // Listen for storage changes to update contact status
  useEffect(() => {
    const handleStorageChange = () => {
      setHasSharedContact(localStorage.getItem('hasSharedContact') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setIsTyping(true);
    
    try {
      const tempUserMessage: ClientMessage = {
        id: Date.now(),
        role: 'user',
        content: message,
        conversationId: currentConversationId || 0,
        createdAt: new Date()
      };

      await addMessage(tempUserMessage);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response) {
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          conversationId: currentConversationId || 0,
          createdAt: new Date()
        };

        await addMessage(assistantMessage);
        
        // Store the latest assistant message for TTS
        localStorage.setItem('lastAssistantMessage', data.response);
        
        // Preload TTS audio
        try {
          const ttsResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: data.response }),
          });

          if (ttsResponse.ok) {
            const audioBlob = await ttsResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            localStorage.setItem('preloadedAudioUrl', audioUrl);
            
            // Show the listen button
            setShowListenButton(true);
          }
        } catch (ttsError) {
          console.error('TTS preload failed:', ttsError);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Handle bold text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <div key={index} style={{ marginBottom: index < content.split('\n').length - 1 ? '8px' : '0' }}>
          {formattedParts}
        </div>
      );
    });
  };

  if (!showBuyButton) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0A0A0A',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>
          Welcome to the Wine Experience
        </div>
        <button
          onClick={() => setLocation('/wine')}
          style={{
            backgroundColor: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Explore Wine
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col bg-background overflow-hidden">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="w-full flex flex-col items-center justify-center py-8 relative" style={{ 
              backgroundColor: '#0A0A0A',
              paddingTop: '75px',
              minHeight: '100vh',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}>
              
              <WineBottleImage />
              
              <div style={{
                width: '100%', 
                textAlign: 'center', 
                justifyContent: 'center', 
                alignItems: 'center',
                paddingLeft: '16px',
                paddingRight: '16px',
                marginTop: '32px',
                marginBottom: '40px'
              }}>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 600,
                  color: 'white',
                  margin: 0,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  lineHeight: '1.2'
                }}>
                  {getWineDisplayName()}. {getWineVintage()}
                </h1>
              </div>

              {showBuyButton && hasSharedContact && (
                <div style={{
                  marginBottom: '32px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h1 style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: 'white',
                      margin: 0,
                      fontFamily: 'Inter, system-ui, sans-serif'
                    }}>
                      Summary
                    </h1>
                    
                    {messages.length > 0 && (
                      <button
                        onClick={() => setShowFullConversation(!showFullConversation)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: 'white',
                          fontSize: '14px',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        {showFullConversation ? 'Show Summary' : 'Show whole dialog'}
                      </button>
                    )}
                  </div>
                  
                  {messages.length > 0 && showFullConversation && (
                    <div id="conversation" className="space-y-4 mb-96">
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
                      <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '20px' }}>
                        <button 
                          onClick={() => setShowFullConversation(false)}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '32px',
                            height: '56px',
                            padding: '0 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            color: 'white',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '16px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            width: '100%',
                            maxWidth: '320px',
                            margin: '0 auto'
                          }}
                        >
                          Back to Summary
                        </button>
                      </div>
                    </div>
                  )}

                  {messages.length > 0 && !showFullConversation && (
                    <div style={{
                      textAlign: 'center',
                      color: '#888',
                      padding: '40px 20px',
                      fontSize: '16px'
                    }}>
                      Summary content will appear here as you chat about wine.
                    </div>
                  )}

                  {messages.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      color: '#888',
                      padding: '40px 20px',
                      fontSize: '16px'
                    }}>
                      No conversation history yet. Start asking questions about wine to see your summary here.
                    </div>
                  )}
                </div>
              )}
                
              {showBuyButton && !hasSharedContact && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '32px'
                }}>
                  <button
                    onClick={() => setLocation('/cellar')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '24px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      fontSize: '16px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      cursor: 'pointer'
                    }}
                  >
                    View chat history
                  </button>
                </div>
              )}

              {isTyping && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  width: '100%',
                  marginBottom: '12px',
                  padding: '16px'
                }}>
                  <ShiningText text="Thinking..." />
                </div>
              )}
                
              <div id="audio-controls" style={{display: 'none', visibility: 'hidden'}}>
                <button id="play-audio-btn">Play Response Audio</button>
              </div>
            </div>
            
            <div style={{ height: '80px' }}></div>
          </div>
          
          <div style={{
            backgroundColor: '#1C1C1C',
            padding: '16px',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {!showBuyButton ? (
              <>
                <div className="max-w-4xl mx-auto">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isProcessing={isTyping}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    voiceButtonComponent={
                      <VoiceAssistant
                        onSendMessage={handleSendMessage}
                        isProcessing={isTyping}
                      />
                    }
                  />
                </div>

                <VoiceBottomSheet
                  isOpen={isVoiceSheetOpen}
                  onClose={() => setIsVoiceSheetOpen(false)}
                  onMute={() => {
                    if (window.voiceAssistant) {
                      window.voiceAssistant.muteAndSavePosition();
                    }
                  }}
                  onAsk={() => setIsVoiceSheetOpen(false)}
                  isListening={isListening}
                  isResponding={isResponding}
                  isThinking={isTyping}
                  showSuggestions={showSuggestions}
                  showListenButton={showListenButton}
                  onSuggestionClick={(suggestion: string) => {
                    handleSendMessage(suggestion);
                    setIsVoiceSheetOpen(false);
                  }}
                  onListenResponse={() => {
                    if (window.voiceAssistant) {
                      window.voiceAssistant.playLastAudio();
                    }
                  }}
                />
              </>
            ) : (
              <div className="flex justify-center">
                <div 
                  onClick={() => setLocation('/cellar')}
                  className="cursor-pointer"
                >
                  <div style={{
                    backgroundColor: '#8B4513',
                    borderRadius: '32px',
                    height: '56px',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    width: '100%',
                    maxWidth: '320px',
                    margin: '0 auto',
                    textAlign: 'center'
                  }}>
                    Ask the sommelier
                  </div>
                </div>
              </div>
            )}

            <ChatInterface
              renderVoiceAssistant={() => (
                <VoiceAssistant
                  onSendMessage={handleSendMessage}
                  isProcessing={isTyping}
                />
              )}
            />
          </div>
        </main>
      </div>
    </div>
  );
}