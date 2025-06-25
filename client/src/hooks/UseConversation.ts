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
    // Extract numeric wine ID if it's in format "wine_123"
    const numericId = typeof wineId === 'string' ? wineId.replace('wine_', '') : wineId;
    return `chatgpt_wine_conversation_${numericId}`;
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
  updateLastAssistantMessage: (content: string) => void;
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

  // Create a new conversation
  const createNewConversation = useCallback(async (): Promise<number | null> => {
    try {
      // Create wine-specific conversation title and metadata
      const wineTitle = wineId && wineId !== 'default' 
        ? `Wine ${String(wineId).replace('wine_', '')} Conversation` 
        : `New Conversation`;
      
      const newConversation = {
        userId: 1, // Default user ID
        title: `${wineTitle} ${new Date().toLocaleString()}`,
        createdAt: new Date(),
        lastActivity: new Date(),
        messages: [],
        // Add wine metadata for filtering
        metadata: wineId && wineId !== 'default' ? { wineId } : undefined
      };
      
      const id = await indexedDBService.createConversation(newConversation);
      
      if (id) {
        // Update localStorage
        localStorage.setItem(getConversationKey(wineId), id.toString());
        
        // Update state
        setCurrentConversationIdState(id);
        setMessages([]);
        
        // Refresh conversations list (wine-specific)
        let conversations: any[] = [];
        if (wineId && wineId !== 'default') {
          conversations = await indexedDBService.getWineConversations(wineId);
        } else {
          conversations = await indexedDBService.getAllConversations();
        }
        setLocalConversations(adaptIDBConversationsToConversations(conversations));
        
        console.log(`Created new conversation for wine ${wineId}: ${id}`);
        return id;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating new wine-specific conversation", error);
      return null;
    }
  }, [wineId]);

  /**
   * Load the most recent conversation for the specific wine
   */
  const loadMostRecentConversation = useCallback(async (): Promise<void> => {
    try {
      let conversations: any[] = [];
      
      if (wineId && wineId !== 'default') {
        // Get wine-specific conversations
        conversations = await indexedDBService.getWineConversations(wineId);
        console.log(`Found ${conversations.length} conversations for wine ${wineId}`);
      } else {
        // Get all conversations for default case
        conversations = await indexedDBService.getAllConversations();
      }
      
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
            console.log(`Loaded ${mostRecent.messages.length} messages from wine-specific conversation`);
          } else {
            setMessages([]);
          }
        } else {
          await createNewConversation();
        }
      } else {
        console.log(`No conversations found for wine ${wineId}, creating new one`);
        await createNewConversation();
      }
    } catch (error) {
      console.error("Error loading wine-specific conversation:", error);
      await createNewConversation();
    }
  }, [wineId, createNewConversation]);

  // Optimized initialization for faster loading
  useEffect(() => {
    let isMounted = true;
    
    async function initializeConversation() {
      if (!isMounted) return;
      
      try {
        // Quick localStorage check first for immediate loading
        const savedConversationId = localStorage.getItem(getConversationKey(wineId));
        
        if (savedConversationId) {
          const conversationId = parseInt(savedConversationId, 10);
          setCurrentConversationIdState(conversationId);
          
          // Load from IndexedDB in background
          indexedDBService.getConversation(conversationId).then(conversation => {
            if (conversation && conversation.messages && isMounted) {
              setMessages(adaptIDBMessagesToMessages(conversation.messages));
            }
          }).catch(console.error);
        }
        
        // Load backend data in background for sync
        fetch('/api/conversations')
          .then(response => response.ok ? response.json() : null)
          .then(conversations => {
            if (!conversations || !isMounted) return;
            
            setLocalConversations(conversations);
            
            if (conversations.length > 0 && !savedConversationId) {
              const mostRecent = conversations[0];
              setCurrentConversationIdState(mostRecent.id);
              localStorage.setItem(getConversationKey(wineId), mostRecent.id.toString());
              
              // Load messages
              fetch(`/api/conversations/${mostRecent.id}/messages`)
                .then(response => response.ok ? response.json() : [])
                .then(messages => {
                  if (isMounted) setMessages(messages);
                })
                .catch(console.error);
            }
          })
          .catch(() => {
            // Fallback to IndexedDB only
            if (!savedConversationId && isMounted) {
              loadMostRecentConversation();
            }
          });
      } catch (error) {
        console.error("Error initializing conversation", error);
        if (isMounted) {
          createNewConversation();
        }
      }
    }
    
    initializeConversation();
    
    return () => {
      isMounted = false;
    };
  }, [wineId, loadMostRecentConversation, createNewConversation]);
  
  // Function to add a message to the current conversation
  const addMessage = useCallback(async (message: Message | ClientMessage) => {
    if (!currentConversationId) return;
    
    // Add to state immediately for UI responsiveness
    setMessages(prev => [...prev, message as ClientMessage]);
    
    try {
      // Try to sync with backend first (for deployment persistence)
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: currentConversationId,
            role: message.role,
            content: message.content,
          }),
        });
        
        if (response.ok) {
          console.log('Message synced to backend successfully');
        }
      } catch (backendError) {
        console.log('Backend sync failed, storing locally:', backendError);
      }
      
      // Always store in IndexedDB for offline access
      try {
        await indexedDBService.addMessageToConversation(
          currentConversationId, 
          adaptMessageToIDBMessage(message)
        );
        
        // Update conversation's last activity timestamp
        const conversation = await indexedDBService.getConversation(currentConversationId);
        if (conversation) {
          conversation.lastActivity = new Date();
          await indexedDBService.updateConversation(conversation);
        }
        
        // Refresh conversations list to update timestamps
        const allConversations = await indexedDBService.getAllConversations();
        setLocalConversations(adaptIDBConversationsToConversations(allConversations));
      } catch (idbError) {
        console.error("Error storing message in IndexedDB:", idbError);
      }
    } catch (error) {
      console.error("Error adding message to conversation", currentConversationId, ":", error);
    }
  }, [currentConversationId]);
  
  // Оновити content останнього assistant-повідомлення у messages
  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages(prev => {
      const lastIndex = [...prev].reverse().findIndex(m => m.role === 'assistant');
      if (lastIndex === -1) return prev;
      const idx = prev.length - 1 - lastIndex;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], content };
      return updated;
    });
  }, []);
  
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
  }, [wineId]);
  
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
    refetchMessages,
    updateLastAssistantMessage
  };
}