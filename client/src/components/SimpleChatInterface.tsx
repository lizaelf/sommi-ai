import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Message } from '@shared/schema';

// Create a simplified chat interface that only relies on database persistence
const SimpleChatInterface: React.FC = () => {
  // Basic states
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });

  // Query conversations data - load on component mount
  const { data: conversations } = useQuery({
    queryKey: ['/api/conversations'],
  });

  // Set initial conversation on mount
  useEffect(() => {
    async function initializeConversation() {
      try {
        // If we have conversations loaded from the API, use the first one
        if (conversations && Array.isArray(conversations) && conversations.length > 0) {
          const firstConversationId = conversations[0].id;
          setCurrentConversationId(firstConversationId);
          
          // Load messages for this conversation
          const messagesResponse = await apiRequest('GET', `/api/conversations/${firstConversationId}/messages`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            if (Array.isArray(messagesData)) {
              setMessages(messagesData);
            }
          }
        } else {
          // If no conversations yet, create a new one
          const response = await apiRequest('POST', '/api/conversations', { 
            title: 'New Conversation' 
          });
          const data = await response.json();
          setCurrentConversationId(data.id);
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      }
    }

    if (currentConversationId === null) {
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
        
        // Try again with the new conversation ID
        const newResponse = await apiRequest('POST', '/api/chat', {
          messages: [{ role: 'user', content }],
          conversationId: newConversationData.id
        });
        
        // Update current conversation ID
        setCurrentConversationId(newConversationData.id);
        
        // Process the response
        const responseData = await newResponse.json();
        
        // Re-fetch messages to ensure we have the correct order
        const messagesResponse = await apiRequest('GET', `/api/conversations/${newConversationData.id}/messages`);
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      } else {
        // Process normal response
        const responseData = await response.json();
        
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
      setMessages([]);
      
      // Refetch conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create a new conversation",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
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