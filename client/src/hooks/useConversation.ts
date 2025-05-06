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
  
  // Track if we've done the initial data fetch
  const [initialDataFetched, setInitialDataFetched] = useState<boolean>(false);
  
  // On initial load only, fetch conversations from the server
  useEffect(() => {
    async function fetchInitialData() {
      // Skip if we've already fetched initial data
      if (initialDataFetched) return;
      
      try {
        console.log("Fetching initial data from server...");
        
        // First load all conversations
        const conversationsResponse = await apiRequest('GET', '/api/conversations');
        const fetchedConversations = await conversationsResponse.json();
        console.log("Fetched conversations:", fetchedConversations);
        
        // Check if we have any conversations
        if (fetchedConversations && Array.isArray(fetchedConversations) && fetchedConversations.length > 0) {
          // Set the conversations in local state
          setLocalConversations(fetchedConversations);
          
          // Logic to decide which conversation to show on first load
          // 1. If a current conversation ID is already set, verify it
          if (currentConversationId) {
            const response = await apiRequest('GET', `/api/conversations/${currentConversationId}`);
            if (!response.ok) {
              // If invalid, use the first conversation from the list
              setCurrentConversationIdState(fetchedConversations[0].id);
            }
          } 
          // 2. Try to use ID from localStorage
          else {
            const savedId = localStorage.getItem(LS_CURRENT_CONVERSATION_ID);
            if (savedId) {
              // Check if this conversation exists in our fetched list
              const id = parseInt(savedId, 10);
              const conversationExists = fetchedConversations.some(c => c.id === id);
              
              if (conversationExists) {
                // Use this conversation
                setCurrentConversationIdState(id);
              } else {
                // Use the first conversation
                setCurrentConversationIdState(fetchedConversations[0].id);
              }
            } else {
              // No saved ID, use first conversation
              setCurrentConversationIdState(fetchedConversations[0].id);
            }
          }
        }
        
        // Mark as fetched so we don't do it again
        setInitialDataFetched(true);
      } catch (e) {
        console.error('Failed to get initial conversation', e);
      }
    }
    
    fetchInitialData();
  }, [currentConversationId, initialDataFetched]);
  
  // Load messages from the API when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      try {
        // Immediately fetch messages for this conversation from the API
        apiRequest('GET', `/api/conversations/${currentConversationId}/messages`)
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Failed to fetch messages');
            }
          })
          .then(fetchedMessages => {
            if (Array.isArray(fetchedMessages) && fetchedMessages.length > 0) {
              console.log('Loaded messages from API:', fetchedMessages.length);
              setMessages(fetchedMessages);
              
              // Also keep a local copy
              try {
                localStorage.setItem(
                  `${LS_MESSAGES_PREFIX}${currentConversationId}`,
                  JSON.stringify(fetchedMessages)
                );
              } catch (e) {
                console.error('Failed to save messages to localStorage', e);
              }
            }
          })
          .catch(error => {
            console.error('Error fetching messages:', error);
          });
      } catch (e) {
        console.error('Failed to load messages from API', e);
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
  
  // Validate if a conversation exists in the backend
  const validateConversation = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await apiRequest('GET', `/api/conversations/${id}`);
      return response.ok;
    } catch (error) {
      console.error('Error validating conversation:', error);
      return false;
    }
  }, []);
  
  // Clear invalid data from localStorage
  const clearInvalidData = useCallback(() => {
    try {
      // Check and clear current conversation ID if needed
      const savedId = localStorage.getItem(LS_CURRENT_CONVERSATION_ID);
      if (savedId) {
        const id = parseInt(savedId, 10);
        validateConversation(id).then(exists => {
          if (!exists) {
            console.log('Clearing invalid conversation ID from localStorage');
            localStorage.removeItem(LS_CURRENT_CONVERSATION_ID);
            // Also clear any saved messages for this conversation
            localStorage.removeItem(`${LS_MESSAGES_PREFIX}${id}`);
            // Reset current state if we're using this invalid ID
            if (currentConversationId === id) {
              setCurrentConversationIdState(null);
              setMessages([]);
            }
          }
        });
      }
    } catch (e) {
      console.error('Error clearing invalid data:', e);
    }
  }, [currentConversationId, validateConversation]);
  
  // Run the validation on mount
  useEffect(() => {
    if (currentConversationId) {
      clearInvalidData();
    }
  }, [clearInvalidData, currentConversationId]);
  
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
