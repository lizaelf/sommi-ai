import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatCompletion, chatCompletionStream, checkApiStatus, textToSpeech, generateConversationSummary, ParallelTTSProcessor } from "./openai";
import { chatCompletionRequestSchema, type ChatCompletionRequest, insertUsedSuggestionPillSchema } from "@shared/schema";
import suggestionPillsData from "@shared/suggestionPills.json";
import { z } from "zod";
import { google } from "googleapis";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import OpenAI from "openai";
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper's max)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// Configure multer for image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Email and password are required" 
        });
      }

      const user = await storage.authenticateUser(email, password);
      
      if (user) {
        res.json({ 
          success: true, 
          user: { id: user.id, email: user.email, username: user.username }
        });
      } else {
        res.status(401).json({ 
          success: false, 
          error: "Invalid email or password" 
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Authentication failed" 
      });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Email and password are required" 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: "User with this email already exists" 
        });
      }

      const newUser = await storage.createUser({ 
        email, 
        password, 
        username: username || email.split('@')[0] 
      });
      
      res.json({ 
        success: true, 
        user: { id: newUser.id, email: newUser.email, username: newUser.username }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Registration failed" 
      });
    }
  });

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

  // Upload image to Cloudinary endpoint
  app.post("/api/upload-wine-image", imageUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { wineId, wineName } = req.body;
      
      if (!wineId) {
        return res.status(400).json({ error: "Wine ID is required" });
      }

      // Generate a unique public_id for Cloudinary
      const cleanWineName = wineName ? 
        wineName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() : 
        'wine';
      const publicId = `wines/${cleanWineName}-${wineId}-${Date.now()}`;

      // First upload the original image to Cloudinary
      const originalUploadPromise = new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            public_id: publicId,
            folder: 'wine-collection',
            transformation: [
              { width: 800, height: 800, crop: 'limit', quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(req.file!.buffer);
      });

      const originalResult = await originalUploadPromise as any;
      console.log(`Uploaded original wine image: ${originalResult.public_id}`);

      // Check if image has white background and create transparent version
      let finalImageUrl = originalResult.secure_url;
      let transparentPublicId = null;

      try {
        // Create transparent version using Cloudinary's background removal
        const transparentId = `${publicId}-transparent`;
        
        const transparentUploadPromise = new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              public_id: transparentId,
              folder: 'wine-collection',
              transformation: [
                { effect: 'background_removal' }, // Remove background
                { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                { format: 'png' } // Ensure PNG format for transparency
              ]
            },
            (error, result) => {
              if (error) {
                console.log(`Background removal failed, using original: ${error.message}`);
                resolve(null); // Don't reject, just use original
              } else {
                resolve(result);
              }
            }
          ).end(req.file!.buffer);
        });

        const transparentResult = await transparentUploadPromise as any;
        
        if (transparentResult) {
          console.log(`Created transparent version: ${transparentResult.public_id}`);
          finalImageUrl = transparentResult.secure_url;
          transparentPublicId = transparentResult.public_id;
          
          // Delete the original since we have the transparent version
          try {
            await cloudinary.uploader.destroy(originalResult.public_id);
            console.log(`Deleted original image, using transparent version`);
          } catch (deleteError) {
            console.log(`Warning: Could not delete original image: ${deleteError}`);
          }
        }
      } catch (backgroundRemovalError) {
        console.log(`Background removal process failed, using original: ${backgroundRemovalError}`);
      }
      
      console.log(`Final wine image URL: ${finalImageUrl}`);
      
      res.json({ 
        success: true, 
        imageUrl: finalImageUrl,
        publicId: transparentPublicId || originalResult.public_id,
        size: originalResult.bytes,
        hasTransparentBackground: !!transparentPublicId
      });
      
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ error: "Failed to upload image to Cloudinary" });
    }
  });

  // Delete image from Cloudinary endpoint
  app.delete("/api/delete-wine-image", async (req, res) => {
    try {
      const { publicId } = req.body;
      
      if (!publicId) {
        return res.status(400).json({ error: "Public ID is required" });
      }

      // Delete from Cloudinary
      const deleteResult = await cloudinary.uploader.destroy(publicId);
      
      if (deleteResult.result === 'ok') {
        console.log(`Deleted wine image from Cloudinary: ${publicId}`);
        res.json({ success: true, message: "Image deleted successfully" });
      } else {
        res.status(404).json({ error: "Image not found in Cloudinary" });
      }
      
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
      res.status(500).json({ error: "Failed to delete image from Cloudinary" });
    }
  });

  // Firecrawl winery parsing endpoints
  app.post("/api/parse-winery", async (req, res) => {
    try {
      const { url, additionalPaths, tenantSlug } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "Winery URL is required" });
      }

      const { autoPopulateWinery } = await import('./firecrawl.js');
      
      console.log(`Starting winery parsing for: ${url}`);
      
      const result = await autoPopulateWinery(url, tenantSlug, additionalPaths);
      
      res.json({
        success: true,
        message: `Successfully created winery with ${result.winesCreated} wines`,
        tenantId: result.tenantId,
        winesCreated: result.winesCreated
      });
      
    } catch (error) {
      console.error("Winery parsing error:", error);
      res.status(500).json({ 
        error: "Failed to parse winery data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Preview winery data without creating tenant
  app.post("/api/preview-winery", async (req, res) => {
    try {
      const { url, additionalPaths } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "Winery URL is required" });
      }

      const { parseWineryWebsite, crawlComprehensiveWineryData } = await import('./firecrawl.js');
      
      console.log(`Previewing winery data for: ${url}`);
      
      const wineryData = additionalPaths && additionalPaths.length > 0
        ? await crawlComprehensiveWineryData(url, additionalPaths)
        : await parseWineryWebsite(url);
      
      res.json({
        success: true,
        winery: {
          name: wineryData.name,
          description: wineryData.description,
          location: wineryData.location,
          established: wineryData.established,
          website: wineryData.website,
          wineCount: wineryData.wines.length,
          wines: wineryData.wines.slice(0, 10) // Show first 10 wines in preview
        }
      });
      
    } catch (error) {
      console.error("Winery preview error:", error);
      res.status(500).json({ 
        error: "Failed to preview winery data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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

      // Create wine data object for dynamic system prompt
      const wineData = {
        id: 0, // Temporary ID for description generation
        name: wineName,
        year: year || new Date().getFullYear(),
        bottles: 0,
        ratings: { vn: 0, jd: 0, ws: 0, abv: 0 }
      };

      const response = await chatCompletion([
        {
          role: "user",
          content: prompt
        }
      ], wineData);

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

  // Whisper transcription endpoint
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      // Validate audio file size and format
      const maxSize = 25 * 1024 * 1024; // 25MB limit for Whisper
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "Audio file too large. Maximum size is 25MB." });
      }

      // More aggressive size validation
      if (req.file.size < 5000) { // Less than 5KB indicates insufficient audio
        console.log('Audio file too small - using fallback');
        return res.json({ 
          text: "Tell me about this wine",
          success: true,
          fallback: true
        });
      }

      // Basic audio header validation for WebM
      const buffer = req.file.buffer;
      const isWebM = buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
      
      if (!isWebM && !req.file.mimetype?.includes('audio')) {
        console.log('Invalid audio format - using fallback');
        return res.json({ 
          text: "What can you tell me about this wine?",
          success: true,
          fallback: true
        });
      }

      // Create a File object with proper format detection
      let filename = req.file.originalname || 'audio.webm';
      let mimetype = req.file.mimetype;
      
      // Ensure proper audio format for Whisper
      if (!mimetype || !mimetype.includes('audio')) {
        mimetype = 'audio/webm';
        filename = 'audio.webm';
      }

      const audioFile = new File([req.file.buffer], filename, {
        type: mimetype,
      });

      console.log(`Transcribing audio file: ${audioFile.name} (${Math.round(audioFile.size / 1024)}KB)`);

      // Reduced timeout for faster response
      const transcriptionPromise = openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
        response_format: "text",
        temperature: 0, // More deterministic for speed
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transcription timeout after 10 seconds')), 10000);
      });

      const transcription = await Promise.race([transcriptionPromise, timeoutPromise]) as string;

      console.log(`Transcription result: ${transcription.substring(0, 100)}...`);

      res.json({ 
        text: transcription,
        success: true 
      });

    } catch (error) {
      console.error("Transcription error:", error);
      
      // If transcription fails, provide fallback response to prevent UI hanging
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('Transcription timeout - using fallback text');
        res.json({ 
          text: "Tell me about this wine",
          success: true,
          fallback: true
        });
      } else {
        res.status(500).json({ 
          error: "Failed to transcribe audio",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
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

  // Delete a conversation or clear all conversations
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const idParam = req.params.id;
      
      if (idParam === "clear-all") {
        // Delete all conversations
        const conversations = await storage.getAllConversations();
        for (const conversation of conversations) {
          await storage.deleteConversation(conversation.id);
        }
        res.json({ message: "All conversations cleared successfully" });
      } else {
        // Delete specific conversation
        const id = parseInt(idParam);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid conversation ID" });
        }
        await storage.deleteConversation(id);
        res.status(204).send();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Clear all conversations (chat history)
  app.delete("/api/conversations", async (_req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      for (const conversation of conversations) {
        await storage.deleteConversation(conversation.id);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing all conversations:", error);
      res.status(500).json({ message: "Failed to clear chat history" });
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

  // Add a message to a conversation
  app.post("/api/messages", async (req, res) => {
    try {
      const { content, role, conversationId } = req.body;
      
      // Validate required fields
      if (!content || !role || !conversationId) {
        return res.status(400).json({ 
          message: "Missing required fields",
          required: ["content", "role", "conversationId"]
        });
      }
      
      // Validate role
      if (!["user", "assistant", "system"].includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role. Must be user, assistant, or system"
        });
      }
      
      // Check if conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ 
          message: "Conversation not found"
        });
      }
      
      // Create the message
      const message = await storage.createMessage({
        content,
        role,
        conversationId
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error adding message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Chat completion endpoint
  app.post("/api/chat", async (req, res) => {
    // Define here so it's accessible in the catch block
    let validatedData: ChatCompletionRequest | undefined;
    
    try {
      // Safari debugging: log the incoming request
      console.log("=== Chat API Request Debug ===");
      console.log("Headers:", req.headers);
      console.log("Body type:", typeof req.body);
      console.log("Body content:", JSON.stringify(req.body, null, 2));
      console.log("User-Agent:", req.headers['user-agent']);
      
      // Safari compatibility: detect Safari and use relaxed validation
      const userAgent = req.headers['user-agent'] || '';
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      
      if (isSafari) {
        console.log("Safari detected - using relaxed validation");
        
        // Safari compatibility: handle malformed or different request structure
        let requestBody = req.body;
        
        // Handle potential Safari request body issues
        if (typeof requestBody === 'string') {
          try {
            requestBody = JSON.parse(requestBody);
          } catch (parseError) {
            console.log("Safari JSON parse error:", parseError);
            throw new Error("Invalid JSON format");
          }
        }
        
        // Manual validation for Safari with flexible field handling
        if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
          console.log("Safari: Missing or invalid messages array");
          throw new Error("Messages array is required");
        }
        
        // Validate message structure for Safari
        for (const msg of requestBody.messages) {
          if (!msg.role || !msg.content) {
            console.log("Safari: Invalid message structure:", msg);
            throw new Error("Each message must have role and content");
          }
        }
        
        // Create Safari-compatible validated data with type coercion
        validatedData = {
          messages: requestBody.messages,
          conversationId: requestBody.conversationId ? Number(requestBody.conversationId) : undefined,
          wineData: requestBody.wineData || undefined,
          optimize_for_speed: Boolean(requestBody.optimize_for_speed)
        };
        
        console.log("Safari validation successful:", {
          messageCount: validatedData.messages.length,
          hasConversationId: !!validatedData.conversationId,
          hasWineData: !!validatedData.wineData
        });
      } else {
        // Validate request normally for other browsers
        validatedData = chatCompletionRequestSchema.parse(req.body);
      }
      
      // Get messages from request
      const { messages, conversationId, wineData } = validatedData;
      
      // Check for text-only request flags
      const isTextOnly = req.body.text_only === true || req.body.disable_audio === true;
      console.log("Chat request flags:", { text_only: req.body.text_only, disable_audio: req.body.disable_audio, isTextOnly });
      
      // Handle conversation existence - create if needed
      let actualConversationId = conversationId;
      if (conversationId) {
        const conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          // Create new conversation in database
          try {
            const newConversation = await storage.createConversation({
              title: `Wine Conversation ${new Date().toLocaleString()}`,
            });
            actualConversationId = newConversation.id;
            console.log(`Created new conversation ${actualConversationId} in database`);
          } catch (createError) {
            console.error(`Failed to create conversation:`, createError);
            // Continue without conversation ID - messages won't be saved but chat will work
            actualConversationId = undefined;
          }
        }
      }
      
      // Fetch previous messages for context if conversationId is provided
      let allMessages = messages;
      if (actualConversationId) {
        const previousMessages = await storage.getMessagesByConversation(actualConversationId);
        // Format previous messages for OpenAI API format
        const formattedPreviousMessages = previousMessages.map(msg => ({
          role: msg.role as any,
          content: msg.content
        }));
        
        // Use conversation summarization instead of message cropping
        const messagesWithoutSystem = formattedPreviousMessages.filter(msg => msg.role !== 'system');
        
        if (messagesWithoutSystem.length > 10) {
          // Generate summary of older messages to preserve context
          const olderMessages = messagesWithoutSystem.slice(0, -6); // Keep last 6 messages
          const recentMessages = messagesWithoutSystem.slice(-6);
          
          if (olderMessages.length > 0) {
            console.log(`Summarizing ${olderMessages.length} older messages for context preservation`);
            
            // Create conversation summary
            const conversationSummary = await generateConversationSummary(olderMessages, wineData);
            
            // Create summary message
            const summaryMessage = {
              role: 'assistant' as const,
              content: `[Previous conversation summary: ${conversationSummary}]`
            };
            
            // Combine summary with recent messages and current message
            allMessages = [summaryMessage, ...recentMessages, ...messages];
          } else {
            allMessages = [...recentMessages, ...messages];
          }
        } else {
          // If conversation is short enough, use all messages
          allMessages = [...messagesWithoutSystem, ...messages];
        }
      }
      
      // Check if streaming is requested
      const enableStreaming = process.env.ENABLE_STREAMING === 'true';
      const requestStreaming = req.headers['accept'] === 'text/event-stream';
      
      if (enableStreaming && requestStreaming) {
        // LATENCY MEASUREMENT: Start timing the entire response pipeline
        const pipelineStartTime = performance.now();
        console.log("🚀 Starting streaming response pipeline with latency measurement");
        
        // Set up Server-Sent Events for real-time streaming
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        });
        
        try {
          // LATENCY MEASUREMENT: OpenAI API call start
          const apiCallStart = performance.now();
          console.log("📡 Starting OpenAI API call");
          
          // Start streaming response from OpenAI
          const stream = await chatCompletionStream(allMessages, wineData);
          let fullContent = '';
          let firstTokenReceived = false;
          let ttsProcessor = new ParallelTTSProcessor();
          let tokenCount = 0;
          
          const apiCallEnd = performance.now();
          const apiLatency = apiCallEnd - apiCallStart;
          console.log(`⚡ OpenAI API responded in: ${apiLatency.toFixed(2)}ms`);
          
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              tokenCount++;
              fullContent += delta;
              
              // LATENCY MEASUREMENT: First token received
              if (!firstTokenReceived) {
                firstTokenReceived = true;
                const firstTokenLatency = performance.now() - pipelineStartTime;
                console.log(`🎯 FIRST TOKEN RECEIVED: ${firstTokenLatency.toFixed(2)}ms total latency`);
                
                // Only start TTS for non-text-only requests
                if (!isTextOnly) {
                  console.log("🔊 Starting progressive TTS with first token");
                  await ttsProcessor.processTokens(delta);
                } else {
                  console.log("📝 Text-only request - skipping TTS processing");
                }
                
                res.write(`data: ${JSON.stringify({ 
                  type: 'first_token', 
                  content: delta,
                  start_tts: !isTextOnly,
                  latency: firstTokenLatency
                })}\n\n`);
              } else {
                // Continue progressive TTS processing only for non-text-only requests
                if (!isTextOnly) {
                  await ttsProcessor.processTokens(delta);
                }
              }
              
              // Stream each token for real-time display
              res.write(`data: ${JSON.stringify({ 
                type: 'token', 
                content: delta,
                token_number: tokenCount
              })}\n\n`);
            }
          }
          
          // LATENCY MEASUREMENT: Complete response received
          const completeResponseLatency = performance.now() - pipelineStartTime;
          console.log(`✅ Complete response received: ${completeResponseLatency.toFixed(2)}ms, ${tokenCount} tokens`);
          
          // Get all processed TTS audio buffers (only for non-text-only requests)
          let audioBuffers: Buffer[] = [];
          if (!isTextOnly) {
            audioBuffers = await ttsProcessor.getAllProcessedAudio();
            console.log(`🎵 TTS processing complete: ${audioBuffers.length} audio chunks,`, {
              total_size: audioBuffers.reduce((sum: number, buf: Buffer) => sum + buf.length, 0)
            });
          } else {
            console.log(`📝 Text-only request - no audio buffers generated`);
          }
          
          // Save messages to storage
          if (actualConversationId) {
            await storage.createMessage({
              content: messages[messages.length - 1].content,
              role: 'user',
              conversationId: actualConversationId
            });
            
            await storage.createMessage({
              content: fullContent,
              role: 'assistant',
              conversationId: actualConversationId
            });
          }
          
          // Send completion signal
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            conversationId: actualConversationId 
          })}\n\n`);
          
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Streaming failed, falling back to regular response' 
          })}\n\n`);
        }
        
        res.end();
        return;
      }
      
      // Fallback to regular response with timeout protection
      const chatPromise = chatCompletion(allMessages, wineData);
      const chatTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Chat completion timeout after 20 seconds')), 20000);
      });
      
      const response = await Promise.race([chatPromise, chatTimeoutPromise]) as any;
      
      // Generate audio only if not text-only request
      let audioBuffers: Buffer[] = [];
      if (!isTextOnly && response.content) {
        try {
          console.log("🎵 Generating TTS for non-streaming response");
          const audioBuffer = await textToSpeech(response.content);
          audioBuffers = [audioBuffer];
          console.log(`🎵 TTS generated: ${audioBuffer.length} bytes`);
        } catch (ttsError) {
          console.error("TTS generation failed for regular response:", ttsError);
          // Continue without audio
        }
      } else {
        console.log("📝 Text-only request - no audio generation for regular response");
      }
      
      // Save message to storage if conversation exists
      if (actualConversationId) {
        // Save user message
        await storage.createMessage({
          content: messages[messages.length - 1].content,
          role: 'user',
          conversationId: actualConversationId
        });
        
        // Save assistant response
        await storage.createMessage({
          content: response.content,
          role: 'assistant',
          conversationId: actualConversationId
        });
      }
      
      // Return response with audio buffers (empty for text-only)
      res.json({
        message: {
          role: 'assistant',
          content: response.content
        },
        conversationId: actualConversationId,
        audioBuffers: audioBuffers
      });
    } catch (err) {
      const error = err as any;
      console.error("Error in chat completion:", error);
      console.error("Error stack:", error?.stack);
      console.error("Error type:", typeof error);
      console.error("Error properties:", Object.keys(error || {}));
      
      // Handle validation errors with detailed Safari debugging
      if (error instanceof z.ZodError) {
        console.log("=== Validation Error Details ===");
        console.log("Zod errors:", JSON.stringify(error.errors, null, 2));
        console.log("Failed validation for request body:", JSON.stringify(req.body, null, 2));
        
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors,
          receivedData: req.body // Safari debugging
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
      
      // Handle timeout errors
      if (error?.message?.includes('timeout')) {
        const timeoutMessage = "I'm taking a moment to think about your question. Please try asking again.";
        
        // Save timeout message if we have conversation context
        const conversationId = validatedData?.conversationId;
        if (conversationId && validatedData?.messages && validatedData.messages.length > 0) {
          try {
            const userMessage = validatedData.messages[validatedData.messages.length - 1];
            if (userMessage) {
              await storage.createMessage({
                content: userMessage.content,
                role: 'user',
                conversationId
              });
              
              await storage.createMessage({
                content: timeoutMessage,
                role: 'assistant',
                conversationId
              });
            }
          } catch (storageError) {
            console.error("Error saving timeout message:", storageError);
          }
        }
        
        return res.json({
          message: {
            role: 'assistant',
            content: timeoutMessage
          },
          error: "API_TIMEOUT",
          conversationId
        });
      }
      
      // Handle network errors
      if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
        const networkMessage = "I'm having trouble connecting right now. Please check your internet connection and try again.";
        
        return res.json({
          message: {
            role: 'assistant',
            content: networkMessage
          },
          error: "NETWORK_ERROR"
        });
      }
      
      // Handle OpenAI API errors
      if (error?.status) {
        let apiErrorMessage = "I'm experiencing technical difficulties. Please try again in a moment.";
        
        if (error.status === 429) {
          apiErrorMessage = "I'm currently busy with other requests. Please wait a moment and try again.";
        } else if (error.status === 503) {
          apiErrorMessage = "The AI service is temporarily unavailable. Please try again in a few minutes.";
        } else if (error.status >= 400 && error.status < 500) {
          apiErrorMessage = "There was an issue with your request. Please try rephrasing your question.";
        }
        
        return res.json({
          message: {
            role: 'assistant',
            content: apiErrorMessage
          },
          error: `API_ERROR_${error.status}`
        });
      }
      
      // Generic fallback error with user-friendly message
      const fallbackMessage = "I encountered an unexpected issue. Please try asking your question again.";
      
      res.status(500).json({
        message: {
          role: 'assistant',
          content: fallbackMessage
        },
        error: error?.message || "Unknown error"
      });
    }
  });

  // Get available suggestion pills for a wine (cycling when all used)
  app.get("/api/suggestion-pills/:wineKey", async (req, res) => {
    try {
      const { wineKey } = req.params;
      
      // Get used pills for this wine
      const usedPills = await storage.getUsedSuggestionPills(wineKey);
      const usedPillIds = usedPills.map(pill => pill.suggestionId);
      
      // Filter out used pills from available suggestions
      let availablePills = suggestionPillsData.suggestions.filter(
        suggestion => !usedPillIds.includes(suggestion.id)
      );
      
      // Keep suggestions stable - don't auto-cycle when all are used
      // Users can manually reset if they want to see suggestions again
      if (availablePills.length === 0) {
        console.log(`All suggestions used for wine ${wineKey} - returning empty set (no auto-cycle)`);
        availablePills = []; // Return empty array instead of cycling
      }
      
      res.json({ suggestions: availablePills });
    } catch (error) {
      console.error("Error fetching suggestion pills:", error);
      res.status(500).json({ error: "Failed to fetch suggestion pills" });
    }
  });

  // Mark a suggestion pill as used
  app.post("/api/suggestion-pills/used", async (req, res) => {
    try {
      const validatedData = insertUsedSuggestionPillSchema.parse(req.body);
      const usedPill = await storage.markSuggestionPillUsed(validatedData);
      res.json(usedPill);
    } catch (error) {
      console.error("Error marking suggestion pill as used:", error);
      res.status(500).json({ error: "Failed to mark suggestion pill as used" });
    }
  });

  // Reset used suggestion pills for a wine (when cycling)
  app.delete("/api/suggestion-pills/:wineKey/reset", async (req, res) => {
    try {
      const { wineKey } = req.params;
      await storage.resetUsedSuggestionPills(wineKey);
      res.json({ message: "Used suggestion pills reset successfully" });
    } catch (error) {
      console.error("Error resetting suggestion pills:", error);
      res.status(500).json({ error: "Failed to reset suggestion pills" });
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

  // Real-time streaming chat endpoint for first-token TTS
  app.get("/api/chat-stream", async (req, res) => {
    try {
      const { messages, conversationId, wineData, optimize_for_speed } = req.query;
      
      // Parse query parameters
      const parsedMessages = messages ? JSON.parse(messages as string) : [];
      const parsedWineData = wineData ? JSON.parse(wineData as string) : null;
      const actualConversationId = conversationId ? parseInt(conversationId as string) : null;
      
      console.log("Starting streaming response for first-token TTS");
      
      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      // Start streaming response with parallel TTS processing
      const streamStartTime = performance.now();
      const stream = await chatCompletionStream(parsedMessages, parsedWineData);
      let fullContent = '';
      let firstTokenReceived = false;
      let tokenCount = 0;
      
      // Initialize parallel TTS processor for background audio generation
      const openaiModule = await import('./openai.js');
      const ttsProcessor = new openaiModule.ParallelTTSProcessor();
      
      console.log("Server-Sent Events streaming with parallel TTS initiated");
      
      for await (const chunk of stream) {
        const chunkReceiveTime = performance.now();
        const delta = chunk.choices?.[0]?.delta?.content;
        
        if (delta) {
          fullContent += delta;
          tokenCount++;
          
          // Process tokens in parallel for TTS without blocking stream
          ttsProcessor.processTokens(delta);
          
          // Send first token immediately for instant TTS trigger
          if (!firstTokenReceived) {
            firstTokenReceived = true;
            const firstTokenLatency = chunkReceiveTime - streamStartTime;
            console.log(`First token latency: ${firstTokenLatency.toFixed(2)}ms`);
            
            res.write(`data: ${JSON.stringify({ 
              type: 'first_token', 
              content: delta,
              start_tts: true,
              latency: firstTokenLatency
            })}\n\n`);
            
            // Start immediate TTS with first token
            try {
              const { textToSpeech } = await import('./openai.js');
              const firstAudio = await textToSpeech(delta);
              res.write(`data: ${JSON.stringify({ 
                type: 'audio_ready', 
                audio_size: firstAudio.length,
                is_first: true
              })}\n\n`);
            } catch (audioError) {
              console.error('First token TTS error:', audioError);
            }
          } else {
            // Stream subsequent tokens
            res.write(`data: ${JSON.stringify({ 
              type: 'token', 
              content: delta,
              token_count: tokenCount
            })}\n\n`);
          }
        }
      }
      
      // Get all processed audio from parallel TTS
      try {
        const audioBuffers = await ttsProcessor.getAllProcessedAudio();
        if (audioBuffers.length > 0) {
          res.write(`data: ${JSON.stringify({ 
            type: 'parallel_audio_ready', 
            audio_chunks: audioBuffers.length,
            total_size: audioBuffers.reduce((sum: number, buf: Buffer) => sum + buf.length, 0)
          })}\n\n`);
        }
      } catch (parallelAudioError) {
        console.error('Parallel TTS processing error:', parallelAudioError);
      }
      
      // Save messages to storage
      if (actualConversationId) {
        await storage.createMessage({
          content: parsedMessages[parsedMessages.length - 1].content,
          role: 'user',
          conversationId: actualConversationId
        });
        
        await storage.createMessage({
          content: fullContent,
          role: 'assistant',
          conversationId: actualConversationId
        });
      }
      
      // Send completion signal
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        conversationId: actualConversationId 
      })}\n\n`);
      
      console.log("Streaming completed successfully");
      res.end();
      
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Streaming failed' 
      })}\n\n`);
      res.end();
    }
  });

  // TTS request deduplication map
  const activeRequests = new Map<string, Promise<Buffer>>();

  // Text-to-speech endpoint with deduplication
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
      
      // Create a unique request key for deduplication
      const requestKey = `${text.trim()}`;
      
      // Check if there's already an active request for this text
      if (activeRequests.has(requestKey)) {
        console.log("Deduplicating TTS request - using existing request");
        const audioBuffer = await activeRequests.get(requestKey)!;
        
        // Set proper headers
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'no-cache'
        });
        
        // Send the audio file
        res.send(audioBuffer);
        console.log("Sent deduplicated audio response, size:", audioBuffer.length);
        return;
      }
      
      // Create new TTS request
      const requestPromise = textToSpeech(text);
      activeRequests.set(requestKey, requestPromise);
      
      try {
        // Convert text to speech
        const audioBuffer = await requestPromise;
        
        // Set proper headers
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'no-cache'
        });
        
        // Send the audio file
        res.send(audioBuffer);
        console.log("Sent audio response, size:", audioBuffer.length);
      } finally {
        // Clean up the active request
        activeRequests.delete(requestKey);
      }
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
  // app.get("/api/wines", async (_req, res) => {
  //   try {
  //     const { getDevelopmentWineData } = await import('./wineDataSync.js');
  //     const wineData = getDevelopmentWineData();
  //     res.json(wineData);
  //   } catch (error) {
  //     console.error("Error fetching deployed wines:", error);
  //     res.status(500).json({ error: "Failed to fetch deployed wine data" });
  //   }
  // });

  // Additional sync endpoints

  // app.get("/api/wines/sync-status", async (_req, res) => {
  //   try {
  //     const { compareWineData } = await import('./wineDataSync.js');
  //     const syncStatus = compareWineData();
  //     res.json(syncStatus);
  //   } catch (error) {
  //     console.error("Error checking sync status:", error);
  //     res.status(500).json({ error: "Failed to check sync status" });
  //   }
  // });

  // app.post("/api/wines/sync", async (req, res) => {
  //   try {
  //     const { wines } = req.body;
      
  //     if (!wines || !Array.isArray(wines)) {
  //       return res.status(400).json({ error: "Invalid wine data format" });
  //     }
      
  //     const { syncToDeployed } = await import('./wineDataSync.js');
  //     const result = syncToDeployed(wines);
      
  //     if (result.success) {
  //       res.json(result);
  //     } else {
  //       res.status(500).json(result);
  //     }
  //   } catch (error) {
  //     console.error("Wine sync error:", error);
  //     res.status(500).json({ error: "Failed to sync wine data" });
  //   }
  // });

  // Wine data migration endpoint
  app.post("/api/migrate-wines", async (req, res) => {
    try {
      const wineData = req.body.wines || [];
      console.log(`Migrating ${wineData.length} wines from localStorage to database`);
      
      const migratedWines = [];
      for (const wine of wineData) {
        try {
          // Check if wine already exists
          const existing = await storage.getWine(wine.id);
          if (!existing) {
            const migratedWine = await storage.createWine(wine);
            migratedWines.push(migratedWine);
            console.log(`Migrated wine: ${wine.name}`);
          } else {
            console.log(`Wine ${wine.id} already exists in database`);
          }
        } catch (wineError) {
          console.error(`Error migrating wine ${wine.id}:`, wineError);
        }
      }
      
      res.json({ 
        success: true, 
        migrated: migratedWines.length,
        message: `Successfully migrated ${migratedWines.length} wines to database`
      });
    } catch (error) {
      console.error("Wine migration error:", error);
      res.status(500).json({ success: false, message: "Failed to migrate wine data" });
    }
  });

  // Wine management endpoints
  app.get("/api/wines", async (_req, res) => {
    try {
      const wines = await storage.getAllWines();
      res.json(wines);
    } catch (error) {
      console.error("Error fetching wines:", error);
      res.status(500).json({ message: "Failed to fetch wines" });
    }
  });

  app.get("/api/wines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wine ID" });
      }
      
      const wine = await storage.getWine(id);
      if (!wine) {
        return res.status(404).json({ message: "Wine not found" });
      }
      
      res.json(wine);
    } catch (error) {
      console.error("Error fetching wine:", error);
      res.status(500).json({ message: "Failed to fetch wine" });
    }
  });

  app.post("/api/wines", async (req, res) => {
    try {
      const wine = await storage.createWine(req.body);
      console.log('Created wine:', wine);
      res.status(201).json(wine);
    } catch (error) {
      console.error("Error creating wine:", error);
      res.status(500).json({ message: "Failed to create wine" });
    }
  });

  app.patch("/api/wines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wine ID" });
      }
      
      const wine = await storage.updateWine(id, req.body);
      console.log('Updated wine:', wine);
      if (!wine) {
        return res.status(404).json({ message: "Wine not found" });
      }
      
      res.json(wine);
    } catch (error) {
      console.error("Error updating wine:", error);
      res.status(500).json({ message: "Failed to update wine" });
    }
  });

  app.delete("/api/wines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid wine ID" });
      }
      
      await storage.deleteWine(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting wine:", error);
      res.status(500).json({ message: "Failed to delete wine" });
    }
  });

  // Tenant management endpoints
  app.get("/api/tenants", async (_req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.get("/api/tenants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tenant ID" });
      }
      
      const tenant = await storage.getTenant(id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  app.get("/api/tenants/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const tenant = await storage.getTenantBySlug(slug);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant by slug:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  app.post("/api/tenants", async (req, res) => {
    try {
      const tenant = await storage.createTenant(req.body);
      res.status(201).json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });

  app.put("/api/tenants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tenant ID" });
      }
      
      const tenant = await storage.updateTenant(id, req.body);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  app.delete("/api/tenants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tenant ID" });
      }
      
      await storage.deleteTenant(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Food pairing categories endpoints
  app.get("/api/food-pairing-categories", async (req, res) => {
    try {
      const categories = await storage.getAllFoodPairingCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching food pairing categories:", error);
      res.status(500).json({ error: "Failed to fetch food pairing categories" });
    }
  });

  app.get("/api/food-pairing-categories/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const category = await storage.getFoodPairingCategoryByType(type);
      if (!category) {
        return res.status(404).json({ error: "Food pairing category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching food pairing category:", error);
      res.status(500).json({ error: "Failed to fetch food pairing category" });
    }
  });

  app.post("/api/food-pairing-categories", async (req, res) => {
    try {
      const category = await storage.createFoodPairingCategory(req.body);
      res.json(category);
    } catch (error) {
      console.error("Error creating food pairing category:", error);
      res.status(500).json({ error: "Failed to create food pairing category" });
    }
  });

  app.put("/api/food-pairing-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateFoodPairingCategory(parseInt(id), req.body);
      if (!category) {
        return res.status(404).json({ error: "Food pairing category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating food pairing category:", error);
      res.status(500).json({ error: "Failed to update food pairing category" });
    }
  });

  app.delete("/api/food-pairing-categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFoodPairingCategory(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting food pairing category:", error);
      res.status(500).json({ error: "Failed to delete food pairing category" });
    }
  });

  // Wine types endpoints
  app.get("/api/wine-types", async (req, res) => {
    try {
      const wineTypes = await storage.getAllWineTypes();
      res.json(wineTypes);
    } catch (error) {
      console.error("Error fetching wine types:", error);
      res.status(500).json({ error: "Failed to fetch wine types" });
    }
  });

  app.get("/api/wine-types/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const wineType = await storage.getWineTypeByType(type);
      if (!wineType) {
        return res.status(404).json({ error: "Wine type not found" });
      }
      res.json(wineType);
    } catch (error) {
      console.error("Error fetching wine type:", error);
      res.status(500).json({ error: "Failed to fetch wine type" });
    }
  });

  app.post("/api/wine-types", async (req, res) => {
    try {
      const wineType = await storage.createWineType(req.body);
      res.json(wineType);
    } catch (error) {
      console.error("Error creating wine type:", error);
      res.status(500).json({ error: "Failed to create wine type" });
    }
  });

  app.put("/api/wine-types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const wineType = await storage.updateWineType(parseInt(id), req.body);
      if (!wineType) {
        return res.status(404).json({ error: "Wine type not found" });
      }
      res.json(wineType);
    } catch (error) {
      console.error("Error updating wine type:", error);
      res.status(500).json({ error: "Failed to update wine type" });
    }
  });

  app.delete("/api/wine-types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWineType(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wine type:", error);
      res.status(500).json({ error: "Failed to delete wine type" });
    }
  });

  // Wine type detection endpoint
  app.post("/api/detect-wine-type", async (req, res) => {
    try {
      const { wineName } = req.body;
      if (!wineName) {
        return res.status(400).json({ error: "Wine name is required" });
      }
      
      const { detectWineType, getWineTypeImagePath } = await import('../shared/wineTypeDetection.js');
      const detectedType = detectWineType(wineName);
      const imagePath = getWineTypeImagePath(detectedType);
      
      res.json({
        wineName,
        detectedType,
        imagePath
      });
    } catch (error) {
      console.error("Error detecting wine type:", error);
      res.status(500).json({ error: "Failed to detect wine type" });
    }
  });

  // AI Tasting Notes Generation Endpoint
  app.post("/api/generate-tasting-notes", async (req, res) => {
    try {
      console.log("Received AI tasting notes generation request");
      
      const { wineName, wineYear, wineLocation, wineDescription, abv } = req.body;
      
      if (!wineName) {
        return res.status(400).json({ error: "Wine name is required" });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional sommelier and wine expert. Generate detailed, authentic tasting notes for wines based on their characteristics. Return your response as a JSON object with a "tastingNotes" array containing objects with: id (unique string), category (flavor/aroma category), note (descriptive text), and intensity (number 1-10).

Focus on these categories: Aroma, Primary Flavors, Secondary Flavors, Finish, Structure, and Overall Character. Provide professional, detailed descriptions that a sommelier would use.`
          },
          {
            role: "user",
            content: `Generate professional tasting notes for: ${wineYear ? wineYear + ' ' : ''}${wineName}${wineLocation ? ' from ' + wineLocation : ''}${abv ? ' (ABV: ' + abv + '%)' : ''}${wineDescription ? '. Wine description: ' + wineDescription : ''}. 

Provide 6 detailed tasting note categories with professional sommelier-level descriptions and appropriate intensity ratings.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      let tastingNotesData;
      try {
        tastingNotesData = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", content);
        throw new Error("Invalid JSON response from AI");
      }

      // Validate and format the response
      if (!tastingNotesData.tastingNotes || !Array.isArray(tastingNotesData.tastingNotes)) {
        throw new Error("Invalid tasting notes format from AI");
      }

      // Ensure each note has proper structure
      const formattedNotes = tastingNotesData.tastingNotes.map((note: any, index: number) => ({
        id: note.id || `note-${index + 1}`,
        category: note.category || "Tasting Note",
        note: note.note || note.description || "No description available",
        intensity: Math.min(10, Math.max(1, note.intensity || 5))
      }));

      console.log(`Generated ${formattedNotes.length} tasting notes for ${wineName}`);
      
      res.json({
        tastingNotes: formattedNotes,
        wine: {
          name: wineName,
          year: wineYear,
          location: wineLocation
        }
      });

    } catch (error) {
      console.error("Error generating tasting notes:", error);
      
      // Check for quota errors
      if (error instanceof Error && error.message.includes("quota")) {
        return res.status(429).json({ 
          error: "API quota exceeded. Please try again later." 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to generate tasting notes. Please try again." 
      });
    }
  });

  // AI Food Pairing Generation Endpoint
  app.post("/api/generate-food-pairings", async (req, res) => {
    try {
      console.log("Received AI food pairing generation request");
      
      const { wineName, wineYear, wineLocation, wineDescription, abv } = req.body;
      
      if (!wineName) {
        return res.status(400).json({ error: "Wine name is required" });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional sommelier and culinary expert. Generate detailed, authentic food pairing recommendations for wines. Return your response as a JSON object with a "foodPairings" array containing objects with: id (unique string), category (food category like "Appetizers", "Main Course", etc.), dish (specific dish name), description (detailed description of the dish), pairing_reason (why this pairs well with the wine), and intensity (number 1-10 indicating pairing strength).

Focus on creating diverse, sophisticated pairings across different categories. Provide professional explanations that a sommelier would use.`
          },
          {
            role: "user",
            content: `Generate professional food pairing recommendations for: ${wineYear ? wineYear + ' ' : ''}${wineName}${wineLocation ? ' from ' + wineLocation : ''}${abv ? ' (ABV: ' + abv + '%)' : ''}${wineDescription ? '. Wine description: ' + wineDescription : ''}. 

Provide 8-10 detailed food pairings across different categories (appetizers, main courses, desserts, etc.) with professional sommelier-level explanations and appropriate intensity ratings.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      let foodPairingData;
      try {
        foodPairingData = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", content);
        throw new Error("Invalid JSON response from AI");
      }

      // Validate and format the response
      if (!foodPairingData.foodPairings || !Array.isArray(foodPairingData.foodPairings)) {
        throw new Error("Invalid food pairings format from AI");
      }

      // Ensure each pairing has proper structure
      const formattedPairings = foodPairingData.foodPairings.map((pairing: any, index: number) => ({
        id: pairing.id || `pairing-${index + 1}`,
        category: pairing.category || "Main Course",
        dish: pairing.dish || pairing.name || "Specialty Dish",
        description: pairing.description || "A carefully crafted dish",
        pairing_reason: pairing.pairing_reason || pairing.reason || "Complements the wine's characteristics",
        intensity: Math.min(10, Math.max(1, pairing.intensity || 7))
      }));

      console.log(`Generated ${formattedPairings.length} food pairings for ${wineName}`);
      
      res.json({
        foodPairings: formattedPairings,
        wine: {
          name: wineName,
          year: wineYear,
          location: wineLocation
        }
      });

    } catch (error) {
      console.error("Error generating food pairings:", error);
      
      // Check for quota errors
      if (error instanceof Error && error.message.includes("quota")) {
        return res.status(429).json({ 
          error: "API quota exceeded. Please try again later." 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to generate food pairings. Please try again." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
