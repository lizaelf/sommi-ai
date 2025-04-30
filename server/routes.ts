import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatCompletion, checkApiStatus } from "./openai";
import { chatCompletionRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API status endpoint
  app.get("/api/status", async (_req, res) => {
    try {
      const apiStatus = await checkApiStatus();
      res.json({ 
        status: "online", 
        openai: apiStatus.isValid ? "connected" : "error",
        message: apiStatus.message 
      });
    } catch (err) {
      const error = err as any;
      res.json({ 
        status: "online", 
        openai: "error",
        message: error?.message || "Failed to check API status" 
      });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (_req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const { title } = req.body;
      const conversation = await storage.createConversation({ title });
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get a specific conversation
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Delete a conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Chat completion endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      // Validate request
      const validatedData = chatCompletionRequestSchema.parse(req.body);
      
      // Get messages from request
      const { messages, conversationId } = validatedData;
      
      // Check if conversation exists
      if (conversationId) {
        const conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
      }
      
      // Fetch previous messages for context if conversationId is provided
      let allMessages = messages;
      if (conversationId) {
        const previousMessages = await storage.getMessagesByConversation(conversationId);
        // Format previous messages for OpenAI API format
        const formattedPreviousMessages = previousMessages.map(msg => ({
          role: msg.role as any,
          content: msg.content
        }));
        
        // Add system message at the beginning if it doesn't exist
        if (!formattedPreviousMessages.some(msg => msg.role === 'system')) {
          formattedPreviousMessages.unshift({
            role: 'system',
            content: 'You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.'
          });
        }
        
        // Combine previous messages with current message
        allMessages = [...formattedPreviousMessages, ...messages];
      }
      
      // Call OpenAI API
      const response = await chatCompletion(allMessages);
      
      // Save message to storage if conversation exists
      if (conversationId) {
        // Save user message
        await storage.createMessage({
          content: messages[messages.length - 1].content,
          role: 'user',
          conversationId
        });
        
        // Save assistant response
        await storage.createMessage({
          content: response.content,
          role: 'assistant',
          conversationId
        });
      }
      
      // Return response
      res.json({
        message: {
          role: 'assistant',
          content: response.content
        },
        conversationId
      });
    } catch (err) {
      const error = err as any;
      console.error("Error in chat completion:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to generate chat completion",
        error: error?.message || "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
