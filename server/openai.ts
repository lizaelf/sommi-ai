import OpenAI from "openai";
import { generateWineSystemPrompt } from "../shared/wineConfig.js";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";
// Fallback model if primary model is not available
const FALLBACK_MODEL = "gpt-3.5-turbo";

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

// Check if API key is valid
let isApiKeyValid = true;

// Interface for chat message
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Function to check API status
export async function checkApiStatus(): Promise<{ isValid: boolean; message: string }> {
  if (!process.env.OPENAI_API_KEY && !process.env.VITE_OPENAI_API_KEY) {
    isApiKeyValid = false;
    return { 
      isValid: false, 
      message: "API key not found. Please provide an OpenAI API key."
    };
  }

  try {
    // Make a minimal API call to test the connection
    await openai.chat.completions.create({
      model: FALLBACK_MODEL,
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5
    });
    
    isApiKeyValid = true;
    return { isValid: true, message: "API connected successfully" };
  } catch (err) {
    const error = err as any;
    console.error("API check failed:", error);
    isApiKeyValid = false;
    
    let message = "API connection failed. ";
    
    if (error?.status === 401) {
      message += "Invalid API key.";
    } else if (error?.status === 429) {
      message += "Rate limit exceeded. Please try again later.";
    } else if (error?.status === 404) {
      message += "The requested model is not available.";
    } else {
      message += error?.message || "Unknown error.";
    }
    
    return { isValid: false, message };
  }
}

// Function to generate chat completion from OpenAI API
export async function chatCompletion(messages: ChatMessage[]) {
  try {
    // Generate the system prompt from centralized wine configuration
    const wineSystemPrompt = generateWineSystemPrompt();
    console.log('Generated wine system prompt:', wineSystemPrompt.substring(0, 200) + '...');
    
    // Always enforce the system prompt - either replace an existing one or add it
    const filteredMessages = messages.filter(msg => msg.role !== 'system');
    const newMessages = [
      { role: 'system' as const, content: wineSystemPrompt },
      ...filteredMessages
    ];

    // Call OpenAI API
    let response;
    try {
      // First try with the primary model - optimized for speed
      response = await openai.chat.completions.create({
        model: MODEL,
        messages: newMessages,
        temperature: 0.5, // Lower temperature for more focused, faster responses
        max_tokens: 300,  // Reduced token limit for faster generation
        presence_penalty: -0.1, // Slight negative presence penalty for more concise responses
        frequency_penalty: 0.2  // Slight frequency penalty to avoid repetition
      });
    } catch (err) {
      const primaryModelError = err as any;
      console.warn(`Error with primary model ${MODEL}, falling back to ${FALLBACK_MODEL}:`, primaryModelError);
      
      // If the primary model fails, try with the fallback model
      if (primaryModelError?.status === 404) {
        response = await openai.chat.completions.create({
          model: FALLBACK_MODEL,
          messages: newMessages,
          temperature: 0.5, // Lower temperature for faster responses
          max_tokens: 300,  // Reduced token limit for faster generation
          presence_penalty: -0.1, // Encourage more concise responses
          frequency_penalty: 0.2  // Avoid repetition
        });
      } else {
        // If it's not a model availability issue, rethrow the error
        throw primaryModelError;
      }
    }

    // Return the assistant's response
    return {
      content: response.choices[0].message.content || "I don't know how to respond to that.",
      usage: response.usage
    };
  } catch (err) {
    const error = err as any;
    console.error("Error calling OpenAI API:", error);
    
    // Check if it's an API key error
    if (error?.message?.includes('API key') || error?.status === 401) {
      throw new Error("Invalid OpenAI API key. Please add a valid API key in the environment variables.");
    }
    
    // Handle rate limiting
    if (error?.status === 429) {
      throw new Error("OpenAI API rate limit or quota exceeded. Please check your billing details or try again later.");
    }

    // Handle model not found
    if (error?.status === 404) {
      throw new Error(`The requested AI model is not available for your API key.`);
    }
    
    // Generic error
    throw new Error(`OpenAI API error: ${error?.message || "Unknown error"}`);
  }
}

// Function to generate a title for a conversation based on content
export async function generateConversationTitle(firstMessage: string) {
  try {
    // Define a constant system message for titles
    const TITLE_SYSTEM_PROMPT = "Generate a short, concise title (maximum 5 words) for a conversation about Cabernet Sauvignon wine that starts with this message. Even if the message doesn't explicitly mention Cabernet Sauvignon, create a title that relates specifically to Cabernet Sauvignon. The title should be elegant and wine-focused, and MUST include reference to Cabernet Sauvignon or its characteristics. Respond with only the title text, nothing else.";
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: TITLE_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: firstMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 20
    });

    let title = response.choices[0].message.content?.trim() || "Cabernet Sauvignon";
    
    // Ensure the title always contains a reference to Cabernet Sauvignon
    if (!title.toLowerCase().includes("cabernet") && !title.toLowerCase().includes("sauvignon")) {
      title = `Cabernet ${title}`;
    }
    
    return title;
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "Cabernet Conversation";
  }
}

// Mobile-optimized voice configuration for faster processing
class MobileVoiceConfig {
  static readonly MODEL = "tts-1" as const; // Use faster model (not HD) for mobile
  static readonly VOICE = "onyx" as const; // Consistent voice
  static readonly SPEED = 1.2 as const; // Slightly faster for mobile attention spans
  
  private constructor() {}
}

// Simplified mobile cache (smaller size)
const mobileVoiceCache = new Map<string, Buffer>();
const MOBILE_MAX_CACHE_SIZE = 20; // Smaller cache for mobile

export async function textToSpeech(text: string): Promise<Buffer> {
  try {
    console.log("📱 Mobile-optimized TTS processing...");
    
    // MOBILE-FIRST: Aggressive text optimization
    const MOBILE_MAX_LENGTH = 250; // Much shorter for mobile
    
    let cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/\n\n/g, '. ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Aggressive truncation for mobile speed
    if (cleanText.length > MOBILE_MAX_LENGTH) {
      const lastSentenceEnd = Math.max(
        cleanText.lastIndexOf('.', MOBILE_MAX_LENGTH),
        cleanText.lastIndexOf('!', MOBILE_MAX_LENGTH),
        cleanText.lastIndexOf('?', MOBILE_MAX_LENGTH)
      );
      
      if (lastSentenceEnd > 50) {
        cleanText = cleanText.substring(0, lastSentenceEnd + 1);
      } else {
        cleanText = cleanText.substring(0, MOBILE_MAX_LENGTH).trim() + ".";
      }
    }
    
    // Check mobile cache first
    const cacheKey = `mobile_${MobileVoiceConfig.VOICE}_${cleanText}`;
    if (mobileVoiceCache.has(cacheKey)) {
      console.log("📱 Using mobile cached voice response");
      return mobileVoiceCache.get(cacheKey)!;
    }
    
    console.log("📱 Mobile TTS request:", cleanText.substring(0, 50) + "...");
    console.log("📱 Using mobile settings:", {
      model: MobileVoiceConfig.MODEL,
      voice: MobileVoiceConfig.VOICE,
      speed: MobileVoiceConfig.SPEED
    });
    
    // Mobile-optimized OpenAI call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout
    
    try {
      const response = await openai.audio.speech.create({
        model: MobileVoiceConfig.MODEL,
        voice: MobileVoiceConfig.VOICE,
        speed: MobileVoiceConfig.SPEED,
        input: cleanText,
      }, {
        signal: controller.signal,
        timeout: 5000 // Additional 5 second timeout
      });
      
      clearTimeout(timeoutId);
      
      const buffer = Buffer.from(await response.arrayBuffer());
      console.log("📱 Mobile TTS success, buffer size:", buffer.length);
      
      // Cache for mobile (with size limit)
      if (mobileVoiceCache.size >= MOBILE_MAX_CACHE_SIZE) {
        const firstKey = mobileVoiceCache.keys().next().value;
        if (firstKey) {
          mobileVoiceCache.delete(firstKey);
        }
      }
      mobileVoiceCache.set(cacheKey, buffer);
      
      return buffer;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Mobile TTS timeout - request took too long');
      }
      throw error;
    }
    
  } catch (error) {
    console.error("📱 Mobile TTS error:", error);
    throw new Error(`Mobile TTS failed: ${(error as any)?.message || "Unknown error"}`);
  }
}
