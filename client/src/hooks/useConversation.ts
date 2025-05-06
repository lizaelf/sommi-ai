import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Message, Conversation } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { truncateString } from '@/lib/utils';

// LocalStorage keys
const LS_CURRENT_CONVERSATION_ID = 'somm_current_conversation_id';
const LS_CONVERSATIONS = 'somm_conversations';
const LS_MESSAGES_PREFIX = 'somm_messages_';

export function useConversation() {
  // Initialize state from localStorage if available
  const [currentConversationId, setCurrentConversationIdRaw] = useState<number | null>(() => {
    const savedId = localStorage.getItem(LS_CURRENT_CONVERSATION_ID);
    return savedId ? parseInt(savedId, 10) : null;
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [localStorageLoaded, setLocalStorageLoaded] = useState(false);
  const queryClient = useQueryClient();
  
  // Wrap setCurrentConversationId to also load from localStorage
  const setCurrentConversationId = (id: number | null) => {
    setCurrentConversationIdRaw(id);
    setLocalStorageLoaded(false); // Reset so we load from localStorage for the new conversation
  };

  // Initialize with conversations from localStorage
  const [localConversations, setLocalConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(LS_CONVERSATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse saved conversations:', error);
      return [];
    }
  });
  
  // Query all conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['/api/conversations'],
    onSuccess: (data) => {
      if (data && Array.isArray(data)) {
        setLocalConversations(data);
      }
    }
  });

  // Query messages for the current conversation
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });

  // Load initial data from localStorage
  useEffect(() => {
    // Load messages for current conversation
    if (currentConversationId && !localStorageLoaded) {
      const savedMessages = localStorage.getItem(`${LS_MESSAGES_PREFIX}${currentConversationId}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages) as Message[];
          setMessages(parsedMessages);
          setLocalStorageLoaded(true);
        } catch (error) {
          console.error('Failed to parse saved messages:', error);
        }
      }
    }
  }, [currentConversationId, localStorageLoaded]);

  // Update messages when data changes from API
  useEffect(() => {
    if (messagesData && Array.isArray(messagesData)) {
      setMessages(messagesData);
      
      // Save messages to localStorage
      if (currentConversationId) {
        localStorage.setItem(
          `${LS_MESSAGES_PREFIX}${currentConversationId}`, 
          JSON.stringify(messagesData)
        );
      }
    }
  }, [messagesData, currentConversationId]);

  // Save current conversation ID to localStorage
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(LS_CURRENT_CONVERSATION_ID, currentConversationId.toString());
    } else {
      localStorage.removeItem(LS_CURRENT_CONVERSATION_ID);
    }
  }, [currentConversationId]);

  // Save conversations list to localStorage when it changes
  useEffect(() => {
    if (conversationsData) {
      localStorage.setItem(LS_CONVERSATIONS, JSON.stringify(conversationsData));
    }
  }, [conversationsData]);

  // Add a message to the current conversation
  const addMessage = (message: Message) => {
    setMessages((prev) => {
      const updatedMessages = [...prev, message];
      
      // Save to localStorage
      if (currentConversationId) {
        localStorage.setItem(
          `${LS_MESSAGES_PREFIX}${currentConversationId}`, 
          JSON.stringify(updatedMessages)
        );
      }
      
      return updatedMessages;
    });
  };

  // Clear all messages for the current conversation
  const clearConversation = () => {
    setMessages([]);
    
    // Remove from localStorage
    if (currentConversationId) {
      localStorage.removeItem(`${LS_MESSAGES_PREFIX}${currentConversationId}`);
    }
  };

  // Create a new conversation
  const createNewConversation = async () => {
    try {
      const response = await apiRequest('POST', '/api/conversations', { 
        title: 'New Conversation' 
      });
      const data = await response.json();
      
      // Set the new conversation as current
      setCurrentConversationId(data.id);
      
      // Clear messages
      setMessages([]);
      
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      return data.id;
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      return null;
    }
  };

  return {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations: conversationsData || localConversations || [],
    createNewConversation,
    clearConversation,
    refetchMessages
  };
}
