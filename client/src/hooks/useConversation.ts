import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Message, Conversation } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// LocalStorage keys
const LS_CURRENT_CONVERSATION_ID = 'somm_current_conversation_id';
const LS_CONVERSATIONS = 'somm_conversations';
const LS_MESSAGES_PREFIX = 'somm_messages_';

/**
 * Hook to manage conversation state with localStorage persistence
 */
export function useConversation() {
  const queryClient = useQueryClient();
  
  // Get the current conversation ID from localStorage on init
  const [currentConversationId, setCurrentConversationIdState] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(LS_CURRENT_CONVERSATION_ID);
      return saved ? parseInt(saved, 10) : null;
    } catch (e) {
      return null;
    }
  });
  
  // Initialize messages state
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Query all conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['/api/conversations'],
  });
  
  // Query messages for the current conversation
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });
  
  // Load cached conversations if API doesn't return any
  const [localConversations, setLocalConversations] = useState<Conversation[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_CONVERSATIONS);
      if (saved) {
        setLocalConversations(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load conversations from localStorage', e);
    }
  }, []);
  
  // Load initial messages from localStorage if available
  useEffect(() => {
    if (currentConversationId) {
      try {
        const key = `${LS_MESSAGES_PREFIX}${currentConversationId}`;
        const savedMessages = localStorage.getItem(key);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            console.log('Loaded messages from localStorage:', parsedMessages.length);
            setMessages(parsedMessages);
          }
        }
      } catch (e) {
        console.error('Failed to load messages from localStorage', e);
      }
    }
  }, [currentConversationId]);
  
  // Save conversation data when it changes
  useEffect(() => {
    if (conversationsData && Array.isArray(conversationsData)) {
      try {
        localStorage.setItem(LS_CONVERSATIONS, JSON.stringify(conversationsData));
        setLocalConversations(conversationsData);
      } catch (e) {
        console.error('Failed to save conversations to localStorage', e);
      }
    }
  }, [conversationsData]);
  
  // Update messages from API data when it changes
  useEffect(() => {
    if (messagesData && Array.isArray(messagesData) && currentConversationId) {
      setMessages(messagesData);
      
      try {
        localStorage.setItem(
          `${LS_MESSAGES_PREFIX}${currentConversationId}`,
          JSON.stringify(messagesData)
        );
        console.log('Saved messages from API to localStorage', messagesData.length);
      } catch (e) {
        console.error('Failed to save messages to localStorage', e);
      }
    }
  }, [messagesData, currentConversationId]);
  
  // Change current conversation
  const setCurrentConversationId = useCallback((id: number | null) => {
    setCurrentConversationIdState(id);
    
    if (id) {
      try {
        localStorage.setItem(LS_CURRENT_CONVERSATION_ID, id.toString());
        
        // Try to load messages from localStorage
        const key = `${LS_MESSAGES_PREFIX}${id}`;
        const savedMessages = localStorage.getItem(key);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          if (Array.isArray(parsedMessages)) {
            setMessages(parsedMessages);
          }
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error('Error setting current conversation', e);
      }
    } else {
      try {
        localStorage.removeItem(LS_CURRENT_CONVERSATION_ID);
      } catch (e) {
        console.error('Error removing current conversation', e);
      }
      setMessages([]);
    }
  }, []);
  
  // Add a message to the current conversation
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      
      if (currentConversationId) {
        try {
          localStorage.setItem(
            `${LS_MESSAGES_PREFIX}${currentConversationId}`, 
            JSON.stringify(newMessages)
          );
          console.log('Saved new message to localStorage');
        } catch (e) {
          console.error('Failed to save new message to localStorage', e);
        }
      }
      
      return newMessages;
    });
  }, [currentConversationId]);
  
  // Clear all messages for the current conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    
    if (currentConversationId) {
      try {
        localStorage.removeItem(`${LS_MESSAGES_PREFIX}${currentConversationId}`);
      } catch (e) {
        console.error('Error clearing conversation', e);
      }
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
      
      // Update the conversations list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      return data.id;
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      return null;
    }
  }, [queryClient, setCurrentConversationId]);
  
  // Public API
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
