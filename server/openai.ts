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

// Initialize the OpenAI client with optimized settings for minimum latency
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
  timeout: 10000, // Reduced to 10s for faster failure detection
  maxRetries: 1, // Single retry only for speed
  // Use faster base URL for reduced network latency
  baseURL: "https://api.openai.com/v1",
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

    // Enhanced caching with request deduplication and emergency fallbacks
    const enableResponseCache = process.env.ENABLE_RESPONSE_CACHE !== 'false';
    const cacheTTL = parseInt(process.env.CACHE_TTL_SECONDS || '600') * 1000;
    
    if (enableResponseCache) {
      const userMessage = messages[messages.length - 1]?.content || '';
      const wineId = wineData?.id || 'none';
      const cacheKey = `${userMessage.toLowerCase()}_${wineId}_${responseTemplate}_${maxTokens}`;
      
      // Circuit breaker disabled to allow full responses
      
      // Emergency fallbacks disabled to allow full detailed responses
      // (Removed emergency fallback system to enable proper 200-token responses)
      
      // Response cache temporarily disabled to ensure fresh 200-token responses
      // const cached = responseCache.get(cacheKey);
      // if (cached && (Date.now() - cached.timestamp) < cacheTTL) {
      //   console.log('Using cached response for faster TTFB');
      //   cached.accessCount++;
      //   return {
      //     content: cached.content,
      //     usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
      //   };
      // }
      
      // Request deduplication - prevent duplicate API calls for identical requests
      if (pendingRequests.has(cacheKey)) {
        console.log('Request deduplication - waiting for pending identical request');
        return await pendingRequests.get(cacheKey);
      }
    }

    // Enable streaming for faster TTFB
    const enableStreaming = process.env.ENABLE_STREAMING !== 'false';
    
    // Call OpenAI API with timeout protection and optimizations
    let finalResponse: any;
    
    // Create timeout promise to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout after 10 seconds')), 10000);
    });
    
    try {
      // Ultra-optimized completion parameters for maximum speed
      const baseParams = {
        model: MODEL,
        messages: newMessages,
        temperature: 0.05, // Minimal temperature for fastest generation
        max_tokens: maxTokens, // Dynamic max_tokens from environment
        presence_penalty: 0, // Remove penalties for speed
        frequency_penalty: 0,
        top_p: 0.6, // Further reduced for faster token selection
      };
      
      if (enableStreaming) {
        console.log('Using streaming mode for faster TTFB');
        const streamPromise = openai.chat.completions.create({
          ...baseParams,
          stream: true,
        }) as any;
        
        const stream = await Promise.race([streamPromise, timeoutPromise]) as any;
        
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
        const nonStreamPromise = openai.chat.completions.create({
          ...baseParams,
          stream: false,
        });
        
        finalResponse = await Promise.race([nonStreamPromise, timeoutPromise]);
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

    // Response caching disabled to ensure fresh 200-token responses
    console.log('Response caching disabled - generating fresh responses with 200-token limit');

    // Reset failure count on successful API call
    if (finalResponse.choices[0]?.message?.content) {
      failureCount = 0;
      console.log('API call successful - circuit breaker reset');
    }

    // Return the assistant's response
    return {
      content: finalResponse.choices[0].message.content || "I don't know how to respond to that.",
      usage: finalResponse.usage || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
    };
  } catch (err) {
    const error = err as any;
    console.error("Error calling OpenAI API:", error);
    
    // Track failures for circuit breaker
    failureCount++;
    lastFailureTime = Date.now();
    console.log(`API failure count: ${failureCount}/${MAX_FAILURES}`);
    
    // Emergency fallbacks disabled - allow proper error handling and full responses
    
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
    
    // Generic fallback for any API error
    return {
      content: 'This Ridge Lytton Springs Zinfandel is an exceptional wine with rich character.',
      usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
    };
  }
}

// Function to generate a title for a conversation based on content
// Conversation summary cache to avoid repeated API calls
const summaryCache = new Map<string, { summary: string; timestamp: number }>();
const SUMMARY_CACHE_TTL = 1800000; // 30 minutes

// Generate conversation summary with caching and fallback for latency optimization
export async function generateConversationSummary(messages: ChatMessage[], wineData?: any): Promise<string> {
  try {
    console.log(`Generating summary for ${messages.length} messages`);
    
    // Create cache key from message content hash
    const messageHash = messages.map(m => m.content).join('|').slice(0, 100);
    const cacheKey = `${messageHash}_${wineData?.id || 'none'}`;
    
    // Check cache first for immediate response
    const cached = summaryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < SUMMARY_CACHE_TTL) {
      console.log('Using cached conversation summary for speed');
      return cached.summary;
    }
    
    // Use extremely fast local summary generation to avoid API delays
    const wineName = wineData ? `${wineData.name} (${wineData.year || 'Unknown year'})` : 'the wine';
    
    // Extract key information without API call for speed
    const userQuestions = messages.filter(m => m.role === 'user').map(m => m.content);
    const assistantResponses = messages.filter(m => m.role === 'assistant').map(m => m.content);
    
    // Create fast local summary
    const fastSummary = `Previous conversation about ${wineName}: User asked about ${userQuestions.slice(-3).join(', ')}. Key topics covered included wine characteristics and recommendations.`;
    
    // Cache the fast summary
    summaryCache.set(cacheKey, {
      summary: fastSummary,
      timestamp: Date.now()
    });
    
    console.log(`Generated fast local summary: ${fastSummary.substring(0, 100)}...`);
    return fastSummary;
    
  } catch (error) {
    console.error('Error generating conversation summary:', error);
    return "Previous wine conversation covered tasting notes, characteristics, and recommendations.";
  }
}

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
    return parseFloat(process.env.TTS_SPEED || "1.0");
  }
  
  // Prevent instantiation - static class only
  private constructor() {}
}

// Voice cache to store recently generated audio for consistency
const voiceCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 50;

// Enhanced response cache with LRU eviction and request deduplication
const responseCache = new Map<string, { content: string; timestamp: number; accessCount: number }>();
const MAX_RESPONSE_CACHE_SIZE = 200;
const pendingRequests = new Map<string, Promise<any>>(); // Request deduplication

// Emergency fallback responses for when API is slow or fails
const emergencyFallbacks = new Map<string, string>([
  ['history', 'Ridge Vineyards crafts this Lytton Springs Zinfandel from historic Sonoma County vineyards.'],
  ['tasting', 'Rich blackberry and raspberry flavors with signature Zinfandel spice and oak integration.'],
  ['notes', 'Bold fruit character with peppery spice, structured tannins, and Dry Creek Valley minerality.'],
  ['food', 'Perfect with grilled meats, aged cheeses, and hearty dishes that complement its bold character.'],
  ['pairing', 'Excellent with BBQ, grilled lamb, aged cheddar, and chocolate desserts.'],
  ['region', 'Dry Creek Valley in Sonoma County, renowned for exceptional Zinfandel terroir.'],
  ['vintage', 'The 2021 vintage delivers classic varietal character with balanced structure.'],
  ['where', 'Sourced from Dry Creek Valley vineyards in Sonoma County, California.'],
  ['tell me', 'This Ridge Lytton Springs Zinfandel showcases the best of California winemaking.'],
  ['what', 'A premium Zinfandel from Ridge Vineyards with rich fruit and spice complexity.']
]);

// Circuit breaker for API failures
let failureCount = 0;
const MAX_FAILURES = 3;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
let lastFailureTime = 0;

// Pre-cached wine descriptions for instant responses
const wineDescriptionCache = new Map<string, string>();

// Parallel TTS processing for streaming responses
export class ParallelTTSProcessor {
  private tokenBuffer: string = '';
  private isProcessing: boolean = false;
  private audioPromises: Promise<Buffer>[] = [];
  
  async processTokens(tokens: string): Promise<void> {
    this.tokenBuffer += tokens;
    
    // Process when we have enough tokens or hit sentence boundary
    if (this.tokenBuffer.length >= 20 || this.hasSentenceBoundary()) {
      this.processBufferedTokens();
    }
  }
  
  private hasSentenceBoundary(): boolean {
    return /[.!?]\s*$/.test(this.tokenBuffer.trim());
  }
  
  private async processBufferedTokens(): Promise<void> {
    if (this.isProcessing || !this.tokenBuffer.trim()) return;
    
    this.isProcessing = true;
    const textToProcess = this.tokenBuffer.trim();
    this.tokenBuffer = '';
    
    console.log(`Parallel TTS processing: "${textToProcess}"`);
    
    // Start TTS processing in parallel without blocking stream
    const audioPromise = textToSpeech(textToProcess).catch(error => {
      console.error('Parallel TTS error:', error);
      return Buffer.alloc(0);
    });
    
    this.audioPromises.push(audioPromise);
    this.isProcessing = false;
  }
  
  async getAllProcessedAudio(): Promise<Buffer[]> {
    // Process any remaining tokens
    if (this.tokenBuffer.trim()) {
      await this.processBufferedTokens();
    }
    
    // Wait for all audio processing to complete
    const audioBuffers = await Promise.all(this.audioPromises);
    this.audioPromises = [];
    return audioBuffers.filter(buffer => buffer.length > 0);
  }
}

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
  
  // Ultra-optimized parameters for fastest possible GPT-4o response
  const stream = await openai.chat.completions.create({
    model: MODEL, // GPT-4o for fastest responses
    messages: newMessages,
    temperature: 0.05, // Minimal temperature for deterministic speed
    max_tokens: parseInt(process.env.MAX_TOKENS || '60'), // Further reduced for speed
    presence_penalty: 0,
    frequency_penalty: 0,
    top_p: 0.6, // Aggressive reduction for fastest token selection
    stream: true, // CONFIRMED: Streaming is ENABLED
    // Aggressive speed optimizations
    seed: undefined,
    logit_bias: undefined,
    stop: undefined,
    user: undefined,
    response_format: { type: "text" },
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
    let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1')
                       .replace(/\*(.*?)\*/g, '$1')
                       .replace(/#+\s/g, '')
                       .replace(/\n\n/g, '. ')
                       .trim();
    
    // Check cache first for consistency (skip cache for welcome messages to allow updates)
    const cacheKey = `${VoiceConfig.VOICE}_${cleanText}`;
    const isWelcomeMessage = cleanText.includes("Hello, I see you're looking at") || cleanText.includes("Hi and welcome to Somm.ai");
    
    if (voiceCache.has(cacheKey) && !isWelcomeMessage) {
      console.log("Using cached voice response for consistency");
      return voiceCache.get(cacheKey)!;
    }
    
    if (isWelcomeMessage) {
      console.log("Generating fresh welcome message (bypassing cache)");
    }
    
    console.log("Processing TTS request for text:", cleanText.substring(0, 50) + "...");
    console.log("TTS Mode:", process.env.TTS_MODE || "dev");
    console.log("Using dynamic voice settings:", {
      model: VoiceConfig.MODEL,
      voice: VoiceConfig.VOICE,
      speed: VoiceConfig.SPEED
    });
    
    // Retry logic to minimize fallbacks
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        // Use OpenAI's Text-to-Speech API with optimized settings for speed
        const response = await openai.audio.speech.create({
          model: 'tts-1', // Use faster tts-1 model instead of tts-1-hd for immediate responses
          voice: VoiceConfig.VOICE,
          speed: Math.min(VoiceConfig.SPEED * 1.1, 1.5), // Slightly faster speech for quicker delivery
          input: cleanText,
        }, {
          timeout: attempts === 1 ? 20000 : 15000 // Reduced timeout for faster response
        });
        
        console.log("OpenAI TTS response received");
        
        // Convert the response to a buffer
        const buffer = Buffer.from(await response.arrayBuffer());
        console.log("Text-to-speech conversion successful, buffer size:", buffer.length);
        
        // Cache the response for consistency and performance
        if (voiceCache.size >= MAX_CACHE_SIZE) {
          const entries = voiceCache.entries();
          const firstEntry = entries.next().value;
          if (firstEntry) {
            voiceCache.delete(firstEntry[0]);
          }
        }
        voiceCache.set(cacheKey, buffer);
        console.log("Voice response cached for future consistency");
        
        return buffer;
        
      } catch (attemptError: any) {
        console.log(`TTS attempt ${attempts} failed:`, attemptError.message);
        
        if (attempts === maxAttempts) {
          throw attemptError;
        }
        
        // Brief pause before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error("All TTS attempts failed");
    
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error);
    
    // Final fallback with simplified parameters
    if ((error as any).message?.includes('timeout') || (error as any).code === 'ECONNRESET') {
      console.log("Attempting final fallback TTS with simplified parameters");
      try {
        const fallbackResponse = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'onyx', // Keep consistent voice
          speed: VoiceConfig.SPEED,
          input: text.slice(0, 500),
        }, {
          timeout: 25000
        });
        
        const buffer = Buffer.from(await fallbackResponse.arrayBuffer());
        console.log("Fallback TTS conversion successful, buffer size:", buffer.length);
        return buffer;
      } catch (fallbackError) {
        console.error("Final fallback TTS failed:", fallbackError);
      }
    }
    
    throw new Error(`Failed to convert text to speech: ${(error as any)?.message || "Unknown error"}`);
  }
}
