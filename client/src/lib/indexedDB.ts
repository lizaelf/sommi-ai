import { Message, Conversation } from '@shared/schema';

// Constants
const DB_NAME = 'cabernetAIDB';
const DB_VERSION = 1;
const CONVERSATIONS_STORE = 'conversations';
const MESSAGES_STORE = 'messages';

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private dbReadyPromise: Promise<IDBDatabase>;
  private dbResolver: ((db: IDBDatabase) => void) | null = null;

  constructor() {
    // Create a promise that will resolve when DB is ready
    this.dbReadyPromise = new Promise((resolve) => {
      this.dbResolver = resolve;
    });

    // Initialize the database
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        const conversationsStore = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id', autoIncrement: true });
        conversationsStore.createIndex('title', 'title', { unique: false });
        conversationsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id', autoIncrement: true });
        messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
        messagesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      if (this.dbResolver) {
        this.dbResolver(this.db);
      }
      console.log('IndexedDB initialized successfully');
    };

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
    };
  }

  // Wait for database to be ready
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }
    return this.dbReadyPromise;
  }

  // CONVERSATION METHODS

  // Create a new conversation
  async createConversation(conversation: Partial<Conversation>): Promise<Conversation> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      
      // Ensure we have createdAt field
      const newConversation = {
        ...conversation,
        createdAt: conversation.createdAt || new Date(),
      };
      
      const request = store.add(newConversation);
      
      request.onsuccess = (event) => {
        const id = (event.target as IDBRequest).result as number;
        resolve({ id, ...newConversation } as Conversation);
      };
      
      request.onerror = (event) => {
        reject(new Error('Failed to create conversation'));
      };
    });
  }

  // Get a conversation by ID
  async getConversation(id: number): Promise<Conversation | undefined> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATIONS_STORE], 'readonly');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        const conversation = (event.target as IDBRequest).result;
        resolve(conversation || undefined);
      };
      
      request.onerror = (event) => {
        reject(new Error(`Failed to get conversation with ID ${id}`));
      };
    });
  }

  // Get all conversations
  async getAllConversations(): Promise<Conversation[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATIONS_STORE], 'readonly');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // Get in descending order (newest first)
      
      const conversations: Conversation[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          conversations.push(cursor.value);
          cursor.continue();
        } else {
          resolve(conversations);
        }
      };
      
      request.onerror = (event) => {
        reject(new Error('Failed to get conversations'));
      };
    });
  }

  // Delete a conversation
  async deleteConversation(id: number): Promise<void> {
    const db = await this.getDB();
    
    // First delete all messages for this conversation
    await this.deleteMessagesByConversation(id);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject(new Error(`Failed to delete conversation with ID ${id}`));
      };
    });
  }

  // Get the most recent conversation
  async getMostRecentConversation(): Promise<Conversation | undefined> {
    const conversations = await this.getAllConversations();
    return conversations.length > 0 ? conversations[0] : undefined;
  }

  // MESSAGE METHODS

  // Create a new message
  async createMessage(message: Partial<Message>): Promise<Message> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      
      // Ensure we have createdAt field
      const newMessage = {
        ...message,
        createdAt: message.createdAt || new Date(),
      };
      
      const request = store.add(newMessage);
      
      request.onsuccess = (event) => {
        const id = (event.target as IDBRequest).result as number;
        resolve({ id, ...newMessage } as Message);
      };
      
      request.onerror = (event) => {
        reject(new Error('Failed to create message'));
      };
    });
  }

  // Get messages by conversation ID
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MESSAGES_STORE], 'readonly');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('conversationId');
      const request = index.openCursor(IDBKeyRange.only(conversationId));
      
      const messages: Message[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          // Sort messages by createdAt
          messages.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateA.getTime() - dateB.getTime();
          });
          resolve(messages);
        }
      };
      
      request.onerror = (event) => {
        reject(new Error(`Failed to get messages for conversation ${conversationId}`));
      };
    });
  }

  // Delete messages by conversation ID
  async deleteMessagesByConversation(conversationId: number): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('conversationId');
      const request = index.openCursor(IDBKeyRange.only(conversationId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = (event) => {
        reject(new Error(`Failed to delete messages for conversation ${conversationId}`));
      };
    });
  }
}

// Create a singleton instance
export const indexedDBStorage = new IndexedDBStorage();