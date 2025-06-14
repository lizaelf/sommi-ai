import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Model for users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
