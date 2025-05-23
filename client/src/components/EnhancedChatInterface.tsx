import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import VoiceAssistant from './VoiceAssistant';
import WineBottleImage from './WineBottleImage';
import USFlagImage from './USFlagImage';
import { useConversation } from '@/hooks/useConversation';
import { ClientMessage } from '@/lib/types';
import typography from '@/styles/typography';
// Import react-icons instead (better compatibility)
import { MdRestaurant, MdOutlineRestaurant, MdOutlineFoodBank, MdCancel } from 'react-icons/md';
import { BsChevronDown } from 'react-icons/bs';
import { GiCow, GiCheeseWedge, GiBroccoli } from 'react-icons/gi';

// Create an enhanced chat interface that uses IndexedDB for persistence
const EnhancedChatInterface: React.FC = () => {
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
  const { toast } = useToast();
  
  // Create a ref for the chat container to allow scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });
  
  // Scroll behavior
  useEffect(() => {
    // Only scroll to bottom on new messages when the user is typing
    // This ensures new messages are visible when the user is actively chatting
    if (isTyping && chatContainerRef.current && messages.length > 0) {
      // Add a small delay to ensure DOM is fully updated
      setTimeout(() => {
        // Calculate the position to scroll to the bottom
        const scrollToPosition = chatContainerRef.current?.scrollHeight || 0;
        
        // Smooth scroll to the position
        chatContainerRef.current?.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
    // On initial load, scroll to top to show beginning of page
    else if (chatContainerRef.current && messages.length === 0) {
      chatContainerRef.current.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }
  }, [messages, isTyping]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === '' || !currentConversationId) return;
    
    setIsTyping(true);
    
    try {
      // Add user message to UI immediately
      const tempUserMessage: ClientMessage = {
        id: Date.now(),
        content,
        role: 'user',
        conversationId: currentConversationId,
        createdAt: new Date().toISOString()
      };
      
      // Add message to the conversation
      await addMessage(tempUserMessage);
      
      // Create a system message containing the prompt
      const systemPrompt = "You are a friendly wine expert specializing in Cabernet Sauvignon. Your responses should be warm, engaging, and informative. Focus on providing interesting facts, food pairings, and tasting notes specific to Cabernet Sauvignon. Keep your responses concise but informative.";
      
      // Make the API request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content }
          ],
          conversationId: currentConversationId
        })
      });
      
      const responseData = await response.json();
      
      // Add the assistant's response to the UI immediately
      if (responseData.message && responseData.message.content) {
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1, // Ensure unique ID
          content: responseData.message.content,
          role: 'assistant',
          conversationId: currentConversationId,
          createdAt: new Date().toISOString()
        };
        
        // Add assistant message to the conversation
        await addMessage(assistantMessage);
      }
      
      // Refresh all messages
      refetchMessages();
      
    } catch (error) {
      console.error('Error in chat request:', error);
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Display loading state if no currentConversationId
  if (!currentConversationId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-background overflow-hidden">
          {/* Scrollable container */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Wine bottle image with fixed size and glow effect - fullscreen height from top */}
            <div className="w-full flex flex-col items-center justify-center py-8 relative" style={{ 
              backgroundColor: '#0A0A0A',
              paddingTop: '75px', // Match the header height exactly
              minHeight: '100vh', // Make the div full screen height
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}>
              
              {/* Wine bottle image */}
              <WineBottleImage />
              
              {/* Wine name with typography styling */}
              <div style={{
                width: '100%', 
                textAlign: 'center', 
                justifyContent: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                color: 'white', 
                wordWrap: 'break-word',
                position: 'relative',
                zIndex: 2,
                padding: '0 20px',
                marginBottom: '0',
                ...typography.h1
              }}>
                2021 Ridge Vineyards "Lytton Springs" Dry Creek Zinfandel
              </div>
              
              {/* Wine region with typography styling and flag */}
              <div style={{
                textAlign: 'center',
                justifyContent: 'center', 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center',
                color: 'rgba(255, 255, 255, 0.60)', 
                wordWrap: 'break-word',
                position: 'relative',
                zIndex: 2,
                padding: '20px 20px',
                gap: '6px',
                marginBottom: '0',
                ...typography.body1R
              }}>
                <USFlagImage />
                <span>San Luis Obispo Country, United States</span>
              </div>
              
              {/* Wine ratings section */}
              <div style={{
                width: '100%', 
                height: '100%', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: 4, 
                display: 'flex',
                position: 'relative',
                zIndex: 2,
                padding: '0 20px',
                marginBottom: '0'
              }}>
                <div style={{
                  padding: 8, 
                  background: 'rgba(255, 255, 255, 0.10)', 
                  borderRadius: 8, 
                  justifyContent: 'flex-start', 
                  alignItems: 'baseline', 
                  gap: 4, 
                  display: 'flex'
                }}>
                  <div style={{
                    justifyContent: 'center', 
                    display: 'flex', 
                    color: 'white', 
                    wordWrap: 'break-word',
                    height: '16px',
                    ...typography.num
                  }}>95</div>
                  <div style={{
                    justifyContent: 'center', 
                    display: 'flex', 
                    color: 'rgba(255, 255, 255, 0.60)', 
                    wordWrap: 'break-word',
                    height: '16px',
                    ...typography.body1R
                  }}>VN</div>
                </div>
                <div style={{
                  padding: 8, 
                  background: 'rgba(255, 255, 255, 0.10)', 
                  borderRadius: 8, 
                  justifyContent: 'flex-start', 
                  alignItems: 'baseline', 
                  gap: 4, 
                  display: 'flex'
                }}>
                  <div style={{
                    justifyContent: 'center', 
                    display: 'flex', 
                    color: 'white', 
                    wordWrap: 'break-word',
                    height: '16px',
                    ...typography.num
                  }}>93</div>
                  <div style={{
                    justifyContent: 'center', 
                    display: 'flex', 
                    color: 'rgba(255, 255, 255, 0.60)', 
                    wordWrap: 'break-word',
                    height: '16px',
                    ...typography.body1R
                  }}>JD</div>
                </div>
                <div style={{
                  padding: 8, 
                  background: 'rgba(255, 255, 255, 0.10)', 
                  borderRadius: 8, 
                  justifyContent: 'flex-start', 
                  alignItems: 'baseline', 
                  gap: 4, 
                  display: 'flex'
                }}>
                  <div style={{
                    justifyContent: 'center', 
                    display: 'flex', 
                    color: 'white', 
                    wordWrap: 'break-word',
                    height: '16px',
                    ...typography.num
                  }}>93</div>
                  <div style={{
                    justifyContent: 'center', 
                    display: 'flex', 
                    color: 'rgba(255, 255, 255, 0.60)', 
                    wordWrap: 'break-word',
                    height: '16px',
                    ...typography.body1R
                  }}>WS</div>
                </div>
                <div style={{
                  padding: 8,
                  justifyContent: 'flex-start', 
                  alignItems: 'baseline', 
                  gap: 4, 
                  display: 'flex'
                }}>
                  <div style={{
                    justifyContent: 'center', 
                    display: 'flex', 
                    color: 'white', 
                    wordWrap: 'break-word',
                    height: '16px',
                    ...typography.num
                  }}>14.3%</div>
                  <div style={{
                    justifyContent: 'center', 
                    display: 'flex', 
                    color: 'rgba(255, 255, 255, 0.60)', 
                    wordWrap: 'break-word',
                    height: '16px',
                    ...typography.body1R
                  }}>ABV</div>
                </div>
              </div>

              {/* Food Pairing Section */}
              <div style={{
                width: '100%',
                padding: '0 20px',
                marginTop: '48px',
                marginBottom: '20px'
              }}>
                <h1 style={{
                  ...typography.h1,
                  color: 'white',
                  marginBottom: '32px',
                  textAlign: 'left'
                }}>
                  Food pairing
                </h1>

                {/* Red Meat Pairing */}
                <div style={{
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid transparent',
                  backgroundImage: 'linear-gradient(rgba(30, 30, 30, 0.9), rgba(30, 30, 30, 0.9)), linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.06))',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <GiCow size={28} color="white" />
                    <span style={{ 
                      color: 'white', 
                      ...typography.bodyPlus1,
                      fontSize: '20px'  // Keep the larger size for visual hierarchy
                    }}>Red Meat</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      color: 'black',
                      backgroundColor: '#e0e0e0',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      ...typography.buttonPlus1
                    }}>
                      Perfect match
                    </span>
                    <BsChevronDown size={20} color="white" />
                  </div>
                </div>

                {/* Cheese Pairings */}
                <div style={{
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid transparent',
                  backgroundImage: 'linear-gradient(rgba(30, 30, 30, 0.9), rgba(30, 30, 30, 0.9)), linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.06))',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <GiCheeseWedge size={28} color="white" />
                    <span style={{ color: 'white', fontSize: '20px', fontFamily: 'Inter, sans-serif' }}>Cheese Pairings</span>
                  </div>
                  <BsChevronDown size={20} color="white" />
                </div>

                {/* Vegetarian Options */}
                <div style={{
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid transparent',
                  backgroundImage: 'linear-gradient(rgba(30, 30, 30, 0.9), rgba(30, 30, 30, 0.9)), linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.06))',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <GiBroccoli size={28} color="white" />
                    <span style={{ color: 'white', fontSize: '20px', fontFamily: 'Inter, sans-serif' }}>Vegetarian Options</span>
                  </div>
                  <BsChevronDown size={20} color="white" />
                </div>

                {/* Avoid pairing with */}
                <div style={{
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid transparent',
                  backgroundImage: 'linear-gradient(rgba(30, 30, 30, 0.9), rgba(30, 30, 30, 0.9)), linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.06))',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px', color: 'red' }}>❌</span>
                    <span style={{ color: 'white', fontSize: '20px', fontFamily: 'Inter, sans-serif' }}>Avoid pairing with</span>
                  </div>
                  <span style={{ fontSize: '20px', color: 'white' }}>⌄</span>
                </div>
              </div>
              
              {/* History Section */}
              <div style={{
                width: '100%',
                padding: '0 20px',
                marginBottom: '20px'
              }}>
                <h1 style={{
                  ...typography.h1,
                  color: 'white',
                  marginBottom: '32px',
                  textAlign: 'left'
                }}>
                  History
                </h1>
                
                <p style={{
                  color: 'white',
                  marginBottom: '16px',
                  ...typography.body
                }}>
                  Lytton Springs is a renowned single-vineyard red wine produced by Ridge Vineyards, located in the Dry Creek Valley of Sonoma County, California. Celebrated for its rich heritage and distinctive field-blend style, Lytton Springs has become a benchmark for Zinfandel-based wines in the United States.
                </p>
              </div>
              
              {/* Conversation Section */}
              <div style={{
                width: '100%',
                padding: '0 20px',
                marginBottom: '20px'
              }}>
                <h1 style={{
                  ...typography.h1,
                  color: 'white',
                  marginBottom: '32px',
                  textAlign: 'left'
                }}>
                  Ask about this wine
                </h1>
                
                {/* Conversation container */}
                <div id="conversation" className="space-y-4 mb-20">
                  {messages.length > 0 && 
                    messages.map((message, index) => (
                      <div key={`${message.id}-${index}`} style={{
                        backgroundColor: message.role === 'user' ? 'rgba(106, 83, 231, 0.2)' : 'rgba(30, 30, 30, 0.9)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          ...typography.button,
                          color: message.role === 'user' ? '#b9a5ff' : 'white',
                          marginBottom: '8px',
                          fontWeight: message.role === 'user' ? '600' : '400'
                        }}>
                          {message.role === 'user' ? 'You' : 'Sommelier AI'}
                        </div>
                        <div style={{
                          color: 'white',
                          whiteSpace: 'pre-wrap',
                          ...typography.body
                        }}>
                          {message.content}
                        </div>
                      </div>
                    ))
                  }
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div style={{
                      backgroundColor: 'rgba(30, 30, 30, 0.9)',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        color: 'white',
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        Sommelier AI
                      </div>
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
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
          </div>
          
          {/* Input Area - Fixed to Bottom */}
          <div className="bg-background p-2 sm:p-3 shadow-lg border-t border-border z-50 fixed bottom-0 left-0 right-0">
            <div className="max-w-3xl mx-auto">
              {/* Suggestion chips */}
              <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                <button 
                  onClick={() => handleSendMessage("Tasting notes")}
                  className="whitespace-nowrap bg-transparent text-white rounded border border-[rgba(255,255,255,0.04)] text-sm hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  Tasting notes
                </button>
                <button 
                  onClick={() => handleSendMessage("Simple recipes for this wine")}
                  className="whitespace-nowrap bg-transparent text-white rounded border border-[rgba(255,255,255,0.04)] text-sm hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  Simple recipes
                </button>
                <button 
                  onClick={() => handleSendMessage("Where is this wine from?")}
                  className="whitespace-nowrap bg-transparent text-white rounded border border-[rgba(255,255,255,0.04)] text-sm hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  Where it's from
                </button>
              </div>
              
              <div className="relative flex items-center gap-1.5 sm:gap-2">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isProcessing={isTyping}
                />
                <VoiceAssistant
                  onSendMessage={handleSendMessage}
                  isProcessing={isTyping}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;