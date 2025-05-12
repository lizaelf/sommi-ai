import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatCompletion, checkApiStatus, textToSpeech } from "./openai";
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
  
  // Get the most recent conversation
  app.get("/api/conversations/recent", async (_req, res) => {
    try {
      const conversation = await storage.getMostRecentConversation();
      
      if (!conversation) {
        return res.status(404).json({ message: "No conversations found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching most recent conversation:", error);
      res.status(500).json({ message: "Failed to fetch most recent conversation" });
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
            content: 'You are a friendly wine expert specializing in Cabernet Sauvignon. Your responses should be warm, engaging, and informative. Focus on providing interesting facts, food pairings, and tasting notes specific to Cabernet Sauvignon. Keep your responses concise but informative.'
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
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      // Check if it's a quota exceeded error
      const isQuotaError = error.message && (
        error.message.includes("quota") || 
        error.message.includes("rate limit") ||
        error.message.includes("insufficient_quota")
      );
      
      // Handle quota exceeded error with a friendly message
      if (isQuotaError) {
        const friendlyMessage = 
          "I apologize, but I'm currently experiencing issues with my service. " +
          "The OpenAI API quota has been exceeded. Please try again later or contact support to update your API key quota.";
        
        // Save the user message and error message to the conversation
        if (validatedData?.conversationId) {
          try {
            // Save the user's original message
            await storage.createMessage({
              content: validatedData.messages[validatedData.messages.length - 1].content,
              role: 'user',
              conversationId: validatedData.conversationId
            });
            
            // Save our error response
            await storage.createMessage({
              content: friendlyMessage,
              role: 'assistant',
              conversationId: validatedData.conversationId
            });
          } catch (storageError) {
            console.error("Error saving quota error message:", storageError);
          }
        }
        
        // Return the friendly error message as an assistant response
        return res.json({
          message: {
            role: 'assistant',
            content: friendlyMessage
          },
          error: "API_QUOTA_EXCEEDED",
          conversationId: validatedData?.conversationId
        });
      }
      
      // Handle other errors
      res.status(500).json({ 
        message: "Failed to generate chat completion",
        error: error?.message || "Unknown error" 
      });
    }
  });

  // Text-to-speech endpoint
  app.post("/api/text-to-speech", async (req, res) => {
    try {
      console.log("Received text-to-speech request");
      
      // Create a schema for text-to-speech request
      const textToSpeechSchema = z.object({
        text: z.string().min(1).max(4000)
      });
      
      // Log request body
      console.log("Text-to-speech request body received");
      
      // Validate the request
      const validationResult = textToSpeechSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.log("Invalid text-to-speech request:", validationResult.error.format());
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.format()
        });
      }
      
      const { text } = validationResult.data;
      console.log("Received TTS request for text:", text.substring(0, 50) + "...");
      
      // Convert text to speech
      const audioBuffer = await textToSpeech(text);
      
      // Set proper headers
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      });
      
      // Send the audio file
      res.send(audioBuffer);
      console.log("Sent audio response, size:", audioBuffer.length);
    } catch (error) {
      console.error("Error in text-to-speech endpoint:", error);
      res.status(500).json({
        message: "Failed to convert text to speech",
        error: (error as any)?.message || "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
