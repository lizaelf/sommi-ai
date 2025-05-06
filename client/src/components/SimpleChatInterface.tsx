import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ConversationSelector from './ConversationSelector';
import { Message, Conversation } from '@shared/schema';

// Save conversation ID key
const LS_CURRENT_CONVERSATION_KEY = 'chatgpt_companion_current_conversation';

// Create a simplified chat interface that relies on database persistence
const SimpleChatInterface: React.FC = () => {
  // Basic states
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });

  // Query conversations data - load on component mount
  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  // Initialize conversation with proper persistence
  useEffect(() => {
    async function initializeConversation() {
      try {
        setIsLoading(true);
        console.log("Initializing conversation...");
        
        // First try to get the last used conversation ID from localStorage
        const savedConversationId = localStorage.getItem(LS_CURRENT_CONVERSATION_KEY);
        
        if (savedConversationId) {
          // Verify this conversation still exists in the database
          try {
            console.log(`Checking saved conversation ID: ${savedConversationId}`);
            const response = await apiRequest('GET', `/api/conversations/${savedConversationId}`);
            if (response.ok) {
              // Conversation exists, use it
              const conversationId = Number(savedConversationId);
              console.log(`Using saved conversation ID: ${conversationId}`);
              setCurrentConversationId(conversationId);
              
              // Load messages for this conversation
              const messagesResponse = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                if (Array.isArray(messagesData)) {
                  console.log(`Loaded ${messagesData.length} messages from saved conversation ID`);
                  setMessages(messagesData);
                }
              }
              setIsLoading(false);
              return; // Exit early as we found and loaded the conversation
            }
          } catch (error) {
            console.warn('Saved conversation ID not found or invalid:', error);
            // Continue to fallback options below
          }
        }
        
        // If no valid saved conversation, check if we have conversations from API
        if (conversations && Array.isArray(conversations) && conversations.length > 0) {
          const mostRecentConversation = conversations[0]; // Assuming sorted by most recent
          const conversationId = mostRecentConversation.id;
          
          console.log(`Using most recent conversation ID: ${conversationId}`);
          setCurrentConversationId(conversationId);
          localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(conversationId));
          
          // Load messages for this conversation
          const messagesResponse = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            if (Array.isArray(messagesData)) {
              console.log(`Loaded ${messagesData.length} messages from most recent conversation`);
              setMessages(messagesData);
            }
          }
        } else {
          // If no conversations yet, create a new one
          console.log('No existing conversations found, creating new one');
          const response = await apiRequest('POST', '/api/conversations', { 
            title: 'New Conversation' 
          });
          const data = await response.json();
          setCurrentConversationId(data.id);
          localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(data.id));
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      } finally {
        setIsLoading(false);
      }
    }

    // Only run initialization if conversations have been loaded from API
    // and we don't have a current conversation ID
    if (conversations !== undefined && currentConversationId === null) {
      initializeConversation();
    }
  }, [conversations, currentConversationId]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === '' || !currentConversationId) return;
    
    setIsTyping(true);
    
    try {
      // Add user message to UI immediately
      const tempUserMessage = {
        id: Date.now(),
        content,
        role: 'user',
        conversationId: currentConversationId,
        createdAt: new Date()
      } as Message;
      
      setMessages(prev => [...prev, tempUserMessage]);
      
      // Send to API
      const response = await apiRequest('POST', '/api/chat', {
        messages: [{ role: 'user', content }],
        conversationId: currentConversationId
      });
      
      // Handle 404 error (conversation not found)
      if (response.status === 404) {
        // Create a new conversation
        const newConversation = await apiRequest('POST', '/api/conversations', { 
          title: content.slice(0, 30) + (content.length > 30 ? '...' : '') 
        });
        const newConversationData = await newConversation.json();
        const newId = newConversationData.id;
        
        // Try again with the new conversation ID
        const newResponse = await apiRequest('POST', '/api/chat', {
          messages: [{ role: 'user', content }],
          conversationId: newId
        });
        
        // Update current conversation ID
        setCurrentConversationId(newId);
        localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(newId));
        
        // Process the response
        const responseData = await newResponse.json();
        
        // Re-fetch messages to ensure we have the correct order
        const messagesResponse = await apiRequest('GET', `/api/conversations/${newId}/messages`);
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      } else {
        // Process normal response
        const responseData = await response.json();
        
        // Ensure current conversation ID is saved
        localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(currentConversationId));
        
        // Re-fetch messages to ensure we have all messages and the correct order
        const messagesResponse = await apiRequest('GET', `/api/conversations/${currentConversationId}/messages`);
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }
      
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

  // Create a new conversation
  const handleNewChat = async () => {
    try {
      const response = await apiRequest('POST', '/api/conversations', { 
        title: 'New Conversation' 
      });
      const data = await response.json();
      
      setCurrentConversationId(data.id);
      localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(data.id));
      setMessages([]);
      
      // Refetch conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // Close sidebar on mobile after creating new conversation
      if (isMobile) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create a new conversation",
        variant: "destructive" 
      });
    }
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = async (id: number) => {
    try {
      // Skip if it's the same conversation
      if (id === currentConversationId) {
        if (isMobile) setShowSidebar(false);
        return;
      }
      
      setCurrentConversationId(id);
      localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(id));
      
      // Load messages for this conversation
      const messagesResponse = await apiRequest('GET', `/api/conversations/${id}/messages`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        if (Array.isArray(messagesData)) {
          console.log(`Loaded ${messagesData.length} messages for conversation ${id}`);
          setMessages(messagesData);
        }
      }
      
      // Close sidebar on mobile
      if (isMobile) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error(`Failed to load conversation ${id}:`, error);
      toast({
        title: "Error",
        description: "Failed to load the selected conversation",
        variant: "destructive"
      });
    }
  };

  // Display loading state if conversations are being loaded
  if (isLoading) {
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
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className={`bg-white p-4 border-r border-gray-200 ${isMobile ? 'absolute top-0 bottom-0 left-0 z-50 w-64 shadow-lg' : 'w-64'}`}>
            {conversations && conversations.length > 0 && (
              <ConversationSelector
                conversations={conversations}
                currentConversationId={currentConversationId}
                onSelectConversation={handleSelectConversation}
                onCreateNewConversation={handleNewChat}
              />
            )}
          </div>
        )}
        
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
          {/* Top navigation bar with sidebar toggle */}
          <div className="bg-white p-2 border-b border-gray-200 flex items-center">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-700 hover:text-[#6A53E7] p-2 rounded-md focus:outline-none"
            >
              {showSidebar ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <h2 className="ml-2 text-lg font-medium text-[#6A53E7]">Cabernet Sauvignon Chat</h2>
          </div>
          
          {/* Scrollable container */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Wine bottle image when no messages */}
            {messages.length === 0 && (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <img 
                  src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" 
                  alt="Wine bottle collection" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Chat Messages */}
            <div className="px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="mx-auto bg-white rounded-lg p-5 shadow-sm max-w-lg"
                     style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
                  <div className="relative">
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 mt-0"></div>
                  </div>
                  
                  <p className="text-xl font-medium mb-3 text-purple-800">
                    Hi! I'm your personal sommelier.
                  </p>
                  <p className="text-gray-700 mb-4">
                    I see you've ordered Cabernet Sauvignon. You've got excellent taste! Would you like me to tell you a short story about this wine?
                  </p>
                  
                  <div className="h-16"></div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
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
            {/* Conversation Info */}
            {currentConversationId && (
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-500">
                  Conversation #{currentConversationId}
                </div>
                <button 
                  onClick={handleNewChat}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  New Conversation
                </button>
              </div>
            )}
            
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

export default SimpleChatInterface;