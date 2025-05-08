import { Conversation, Message } from '@shared/schema';
import { ClientMessage, ClientConversation } from './types';
import { IDBConversation, IDBMessage } from './indexedDB';

/**
 * Adapters for converting between database types and application types
 * to handle the Date/string incompatibility and ensure proper data format
 * between IndexedDB, API responses, and component state.
 */

// Convert IDBMessage to ClientMessage
export function adaptIDBMessageToMessage(message: IDBMessage): ClientMessage {
  return {
    id: message.id || 0,
    content: message.content,
    role: message.role,
    conversationId: message.conversationId,
    // Ensure consistent date format
    createdAt: typeof message.createdAt === 'string' 
      ? message.createdAt 
      : message.createdAt.toISOString()
  };
}

// Convert Message or ClientMessage to IDBMessage
export function adaptMessageToIDBMessage(message: Message | ClientMessage): IDBMessage {
  return {
    id: message.id,
    content: message.content,
    role: message.role,
    conversationId: message.conversationId,
    // Ensure consistent date storage
    createdAt: typeof message.createdAt === 'string' 
      ? message.createdAt 
      : (message.createdAt instanceof Date 
        ? message.createdAt.toISOString() 
        : new Date().toISOString())
  };
}

// Convert IDBConversation to ClientConversation
export function adaptIDBConversationToConversation(conversation: IDBConversation): ClientConversation {
  return {
    id: conversation.id || 0,
    title: conversation.title,
    // Ensure consistent date format
    createdAt: typeof conversation.createdAt === 'string' 
      ? conversation.createdAt 
      : conversation.createdAt.toISOString()
  };
}

// Convert array of IDBConversation to array of ClientConversation
export function adaptIDBConversationsToConversations(conversations: IDBConversation[]): ClientConversation[] {
  return conversations.map(adaptIDBConversationToConversation);
}

// Convert array of IDBMessage to array of ClientMessage
export function adaptIDBMessagesToMessages(messages: IDBMessage[]): ClientMessage[] {
  return messages.map(adaptIDBMessageToMessage);
}