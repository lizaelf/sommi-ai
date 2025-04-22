import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Message, Conversation } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { truncateString } from '@/lib/utils';

export function useConversation() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();

  // Query all conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['/api/conversations'],
  });

  // Query messages for the current conversation
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });

  // Update messages when data changes
  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData);
    }
  }, [messagesData]);

  // Add a message to the current conversation
  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  // Clear all messages for the current conversation
  const clearConversation = () => {
    setMessages([]);
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
    conversations: conversationsData || [],
    createNewConversation,
    clearConversation,
    refetchMessages
  };
}
