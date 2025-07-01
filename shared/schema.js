"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertWineSchema = exports.wines = exports.insertWineTypeSchema = exports.wineTypes = exports.insertFoodPairingCategorySchema = exports.foodPairingCategories = exports.insertUsedSuggestionPillSchema = exports.usedSuggestionPills = exports.insertTenantSchema = exports.tenants = exports.chatCompletionResponseSchema = exports.chatCompletionRequestSchema = exports.insertConversationSchema = exports.conversations = exports.insertMessageSchema = exports.messages = exports.insertUserSchema = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
// Model for users
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    password: (0, pg_core_1.text)('password').notNull(),
    username: (0, pg_core_1.text)('username'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    email: true,
    password: true,
    username: true,
});
// Model for messages in a conversation
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    content: (0, pg_core_1.text)('content').notNull(),
    role: (0, pg_core_1.text)('role').notNull(), // "user" or "assistant"
    conversationId: (0, pg_core_1.integer)('conversation_id').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.insertMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.messages).pick({
    content: true,
    role: true,
    conversationId: true,
});
// Model for conversations
exports.conversations = (0, pg_core_1.pgTable)('conversations', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    title: (0, pg_core_1.text)('title').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.insertConversationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.conversations).pick({
    title: true,
});
// Chat completion request and response types
exports.chatCompletionRequestSchema = zod_1.z
    .object({
    messages: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['system', 'user', 'assistant']),
        content: zod_1.z.string(),
    })),
    conversationId: zod_1.z.number().optional(),
    wineData: zod_1.z.any().optional(), // Allow any wine data structure for flexibility
    // Safari compatibility: accept additional fields
    optimize_for_speed: zod_1.z.boolean().optional(),
})
    .passthrough(); // Allow additional fields for browser compatibility
exports.chatCompletionResponseSchema = zod_1.z.object({
    message: zod_1.z.object({
        role: zod_1.z.enum(['assistant']),
        content: zod_1.z.string(),
    }),
    conversationId: zod_1.z.number(),
});
// Model for tenants (wineries)
exports.tenants = (0, pg_core_1.pgTable)('tenants', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    profile: (0, pg_core_1.json)('profile').$type(),
    wineEntries: (0, pg_core_1.json)('wine_entries').$type(),
    wineClub: (0, pg_core_1.json)('wine_club').$type(),
    aiModel: (0, pg_core_1.json)('ai_model').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.insertTenantSchema = (0, drizzle_zod_1.createInsertSchema)(exports.tenants).pick({
    profile: true,
    wineEntries: true,
    wineClub: true,
    aiModel: true,
});
// Suggestion pills tracking table
exports.usedSuggestionPills = (0, pg_core_1.pgTable)('used_suggestion_pills', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    wineKey: (0, pg_core_1.text)('wine_key').notNull(), // wine_name + wine_year
    suggestionId: (0, pg_core_1.text)('suggestion_id').notNull(), // ID from suggestionPills.json
    userId: (0, pg_core_1.integer)('user_id'), // Optional user tracking
    usedAt: (0, pg_core_1.timestamp)('used_at').defaultNow().notNull(),
});
exports.insertUsedSuggestionPillSchema = (0, drizzle_zod_1.createInsertSchema)(exports.usedSuggestionPills).pick({
    wineKey: true,
    suggestionId: true,
    userId: true,
});
// Food pairing categories table
exports.foodPairingCategories = (0, pg_core_1.pgTable)('food_pairing_categories', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    type: (0, pg_core_1.text)('type').notNull().unique(),
    imagePath: (0, pg_core_1.text)('image_path').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.insertFoodPairingCategorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.foodPairingCategories).pick({
    type: true,
    imagePath: true,
});
// Wine types table
exports.wineTypes = (0, pg_core_1.pgTable)('wine_types', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    type: (0, pg_core_1.text)('type').notNull().unique(), // Red, Rose, White, Sparkling
    imagePath: (0, pg_core_1.text)('image_path').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.insertWineTypeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.wineTypes).pick({
    type: true,
    imagePath: true,
});
// Model for wines
exports.wines = (0, pg_core_1.pgTable)('wines', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    year: (0, pg_core_1.integer)('year'),
    bottles: (0, pg_core_1.integer)('bottles').default(0),
    image: (0, pg_core_1.text)('image'),
    ratings: (0, pg_core_1.json)('ratings').$type(),
    buyAgainLink: (0, pg_core_1.text)('buy_again_link'),
    qrCode: (0, pg_core_1.text)('qr_code'),
    qrLink: (0, pg_core_1.text)('qr_link'),
    location: (0, pg_core_1.text)('location'),
    description: (0, pg_core_1.text)('description'),
    foodPairing: (0, pg_core_1.json)('food_pairing').$type(),
    technicalDetails: (0, pg_core_1.json)('technical_details').$type(),
    hasCustomImage: (0, pg_core_1.boolean)('has_custom_image').default(false),
    imagePrefix: (0, pg_core_1.text)('image_prefix'),
    imageSize: (0, pg_core_1.integer)('image_size').default(0),
    conversationHistory: (0, pg_core_1.json)('conversation_history').$type().default([]),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.insertWineSchema = (0, drizzle_zod_1.createInsertSchema)(exports.wines).pick({
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
