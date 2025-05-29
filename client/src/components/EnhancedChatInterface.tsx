import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { ContactFormBottomSheet } from './ContactFormBottomSheet';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import VoiceAssistant from './VoiceAssistant';
import WineBottleImage from './WineBottleImage';
import { useConversation } from '@/hooks/useConversation';
import { ClientMessage } from '@/lib/types';
import typography from '@/styles/typography';
import { getWineDisplayName, getWineRegion, getWineVintage } from '@shared/wineConfig';
import { ShiningText } from '@/components/ShiningText';
import { TextGenerateEffect } from './ui/text-generate-effect';

interface EnhancedChatInterfaceProps {
  showBuyButton?: boolean;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({ showBuyButton = false }) => {
  // Check if user has shared contact information
  const [hasSharedContact, setHasSharedContact] = useState(() => {
    return localStorage.getItem('hasSharedContact') === 'true';
  });
  
  // State for contact bottom sheet
  const [showContactSheet, setShowContactSheet] = useState(false);

  const handleContactFormSubmit = (formData: any) => {
    setHasSharedContact(true);
    localStorage.setItem('hasSharedContact', 'true');
    
    toast({
      title: "Success!",
      description: "Your contact information has been saved.",
    });
  };

  const handleCloseContactSheet = () => {
    setShowContactSheet(false);
    localStorage.setItem('hasClosedContactForm', 'true');
  };

  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showFullConversation, setShowFullConversation] = useState(false);

  const {
    messages,
    addMessage,
    createNewConversation,
    currentConversationId
  } = useConversation();

  // Initialize conversation on mount
  useEffect(() => {
    async function initializeConversation() {
      try {
        await createNewConversation();
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      }
    }
    
    if (!currentConversationId) {
      initializeConversation();
    }
  }, [createNewConversation, currentConversationId]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    setIsTyping(true);
    
    try {
      // Create user message
      const userMessage: ClientMessage = {
        id: Date.now(),
        role: 'user',
        content: content.trim(),
        conversationId: currentConversationId || 0
      };

      await addMessage(userMessage);

      // Simulate AI response (replace with actual API call)
      setTimeout(async () => {
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: "Thank you for your question about this wine. This is a placeholder response while the API integration is being completed.",
          conversationId: currentConversationId || 0
        };

        await addMessage(assistantMessage);
        setIsTyping(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleShowFullDialog = () => {
    if (currentConversationId) {
      setLocation(`/conversation/${currentConversationId}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Fixed Header */}
      <div className="flex-none bg-black border-b border-gray-800 p-4">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-3">
            <WineBottleImage />
            <div>
              <h1 style={{
                ...typography.h1,
                color: 'white',
                margin: 0,
                fontSize: '20px'
              }}>
                {getWineDisplayName()}.{' '}
                <span style={{ color: '#8D8D8D' }}>
                  {getWineVintage()}
                </span>
              </h1>
              <p style={{
                ...typography.body,
                color: '#8D8D8D',
                margin: 0,
                fontSize: '14px'
              }}>
                {getWineRegion()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div 
              ref={scrollAreaRef}
              className="h-full overflow-y-auto p-4 space-y-6"
              style={{
                paddingBottom: isKeyboardFocused ? '120px' : '80px'
              }}
            >
              {/* Food pairing section */}
              <div className="space-y-4">
                <h1 style={{
                  ...typography.h1,
                  color: 'white',
                  margin: '0 0 16px 0',
                  textAlign: 'left'
                }}>
                  Food pairing
                </h1>
                <div className="space-y-2">
                  <p style={{
                    ...typography.body,
                    color: 'white',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    <strong>Grilled red meats</strong> - The wine's robust tannins and full body complement the rich flavors of grilled beef, lamb, or venison.
                  </p>
                  <p style={{
                    ...typography.body,
                    color: 'white',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    <strong>Aged cheeses</strong> - Pairs beautifully with aged Pecorino Toscano, Parmigiano-Reggiano, or strong blue cheeses.
                  </p>
                  <p style={{
                    ...typography.body,
                    color: 'white',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    <strong>Game dishes</strong> - Wild boar, duck, or braised short ribs enhance the wine's earthy and complex character.
                  </p>
                </div>
              </div>

              {/* Conditional sections based on contact sharing status */}
              {hasSharedContact ? (
                <>
                  {/* Summary section for users who shared contact */}
                  <div className="space-y-4">
                    <h1 style={{
                      ...typography.h1,
                      color: 'white',
                      margin: '0 0 16px 0',
                      textAlign: 'left'
                    }}>
                      Summary
                    </h1>
                    <p style={{
                      ...typography.body,
                      color: '#8D8D8D',
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      No conversation summary available yet.
                    </p>
                  </div>

                  {/* Chat history section for users who shared contact */}
                  <div className="space-y-4">
                    <h1 style={{
                      ...typography.h1,
                      color: 'white',
                      margin: '0 0 16px 0',
                      textAlign: 'left'
                    }}>
                      Chat history
                    </h1>
                  </div>
                </>
              ) : (
                // Show "Chat history" section when user hasn't shared contact info
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h1 style={{
                    ...typography.h1,
                    color: 'white',
                    margin: '0 0 24px 0',
                    textAlign: 'left'
                  }}>
                    Chat history
                  </h1>
                  <button 
                    onClick={() => setShowContactSheet(true)}
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
                    Want to see wine history?
                  </button>
                </div>
              )}
              
              {/* Conversation Content */}
              <div id="conversation" className="space-y-4 mb-96">
                {messages.length > 0 ? (
                  <>
                    {messages.map((message, index) => (
                      <div key={`${message.id}-${index}`} style={{
                        display: 'flex',
                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                        width: '100%',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          maxWidth: '85%',
                          padding: '12px 16px',
                          borderRadius: message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: message.role === 'user' ? '#007AFF' : 'rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}>
                          <ChatMessage message={message} />
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#8D8D8D'
                  }}>
                    <ShiningText text="Start a conversation about this wine..." />
                  </div>
                )}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    width: '100%',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: '18px 18px 18px 4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}>
                      <TextGenerateEffect words="Thinking..." duration={0.5} />
                    </div>
                  </div>
                )}
              </div>

              {/* Buy Button - only show if showBuyButton prop is true */}
              {showBuyButton && (
                <div className="text-center py-8">
                  <button
                    onClick={() => setLocation('/checkout')}
                    className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Buy this wine
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Fixed Input Area */}
      {!isKeyboardFocused && (
        <div className="flex-none bg-black border-t border-gray-800">
          <div className="p-4">
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
      )}
      
      {/* Contact Bottom Sheet */}
      <ContactFormBottomSheet
        isOpen={showContactSheet}
        onClose={handleCloseContactSheet}
        onSubmit={handleContactFormSubmit}
        title="Want to see wine history?"
        subtitle="Enter your contact info"
      />
    </div>
  );
};

export default EnhancedChatInterface;