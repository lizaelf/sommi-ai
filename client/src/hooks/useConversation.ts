import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Message, Conversation } from '@shared/schema';
import { ClientMessage, ClientConversation } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import indexedDBService, { IDBMessage } from '@/lib/indexedDB';
import { 
  adaptIDBMessagesToMessages, 
  adaptIDBConversationsToConversations,
  adaptMessageToIDBMessage
} from '@/lib/adapters';

// Key for storing the current conversation ID in localStorage
const getConversationKey = (wineId?: string | number) => {
  if (wineId) {
    return `chatgpt_wine_conversation_${wineId}`;
  }
  return 'chatgpt_wine_current_conversation_id';
};

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
 * @param wineId - Optional wine identifier for wine-specific conversations
 */
export function useConversation(wineId?: string | number): UseConversationReturn {
  // State for tracking the current conversation ID
  const [currentConversationId, setCurrentConversationIdState] = useState<number | null>(null);
  // State for storing messages in the current conversation
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  // State for storing all conversations
  const [localConversations, setLocalConversations] = useState<ClientConversation[]>([]);
  
  // Query client for server-side data operations
  const queryClient = useQueryClient();

  /**
   * Load the most recent conversation
   */
  const loadMostRecentConversation = useCallback(async (): Promise<void> => {
    try {
      // Get all conversations
      const conversations = await indexedDBService.getAllConversations();
      
      if (conversations && conversations.length > 0) {
        // Sort by last activity (desc)
        conversations.sort((a, b) => {
          const dateA = new Date(a.lastActivity || a.createdAt).getTime();
          const dateB = new Date(b.lastActivity || b.createdAt).getTime();
          return dateB - dateA;
        });
        
        const mostRecent = conversations[0];
        
        if (mostRecent && mostRecent.id) {
          // Update state
          setCurrentConversationIdState(mostRecent.id);
          // Update localStorage
          localStorage.setItem(getConversationKey(wineId), mostRecent.id.toString());
          
          // Load messages
          if (mostRecent.messages && mostRecent.messages.length > 0) {
            setMessages(adaptIDBMessagesToMessages(mostRecent.messages));
            console.log(`Loaded ${mostRecent.messages.length} messages from most recent conversation`);
          } else {
            setMessages([]);
          }
        } else {
          await createNewConversation();
        }
      } else {
        await createNewConversation();
      }
    } catch (error) {
      console.error("Error loading most recent conversation:", error);
      await createNewConversation();
    }
  }, []);

  // Initialization code that loads saved conversation from localStorage or IndexedDB
  useEffect(() => {
    async function initializeConversation() {
      console.log("Initializing conversation...");
      
      // Force scroll to top on initialization
      window.scrollTo(0, 0);
      
      try {
        // First, check if there's a specific conversation ID in localStorage
        const savedConversationId = localStorage.getItem(getConversationKey(wineId));
        
        if (savedConversationId) {
          const conversationId = parseInt(savedConversationId, 10);
          console.log(`Found saved conversation ID in localStorage: ${conversationId}`);
          
          const conversation = await indexedDBService.getConversation(conversationId);
          
          if (conversation) {
            console.log(`Using saved conversation ID from localStorage: ${conversationId}`);
            setCurrentConversationIdState(conversationId);
            
            // Load messages for this conversation
            if (conversation.messages && conversation.messages.length > 0) {
              console.log(`Loaded ${conversation.messages.length} messages from saved conversation ID`);
              setMessages(adaptIDBMessagesToMessages(conversation.messages));
            } else {
              setMessages([]);
            }
          } else {
            console.log(`Saved conversation ${conversationId} not found, loading most recent`);
            // If the conversation doesn't exist, fall back to most recent
            await loadMostRecentConversation();
          }
        } else {
          console.log('No saved conversation ID in localStorage, loading most recent');
          // No saved ID in localStorage, use most recent conversation
          await loadMostRecentConversation();
        }
        
        // Load all conversations
        const allConversations = await indexedDBService.getAllConversations();
        if (allConversations && allConversations.length > 0) {
          setLocalConversations(adaptIDBConversationsToConversations(allConversations));
          console.log(`Loaded ${allConversations.length} conversations from IndexedDB`);
        }
      } catch (error) {
        console.error("Error initializing conversation", error);
        // Fall back to creating a new conversation
        try {
          await createNewConversation();
        } catch (fallbackError) {
          console.error("Failed to create new conversation after error", fallbackError);
        }
      }
    }
    
    initializeConversation();
  }, [wineId]);
  
  // Function to add a message to the current conversation
  const addMessage = useCallback(async (message: Message | ClientMessage) => {
    if (!currentConversationId) return;
    
    // Add to state immediately for UI responsiveness
    setMessages(prev => [...prev, message as ClientMessage]);
    
    try {
      // Add to IndexedDB using the adapter
      await indexedDBService.addMessageToConversation(
        currentConversationId, 
        adaptMessageToIDBMessage(message)
      );
      
      // Also update the conversation's last activity timestamp
      const conversation = await indexedDBService.getConversation(currentConversationId);
      if (conversation) {
        conversation.lastActivity = new Date();
        await indexedDBService.updateConversation(conversation);
      }
      
      // Refresh conversations list to update timestamps
      const allConversations = await indexedDBService.getAllConversations();
      setLocalConversations(adaptIDBConversationsToConversations(allConversations));
    } catch (error) {
      console.error("Error adding message to IndexedDB", error);
    }
  }, [currentConversationId]);
  
  // Set the current conversation ID and update localStorage
  const setCurrentConversationId = useCallback(async (id: number | null) => {
    setCurrentConversationIdState(id);
    
    if (id) {
      localStorage.setItem(getConversationKey(wineId), id.toString());
      
      // Load messages for this conversation
      try {
        const conversation = await indexedDBService.getConversation(id);
        if (conversation && conversation.messages) {
          setMessages(adaptIDBMessagesToMessages(conversation.messages));
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error(`Error loading messages for conversation ${id}`, error);
        setMessages([]);
      }
    } else {
      localStorage.removeItem(getConversationKey(wineId));
      setMessages([]);
    }
  }, []);
  
  // Create a new conversation
  const createNewConversation = useCallback(async (): Promise<number | null> => {
    try {
      const newConversation = {
        userId: 1, // Default user ID
        title: `New Conversation ${new Date().toLocaleString()}`,
        createdAt: new Date(),
        lastActivity: new Date(),
        messages: []
      };
      
      const id = await indexedDBService.createConversation(newConversation);
      
      if (id) {
        // Update localStorage
        localStorage.setItem(getConversationKey(wineId), id.toString());
        
        // Update state
        setCurrentConversationIdState(id);
        setMessages([]);
        
        // Refresh conversations list
        const allConversations = await indexedDBService.getAllConversations();
        setLocalConversations(adaptIDBConversationsToConversations(allConversations));
        
        return id;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating new conversation", error);
      return null;
    }
  }, []);
  
  // Clear the current conversation
  const clearConversation = useCallback(async () => {
    if (!currentConversationId) return;
    
    try {
      // Get the conversation
      const conversation = await indexedDBService.getConversation(currentConversationId);
      
      if (conversation) {
        // Clear messages
        conversation.messages = [];
        
        // Update in IndexedDB
        await indexedDBService.updateConversation(conversation);
        
        // Update state
        setMessages([]);
        
        console.log(`Cleared conversation ${currentConversationId}`);
      }
    } catch (error) {
      console.error(`Error clearing conversation ${currentConversationId}`, error);
    }
  }, [currentConversationId]);
  
  // Refetch messages from IndexedDB
  const refetchMessages = useCallback(async () => {
    if (!currentConversationId) return null;
    
    try {
      const conversation = await indexedDBService.getConversation(currentConversationId);
      
      if (conversation && conversation.messages) {
        setMessages(adaptIDBMessagesToMessages(conversation.messages));
        return conversation;
      }
      
      return null;
    } catch (error) {
      console.error(`Error refetching messages for conversation ${currentConversationId}`, error);
      return null;
    }
  }, [currentConversationId]);
  
  return {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations: localConversations,
    createNewConversation,
    clearConversation,
    refetchMessages
  };
}