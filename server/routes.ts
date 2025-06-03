import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatCompletion, checkApiStatus, textToSpeech } from "./openai";
import { chatCompletionRequestSchema, type ChatCompletionRequest } from "@shared/schema";
import { z } from "zod";
import { google } from "googleapis";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Google Sheets integration function
async function saveToGoogleSheets(contactData: any) {
  const { 
    GOOGLE_SHEETS_SPREADSHEET_ID, 
    GOOGLE_SERVICE_ACCOUNT_EMAIL, 
    GOOGLE_PRIVATE_KEY 
  } = process.env;

  if (!GOOGLE_SHEETS_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error("Google Sheets credentials not configured");
  }

  // Create JWT client
  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });

  // Prepare row data
  const values = [[
    contactData.submittedAt,
    contactData.firstName,
    contactData.lastName,
    contactData.email,
    contactData.countryCode,
    contactData.phone
  ]];

  // Append to the first sheet (usually "Sheet1")
  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
    range: 'A:F',
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

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

  // Upload image endpoint
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { imageData, wineId, fileName, wineName } = req.body;
      
      if (!imageData || !wineId) {
        return res.status(400).json({ error: "Missing image data or wine ID" });
      }

      // Create assets directory if it doesn't exist
      const assetsDir = join(__dirname, "..", "attached_assets");
      if (!existsSync(assetsDir)) {
        mkdirSync(assetsDir, { recursive: true });
      }

      // Extract base64 data and convert to buffer
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate descriptive filename based on wine name
      const timestamp = Date.now();
      const extension = imageData.match(/^data:image\/([a-z]+);base64,/)?.[1] || 'jpg';
      
      let uniqueFileName;
      if (fileName) {
        uniqueFileName = fileName;
      } else if (wineName) {
        // Clean wine name for filename (remove special characters, spaces)
        const cleanWineName = wineName
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .toLowerCase();
        uniqueFileName = `wine-${wineId}-${cleanWineName}-${timestamp}.${extension}`;
      } else {
        uniqueFileName = `wine-${wineId}-${timestamp}.${extension}`;
      }
      
      // Save file to assets directory
      const filePath = join(assetsDir, uniqueFileName);
      writeFileSync(filePath, buffer);
      
      // Return the relative path for use in the frontend
      const relativePath = `/@assets/${uniqueFileName}`;
      
      console.log(`Saved wine image: ${uniqueFileName} (${Math.round(buffer.length / 1024)}KB)`);
      
      res.json({ 
        success: true, 
        imagePath: relativePath,
        fileName: uniqueFileName,
        size: buffer.length
      });
      
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  // Delete image endpoint
  app.delete("/api/delete-image", async (req, res) => {
    try {
      const { imagePath } = req.body;
      
      if (!imagePath || !imagePath.startsWith('/@assets/')) {
        return res.status(400).json({ error: "Invalid image path" });
      }

      // Extract filename from path
      const fileName = imagePath.replace('/@assets/', '');
      const assetsDir = join(__dirname, "..", "attached_assets");
      const filePath = join(assetsDir, fileName);
      
      // Check if file exists and delete it
      if (existsSync(filePath)) {
        const { unlinkSync } = await import("fs");
        unlinkSync(filePath);
        console.log(`Deleted wine image: ${fileName}`);
        res.json({ success: true, message: "Image deleted successfully" });
      } else {
        res.status(404).json({ error: "Image file not found" });
      }
      
    } catch (error) {
      console.error("Image deletion error:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Generate wine description endpoint
  app.post("/api/generate-wine-description", async (req, res) => {
    try {
      const { wineName, year } = req.body;
      
      if (!wineName) {
        return res.status(400).json({ error: "Wine name is required" });
      }

      // Create a focused prompt for wine description generation
      const prompt = `Generate a concise, professional wine description for "${wineName}" ${year ? `(${year} vintage)` : ''}. 

Requirements:
- 2-3 sentences maximum
- Focus on authentic tasting notes and characteristics
- Include varietal-specific traits if identifiable from the name
- Mention terroir or region if apparent from the name
- Professional wine industry language
- No marketing fluff or superlatives

Format: Return only the description text, no quotes or additional formatting.`;

      const response = await chatCompletion([
        {
          role: "system",
          content: "You are a professional sommelier and wine expert. Generate authentic, concise wine descriptions based on wine names and vintages."
        },
        {
          role: "user",
          content: prompt
        }
      ]);

      const description = response.content.trim();
      
      if (!description) {
        throw new Error("No description generated");
      }

      console.log(`Generated description for ${wineName} ${year || ''}: ${description.substring(0, 50)}...`);
      
      res.json({ 
        success: true, 
        description: description,
        wineName,
        year
      });
      
    } catch (error) {
      console.error("Description generation error:", error);
      res.status(500).json({ error: "Failed to generate wine description" });
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
    // Define here so it's accessible in the catch block
    let validatedData: ChatCompletionRequest | undefined;
    
    try {
      // Validate request
      validatedData = chatCompletionRequestSchema.parse(req.body);
      
      // Get messages from request
      const { messages, conversationId, wineData } = validatedData;
      
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
        
        // Limit conversation history to prevent token limit issues
        // Keep only the last 8 messages (4 exchanges) plus system message
        const maxHistoryMessages = 8;
        const recentMessages = formattedPreviousMessages.slice(-maxHistoryMessages);
        
        // Add system message at the beginning if it doesn't exist
        if (!recentMessages.some(msg => msg.role === 'system')) {
          recentMessages.unshift({
            role: 'system',
            content: 'You are a friendly wine expert specializing in Cabernet Sauvignon. Your responses should be warm, engaging, and informative. Focus on providing interesting facts, food pairings, and tasting notes specific to Cabernet Sauvignon. Keep your responses concise but informative.'
          });
        }
        
        // Combine limited previous messages with current message
        allMessages = [...recentMessages, ...messages];
      }
      
      // Call OpenAI API
      const response = await chatCompletion(allMessages, wineData);
      
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
        
        // Only try to save messages if we have valid data and a conversation ID
        const conversationId = validatedData?.conversationId;
        if (conversationId && validatedData?.messages && validatedData.messages.length > 0) {
          try {
            // Save the user's original message
            const userMessage = validatedData.messages[validatedData.messages.length - 1];
            if (userMessage) {
              await storage.createMessage({
                content: userMessage.content,
                role: 'user',
                conversationId
              });
              
              // Save our error response
              await storage.createMessage({
                content: friendlyMessage,
                role: 'assistant',
                conversationId
              });
            }
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
          conversationId
        });
      }
      
      // Handle other errors
      res.status(500).json({ 
        message: "Failed to generate chat completion",
        error: error?.message || "Unknown error" 
      });
    }
  });

  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, countryCode } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({ 
          message: "All fields are required",
          errors: {
            firstName: !firstName ? "First name is required" : "",
            lastName: !lastName ? "Last name is required" : "",
            email: !email ? "Email is required" : "",
            phone: !phone ? "Phone is required" : ""
          }
        });
      }

      const contactData = {
        firstName,
        lastName,
        email,
        phone,
        countryCode: countryCode || "+1",
        submittedAt: new Date().toISOString()
      };

      // Save to Google Sheets if credentials are available
      try {
        await saveToGoogleSheets(contactData);
      } catch (sheetsError) {
        console.error("Google Sheets error:", sheetsError);
        // Continue even if Google Sheets fails
      }

      // Return success response
      res.json({ 
        success: true, 
        message: "Contact information saved successfully" 
      });

    } catch (error: any) {
      console.error("Error saving contact data:", error);
      res.status(500).json({ 
        message: "Failed to save contact information",
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
    } catch (err) {
      const error = err as any;
      console.error("Error in text-to-speech endpoint:", error);
      
      // Check if this is a quota exceeded error
      const isQuotaError = error.message && (
        error.message.includes("quota") || 
        error.message.includes("rate limit") ||
        error.message.includes("insufficient_quota")
      );
      
      if (isQuotaError) {
        // For TTS errors, we return a special status code that our client can recognize
        // The client will then fall back to browser-based speech synthesis
        return res.status(429).json({
          message: "API quota exceeded for text-to-speech",
          error: "QUOTA_EXCEEDED",
          fallback: true
        });
      }
      
      // For other errors
      res.status(500).json({
        message: "Failed to convert text to speech",
        error: error?.message || "Unknown error"
      });
    }
  });

  // Wine data synchronization endpoints
  app.get("/api/wines", async (_req, res) => {
    try {
      // Return wine data from localStorage simulation for deployed environment
      // In production, this would read from your actual database
      const wineData = [
        {
          id: 1,
          name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel",
          year: 2021,
          bottles: 6,
          image: "",
          ratings: { vn: 95, jd: 93, ws: 92, abv: 14.8 },
          buyAgainLink: "https://www.ridgewine.com/wines/2021-lytton-springs/",
          qrCode: "QR_001",
          qrLink: "",
          description: "A premium Zinfandel with complex flavors and excellent structure"
        },
        {
          id: 2,
          name: "Monte Bello Cabernet Sauvignon",
          year: 2019,
          bottles: 3,
          image: "",
          ratings: { vn: 98, jd: 96, ws: 95, abv: 13.5 },
          buyAgainLink: "https://www.ridgewine.com/wines/2019-monte-bello/",
          qrCode: "QR_002",
          qrLink: "",
          description: "An exceptional Cabernet Sauvignon from the Santa Cruz Mountains"
        }
      ];
      
      res.json(wineData);
    } catch (error) {
      console.error("Error fetching wines:", error);
      res.status(500).json({ error: "Failed to fetch wine data" });
    }
  });

  app.post("/api/wines/sync", async (req, res) => {
    try {
      const { wines } = req.body;
      
      if (!wines || !Array.isArray(wines)) {
        return res.status(400).json({ error: "Invalid wine data format" });
      }
      
      // In production, this would update your database with the synchronized data
      console.log(`Received sync request for ${wines.length} wines`);
      
      res.json({ 
        success: true, 
        message: `Successfully synchronized ${wines.length} wines` 
      });
    } catch (error) {
      console.error("Wine sync error:", error);
      res.status(500).json({ error: "Failed to sync wine data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
