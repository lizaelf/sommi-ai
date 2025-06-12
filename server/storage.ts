import { 
  users, type User, type InsertUser,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation,
  tenants, type Tenant, type InsertTenant
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  getMostRecentConversation(): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<void>;
  
  // Tenant operations
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant | undefined>;
  deleteTenant(id: number): Promise<void>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private static connectionCount = 0;
  private static maxConnections = 3;
  private static activeConnections = new Set<Promise<any>>();

  private async executeWithLimit<T>(operation: () => Promise<T>): Promise<T> {
    // Check connection limit
    if (DatabaseStorage.connectionCount >= DatabaseStorage.maxConnections) {
      throw new Error('Connection limit reached');
    }

    DatabaseStorage.connectionCount++;
    const promise = operation();
    DatabaseStorage.activeConnections.add(promise);

    try {
      const result = await promise;
      return result;
    } finally {
      DatabaseStorage.connectionCount--;
      DatabaseStorage.activeConnections.delete(promise);
    }
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results.length > 0 ? results[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const results = await db.select().from(messages).where(eq(messages.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values({
        ...insertMessage,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }

  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    const results = await db.select().from(conversations).where(eq(conversations.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getAllConversations(): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt));
  }
  
  async getMostRecentConversation(): Promise<Conversation | undefined> {
    const results = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt))
      .limit(1);
    
    return results.length > 0 ? results[0] : undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const result = await db
      .insert(conversations)
      .values({
        ...insertConversation,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const result = await db
      .update(conversations)
      .set(data)
      .where(eq(conversations.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteConversation(id: number): Promise<void> {
    // Delete all messages in this conversation first
    await db
      .delete(messages)
      .where(eq(messages.conversationId, id));
    
    // Then delete the conversation
    await db
      .delete(conversations)
      .where(eq(conversations.id, id));
  }

  // Tenant operations
  async getTenant(id: number): Promise<Tenant | undefined> {
    const results = await db.select().from(tenants).where(eq(tenants.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const results = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return results.length > 0 ? results[0] : undefined;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const result = await db
      .insert(tenants)
      .values({
        ...insertTenant,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updateTenant(id: number, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const result = await db
      .update(tenants)
      .set(data)
      .where(eq(tenants.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTenant(id: number): Promise<void> {
    await db
      .delete(tenants)
      .where(eq(tenants.id, id));
  }
}

export const storage = new DatabaseStorage();
