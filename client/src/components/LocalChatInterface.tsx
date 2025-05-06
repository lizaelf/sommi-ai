import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Message, Conversation } from '@shared/schema';
import { indexedDBStorage } from '@/lib/indexedDB';
import { apiRequest } from '@/lib/queryClient';

// Save conversation ID key
const LS_CURRENT_CONVERSATION_KEY = 'chatgpt_companion_current_conversation';

// Create a simplified chat interface that relies on IndexedDB persistence
const LocalChatInterface: React.FC = () => {
  // Basic states
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
    // When messages change or typing status changes
    if (chatContainerRef.current && messages.length > 0) {
      // Add a small delay to ensure DOM is fully updated
      setTimeout(() => {
        // Calculate the position to scroll to (a bit above the bottom to show part of the previous message)
        const scrollToPosition = chatContainerRef.current?.scrollHeight || 0;
        
        // Smooth scroll to the position
        chatContainerRef.current?.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages, isTyping]);

  // Load conversations from IndexedDB
  useEffect(() => {
    async function loadConversations() {
      try {
        setIsLoading(true);
        
        // First try to get the last used conversation ID from localStorage
        const savedConversationId = localStorage.getItem(LS_CURRENT_CONVERSATION_KEY);
        
        if (savedConversationId) {
          // Verify this conversation still exists in IndexedDB
          try {
            const conversationId = Number(savedConversationId);
            const conversation = await indexedDBStorage.getConversation(conversationId);
            
            if (conversation) {
              console.log(`Using saved conversation ID: ${conversationId}`);
              setCurrentConversationId(conversationId);
              
              // Load messages for this conversation
              const messagesData = await indexedDBStorage.getMessagesByConversation(conversationId);
              console.log(`Loaded ${messagesData.length} messages from saved conversation ID`);
              setMessages(messagesData);
              setIsLoading(false);
              return; // Exit early as we found and loaded the conversation
            }
          } catch (error) {
            console.warn('Saved conversation ID not found or invalid:', error);
            // Continue to fallback options below
          }
        }
        
        // If no valid saved conversation, check if we have any conversations
        const conversations = await indexedDBStorage.getAllConversations();
        
        if (conversations.length > 0) {
          const mostRecentConversation = conversations[0]; // Assuming sorted by most recent
          const conversationId = mostRecentConversation.id;
          
          console.log(`Using most recent conversation ID: ${conversationId}`);
          setCurrentConversationId(conversationId);
          localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(conversationId));
          
          // Load messages for this conversation
          const messagesData = await indexedDBStorage.getMessagesByConversation(conversationId);
          console.log(`Loaded ${messagesData.length} messages from most recent conversation`);
          setMessages(messagesData);
        } else {
          // If no conversations yet, create a new one
          console.log('No existing conversations found, creating new one');
          const newConversation = await indexedDBStorage.createConversation({ 
            title: 'New Cabernet Conversation',
            createdAt: new Date()
          });
          
          setCurrentConversationId(newConversation.id);
          localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(newConversation.id));
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        toast({
          title: "Error",
          description: "Failed to load conversation data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadConversations();
  }, [toast]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === '' || !currentConversationId) return;
    
    setIsTyping(true);
    
    try {
      // Add user message to UI immediately
      const tempUserMessage = {
        content,
        role: 'user',
        conversationId: currentConversationId,
        createdAt: new Date()
      } as Partial<Message>;
      
      // Save user message to IndexedDB
      const savedUserMessage = await indexedDBStorage.createMessage(tempUserMessage);
      setMessages(prev => [...prev, savedUserMessage]);
      
      // Send to OpenAI API with wine-specific system prompt
      const response = await apiRequest('POST', '/api/chat', {
        messages: [
          { 
            role: 'system', 
            content: 'You are a wine expert sommelier specializing in Cabernet Sauvignon. Provide detailed, friendly, and knowledgeable responses about Cabernet Sauvignon wines, including tasting notes, food pairings, history, regions, and serving recommendations. Keep responses concise but informative, and maintain a friendly, approachable tone as if speaking to a curious wine enthusiast.'
          },
          { role: 'user', content }
        ],
        conversationId: null // Don't save on server
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const responseData = await response.json();
      
      // Add assistant response to IndexedDB
      const assistantMessage = {
        content: responseData.message.content,
        role: 'assistant',
        conversationId: currentConversationId,
        createdAt: new Date()
      } as Partial<Message>;
      
      const savedAssistantMessage = await indexedDBStorage.createMessage(assistantMessage);
      
      // Update messages state with fresh data from IndexedDB
      const updatedMessages = await indexedDBStorage.getMessagesByConversation(currentConversationId);
      setMessages(updatedMessages);
      
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
      const newConversation = await indexedDBStorage.createConversation({ 
        title: 'New Cabernet Conversation',
        createdAt: new Date()
      });
      
      setCurrentConversationId(newConversation.id);
      localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(newConversation.id));
      setMessages([]);
      
      toast({
        title: "Success",
        description: "New conversation created",
      });
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
        return;
      }
      
      setCurrentConversationId(id);
      localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, String(id));
      
      // Load messages for this conversation
      const messagesData = await indexedDBStorage.getMessagesByConversation(id);
      console.log(`Loaded ${messagesData.length} messages for conversation ${id}`);
      setMessages(messagesData);
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

  // Add new chat button to header
  const createNewChatButton = (
    <button
      onClick={handleNewChat}
      className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
    >
      New Chat
    </button>
  );

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
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
              <div className="absolute top-4 right-4">
                {createNewChatButton}
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
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

          {/* Input Area */}
          <div className="bg-white p-2 sm:p-3 shadow-lg border-t border-gray-100 z-50 sticky bottom-0">
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
        </main>
      </div>
    </div>
  );
};

export default LocalChatInterface;