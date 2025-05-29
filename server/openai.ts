import OpenAI from "openai";
import { generateWineSystemPrompt } from "../shared/wineConfig.js";

// Using GPT-4 for high-quality responses
const MODEL = "gpt-4";
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
        temperature: 0.5, // Lower temperature for more focused responses
        // Removed max_tokens limit to allow full-length responses
        presence_penalty: -0.1, // Slight negative presence penalty for concise responses
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
          temperature: 0.5, // Lower temperature for focused responses
          // Removed max_tokens limit to allow full-length responses
          presence_penalty: -0.1, // Encourage concise responses
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

// Fixed voice configuration class - ensures absolutely consistent parameters
class VoiceConfig {
  static readonly MODEL = "tts-1" as const; // Standard model for faster response
  static readonly VOICE = "onyx" as const; // Male voice - never changes
  static readonly SPEED = 1.1 as const; // Slightly faster speed for quicker delivery
  
  // Prevent instantiation - static class only
  private constructor() {}
}

// Voice cache to store recently generated audio for consistency
const voiceCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 50;

// Function to convert text to speech using OpenAI's Text-to-Speech API with consistent voice
export async function textToSpeech(text: string): Promise<Buffer> {
  try {
    console.log("Converting text to speech...");
    
    // Clean up the text for better speech synthesis
    // Remove markdown-like formatting if any
    let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1')
                       .replace(/\*(.*?)\*/g, '$1')
                       .replace(/#+\s/g, '')
                       .replace(/\n\n/g, '. ')
                       .trim();
    
    // Check cache first for consistency
    const cacheKey = `${VoiceConfig.VOICE}_${cleanText}`;
    if (voiceCache.has(cacheKey)) {
      console.log("Using cached voice response for consistency");
      return voiceCache.get(cacheKey)!;
    }
    
    console.log("Processing TTS request for text:", cleanText.substring(0, 50) + "...");
    console.log("Using fixed voice settings:", {
      model: VoiceConfig.MODEL,
      voice: VoiceConfig.VOICE,
      speed: VoiceConfig.SPEED
    });
    
    // Use OpenAI's Text-to-Speech API with FIXED consistent voice settings
    const response = await openai.audio.speech.create({
      model: VoiceConfig.MODEL,
      voice: VoiceConfig.VOICE,
      speed: VoiceConfig.SPEED,
      input: cleanText,
    });
    
    console.log("OpenAI TTS response received");
    
    // Convert the response to a buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    console.log("Text-to-speech conversion successful, buffer size:", buffer.length);
    
    // Cache the response for consistency and performance
    if (voiceCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry to make space
      const entries = voiceCache.entries();
      const firstEntry = entries.next().value;
      if (firstEntry) {
        voiceCache.delete(firstEntry[0]);
      }
    }
    voiceCache.set(cacheKey, buffer);
    console.log("Voice response cached for future consistency");
    
    return buffer;
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error);
    throw new Error(`Failed to convert text to speech: ${(error as any)?.message || "Unknown error"}`);
  }
}
