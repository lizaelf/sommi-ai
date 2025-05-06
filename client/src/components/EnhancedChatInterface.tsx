import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ConversationSelector from './ConversationSelector';
import { useConversation } from '@/hooks/useConversation';
import { ClientMessage } from '@/lib/types';

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
  const [showConversations, setShowConversations] = useState(false);
  const { toast } = useToast();
  
  // Create a ref for the chat container to allow scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });
  
  // Improved scroll behavior for better user experience
  useEffect(() => {
    // Always scroll to bottom when messages change or typing status changes
    if (chatContainerRef.current) {
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
      
      // Check if we need to reload messages (they might be stored server-side)
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

  // Handle conversation selection
  const handleSelectConversation = async (id: number) => {
    if (id === currentConversationId) return;
    
    try {
      await setCurrentConversationId(id);
      setShowConversations(false); // Hide conversation selector after selection
      
      // Scroll to top after changing conversation
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    }
  };

  // Handle creating a new conversation
  const handleCreateNewConversation = async () => {
    try {
      const newId = await createNewConversation();
      if (newId) {
        setShowConversations(false); // Hide conversation selector after creation
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      {/* Header with App Name and Conversation Toggle */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#6A53E7]">
          Cabernet Companion
        </h1>
        <button 
          onClick={() => setShowConversations(!showConversations)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-purple-50 text-[#6A53E7] hover:bg-purple-100 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          Conversations
        </button>
      </header>

      {/* Conversation Selector (conditionally rendered) */}
      {showConversations && (
        <div className="bg-white border-b border-gray-200">
          <ConversationSelector
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onCreateNewConversation={handleCreateNewConversation}
          />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
          {/* Scrollable container */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Wine bottle image (always show at top with responsive height) */}
            <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-200 flex items-center justify-center">
              <img 
                src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" 
                alt="Wine bottle collection" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Chat Messages */}
            <div className="px-3 sm:px-4 py-3 sm:py-4 pb-36 space-y-3 sm:space-y-4 max-w-3xl mx-auto w-full">
              {/* Always show the welcome message */}
              <div className="mx-auto bg-white rounded-lg p-3 sm:p-5 shadow-sm max-w-lg"
                   style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
                <div className="relative">
                  <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 mt-0"></div>
                </div>
                
                <p className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-purple-800">
                  Hi! I'm your personal sommelier.
                </p>
                <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
                  I see you've ordered Cabernet Sauvignon. You've got excellent taste! Would you like me to tell you a short story about this wine?
                </p>
                
                {messages.length === 0 && <div className="h-10 sm:h-16"></div>}
              </div>
              
              {/* Show any conversation messages below the welcome message */}
              {messages.length > 0 && (
                <>
                  {messages.map((message, index) => (
                    <ChatMessage 
                      key={`${message.id}-${index}`} 
                      message={message} 
                    />
                  ))}
                </>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="mx-auto max-w-2xl">
                  <div className="bg-white rounded-lg p-2 sm:p-4 shadow-sm">
                    <div className="text-gray-700">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Fixed to Bottom */}
          <div className="bg-white p-2 sm:p-3 shadow-lg border-t border-gray-100 z-50 fixed bottom-0 left-0 right-0">
            <div className="max-w-3xl mx-auto">
              {/* Suggestion chips */}
              <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                <button 
                  onClick={() => handleSendMessage("Tasting notes")}
                  className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-xs sm:text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  Tasting notes
                </button>
                <button 
                  onClick={() => handleSendMessage("Simple recipes for this wine")}
                  className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-xs sm:text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  Simple recipes
                </button>
                <button 
                  onClick={() => handleSendMessage("Where is this wine from?")}
                  className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-xs sm:text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  Where it's from
                </button>
              </div>
              
              <div className="relative flex items-center gap-1.5 sm:gap-2">
                <ChatInput 
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