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
import { getWineDisplayName, getWineRegion, WINE_CONFIG } from '@shared/wineConfig';
// Import typography styles

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
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Create a ref for the chat container to allow scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });
  
  // Scroll behavior - scroll to latest AI response
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      // Add a small delay to ensure DOM is fully updated
      setTimeout(() => {
        // Find the last assistant message in the DOM
        const assistantMessages = chatContainerRef.current?.querySelectorAll('[data-role="assistant"]');
        if (assistantMessages && assistantMessages.length > 0) {
          const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
          
          // Scroll to the beginning of the latest AI response
          lastAssistantMessage.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else if (isTyping) {
          // If no assistant messages yet but user is typing, scroll to bottom
          const scrollToPosition = chatContainerRef.current?.scrollHeight || 0;
          chatContainerRef.current?.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
          });
        }
      }, 300); // Increased delay to ensure response is fully rendered
    }
    // On initial load, scroll to top to show beginning of page
    else if (chatContainerRef.current && messages.length === 0) {
      chatContainerRef.current.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }
  }, [messages, isTyping]);
  
  // Reset suggestions visibility when conversation changes
  useEffect(() => {
    if (messages.length === 0) {
      setHideSuggestions(false);
    }
  }, [messages.length]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === '' || !currentConversationId) return;
    
    // Hide suggestions after sending a message
    setHideSuggestions(true);
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
      // Optimize the prompt for faster responses by explicitly requesting brevity
      const systemPrompt = "You are a friendly wine expert specializing in Cabernet Sauvignon. Your responses should be warm, engaging, and informative. Focus on providing interesting facts, food pairings, and tasting notes specific to Cabernet Sauvignon. Keep your responses very concise and to the point. Aim for 2-3 sentences maximum unless specifically asked for more detail.";
      
      // Make the API request with optimization flags
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Priority': 'high' // Signal high priority to the server
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content }
          ],
          conversationId: currentConversationId,
          optimize_for_speed: true // Additional flag to optimize for speed
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
        
        // Auto-speak the assistant's response if window.voiceAssistant is available
        if (window.voiceAssistant && window.voiceAssistant.speakResponse) {
          try {
            console.log("Auto-speaking the assistant's response");
            await window.voiceAssistant.speakResponse(assistantMessage.content);
          } catch (error) {
            console.error("Failed to auto-speak response:", error);
          }
        }
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
                {getWineDisplayName()}
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
                <span>{getWineRegion()}</span>
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
                  display: 'flex',
                  padding: 8,
                  alignItems: 'baseline',
                  gap: 4,
                  background: 'rgba(255, 255, 255, 0.10)', 
                  borderRadius: 8
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
                  display: 'flex',
                  padding: 8,
                  alignItems: 'baseline',
                  gap: 4,
                  background: 'rgba(255, 255, 255, 0.10)', 
                  borderRadius: 8
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
                  display: 'flex',
                  padding: 8,
                  alignItems: 'baseline',
                  gap: 4,
                  background: 'rgba(255, 255, 255, 0.10)', 
                  borderRadius: 8
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
                  display: 'flex',
                  padding: 8,
                  alignItems: 'baseline',
                  gap: 4,
                  background: 'rgba(255, 255, 255, 0.10)', 
                  borderRadius: 8
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

              {/* Historic Heritage Section */}
              <div style={{
                width: '100%',
                padding: '0 20px',
                marginTop: '48px',
                marginBottom: '20px'
              }}>
                <p style={{
                  color: 'white',
                  marginBottom: '16px',
                  ...typography.body
                }}>
                  {WINE_CONFIG.history}
                </p>
              </div>

              {/* Food Pairing Section */}
              <div style={{
                width: '100%',
                padding: '0 20px',
                marginBottom: '20px'
              }}>
                <h1 style={{
                  ...typography.h1,
                  color: 'white',
                  marginBottom: '24px',
                  textAlign: 'left'
                }}>
                  Food pairing
                </h1>

                {/* Red Meat Pairing - Expandable */}
                <div 
                  onClick={() => {
                    // Toggle expanded state for this item
                    setExpandedItem(expandedItem === 'redMeat' ? null : 'redMeat');
                  }}
                  style={{
                    backgroundColor: '#191919',
                    borderRadius: '16px',
                    padding: '0 20px',
                    minHeight: '64px', // Use minHeight instead of fixed height to allow expansion
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column', // Change to column for expanded view
                    gap: '10px',
                    alignSelf: 'stretch',
                    cursor: 'pointer', // Show pointer cursor to indicate clickable
                    transition: 'all 0.3s ease', // Smooth transition for expanding
                    borderTop: '2px solid transparent',
                    borderRight: '1px solid transparent',
                    borderBottom: '1px solid transparent',
                    borderLeft: '1px solid transparent',
                    backgroundImage: 'linear-gradient(#191919, #191919), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0) 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                  }}
                >
                  {/* Header row - always visible */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    minHeight: '64px',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>🥩</span>
                      <span style={{ 
                        color: 'white', 
                        ...typography.bodyPlus1
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
                      {/* Rotating chevron icon for expanded state */}
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          transform: expandedItem === 'redMeat' ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <path d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === 'redMeat' && (
                    <div
                      style={{
                        padding: '0 0 20px 0', // Remove left padding
                        color: 'white',
                        ...typography.body // Using Body text style as requested
                      }}
                      className="pl-[0px] pr-[0px]">
                      <p>{getWineDisplayName()}'s elegant structure and complex flavor profile makes it perfect for premium red meat preparations:</p>
                      <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>Grilled bistecca with herbs</li>
                        <li>Braised short ribs with rich sauce</li>
                        <li>Roasted rack of lamb with Mediterranean herbs</li>
                        <li>Aged beef tenderloin with mushrooms</li>
                      </ul>
                      <p>The wine's refined tannins and mineral complexity complement sophisticated meat dishes beautifully.</p>
                    </div>
                  )}
                </div>

                {/* Cheese Pairings - Expandable */}
                <div 
                  onClick={() => {
                    // Toggle expanded state for this item
                    setExpandedItem(expandedItem === 'cheese' ? null : 'cheese');
                  }}
                  style={{
                    backgroundColor: '#191919',
                    borderRadius: '16px',
                    padding: '0 20px',
                    minHeight: '64px',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    alignSelf: 'stretch',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderTop: '2px solid transparent',
                    borderRight: '1px solid transparent',
                    borderBottom: '1px solid transparent',
                    borderLeft: '1px solid transparent',
                    backgroundImage: 'linear-gradient(#191919, #191919), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0) 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                  }}
                >
                  {/* Header row - always visible */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    minHeight: '64px',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>🧀</span>
                      <span style={{ color: 'white', ...typography.bodyPlus1 }}>Cheese Pairings</span>
                    </div>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        transform: expandedItem === 'cheese' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <path d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06" fill="white"/>
                    </svg>
                  </div>
                  
                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === 'cheese' && (
                    <div style={{
                      padding: '0 0 20px 0',
                      color: 'white',
                      ...typography.body
                    }}>
                      <p>{getWineDisplayName()}'s sophisticated tannin structure and complex flavors pair beautifully with these artisanal cheeses:</p>
                      <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>Aged Parmigiano-Reggiano (24+ months)</li>
                        <li>Aged Gouda or Manchego</li>
                        <li>Gorgonzola or blue cheese varieties</li>
                        <li>Aged sheep's milk cheese</li>
                      </ul>
                      <p>The wine's elegant mineral backbone and structured tannins create perfect harmony with aged cheeses.</p>
                    </div>
                  )}
                </div>

                {/* Vegetarian Options - Expandable */}
                <div 
                  onClick={() => {
                    // Toggle expanded state for this item
                    setExpandedItem(expandedItem === 'vegetarian' ? null : 'vegetarian');
                  }}
                  style={{
                    backgroundColor: '#191919',
                    borderRadius: '16px',
                    padding: '0 20px',
                    minHeight: '64px',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    alignSelf: 'stretch',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderTop: '2px solid transparent',
                    borderRight: '1px solid transparent',
                    borderBottom: '1px solid transparent',
                    borderLeft: '1px solid transparent',
                    backgroundImage: 'linear-gradient(#191919, #191919), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0) 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                  }}
                >
                  {/* Header row - always visible */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    minHeight: '64px',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>🥗</span>
                      <span style={{ color: 'white', ...typography.bodyPlus1 }}>Vegetarian Options</span>
                    </div>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        transform: expandedItem === 'vegetarian' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <path d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06" fill="white"/>
                    </svg>
                  </div>
                  
                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === 'vegetarian' && (
                    <div style={{
                      padding: '0 0 20px 0',
                      color: 'white',
                      ...typography.body
                    }}>
                      <p>{getWineDisplayName()}'s refined structure and elegant fruit character complement these sophisticated vegetarian dishes:</p>
                      <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>Hearty bean and vegetable stew</li>
                        <li>Grilled portobello with herbs and olive oil</li>
                        <li>Pasta with truffle and aged cheese</li>
                        <li>Roasted eggplant parmigiana</li>
                      </ul>
                      <p>The wine's mineral complexity and balanced tannins enhance rich, hearty vegetarian cuisine.</p>
                    </div>
                  )}
                </div>

                {/* Avoid pairing with - Expandable */}
                <div 
                  onClick={() => {
                    // Toggle expanded state for this item
                    setExpandedItem(expandedItem === 'avoid' ? null : 'avoid');
                  }}
                  style={{
                    backgroundColor: '#191919',
                    borderRadius: '16px',
                    padding: '0 20px',
                    minHeight: '64px',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    alignSelf: 'stretch',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderTop: '2px solid transparent',
                    borderRight: '1px solid transparent',
                    borderBottom: '1px solid transparent',
                    borderLeft: '1px solid transparent',
                    backgroundImage: 'linear-gradient(#191919, #191919), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0) 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                  }}
                >
                  {/* Header row - always visible */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    minHeight: '64px',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px', color: 'red' }}>❌</span>
                      <span style={{ color: 'white', ...typography.bodyPlus1 }}>Avoid pairing with</span>
                    </div>
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        transform: expandedItem === 'avoid' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <path d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06" fill="white"/>
                    </svg>
                  </div>
                  
                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === 'avoid' && (
                    <div style={{
                      padding: '0 0 20px 0',
                      color: 'white',
                      ...typography.body
                    }}>
                      <p>While {getWineDisplayName()} is exceptional, these combinations don't showcase its elegant qualities:</p>
                      <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>Delicate fish preparations like sole or sea bass</li>
                        <li>Fresh shellfish or raw oysters</li>
                        <li>Very spicy Asian curries or hot dishes</li>
                        <li>Light salads with acidic vinaigrettes</li>
                        <li>Sweet desserts or milk chocolate</li>
                      </ul>
                      <p>The wine's structured tannins and complex flavors can overpower delicate dishes or clash with excessive sweetness.</p>
                    </div>
                  )}
                </div>
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
                  marginBottom: '24px',
                  textAlign: 'left'
                }}>
                  Ask about this wine
                </h1>
                
                {/* Suggestion pills - hidden after sending a message */}
                <div style={{ 
                  display: hideSuggestions ? 'none' : 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  marginBottom: '20px' 
                }}>
                  <button
                    onClick={() => handleSendMessage("What does it taste like?")}
                    style={{
                      backgroundColor: '#191919',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Taste profile
                  </button>
                  <button
                    onClick={() => handleSendMessage("What food pairs well with this wine?")}
                    style={{
                      backgroundColor: '#191919',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Food pairing
                  </button>
                  <button
                    onClick={() => handleSendMessage("What's special about this vintage?")}
                    style={{
                      backgroundColor: '#191919',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    About this vintage
                  </button>
                </div>

                {/* Conversation container */}
                <div id="conversation" className="space-y-4 mb-20">
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
                            backgroundColor: message.role === 'user' ? '#F5F5F5' : message.role === 'assistant' ? '#191919' : 'transparent',
                            borderRadius: '16px',
                            padding: '16px',
                            width: message.role === 'user' ? 'fit-content' : '100%',
                            maxWidth: message.role === 'user' ? '80%' : '100%'
                          }}
                          data-role={message.role}
                        >
                          <div style={{
                            color: message.role === 'user' ? '#000000' : '#DBDBDB',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: '16px', // Body font size
                            lineHeight: '1.6'
                          }}>
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div style={{
                      backgroundColor: '#191919',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '12px',
                      width: '100%'
                    }}>
                      {/* Title removed from typing indicator as well */}
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
              {/* Suggestion chips - only shown when keyboard is active */}
              {isKeyboardFocused && (
                <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                  <button 
                    onClick={() => handleSendMessage("Tasting notes")}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                  >
                    Tasting notes
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Simple recipes for this wine")}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                  >
                    Simple recipes
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Where is this wine from?")}
                    className="whitespace-nowrap text-white rounded text-sm suggestion-button"
                  >
                    Where it's from
                  </button>
                </div>
              )}
              
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
  );
};

export default EnhancedChatInterface;