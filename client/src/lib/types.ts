import { Conversation, Message } from '@shared/schema';

/**
 * Client-side types that extend/modify server types to deal with
 * the limitations of localStorage and IndexedDB (like Date objects)
 */

// Modified Message type that allows string or Date for createdAt
export type ClientMessage = Omit<Message, 'createdAt'> & {
  createdAt: Date | string;
};

// Modified Conversation type that allows string or Date for createdAt
export type ClientConversation = Omit<Conversation, 'createdAt'> & {
  createdAt: Date | string;
};