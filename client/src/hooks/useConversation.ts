import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Message, Conversation } from '@shared/schema';
import { ClientMessage, ClientConversation } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import indexedDBService, { IDBMessage, IDBConversation } from '@/lib/indexedDB';
import { 
  adaptIDBMessagesToMessages, 
  adaptIDBConversationsToConversations,
  adaptMessageToIDBMessage
} from '@/lib/adapters';

// Key for storing the current conversation ID in localStorage
const LS_CURRENT_CONVERSATION_KEY = 'chatgpt_wine_current_conversation_id';

/**
 * Return type for the useConversation hook with client-side compatible types
 */
interface UseConversationReturn {
  currentConversationId: number | null;
  setCurrentConversationId: (id: number | null) => Promise<void>;
  messages: ClientMessage[];
  addMessage: (message: Message | ClientMessage) => Promise<void>;
  conversations: ClientConversation[];
  createNewConversation: () => Promise<number | null>;
  clearConversation: () => Promise<void>;
  refetchMessages: () => Promise<any>;
}

/**
 * Hook to manage conversation state with IndexedDB persistence
 */
export function useConversation(): UseConversationReturn {
  const queryClient = useQueryClient();
  
  // State for the current conversation ID
  const [currentConversationId, setCurrentConversationIdState] = useState<number | null>(null);
  
  // Initialize messages state using ClientMessage type for IndexedDB compatibility
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  
  // State for locally stored conversations using ClientConversation type
  const [localConversations, setLocalConversations] = useState<ClientConversation[]>([]);
  
  // Track if we've done the initial data fetch
  const [initialDataFetched, setInitialDataFetched] = useState<boolean>(false);
  
  // Query data for API fallback
  const { data: conversationsData } = useQuery({
    queryKey: ['/api/conversations'],
  });
  
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });
  
  // Initialize IndexedDB and load session data
  useEffect(() => {
    async function initializeConversation() {
      console.log("Initializing conversation...");
      
      try {
        // First, check if there's a specific conversation ID in localStorage
        const savedConversationId = localStorage.getItem(LS_CURRENT_CONVERSATION_KEY);
        
        if (savedConversationId) {
          const conversationId = parseInt(savedConversationId, 10);
          const conversation = await indexedDBService.getConversation(conversationId);
          
          if (conversation) {
            console.log(`Using saved conversation ID from localStorage: ${conversationId}`);
            setCurrentConversationIdState(conversationId);
            
            // Load messages for this conversation
            const savedMessages = conversation.messages;
            if (savedMessages && savedMessages.length > 0) {
              console.log(`Loaded ${savedMessages.length} messages from saved conversation ID`);
              setMessages(adaptIDBMessagesToMessages(savedMessages));
            }
          } else {
            // If the conversation doesn't exist, fall back to most recent
            console.log(`Saved conversation ID ${conversationId} not found, using most recent`);
            await loadMostRecentConversation();
          }
        } else {
          // No saved ID in localStorage, use most recent conversation
          await loadMostRecentConversation();
        }
        
        // Load all conversations
        const allConversations = await indexedDBService.getAllConversations();
        if (allConversations && allConversations.length > 0) {
          setLocalConversations(adaptIDBConversationsToConversations(allConversations));
        }
        
        setInitialDataFetched(true);
      } catch (error) {
        console.error("Error initializing conversation", error);
        
        // Fall back to API if IndexedDB fails
        try {
          await fallbackToAPI();
        } catch (apiError) {
          console.error("API fallback failed", apiError);
        }
      }
    }
    
    // Helper function to load most recent conversation
    async function loadMostRecentConversation() {
      const recentConversation = await indexedDBService.getMostRecentConversation();
      
      if (recentConversation && recentConversation.id) {
        console.log(`Using most recent conversation ID: ${recentConversation.id}`);
        setCurrentConversationIdState(recentConversation.id);
        
        // Save to localStorage for persistence
        localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, recentConversation.id.toString());
        
        // Load messages for this conversation
        const savedMessages = recentConversation.messages;
        if (savedMessages && savedMessages.length > 0) {
          console.log(`Loaded ${savedMessages.length} messages from most recent conversation`);
          setMessages(adaptIDBMessagesToMessages(savedMessages));
        }
      } else {
        console.log("No conversations found, creating a new one");
        const newId = await indexedDBService.createConversation("New Conversation");
        setCurrentConversationIdState(newId);
        
        // Save to localStorage for persistence
        localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, newId.toString());
      }
    }
    
    initializeConversation();
  }, []);
  
  // Fallback to API if IndexedDB is not available or fails
  const fallbackToAPI = async () => {
    console.log("Falling back to API for conversation data...");
    
    try {
      // Load conversations from API
      const conversationsResponse = await apiRequest('GET', '/api/conversations');
      const fetchedConversations = await conversationsResponse.json();
      
      if (fetchedConversations && Array.isArray(fetchedConversations) && fetchedConversations.length > 0) {
        setLocalConversations(fetchedConversations);
        
        // Use the first conversation by default
        const firstConversation = fetchedConversations[0];
        setCurrentConversationIdState(firstConversation.id);
        
        // Load messages for this conversation
        const messagesResponse = await apiRequest('GET', `/api/conversations/${firstConversation.id}/messages`);
        if (messagesResponse.ok) {
          const fetchedMessages = await messagesResponse.json();
          if (fetchedMessages && Array.isArray(fetchedMessages)) {
            setMessages(fetchedMessages);
          }
        }
      }
      
      setInitialDataFetched(true);
    } catch (error) {
      console.error("API fallback failed", error);
    }
  };
  
  // Sync with API when needed
  useEffect(() => {
    if (initialDataFetched && currentConversationId && messagesData) {
      // If we have API data, sync it to IndexedDB
      const syncMessages = async () => {
        try {
          // Ensure messagesData is an array
          if (!Array.isArray(messagesData)) {
            console.warn("messagesData is not an array:", messagesData);
            return;
          }
          
          // Get current messages from IndexedDB
          const dbMessages = await indexedDBService.getConversationMessages(currentConversationId);

          // Only update if the API messages are different from what we have
          if (messagesData.length !== dbMessages.length) {
            // Clear existing messages
            await indexedDBService.updateConversation(currentConversationId, { messages: [] });
            
            // Add all messages from API
            for (const message of messagesData) {
              await indexedDBService.addMessageToConversation(currentConversationId, {
                conversationId: message.conversationId,
                role: message.role,
                content: message.content,
                createdAt: message.createdAt
              });
            }
            
            // Update the messages state
            setMessages(messagesData);
          }
        } catch (error) {
          console.error("Error syncing messages with API", error);
        }
      };
      
      syncMessages();
    }
  }, [initialDataFetched, currentConversationId, messagesData]);
  
  // Change current conversation
  const setCurrentConversationId = useCallback(async (id: number | null) => {
    if (id === currentConversationId) return;
    
    setCurrentConversationIdState(id);
    
    // Update localStorage for persistence across refreshes
    if (id) {
      localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, id.toString());
      
      try {
        // Get conversation from IndexedDB
        const conversation = await indexedDBService.getConversation(id);
        
        if (conversation) {
          // Convert to expected Message format using adapter
          setMessages(adaptIDBMessagesToMessages(conversation.messages));
        } else {
          // Conversation not found, clear messages
          setMessages([]);
          
          // Try to get from API as fallback
          apiRequest('GET', `/api/conversations/${id}/messages`)
            .then(response => response.ok ? response.json() : null)
            .then(fetchedMessages => {
              if (fetchedMessages && Array.isArray(fetchedMessages)) {
                setMessages(fetchedMessages);
                
                // Store in IndexedDB
                indexedDBService.createConversation("New Conversation")
                  .then(newId => {
                    // Update localStorage with the new ID
                    localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, newId.toString());
                    
                    for (const message of fetchedMessages) {
                      indexedDBService.addMessageToConversation(newId, {
                        conversationId: message.conversationId,
                        role: message.role,
                        content: message.content,
                        createdAt: message.createdAt
                      });
                    }
                  });
              }
            })
            .catch(error => console.error("Error fetching messages from API", error));
        }
      } catch (error) {
        console.error("Error setting current conversation", error);
        setMessages([]);
      }
    } else {
      // If ID is null, remove from localStorage
      localStorage.removeItem(LS_CURRENT_CONVERSATION_KEY);
      setMessages([]);
    }
  }, [currentConversationId]);
  
  // Add a message to the current conversation
  const addMessage = useCallback(async (message: Message | ClientMessage) => {
    if (!currentConversationId) return;
    
    // Add to state immediately for UI responsiveness
    setMessages(prev => [...prev, message]);
    
    try {
      // Add to IndexedDB using the adapter
      await indexedDBService.addMessageToConversation(
        currentConversationId, 
        adaptMessageToIDBMessage(message)
      );
    } catch (error) {
      console.error("Error adding message to IndexedDB", error);
    }
  }, [currentConversationId]);
  
  // Clear all messages for the current conversation
  const clearConversation = useCallback(async () => {
    if (!currentConversationId) return;
    
    // Clear state immediately
    setMessages([]);
    
    try {
      // Clear messages in IndexedDB
      await indexedDBService.clearConversationMessages(currentConversationId);
      console.log(`Cleared messages for conversation ${currentConversationId}`);
    } catch (error) {
      console.error("Error clearing conversation in IndexedDB", error);
    }
  }, [currentConversationId]);
  
  // Create a new conversation
  const createNewConversation = useCallback(async () => {
    try {
      // Create new conversation with a title
      const title = 'New Conversation';
      
      // Create in IndexedDB
      const newId = await indexedDBService.createConversation(title);
      
      if (!newId) {
        throw new Error("Failed to create conversation");
      }
      
      // Update state
      setCurrentConversationIdState(newId);
      setMessages([]);
      
      // Save to localStorage for persistence
      localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, newId.toString());
      
      // Refresh conversations list
      const allConversations = await indexedDBService.getAllConversations();
      setLocalConversations(adaptIDBConversationsToConversations(allConversations));
      
      // Also try to create on the API as a backup
      try {
        const response = await apiRequest('POST', '/api/conversations', { title: 'New Conversation' });
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        }
      } catch (apiError) {
        console.error("Error creating conversation on API (continuing with local only)", apiError);
      }
      
      return newId;
    } catch (error) {
      console.error("Error creating new conversation in IndexedDB", error);
      
      // Fall back to API
      try {
        const response = await apiRequest('POST', '/api/conversations', { title: 'New Conversation' });
        const data = await response.json();
        
        setCurrentConversationIdState(data.id);
        setMessages([]);
        
        // Save API conversation ID to localStorage
        localStorage.setItem(LS_CURRENT_CONVERSATION_KEY, data.id.toString());
        
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        
        return data.id;
      } catch (apiError) {
        console.error("API fallback for new conversation failed", apiError);
        return null;
      }
    }
  }, [queryClient]);
  
  // Public API - keep the interface the same as before
  return {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations: localConversations.length > 0 
      ? localConversations 
      : (Array.isArray(conversationsData) ? conversationsData as ClientConversation[] : []),
    createNewConversation,
    clearConversation,
    refetchMessages
  };
}
