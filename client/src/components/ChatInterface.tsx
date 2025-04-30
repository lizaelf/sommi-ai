import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Sidebar from './Sidebar';
import { useConversation } from '@/hooks/useConversation';
import { Message, Conversation } from '@shared/schema';

const ChatInterface: React.FC = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Removed expansion behavior
  const welcomeSheetRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations,
    createNewConversation,
    clearConversation
  } = useConversation();

  // Query for active conversation
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['/api/conversations', currentConversationId],
    enabled: !!currentConversationId,
  });

  // Conversation messages query
  const { 
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });

  // API status check
  const { data: apiStatus, isError: apiError } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000, // Check API status every 30 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Start with a new conversation if none exists
      let conversationId = currentConversationId;
      
      if (!conversationId) {
        const newConversation = await apiRequest('POST', '/api/conversations', { 
          title: content.slice(0, 30) + (content.length > 30 ? '...' : '') 
        });
        const conversationData = await newConversation.json();
        conversationId = conversationData.id;
        setCurrentConversationId(conversationId);
      }
      
      // Add user message to UI immediately
      const userMessage = {
        id: Date.now(),
        content,
        role: 'user',
        conversationId,
        createdAt: new Date()
      } as Message;
      
      addMessage(userMessage);
      setIsTyping(true);
      
      // Send to API
      return apiRequest('POST', '/api/chat', {
        messages: [{ role: 'user', content }],
        conversationId
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Add assistant message
      const assistantMessage = {
        id: Date.now() + 1,
        content: data.message.content,
        role: 'assistant',
        conversationId: data.conversationId,
        createdAt: new Date()
      } as Message;
      
      addMessage(assistantMessage);
      setIsTyping(false);
      
      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error: Error) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: `Failed to get a response: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Clear conversation mutation
  const clearConversationMutation = useMutation({
    mutationFn: async () => {
      if (!currentConversationId) return null;
      return apiRequest('DELETE', `/api/conversations/${currentConversationId}`);
    },
    onSuccess: () => {
      clearConversation();
      createNewConversation();
      toast({
        title: "Conversation cleared",
        description: "All messages have been removed."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to clear conversation: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    if (content.trim() === '') return;
    sendMessageMutation.mutate(content);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle creating a new conversation
  const handleNewChat = async () => {
    await createNewConversation();
  };

  // Close sidebar on mobile when changing conversation
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [currentConversationId, isMobile]);
  
  // Safe empty array for when conversations are not yet loaded
  const safeConversations: Conversation[] = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]"> {/* Adjusted for mobile header */}
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden in this design */}
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
            {/* User Image Banner - only shown when no messages (not sticky, regular scrollable) */}
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
                  
                  {/* Suggestion list section removed from default state */}
                  
                  <div className="h-16"></div> {/* Small spacer at the bottom */}
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    // Only show system welcome message for first assistant message
                    if (message.role === 'assistant' && index === 1) {
                      return (
                        <div key={message.id} className="space-y-3">
                          <p className="text-xl font-medium">Great choice! 🍷</p>
                          <ChatMessage message={message} />
                        </div>
                      );
                    }
                    return (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                      />
                    );
                  })}
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

              {/* Error Message */}
              {sendMessageMutation.isError && (
                <div className="mx-auto max-w-2xl">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 mr-2">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                    </svg>
                    <div>
                      <p className="font-medium">Error connecting to the API</p>
                      <p className="text-sm">{sendMessageMutation.error?.message || 'Please check your connection and try again.'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sample Action Buttons removed to avoid duplication with suggestion chips at the bottom */}
            </div>
          </div>

          {/* New Input Area - styled to match the reference and always visible at bottom */}
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
                isProcessing={isTyping || sendMessageMutation.isPending}
                apiConnected={!apiError && !!apiStatus}
              />
            </div>
          </div>
        </main>
      </div>
      
      {/* Clear and Settings Buttons - Initially hidden in mobile view */}
      <div className="hidden">
        <button 
          onClick={() => clearConversationMutation.mutate()}
          className="text-gray-500 hover:text-gray-700" 
          title="Clear conversation"
        >
          <i className="fas fa-trash-alt"></i>
        </button>
        <button 
          className="text-gray-500 hover:text-gray-700" 
          title="Settings"
        >
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;