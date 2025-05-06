import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Sidebar from './Sidebar';
import { useConversation } from '@/hooks/useConversation';
import { Message, Conversation } from '@shared/schema';

const ChatInterface: React.FC = () => {
  // Custom hooks
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // State
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Refs
  const welcomeSheetRef = useRef<HTMLDivElement>(null);
  
  // Conversation hook
  const {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations,
    createNewConversation,
    clearConversation
  } = useConversation();

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });

  // Close sidebar on mobile when changing conversation
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [currentConversationId, isMobile, sidebarOpen]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === '') return;
    
    setIsTyping(true);
    
    try {
      // Create a conversation if needed
      let conversationId = currentConversationId;
      if (!conversationId) {
        const newConversation = await apiRequest('POST', '/api/conversations', { 
          title: content.slice(0, 30) + (content.length > 30 ? '...' : '') 
        });
        const data = await newConversation.json();
        conversationId = data.id;
        setCurrentConversationId(conversationId);
      }
      
      // Add user message to UI
      const userMessage = {
        id: Date.now(),
        content,
        role: 'user',
        conversationId,
        createdAt: new Date()
      } as Message;
      
      addMessage(userMessage);
      
      // Try to send to API
      let response = await apiRequest('POST', '/api/chat', {
        messages: [{ role: 'user', content }],
        conversationId
      });
      
      // Handle 404 conversation not found
      if (response.status === 404) {
        console.log('Conversation not found, creating a new one');
        
        // Create a new conversation
        const newConversationRes = await apiRequest('POST', '/api/conversations', { 
          title: content.slice(0, 30) + (content.length > 30 ? '...' : '') 
        });
        const newData = await newConversationRes.json();
        const newId = newData.id;
        setCurrentConversationId(newId);
        
        // Try again with new ID
        response = await apiRequest('POST', '/api/chat', {
          messages: [{ role: 'user', content }],
          conversationId: newId
        });
      }
      
      // Handle successful response
      const responseData = await response.json();
      
      // Add assistant response
      const assistantMessage = {
        id: Date.now() + 1,
        content: responseData.message.content,
        role: 'assistant',
        conversationId: responseData.conversationId,
        createdAt: new Date()
      } as Message;
      
      addMessage(assistantMessage);
      
      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
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
  
  // Clear conversation handler
  const handleClearConversation = async () => {
    if (!currentConversationId) return;
    
    try {
      await apiRequest('DELETE', `/api/conversations/${currentConversationId}`);
      clearConversation();
      createNewConversation();
      toast({
        title: "Conversation cleared",
        description: "All messages have been removed."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to clear conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  // Handle creating a new conversation
  const handleNewChat = async () => {
    await createNewConversation();
  };
  
  // Safe empty array for when conversations are not yet loaded
  const safeConversations: Conversation[] = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <Sidebar 
            isOpen={sidebarOpen}
            conversations={safeConversations}
            currentConversationId={currentConversationId}
            onNewChat={handleNewChat}
            onSelectConversation={setCurrentConversationId}
          />
        )}

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
          {/* Unified scrollable container */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* User Image Banner - only shown when no messages */}
            {messages.length === 0 && (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <img 
                  src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" 
                  alt="Wine bottle collection" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Chat Messages Content */}
            <div className="px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div 
                  ref={welcomeSheetRef}
                  className="mx-auto bg-white rounded-lg p-5 shadow-sm max-w-lg"
                  style={{ 
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                  }}>
                  {/* Pull handle indicator */}
                  <div className="relative">
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 mt-0"></div>
                  </div>
                  
                  <p className="text-xl font-medium mb-3 text-purple-800">
                    Hi! I'm your personal sommelier.
                  </p>
                  <p className="text-gray-700 mb-4">
                    I see you've ordered Cabernet Sauvignon. You've got excellent taste! Would you like me to tell you a short story about this wine?
                  </p>
                  
                  <div className="h-16"></div> {/* Small spacer at the bottom */}
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                    />
                  ))}
                </>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="mx-auto max-w-2xl">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
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

          {/* Input Area */}
          <div className="bg-white p-3 shadow-lg border-t border-gray-100 z-50">
            {/* Suggestion chips */}
            <div className="scrollbar-hide overflow-x-auto mb-3 pb-1 -mt-1 flex gap-2 w-full">
              <button 
                onClick={() => handleSendMessage("Tasting notes")}
                className="whitespace-nowrap py-2 px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-sm font-medium hover:bg-purple-50 transition-colors"
              >
                Tasting notes
              </button>
              <button 
                onClick={() => handleSendMessage("Simple recipes for this wine")}
                className="whitespace-nowrap py-2 px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-sm font-medium hover:bg-purple-50 transition-colors"
              >
                Simple recipes
              </button>
              <button 
                onClick={() => handleSendMessage("Where is this wine from?")}
                className="whitespace-nowrap py-2 px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-sm font-medium hover:bg-purple-50 transition-colors"
              >
                Where it's from
              </button>
            </div>
            
            <div className="relative flex items-center gap-2">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isProcessing={isTyping}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatInterface;