import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Model for users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  username: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Model for messages in a conversation
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").notNull(), // "user" or "assistant"
  conversationId: integer("conversation_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true,
  conversationId: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Model for conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Chat completion request and response types
export const chatCompletionRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  conversationId: z.number().optional(),
  wineData: z.any().optional(), // Allow any wine data structure for flexibility
  // Safari compatibility: accept additional fields
  optimize_for_speed: z.boolean().optional(),
}).passthrough(); // Allow additional fields for browser compatibility

export type ChatCompletionRequest = z.infer<typeof chatCompletionRequestSchema>;

export const chatCompletionResponseSchema = z.object({
  message: z.object({
    role: z.enum(["assistant"]),
    content: z.string(),
  }),
  conversationId: z.number(),
});

export type ChatCompletionResponse = z.infer<typeof chatCompletionResponseSchema>;

// Model for tenants (wineries)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  logo: text("logo"), // Logo URL or base64
  description: text("description"),
  aiTone: text("ai_tone"), // AI personality/tone for this winery
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  slug: true,
  logo: true,
  description: true,
  aiTone: true,
});

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// Suggestion pills tracking table
export const usedSuggestionPills = pgTable("used_suggestion_pills", {
  id: serial("id").primaryKey(),
  wineKey: text("wine_key").notNull(), // wine_name + wine_year
  suggestionId: text("suggestion_id").notNull(), // ID from suggestionPills.json
  userId: integer("user_id"), // Optional user tracking
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export const insertUsedSuggestionPillSchema = createInsertSchema(usedSuggestionPills).pick({
  wineKey: true,
  suggestionId: true,
  userId: true,
});

export type InsertUsedSuggestionPill = z.infer<typeof insertUsedSuggestionPillSchema>;
export type UsedSuggestionPill = typeof usedSuggestionPills.$inferSelect;

// Food pairing categories table
export const foodPairingCategories = pgTable("food_pairing_categories", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().unique(),
  imagePath: text("image_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertFoodPairingCategorySchema = createInsertSchema(foodPairingCategories).pick({
  type: true,
  imagePath: true,
});

export type InsertFoodPairingCategory = z.infer<typeof insertFoodPairingCategorySchema>;
export type FoodPairingCategory = typeof foodPairingCategories.$inferSelect;

// Wine types table
export const wineTypes = pgTable("wine_types", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().unique(), // Red, Rose, White, Sparkling
  imagePath: text("image_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertWineTypeSchema = createInsertSchema(wineTypes).pick({
  type: true,
  imagePath: true,
});

export type InsertWineType = z.infer<typeof insertWineTypeSchema>;
export type WineType = typeof wineTypes.$inferSelect;

// Model for wines
export const wines = pgTable("wines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: integer("year"),
  bottles: integer("bottles").default(0),
  image: text("image"),
  ratings: json("ratings").$type<{
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  }>(),
  buyAgainLink: text("buy_again_link"),
  qrCode: text("qr_code"),
  qrLink: text("qr_link"),
  location: text("location"),
  description: text("description"),
  foodPairing: json("food_pairing").$type<string[]>(),
  technicalDetails: json("technical_details").$type<{
    varietal?: {
      primary?: { name: string; percentage: number };
      secondary?: { name: string; percentage: number };
    };
    appellation?: string;
    aging?: {
      drinkNow: boolean;
      ageUpTo?: number;
    };
    customAbv?: number;
  }>(),
  hasCustomImage: boolean("has_custom_image").default(false),
  imagePrefix: text("image_prefix"),
  imageSize: integer("image_size").default(0),
  conversationHistory: json("conversation_history").$type<any[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertWineSchema = createInsertSchema(wines).pick({
  name: true,
  year: true,
  bottles: true,
  image: true,
  ratings: true,
  buyAgainLink: true,
  qrCode: true,
  qrLink: true,
  location: true,
  description: true,
  foodPairing: true,
  technicalDetails: true,
  hasCustomImage: true,
  imagePrefix: true,
  imageSize: true,
  conversationHistory: true,
});

export type InsertWine = z.infer<typeof insertWineSchema>;
export type Wine = typeof wines.$inferSelect;
