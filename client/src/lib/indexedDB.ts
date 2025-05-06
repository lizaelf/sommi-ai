import { Message, Conversation } from '@shared/schema';

// Define database structure
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

  // Initialize the database
  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject(new Error('Could not open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
        this.loadSessionId();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create users store
        if (!db.objectStoreNames.contains(USER_STORE)) {
          const userStore = db.createObjectStore(USER_STORE, { keyPath: 'id', autoIncrement: true });
          userStore.createIndex('username', 'username', { unique: true });
        }

        // Create conversations store
        if (!db.objectStoreNames.contains(CONVERSATION_STORE)) {
          const conversationStore = db.createObjectStore(CONVERSATION_STORE, { keyPath: 'id', autoIncrement: true });
          conversationStore.createIndex('userId', 'userId', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  // Load or create a session ID from localStorage
  private async loadSessionId(): Promise<number> {
    // If we already have a user ID, use it
    if (this.currentUserId !== null) {
      return this.currentUserId;
    }

    // Try to get stored user ID from localStorage
    const storedUserId = localStorage.getItem(SESSION_ID_KEY);
    if (storedUserId) {
      const userId = parseInt(storedUserId, 10);
      
      // Verify that this user exists in our database
      try {
        const user = await this.getUser(userId);
        if (user) {
          this.currentUserId = userId;
          return userId;
        }
      } catch (error) {
        console.error('Error verifying stored user:', error);
      }
    }

    // Create a new user
    try {
      const newUser: Omit<IDBUser, 'id'> = {
        username: `user_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      
      const userId = await this.createUser(newUser);
      this.currentUserId = userId;
      localStorage.setItem(SESSION_ID_KEY, userId.toString());
      return userId;
    } catch (error) {
      console.error('Error creating new user:', error);
      throw error;
    }
  }

  // Get the current user ID or create a new user
  public async getCurrentUserId(): Promise<number> {
    return this.loadSessionId();
  }

  // User operations
  private async getUser(id: number): Promise<IDBUser | undefined> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USER_STORE], 'readonly');
      const store = transaction.objectStore(USER_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || undefined);
      };

      request.onerror = (event) => {
        reject(new Error(`Error getting user: ${event}`));
      };
    });
  }

  private async createUser(user: Omit<IDBUser, 'id'>): Promise<number> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USER_STORE], 'readwrite');
      const store = transaction.objectStore(USER_STORE);
      const request = store.add(user);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = (event) => {
        reject(new Error(`Error creating user: ${event}`));
      };
    });
  }

  // Conversation operations
  public async getConversation(id: number): Promise<IDBConversation | undefined> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATION_STORE], 'readonly');
      const store = transaction.objectStore(CONVERSATION_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || undefined);
      };

      request.onerror = (event) => {
        reject(new Error(`Error getting conversation: ${event}`));
      };
    });
  }

  public async getAllConversations(): Promise<IDBConversation[]> {
    const userId = await this.getCurrentUserId();
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATION_STORE], 'readonly');
      const store = transaction.objectStore(CONVERSATION_STORE);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        reject(new Error(`Error getting conversations: ${event}`));
      };
    });
  }

  public async getConversationMessages(conversationId: number): Promise<IDBMessage[]> {
    const conversation = await this.getConversation(conversationId);
    return conversation?.messages || [];
  }

  public async createConversation(title: string = 'New Conversation'): Promise<number> {
    const userId = await this.getCurrentUserId();
    const db = await this.initDB();
    
    const newConversation: Omit<IDBConversation, 'id'> = {
      userId,
      title,
      createdAt: new Date().toISOString(),
      messages: []
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATION_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATION_STORE);
      const request = store.add(newConversation);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = (event) => {
        reject(new Error(`Error creating conversation: ${event}`));
      };
    });
  }

  public async updateConversation(id: number, data: Partial<IDBConversation>): Promise<void> {
    const db = await this.initDB();
    const conversation = await this.getConversation(id);
    
    if (!conversation) {
      throw new Error(`Conversation with ID ${id} not found`);
    }

    const updatedConversation = { ...conversation, ...data };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATION_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATION_STORE);
      const request = store.put(updatedConversation);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(new Error(`Error updating conversation: ${event}`));
      };
    });
  }

  public async deleteConversation(id: number): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATION_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATION_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(new Error(`Error deleting conversation: ${event}`));
      };
    });
  }

  public async addMessageToConversation(conversationId: number, message: IDBMessage): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }

    // Create a new message with a local ID if not provided
    const newMessage: IDBMessage = {
      ...message,
      localId: message.localId || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: message.createdAt || new Date().toISOString()
    };

    // Add the message to the conversation
    const updatedMessages = [...conversation.messages, newMessage];
    await this.updateConversation(conversationId, { messages: updatedMessages });
  }

  // Get the most recent conversation or create a new one if none exists
  public async getMostRecentConversation(): Promise<IDBConversation> {
    const conversations = await this.getAllConversations();
    
    if (conversations.length === 0) {
      // Create a new conversation if none exist
      const id = await this.createConversation();
      return this.getConversation(id) as Promise<IDBConversation>;
    }

    // Sort conversations by creation date (newest first)
    const sortedConversations = [...conversations].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedConversations[0];
  }
}

// Create a singleton instance
const indexedDBService = new IndexedDBService();
export default indexedDBService;