import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ConversationSelector } from './ConversationSelector';
import { useConversation } from '@/hooks/useConversation';
import { ClientMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Menu, MessageSquare, X } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Function to handle selecting a conversation 
  const handleSelectConversation = async (id: number) => {
    await setCurrentConversationId(id);
    setSidebarOpen(false); // Close sidebar after selection on mobile
  };

  // Function to handle creating a new conversation
  const handleCreateNewChat = async () => {
    await createNewConversation();
    setSidebarOpen(false); // Close sidebar after creating new conversation on mobile
  };

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      {/* Mobile Header - Fixed to top */}
      <div className="sm:hidden bg-white border-b px-3 py-2 flex items-center justify-between shadow-sm z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium text-[#6A53E7]">Cabernet Sauvignon</h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleCreateNewChat}
          className="h-9 w-9"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar - Slide in from left */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setSidebarOpen(false)}>
            <div 
              className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-white shadow-lg z-50" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="font-semibold text-[#6A53E7]">Conversations</h2>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-3">
                <ConversationSelector 
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onSelectConversation={handleSelectConversation}
                  onCreateNewConversation={handleCreateNewChat}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop Sidebar - Always visible */}
        <div className="hidden sm:block w-64 border-r overflow-y-auto bg-white">
          <div className="p-4">
            <h2 className="font-semibold mb-3 text-[#6A53E7]">My Conversations</h2>
            <ConversationSelector 
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onCreateNewConversation={handleCreateNewChat}
            />
          </div>
        </div>
        
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-100 overflow-hidden pt-0 sm:pt-0">
          {/* Scrollable container - adjust for mobile header */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto scrollbar-hide pt-0 mt-0 sm:mt-0">
            {/* Wine bottle image (always show at top with responsive height) */}
            <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-200 flex items-center justify-center">
              <img 
                src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" 
                alt="Wine bottle collection" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Chat Messages */}
            <div className="px-3 sm:px-4 py-3 sm:py-4 pb-36 space-y-0 max-w-3xl mx-auto w-full">
              {/* Always show the welcome message */}
              <div className="mx-auto p-3 sm:p-5 max-w-lg" style={{ marginBottom: '0' }}>
                
                <p className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-purple-800">
                  Hi! I'm your personal sommelier.
                </p>
                <p className="text-sm sm:text-base text-gray-700 mb-0">
                  I see you've ordered Cabernet Sauvignon. You've got excellent taste! Would you like me to tell you a short story about this wine?
                </p>
                
                {messages.length === 0 && <div className="h-10 sm:h-16"></div>}
              </div>
              
              {/* Show any conversation messages directly below the welcome message */}
              {messages.length > 0 && 
                messages.map((message, index) => (
                  <ChatMessage 
                    key={`${message.id}-${index}`} 
                    message={message} 
                  />
                ))
              }

              {/* Typing Indicator */}
              {isTyping && (
                <div className="mx-auto max-w-2xl">
                  <div className="p-2 sm:p-4">
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