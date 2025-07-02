import { users, type User, type InsertUser, messages, type Message, type InsertMessage, conversations, type Conversation, type InsertConversation, tenants, type Tenant, type InsertTenant, usedSuggestionPills, type UsedSuggestionPill, type InsertUsedSuggestionPill, foodPairingCategories, type FoodPairingCategory, type InsertFoodPairingCategory, wineTypes, type WineType, type InsertWineType, wines, type Wine as SharedWine, type InsertWine } from '@shared/schema'
import { db } from './db'
import { eq, desc, sql } from 'drizzle-orm'

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>
  getUserByUsername(username: string): Promise<User | undefined>
  getUserByEmail(email: string): Promise<User | undefined>
  createUser(user: InsertUser): Promise<User>
  authenticateUser(email: string, password: string): Promise<User | null>

  // Message operations
  getMessage(id: number): Promise<Message | undefined>
  getMessagesByConversation(conversationId: number): Promise<Message[]>
  createMessage(message: InsertMessage): Promise<Message>

  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>
  getAllConversations(): Promise<Conversation[]>
  getMostRecentConversation(): Promise<Conversation | undefined>
  createConversation(conversation: InsertConversation): Promise<Conversation>
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>
  deleteConversation(id: number): Promise<void>

  // Tenant operations
  getTenant(id: number): Promise<Tenant | undefined>
  getTenantByTenantName(tenantName: string): Promise<Tenant | undefined>
  getAllTenants(): Promise<Tenant[]>
  createTenant(tenant: InsertTenant): Promise<Tenant>
  updateTenant(id: number, tenant: Partial<InsertTenant>): Promise<Tenant | undefined>
  deleteTenant(id: number): Promise<void>

  // Suggestion pills operations
  getUsedSuggestionPills(wineKey: string): Promise<UsedSuggestionPill[]>
  markSuggestionPillUsed(pill: InsertUsedSuggestionPill): Promise<UsedSuggestionPill>
  resetUsedSuggestionPills(wineKey: string): Promise<void>

  // Food pairing categories operations
  getAllFoodPairingCategories(): Promise<FoodPairingCategory[]>
  getFoodPairingCategoryByType(type: string): Promise<FoodPairingCategory | undefined>
  createFoodPairingCategory(category: InsertFoodPairingCategory): Promise<FoodPairingCategory>
  updateFoodPairingCategory(id: number, category: Partial<InsertFoodPairingCategory>): Promise<FoodPairingCategory | undefined>
  deleteFoodPairingCategory(id: number): Promise<void>

  // Wine types operations
  getAllWineTypes(): Promise<WineType[]>
  getWineTypeByType(type: string): Promise<WineType | undefined>
  createWineType(wineType: InsertWineType): Promise<WineType>
  updateWineType(id: number, wineType: Partial<InsertWineType>): Promise<WineType | undefined>
  deleteWineType(id: number): Promise<void>

  // Wine operations
  getAllWines(): Promise<SharedWine[]>
  getWine(id: number): Promise<SharedWine | undefined>
  createWine(wine: InsertWine): Promise<SharedWine>
  updateWine(id: number, wine: Partial<InsertWine>): Promise<SharedWine | undefined>
  deleteWine(id: number): Promise<void>
  clearAllWines(): Promise<void>

  // Додаємо функцію для генерації унікального ID для вина в рамках tenant
  generateWineId(tenantId: number): Promise<number>
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id))
    return results.length > 0 ? results[0] : undefined
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username))
    return results.length > 0 ? results[0] : undefined
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email))
    return results.length > 0 ? results[0] : undefined
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning()
    return result[0]
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email)
    if (user && user.password === password) {
      return user
    }
    return null
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const results = await db.select().from(messages).where(eq(messages.id, id))
    return results.length > 0 ? results[0] : undefined
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt)
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values({
        ...insertMessage,
        createdAt: new Date(),
      })
      .returning()
    return result[0]
  }

  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    const results = await db.select().from(conversations).where(eq(conversations.id, id))
    return results.length > 0 ? results[0] : undefined
  }

  async getAllConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(desc(conversations.createdAt))
  }

  async getMostRecentConversation(): Promise<Conversation | undefined> {
    const results = await db.select().from(conversations).orderBy(desc(conversations.createdAt)).limit(1)

    return results.length > 0 ? results[0] : undefined
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const result = await db
      .insert(conversations)
      .values({
        ...insertConversation,
        createdAt: new Date(),
      })
      .returning()
    return result[0]
  }

  async updateConversation(id: number, data: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const result = await db.update(conversations).set(data).where(eq(conversations.id, id)).returning()
    return result.length > 0 ? result[0] : undefined
  }

  async deleteConversation(id: number): Promise<void> {
    // Delete all messages in this conversation first
    await db.delete(messages).where(eq(messages.conversationId, id))

    // Then delete the conversation
    await db.delete(conversations).where(eq(conversations.id, id))
  }

  // Tenant operations
  async getTenant(id: number): Promise<Tenant | undefined> {
    const results = await db.select().from(tenants).where(eq(tenants.id, id))
    return results.length > 0 ? results[0] : undefined
  }

  async getTenantByTenantName(tenantName: string): Promise<Tenant | undefined> {
    const results = (await db.execute(sql`SELECT * FROM tenants WHERE profile->>'tenantName' = ${tenantName} LIMIT 1`)) as { rows: Tenant[] }
    return results.rows && results.rows.length > 0 ? results.rows[0] : undefined
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt))
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const result = await db
      .insert(tenants)
      .values({
        ...insertTenant,
        profile: insertTenant.profile as Tenant['profile'],
        wineEntries: (insertTenant.wineEntries ?? []) as SharedWine[],
        wineClub: insertTenant.wineClub as Tenant['wineClub'],
        aiModel: insertTenant.aiModel as Tenant['aiModel'],
      })
      .returning()
    return result[0]
  }

  async updateTenant(id: number, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const result = await db
      .update(tenants)
      .set({
        ...data,
        profile: data.profile as Tenant['profile'],
        wineEntries: (data.wineEntries ?? []) as SharedWine[],
        wineClub: data.wineClub as Tenant['wineClub'],
        aiModel: data.aiModel as Tenant['aiModel'],
      })
      .where(eq(tenants.id, id))
      .returning()
    return result.length > 0 ? result[0] : undefined
  }

  async deleteTenant(id: number): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id))
  }

  async getUsedSuggestionPills(wineKey: string): Promise<UsedSuggestionPill[]> {
    return await db.select().from(usedSuggestionPills).where(eq(usedSuggestionPills.wineKey, wineKey))
  }

  async markSuggestionPillUsed(pill: InsertUsedSuggestionPill): Promise<UsedSuggestionPill> {
    const [insertedPill] = await db.insert(usedSuggestionPills).values(pill).returning()
    return insertedPill
  }

  async resetUsedSuggestionPills(wineKey: string): Promise<void> {
    await db.delete(usedSuggestionPills).where(eq(usedSuggestionPills.wineKey, wineKey))
  }

  // Food pairing categories operations
  async getAllFoodPairingCategories(): Promise<FoodPairingCategory[]> {
    return await db.select().from(foodPairingCategories)
  }

  async getFoodPairingCategoryByType(type: string): Promise<FoodPairingCategory | undefined> {
    const [category] = await db.select().from(foodPairingCategories).where(eq(foodPairingCategories.type, type))
    return category || undefined
  }

  async createFoodPairingCategory(insertCategory: InsertFoodPairingCategory): Promise<FoodPairingCategory> {
    const [category] = await db.insert(foodPairingCategories).values(insertCategory).returning()
    return category
  }

  async updateFoodPairingCategory(id: number, data: Partial<InsertFoodPairingCategory>): Promise<FoodPairingCategory | undefined> {
    const [category] = await db.update(foodPairingCategories).set(data).where(eq(foodPairingCategories.id, id)).returning()
    return category || undefined
  }

  async deleteFoodPairingCategory(id: number): Promise<void> {
    await db.delete(foodPairingCategories).where(eq(foodPairingCategories.id, id))
  }

  // Wine types operations
  async getAllWineTypes(): Promise<WineType[]> {
    return await db.select().from(wineTypes)
  }

  async getWineTypeByType(type: string): Promise<WineType | undefined> {
    const [wineType] = await db.select().from(wineTypes).where(eq(wineTypes.type, type))
    return wineType || undefined
  }

  async createWineType(insertWineType: InsertWineType): Promise<WineType> {
    const [wineType] = await db.insert(wineTypes).values(insertWineType).returning()
    return wineType
  }

  async updateWineType(id: number, data: Partial<InsertWineType>): Promise<WineType | undefined> {
    const [wineType] = await db.update(wineTypes).set(data).where(eq(wineTypes.id, id)).returning()
    return wineType || undefined
  }

  async deleteWineType(id: number): Promise<void> {
    await db.delete(wineTypes).where(eq(wineTypes.id, id))
  }

  // Wine operations
  async getAllWines(): Promise<SharedWine[]> {
    return await db.select().from(wines)
  }

  async getWine(id: number): Promise<SharedWine | undefined> {
    const [wine] = await db.select().from(wines).where(eq(wines.id, id))
    return wine || undefined
  }

  async createWine(insertWine: InsertWine): Promise<SharedWine> {
    const [created] = await db
      .insert(wines)
      .values(insertWine as any)
      .returning()
    // Після вставки робимо select по id
    const [wine] = await db.select().from(wines).where(eq(wines.id, created.id))
    return wine
  }

  async updateWine(id: number, data: Partial<InsertWine>): Promise<SharedWine | undefined> {
    if (Object.keys(data).length === 0) {
      return this.getWine(id)
    }

    await db
      .update(wines)
      .set(data as any)
      .where(eq(wines.id, id))

    // Після оновлення робимо select по id
    const [wine] = await db.select().from(wines).where(eq(wines.id, id))
    return wine || undefined
  }

  async deleteWine(id: number): Promise<void> {
    await db.delete(wines).where(eq(wines.id, id))
  }

  async clearAllWines(): Promise<void> {
    await db.delete(wines)
  }

  // Додаємо функцію для генерації унікального ID для вина в рамках tenant
  async generateWineId(tenantId: number): Promise<number> {
    const tenant = await this.getTenant(tenantId)
    if (!tenant || !tenant.wineEntries) {
      return 1
    }

    // Знаходимо максимальний ID серед існуючих вин
    const maxId = Math.max(0, ...tenant.wineEntries.map(wine => wine.id || 0))
    return maxId + 1
  }
}

export const storage = new DatabaseStorage()
