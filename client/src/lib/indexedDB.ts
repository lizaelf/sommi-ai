import { Message, Conversation } from '@shared/schema';

// Database schema definitions
interface IDBUser {
  id: number;
  username: string;
  createdAt: string | Date;
}

export interface IDBMessage extends Omit<Message, 'id' | 'createdAt'> {
  id?: number;
  localId?: string;
  createdAt: string | Date;
}

export interface IDBConversation extends Omit<Conversation, 'id' | 'createdAt'> {
  id?: number;
  userId: number;
  createdAt: string | Date;
  lastActivity?: Date | string;
  messages: IDBMessage[];
}

// Constants
const DB_NAME = 'WineAssistantDB';
const DB_VERSION = 1;
const USER_STORE = 'users';
const CONVERSATION_STORE = 'conversations';
const SESSION_ID_KEY = 'wine_assistant_session_id';

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private currentUserId: number | null = null;

  constructor() {
    this.initDB();
  }

  // Initialize database
  private initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create users store if it doesn't exist
          if (!db.objectStoreNames.contains(USER_STORE)) {
            const userStore = db.createObjectStore(USER_STORE, { keyPath: 'id', autoIncrement: true });
            userStore.createIndex('username', 'username', { unique: true });
          }

          // Create conversations store if it doesn't exist
          if (!db.objectStoreNames.contains(CONVERSATION_STORE)) {
            const conversationStore = db.createObjectStore(CONVERSATION_STORE, { keyPath: 'id', autoIncrement: true });
            conversationStore.createIndex('userId', 'userId', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          
          // Ensure we have a user
          this.ensureUser().then(() => {
            resolve(this.db as IDBDatabase);
          }).catch(reject);
        };

        request.onerror = (event) => {
          console.error('Error opening IndexedDB:', event);
          reject(new Error('Could not open IndexedDB'));
        };
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
        reject(error);
      }
    });

    return this.dbPromise;
  }

  // Ensure a user exists in the database
  private async ensureUser(): Promise<number> {
    if (this.currentUserId) {
      return this.currentUserId;
    }

    // Check if we have a session ID in localStorage
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    
    if (sessionId) {
      // Try to find the user with this ID
      try {
        const user = await this.getUser(parseInt(sessionId, 10));
        if (user) {
          this.currentUserId = user.id;
          return user.id;
        }
      } catch (error) {
        console.warn('Failed to get user with saved session ID:', error);
      }
    }

    // Create a new user
    try {
      const userId = await this.createUser({
        username: `user_${Date.now()}`,
        createdAt: new Date()
      } as IDBUser);

      if (userId) {
        localStorage.setItem(SESSION_ID_KEY, userId.toString());
        this.currentUserId = userId;
        return userId;
      }
      
      throw new Error('Failed to create user');
    } catch (error) {
      console.error('Error ensuring user:', error);
      throw error;
    }
  }

  // Get a user by ID
  private async getUser(id: number): Promise<IDBUser | undefined> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(USER_STORE, 'readonly');
      const store = transaction.objectStore(USER_STORE);
      const request = store.get(id);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result || undefined);
        };
        
        request.onerror = () => {
          reject(new Error(`Could not get user with ID ${id}`));
        };
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  // Create a new user
  private async createUser(user: IDBUser): Promise<number> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(USER_STORE, 'readwrite');
      const store = transaction.objectStore(USER_STORE);
      
      return new Promise((resolve, reject) => {
        const request = store.add(user);
        
        request.onsuccess = () => {
          resolve(request.result as number);
        };
        
        request.onerror = () => {
          reject(new Error('Could not create user'));
        };
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  // Get a specific conversation by ID
  public async getConversation(id: number): Promise<IDBConversation | undefined> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(CONVERSATION_STORE, 'readonly');
      const store = transaction.objectStore(CONVERSATION_STORE);
      const request = store.get(id);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result || undefined);
        };
        
        request.onerror = () => {
          reject(new Error(`Could not get conversation with ID ${id}`));
        };
      });
    } catch (error) {
      console.error('Error getting conversation:', error);
      return undefined;
    }
  }

  // Get all conversations
  public async getAllConversations(): Promise<IDBConversation[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(CONVERSATION_STORE, 'readonly');
      const store = transaction.objectStore(CONVERSATION_STORE);
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          // Sort by last activity date (descending)
          const conversations = request.result || [];
          conversations.sort((a, b) => {
            const dateA = new Date(a.lastActivity || a.createdAt);
            const dateB = new Date(b.lastActivity || b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          resolve(conversations);
        };
        
        request.onerror = () => {
          reject(new Error('Could not get all conversations'));
        };
      });
    } catch (error) {
      console.error('Error getting all conversations:', error);
      return [];
    }
  }

  // Get conversations for a specific wine
  public async getWineConversations(wineId: string | number): Promise<IDBConversation[]> {
    try {
      const allConversations = await this.getAllConversations();
      const numericWineId = typeof wineId === 'string' ? wineId.replace('wine_', '') : wineId.toString();
      
      // Filter conversations that have wine-specific titles or contain wine-specific content
      const wineConversations = allConversations.filter(conv => {
        // Check if title contains wine ID or wine-specific naming
        if (conv.title && conv.title.includes(`wine_${numericWineId}`)) {
          return true;
        }
        
        // Check if conversation has messages about this specific wine
        if (conv.messages && conv.messages.length > 0) {
          const hasWineSpecificContent = conv.messages.some(msg => 
            msg.content && (
              msg.content.includes(`wine_${numericWineId}`) ||
              msg.content.includes(`Wine ID: ${numericWineId}`)
            )
          );
          return hasWineSpecificContent;
        }
        
        return false;
      });
      
      return wineConversations;
    } catch (error) {
      console.error('Error getting wine conversations:', error);
      return [];
    }
  }

  // Get the most recent conversation
  public async getMostRecentConversation(): Promise<IDBConversation | undefined> {
    try {
      const conversations = await this.getAllConversations();
      
      if (conversations.length > 0) {
        return conversations[0]; // First one is the most recent due to sorting
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting most recent conversation:', error);
      return undefined;
    }
  }

  // Create a new conversation
  public async createConversation(conversation: string | IDBConversation): Promise<number> {
    try {
      // Ensure we have a user ID
      const userId = await this.ensureUser();
      
      let newConversation: IDBConversation;
      
      if (typeof conversation === 'string') {
        // If just a title string was passed
        newConversation = {
          userId: userId,
          title: conversation,
          createdAt: new Date(),
          messages: []
        };
      } else {
        // If a conversation object was passed
        newConversation = {
          ...conversation,
          userId: userId
        };
        
        if (!newConversation.createdAt) {
          newConversation.createdAt = new Date();
        }
        
        if (!newConversation.messages) {
          newConversation.messages = [];
        }
      }
      
      const db = await this.initDB();
      const transaction = db.transaction(CONVERSATION_STORE, 'readwrite');
      const store = transaction.objectStore(CONVERSATION_STORE);
      
      return new Promise((resolve, reject) => {
        const request = store.add(newConversation);
        
        request.onsuccess = () => {
          resolve(request.result as number);
        };
        
        request.onerror = (event) => {
          console.error('Error adding conversation:', event);
          reject(new Error('Could not create conversation'));
        };
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Update an existing conversation
  public async updateConversation(conversation: IDBConversation | number, data?: Partial<IDBConversation>): Promise<void> {
    try {
      let conversationToUpdate: IDBConversation;
      
      if (typeof conversation === 'number') {
        // If ID was passed, we need to fetch the conversation first
        const existingConversation = await this.getConversation(conversation);
        
        if (!existingConversation) {
          throw new Error(`Conversation with ID ${conversation} not found`);
        }
        
        conversationToUpdate = {
          ...existingConversation,
          ...(data || {})
        };
      } else {
        // Conversation object was passed directly
        conversationToUpdate = conversation;
        
        if (!conversationToUpdate.id) {
          throw new Error('Conversation ID is required for update');
        }
      }
      
      const db = await this.initDB();
      const transaction = db.transaction(CONVERSATION_STORE, 'readwrite');
      const store = transaction.objectStore(CONVERSATION_STORE);
      
      return new Promise((resolve, reject) => {
        const request = store.put(conversationToUpdate);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error(`Could not update conversation with ID ${conversationToUpdate.id}`));
        };
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  // Add a message to a conversation
  public async addMessageToConversation(conversationId: number, message: IDBMessage): Promise<void> {
    try {
      const conversation = await this.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }
      
      // Add the message
      if (!conversation.messages) {
        conversation.messages = [];
      }
      
      // Ensure message has conversationId and createdAt
      message.conversationId = conversationId;
      if (!message.createdAt) {
        message.createdAt = new Date();
      }
      
      conversation.messages.push(message);
      conversation.lastActivity = new Date();
      
      // Update the conversation
      await this.updateConversation(conversation);
    } catch (error) {
      console.error(`Error adding message to conversation ${conversationId}:`, error);
      throw error;
    }
  }

  // Get messages for a specific conversation
  public async getConversationMessages(conversationId: number): Promise<IDBMessage[]> {
    try {
      const conversation = await this.getConversation(conversationId);
      return conversation?.messages || [];
    } catch (error) {
      console.error(`Error getting messages for conversation ${conversationId}:`, error);
      return [];
    }
  }

  // Clear all messages from a conversation
  public async clearConversationMessages(conversationId: number): Promise<void> {
    try {
      const conversation = await this.getConversation(conversationId);
      
      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }
      
      // Clear messages
      conversation.messages = [];
      conversation.lastActivity = new Date();
      
      // Update the conversation
      await this.updateConversation(conversation);
    } catch (error) {
      console.error(`Error clearing messages for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  // Delete a conversation
  public async deleteConversation(conversationId: number): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(CONVERSATION_STORE, 'readwrite');
      const store = transaction.objectStore(CONVERSATION_STORE);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(conversationId);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error(`Could not delete conversation with ID ${conversationId}`));
        };
      });
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      throw error;
    }
  }

  // Clear all data from IndexedDB
  public async clearAllData(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([CONVERSATION_STORE, USER_STORE], 'readwrite');
      
      const conversationStore = transaction.objectStore(CONVERSATION_STORE);
      const userStore = transaction.objectStore(USER_STORE);
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = conversationStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = userStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ]);
      
      console.log('Cleared all IndexedDB data');
    } catch (error) {
      console.error('Error clearing IndexedDB data:', error);
      throw error;
    }
  }
}

// Export singleton instance
const indexedDBService = new IndexedDBService();
export default indexedDBService;