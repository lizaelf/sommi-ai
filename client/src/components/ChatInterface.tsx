import React, { useState, useEffect } from 'react';
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="md:hidden mr-3 text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">ChatGPT Interface</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => clearConversationMutation.mutate()}
            className="text-gray-500 hover:text-gray-700" 
            title="Clear conversation"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
          <button className="text-gray-500 hover:text-gray-700" title="Settings">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={!isMobile || sidebarOpen}
          conversations={safeConversations}
          currentConversationId={currentConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={setCurrentConversationId}
        />

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {/* Chat Messages */}
          <div 
            className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide"
          >
            {messages.length === 0 ? (
              <div className="mx-auto max-w-2xl">
                <div className="flex items-start space-x-3">
                  <div className="min-w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm max-w-3xl">
                    <div className="text-gray-700">
                      <p className="mb-2"><span className="font-medium text-blue-500">ChatGPT</span></p>
                      <p>Hello! I'm your AI assistant. How can I help you today?</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                />
              ))
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="mx-auto max-w-2xl">
                <div className="flex items-start space-x-3">
                  <div className="min-w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-gray-700">
                      <p className="mb-2"><span className="font-medium text-blue-500">ChatGPT</span></p>
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {sendMessageMutation.isError && (
              <div className="mx-auto max-w-2xl">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                  <i className="fas fa-exclamation-circle text-red-500 mr-3 mt-0.5"></i>
                  <div>
                    <p className="font-medium">Error connecting to the API</p>
                    <p className="text-sm">{sendMessageMutation.error?.message || 'Please check your connection and try again.'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isProcessing={isTyping || sendMessageMutation.isPending}
            apiConnected={!apiError && !!apiStatus}
          />
        </main>
      </div>
    </div>
  );
};

export default ChatInterface;
