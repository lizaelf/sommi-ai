import OpenAI from "openai";
import { generateWineSystemPrompt } from "../shared/wineConfig.js";

// Generate dynamic system prompt based on wine data from CRM
export function generateDynamicWineSystemPrompt(wineData: any): string {
  const wineName = wineData.name || "Unknown Wine";
  const wineYear = wineData.year || "Unknown Year";
  const ratings = wineData.ratings || {};
  
  // Check if this is a description generation request (temporary ID 0)
  if (wineData.id === 0) {
    return `You are a professional sommelier and wine expert. Generate authentic, concise wine descriptions based on wine names and vintages.

TASK: Create a professional wine description for ${wineName} (${wineYear}).

REQUIREMENTS:
- Focus EXCLUSIVELY on ${wineName} (${wineYear})
- 2-3 sentences maximum
- Authentic tasting notes and characteristics
- Include varietal-specific traits when identifiable
- Mention terroir or region if apparent from the name
- Professional wine industry language
- No marketing fluff or superlatives

Return only the description text, no quotes or additional formatting.`;
  }
  
  return `You are a wine expert specializing EXCLUSIVELY in ${wineName} (${wineYear}).

CRITICAL: You MUST ONLY discuss ${wineName} (${wineYear}). NEVER discuss generic wines or any other wine. Every response must be specifically about ${wineName} (${wineYear}).

When users ask about "this wine" or wine characteristics, they are asking specifically about ${wineName} (${wineYear}).

SPECIFIC WINE DETAILS for ${wineName} (${wineYear}):
- Wine Name: ${wineName}
- Vintage: ${wineYear}
- ABV: ${ratings.abv || 'Unknown'}%
- Ratings: ${ratings.vn ? `Vivino: ${ratings.vn}/100` : ''} ${ratings.jd ? `James Dean: ${ratings.jd}/100` : ''} ${ratings.ws ? `Wine Spectator: ${ratings.ws}/100` : ''}
- Available Bottles: ${wineData.bottles || 'Unknown'}

MANDATORY: Always mention "${wineName}" by name in your responses. Never give generic wine information.

Follow these specific instructions for common queries:
1. When asked about "Tasting notes", focus on describing the specific flavor profile of the ${wineYear} ${wineName}.
2. When asked about "Simple recipes", provide food recipes that pair perfectly with this specific wine.
3. When asked about "Where it's from", discuss the wine's origin and producer history.
4. For any general questions, always answer specifically about the ${wineName} (${wineYear}).

Present information in a friendly, conversational manner as if you're speaking to a friend who loves wine. Include interesting facts and stories about the wine when appropriate. If you don't know something specific about this wine, acknowledge this and provide the most relevant information you can.

For tasting notes, be specific and detailed about the ${wineYear} ${wineName}. For food pairings, be creative but appropriate for this wine type.`;
}

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

  // Skip actual API call for status checks to avoid quota usage
  // Only validate API key presence
  if (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) {
    isApiKeyValid = true;
    return { isValid: true, message: "API key configured" };
  }

  isApiKeyValid = false;
  return { isValid: false, message: "API key not configured" };
}

// Function to generate chat completion from OpenAI API
export async function chatCompletion(messages: ChatMessage[], wineData?: any) {
  try {
    console.log('Chat completion called with wine data:', wineData ? { id: wineData.id, name: wineData.name, year: wineData.year } : 'No wine data provided');
    
    // Generate the system prompt - use dynamic wine data if provided, otherwise use default config
    const wineSystemPrompt = wineData ? generateDynamicWineSystemPrompt(wineData) : generateWineSystemPrompt();
    console.log('Using wine system prompt for:', wineData ? `${wineData.name} (${wineData.year})` : 'Default wine config');
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

// Function to transcribe audio using OpenAI Whisper
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    console.log("Transcribing audio with OpenAI Whisper...");
    console.log("Audio buffer size:", audioBuffer.length);
    
    // Create a file-like object from the buffer
    const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    
    // Use OpenAI's Whisper API for transcription
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Specify English for better accuracy
      response_format: "text"
    });
    
    console.log("Whisper transcription successful:", response);
    return response.trim();
  } catch (error) {
    console.error("Error in audio transcription:", error);
    throw new Error(`Failed to transcribe audio: ${(error as any)?.message || "Unknown error"}`);
  }
}
