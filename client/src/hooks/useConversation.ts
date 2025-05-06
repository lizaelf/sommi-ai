import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Message, Conversation } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// LocalStorage keys
const LS_CURRENT_CONVERSATION_ID = 'somm_current_conversation_id';
const LS_CONVERSATIONS = 'somm_conversations';
const LS_MESSAGES_PREFIX = 'somm_messages_';

// Helper function to safely load localStorage data
const loadFromLocalStorage = <T,>(key: string, fallback: T): T => {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : fallback;
  } catch (error) {
    console.error(`Failed to load data from localStorage key: ${key}`, error);
    return fallback;
  }
};

// Helper function to safely save to localStorage
const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data to localStorage key: ${key}`, error);
  }
};

export function useConversation() {
  // Initialize from localStorage
  const [currentConversationId, setCurrentConversationIdState] = useState<number | null>(() => {
    const savedId = localStorage.getItem(LS_CURRENT_CONVERSATION_ID);
    return savedId ? parseInt(savedId, 10) : null;
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [localConversations, setLocalConversations] = useState<Conversation[]>(() => 
    loadFromLocalStorage<Conversation[]>(LS_CONVERSATIONS, [])
  );
  
  const queryClient = useQueryClient();

  // Set current conversation ID and save to localStorage
  const setCurrentConversationId = useCallback((id: number | null) => {
    setCurrentConversationIdState(id);
    
    if (id) {
      localStorage.setItem(LS_CURRENT_CONVERSATION_ID, id.toString());
      
      // Try to load messages from localStorage for this conversation
      const savedMessages = loadFromLocalStorage<Message[]>(`${LS_MESSAGES_PREFIX}${id}`, []);
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        setMessages([]);
      }
    } else {
      localStorage.removeItem(LS_CURRENT_CONVERSATION_ID);
      setMessages([]);
    }
  }, []);

  // Query all conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['/api/conversations'],
  });

  // Query messages for the current conversation
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });

  // Update local conversations when API data changes
  useEffect(() => {
    if (conversationsData && Array.isArray(conversationsData)) {
      setLocalConversations(conversationsData);
      saveToLocalStorage(LS_CONVERSATIONS, conversationsData);
    }
  }, [conversationsData]);

  // Update messages when API data changes
  useEffect(() => {
    if (messagesData && Array.isArray(messagesData) && currentConversationId) {
      setMessages(messagesData);
      saveToLocalStorage(`${LS_MESSAGES_PREFIX}${currentConversationId}`, messagesData);
    }
  }, [messagesData, currentConversationId]);

  // Add a message to the current conversation
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const updatedMessages = [...prev, message];
      
      if (currentConversationId) {
        saveToLocalStorage(`${LS_MESSAGES_PREFIX}${currentConversationId}`, updatedMessages);
      }
      
      return updatedMessages;
    });
  }, [currentConversationId]);

  // Clear all messages for the current conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    
    if (currentConversationId) {
      localStorage.removeItem(`${LS_MESSAGES_PREFIX}${currentConversationId}`);
    }
  }, [currentConversationId]);

  // Create a new conversation
  const createNewConversation = useCallback(async () => {
    try {
      const response = await apiRequest('POST', '/api/conversations', { 
        title: 'New Conversation' 
      });
      const data = await response.json();
      
      setCurrentConversationId(data.id);
      setMessages([]);
      
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      return data.id;
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      return null;
    }
  }, [queryClient, setCurrentConversationId]);

  // Return the public API
  return {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations: conversationsData || localConversations,
    createNewConversation,
    clearConversation,
    refetchMessages
  };
}
