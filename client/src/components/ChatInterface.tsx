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
  const [isExpanded, setIsExpanded] = useState(false);
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
  
  // Bottom sheet scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      if (welcomeSheetRef.current) {
        const scrollTop = welcomeSheetRef.current.scrollTop;
        // When scrolled more than 50px, expand the sheet
        setIsExpanded(scrollTop > 50);
      }
    };
    
    const sheetElement = welcomeSheetRef.current;
    if (sheetElement) {
      sheetElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (sheetElement) {
        sheetElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

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
          {/* User Image Section */}
          {messages.length === 0 && (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
              <img 
                src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" 
                alt="Wine bottle collection" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Chat Messages - Styled like the wine info layout */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
            {messages.length === 0 ? (
              <div 
                ref={welcomeSheetRef}
                className={`mx-auto max-w-lg bg-white rounded-lg p-5 shadow-sm overflow-y-auto transition-all duration-300 ease-in-out transform-gpu ${
                  isExpanded ? 'h-[80vh]' : 'h-[60vh]'
                }`}
                style={{ 
                  height: isExpanded ? 'min(80vh, 700px)' : 'min(60vh, 500px)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}>
                {/* Pull handle indicator */}
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 mt-0"></div>
                
                <p className="text-xl font-medium mb-3 text-purple-800">
                  Hi! I'm your personal sommelier.
                </p>
                <p className="text-gray-700 mb-4">
                  I see you've ordered Cabernet Sauvignon. You've got excellent taste! Would you like me to tell you a short story about this wine?
                </p>
                
                {/* Additional content to enable scrolling - making the bottom sheet expandable */}
                <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="text-lg font-medium text-purple-800 mb-2">About Cabernet Sauvignon</h3>
                  <p className="text-gray-700 mb-3">
                    Cabernet Sauvignon is one of the world's most widely recognized red wine grape varieties. It is the dominant grape in Bordeaux, and is planted in virtually every major wine producing country.
                  </p>
                  <p className="text-gray-700 mb-3">
                    The flavor profile typically includes notes of black currant, black cherry, cedar, and sometimes bell pepper or green olive.
                  </p>
                  <p className="text-gray-700">
                    Scroll down to see more details about this exceptional wine variety, or ask me specific questions about its origin, taste profile, or food pairings.
                  </p>
                </div>
                
                <div className="mt-6 bg-white p-4 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium text-purple-800 mb-2">Try asking about:</h3>
                  <ul className="text-gray-700 space-y-2 ml-2">
                    <li>• What foods pair well with Cabernet Sauvignon?</li>
                    <li>• What's the history of this wine?</li>
                    <li>• Is Cabernet Sauvignon dry or sweet?</li>
                    <li>• Best regions for Cabernet Sauvignon</li>
                    <li>• How should I store this wine?</li>
                  </ul>
                </div>
                
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
            
            {/* Sample Action Buttons (like in the reference design) */}
            {messages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button className="w-full py-3 px-4 bg-white text-gray-700 rounded-full border border-gray-200 text-sm font-medium flex items-center justify-center">
                  What food suits better
                </button>
                <button className="w-full py-3 px-4 bg-white text-gray-700 rounded-full border border-gray-200 text-sm font-medium flex items-center justify-center">
                  What's alternatives
                </button>
              </div>
            )}
          </div>

          {/* New Input Area - styled to match the reference */}
          <div className="bg-white p-3">
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
