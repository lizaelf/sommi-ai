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

// Using GPT-4o for fastest responses and latency optimization
const MODEL = "gpt-4o";
// Fallback model if primary model is not available
const FALLBACK_MODEL = "gpt-4o-mini";

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

    // Get configuration from environment variables
    const maxTokens = parseInt(process.env.MAX_TOKENS || "300");
    const responseRules = process.env.RESPONSE_RULES || "Keep responses concise and focused.";
    const responseTemplate = process.env.RESPONSE_TEMPLATE || "full";

    // Apply response template formatting
    let templateRules = "";
    switch (responseTemplate) {
      case "brief":
        templateRules = "RESPONSE FORMAT: Provide ultra-brief, single-sentence answers only. Maximum 25 words.";
        break;
      case "summary":
        templateRules = "RESPONSE FORMAT: Provide short summaries only. Maximum 2-3 sentences. Focus on key points.";
        break;
      case "full":
      default:
        templateRules = "RESPONSE FORMAT: Provide comprehensive, detailed responses.";
        break;
    }

    // Append response rules and template to system prompt
    const combinedRules = `${responseRules}\n\n${templateRules}`;
    if (combinedRules) {
      newMessages[0].content += `\n\nIMPORTANT RESPONSE RULES: ${combinedRules}`;
    }

    console.log('Max tokens configured:', maxTokens);
    console.log('Response template:', responseTemplate);
    console.log('Combined rules:', combinedRules);

    // Check response cache first for faster responses
    const enableResponseCache = process.env.ENABLE_RESPONSE_CACHE === 'true';
    const cacheTTL = parseInt(process.env.CACHE_TTL_SECONDS || '300') * 1000; // Convert to milliseconds
    
    if (enableResponseCache) {
      // Create cache key from last user message and wine data
      const userMessage = messages[messages.length - 1]?.content || '';
      const wineId = wineData?.id || 'none';
      const cacheKey = `${userMessage}_${wineId}_${responseTemplate}_${maxTokens}`;
      
      const cached = responseCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cacheTTL) {
        console.log('Using cached response for faster TTFB');
        return {
          content: cached.content,
          usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
        };
      }
    }

    // Enable streaming for faster TTFB
    const enableStreaming = process.env.ENABLE_STREAMING !== 'false';
    
    // Call OpenAI API with optimizations for speed
    let finalResponse;
    try {
      // Optimized completion parameters for faster responses
      const baseParams = {
        model: MODEL,
        messages: newMessages,
        temperature: 0.3, // Lower temperature for faster, more deterministic responses
        max_tokens: maxTokens, // Dynamic max_tokens from environment
        presence_penalty: -0.1, // Slight negative presence penalty for concise responses
        frequency_penalty: 0.2, // Slight frequency penalty to avoid repetition
        top_p: 0.9, // Reduce top_p for faster generation
      };
      
      if (enableStreaming) {
        console.log('Using streaming mode for faster TTFB');
        const stream = await openai.chat.completions.create({
          ...baseParams,
          stream: true,
        }) as any;
        
        // Collect streaming response for faster perceived performance
        let content = '';
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
            }
          }
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          throw streamError;
        }
        
        finalResponse = {
          choices: [{
            message: {
              role: 'assistant' as const,
              content: content
            }
          }],
          usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
        };
      } else {
        console.log('Using non-streaming mode');
        finalResponse = await openai.chat.completions.create({
          ...baseParams,
          stream: false,
        });
      }
    } catch (err) {
      const primaryModelError = err as any;
      console.warn(`Error with primary model ${MODEL}, falling back to ${FALLBACK_MODEL}:`, primaryModelError);
      
      // If the primary model fails, try with the fallback model
      if (primaryModelError?.status === 404) {
        finalResponse = await openai.chat.completions.create({
          model: FALLBACK_MODEL,
          messages: newMessages,
          temperature: 0.3, // Lower temperature for focused responses
          max_tokens: maxTokens, // Dynamic max_tokens from environment
          presence_penalty: -0.1, // Encourage concise responses
          frequency_penalty: 0.2, // Avoid repetition
          stream: false // Use non-streaming for fallback
        });
      } else {
        // If it's not a model availability issue, rethrow the error
        throw primaryModelError;
      }
    }

    // Cache the response for faster future requests
    if (enableResponseCache && finalResponse.choices[0]?.message?.content) {
      const userMessage = messages[messages.length - 1]?.content || '';
      const wineId = wineData?.id || 'none';
      const cacheKey = `${userMessage}_${wineId}_${responseTemplate}_${maxTokens}`;
      
      // Manage cache size
      if (responseCache.size >= MAX_RESPONSE_CACHE_SIZE) {
        const firstKey = responseCache.keys().next().value;
        if (firstKey) {
          responseCache.delete(firstKey);
        }
      }
      
      responseCache.set(cacheKey, {
        content: finalResponse.choices[0].message.content,
        timestamp: Date.now()
      });
      console.log('Response cached for future requests');
    }

    // Return the assistant's response
    return {
      content: finalResponse.choices[0].message.content || "I don't know how to respond to that.",
      usage: finalResponse.usage || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
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

// Dynamic voice configuration class - uses environment variables
class VoiceConfig {
  static get MODEL() { 
    return process.env.TTS_MODE === "prod" ? "tts-1-hd" : "tts-1";
  }
  
  static get VOICE() { 
    return (process.env.VOICE_TYPE as any) || "onyx";
  }
  
  static get SPEED() { 
    return parseFloat(process.env.TTS_SPEED || "1.1");
  }
  
  // Prevent instantiation - static class only
  private constructor() {}
}

// Voice cache to store recently generated audio for consistency
const voiceCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 50;

// Response cache for chat completions to reduce API calls
const responseCache = new Map<string, { content: string; timestamp: number }>();
const MAX_RESPONSE_CACHE_SIZE = 100;

// Function to convert text to speech using OpenAI's Text-to-Speech API with consistent voice
// Real-time streaming chat completion with latency measurement and progressive TTS
export async function chatCompletionStream(messages: ChatMessage[], wineData?: any) {
  const startTime = performance.now();
  console.log("🚀 Starting real-time streaming with GPT-4o for maximum speed");
  
  const systemPrompt = wineData ? generateDynamicWineSystemPrompt(wineData) : generateWineSystemPrompt();
  const newMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages
  ];
  
  console.log("⚡ Initiating streaming request to OpenAI with optimized parameters");
  
  const requestStartTime = performance.now();
  
  // Optimized parameters for fastest response with GPT-4o
  const stream = await openai.chat.completions.create({
    model: MODEL, // GPT-4o for fastest responses
    messages: newMessages,
    temperature: 0.2, // Lower temperature for faster generation
    max_tokens: parseInt(process.env.MAX_TOKENS || '100'), // Reduced for speed
    presence_penalty: 0, // Removed penalties for speed
    frequency_penalty: 0,
    top_p: 0.8, // Reduced for faster token selection
    stream: true, // CONFIRMED: Streaming is ENABLED
    // Additional optimization parameters
    seed: undefined, // No seed for fastest response
    response_format: { type: "text" }, // Explicit text format
  });
  
  const requestEndTime = performance.now();
  const requestLatency = requestEndTime - requestStartTime;
  console.log(`📊 OpenAI API request latency: ${requestLatency.toFixed(2)}ms`);
  
  // Wrap stream with latency measurement and progressive TTS capability
  return {
    async *[Symbol.asyncIterator]() {
      let firstTokenTime: number | null = null;
      let tokenCount = 0;
      
      for await (const chunk of stream) {
        const tokenReceiveTime = performance.now();
        
        if (!firstTokenTime && chunk.choices?.[0]?.delta?.content) {
          firstTokenTime = tokenReceiveTime;
          const timeToFirstToken = firstTokenTime - startTime;
          console.log(`🎯 TIME TO FIRST TOKEN: ${timeToFirstToken.toFixed(2)}ms`);
          console.log(`🔥 STREAMING CONFIRMED ACTIVE - First token received in ${timeToFirstToken.toFixed(2)}ms`);
        }
        
        if (chunk.choices?.[0]?.delta?.content) {
          tokenCount++;
          const tokenLatency = tokenReceiveTime - (firstTokenTime || startTime);
          console.log(`📈 Token ${tokenCount} received at +${tokenLatency.toFixed(2)}ms`);
        }
        
        yield chunk;
      }
      
      const totalTime = performance.now() - startTime;
      console.log(`✅ Streaming completed - Total time: ${totalTime.toFixed(2)}ms, Tokens: ${tokenCount}`);
    }
  };
}

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
    console.log("TTS Mode:", process.env.TTS_MODE || "dev");
    console.log("Using dynamic voice settings:", {
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
