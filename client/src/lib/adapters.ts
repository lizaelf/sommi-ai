import { Conversation, Message } from '@shared/schema';
import { ClientMessage, ClientConversation } from './types';
import { IDBConversation, IDBMessage } from './indexedDB';

/**
 * Adapters for converting between database types and application types
 * to handle the Date/string incompatibility
 */

// Convert IDBMessage to ClientMessage
export function adaptIDBMessageToMessage(message: IDBMessage): ClientMessage {
  return {
    id: message.id || 0,
    content: message.content,
    role: message.role,
    conversationId: message.conversationId,
    // Keep createdAt as-is, could be string or Date
    createdAt: message.createdAt
  };
}

// Convert Message or ClientMessage to IDBMessage
export function adaptMessageToIDBMessage(message: Message | ClientMessage): IDBMessage {
  return {
    id: message.id,
    content: message.content,
    role: message.role,
    conversationId: message.conversationId,
    // Keep the date as is (could be Date or string)
    createdAt: message.createdAt
  };
}

// Convert IDBConversation to ClientConversation
export function adaptIDBConversationToConversation(conversation: IDBConversation): ClientConversation {
  return {
    id: conversation.id || 0,
    title: conversation.title,
    // Keep createdAt as-is, could be string or Date
    createdAt: conversation.createdAt
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