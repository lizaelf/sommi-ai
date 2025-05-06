import { Conversation, Message } from '@shared/schema';
import { IDBConversation, IDBMessage } from './indexedDB';

/**
 * Adapters for converting between database types and application types
 * to handle the Date/string incompatibility
 */

// Convert IDBMessage to Message
export function adaptIDBMessageToMessage(message: IDBMessage): Message {
  return {
    id: message.id || 0,
    content: message.content,
    role: message.role,
    conversationId: message.conversationId,
    // Convert string date to Date object if needed
    createdAt: typeof message.createdAt === 'string' 
      ? new Date(message.createdAt) 
      : message.createdAt as Date
  };
}

// Convert Message to IDBMessage
export function adaptMessageToIDBMessage(message: Message): IDBMessage {
  return {
    id: message.id,
    content: message.content,
    role: message.role,
    conversationId: message.conversationId,
    // Keep the date as is (could be Date or string)
    createdAt: message.createdAt
  };
}

// Convert IDBConversation to Conversation
export function adaptIDBConversationToConversation(conversation: IDBConversation): Conversation {
  return {
    id: conversation.id || 0,
    title: conversation.title,
    // Convert string date to Date object if needed
    createdAt: typeof conversation.createdAt === 'string' 
      ? new Date(conversation.createdAt) 
      : conversation.createdAt as Date
  };
}

// Convert array of IDBConversation to array of Conversation
export function adaptIDBConversationsToConversations(conversations: IDBConversation[]): Conversation[] {
  return conversations.map(adaptIDBConversationToConversation);
}

// Convert array of IDBMessage to array of Message
export function adaptIDBMessagesToMessages(messages: IDBMessage[]): Message[] {
  return messages.map(adaptIDBMessageToMessage);
}