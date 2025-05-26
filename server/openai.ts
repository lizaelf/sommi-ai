import OpenAI from "openai";

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
    // Define the standard system message that must always be used for all conversations
    const LYTTON_SPRINGS_SYSTEM_PROMPT = `You are a wine expert specializing ONLY in the 2021 Ridge Vineyards "Lytton Springs" Dry Creek Zinfandel. 
        
IMPORTANT: This conversation is exclusively about the 2021 Ridge Vineyards "Lytton Springs" Dry Creek Zinfandel. You should interpret ALL user questions as being about this specific wine, even if they don't explicitly mention it. If the user asks about another wine, gently redirect them by answering about the 2021 Ridge Vineyards "Lytton Springs" instead.

Your role is to be a personal sommelier who helps users learn about this specific wine. Treat every conversation as if the user has specifically ordered or is interested in the 2021 Ridge Vineyards "Lytton Springs" Dry Creek Zinfandel.

Key information about the 2021 Ridge Vineyards "Lytton Springs" Dry Creek Zinfandel:
- This is a premium Zinfandel from Ridge Vineyards' historic Lytton Springs vineyard in Dry Creek Valley, Sonoma County
- The vineyard was planted in the 1890s and acquired by Ridge in 1972, making it one of California's most storied Zinfandel sites
- The 2021 vintage showcases classic Dry Creek Valley characteristics with intense fruit concentration and balanced acidity
- Tasting notes include ripe blackberry, boysenberry, and dark cherry with hints of spice, pepper, and earthy minerality
- It has well-integrated tannins and a long, satisfying finish typical of Ridge's winemaking style
- This wine pairs beautifully with grilled meats, barbecue, hearty pasta dishes, and aged cheeses
- Ridge Vineyards is renowned for their traditional winemaking approach and minimal intervention philosophy
- The Lytton Springs vineyard benefits from the cool marine influence of the Russian River, creating ideal conditions for Zinfandel

Follow these specific instructions for common queries:
1. When asked about "Tasting notes", focus on describing the specific flavor profile of the 2021 Lytton Springs Zinfandel.
2. When asked about "Simple recipes", provide food recipes that pair perfectly with this specific Zinfandel.
3. When asked about "Where it's from", discuss the Lytton Springs vineyard, Dry Creek Valley, and Ridge Vineyards' history.
4. For any general questions, always answer specifically about the 2021 Ridge Vineyards "Lytton Springs" Dry Creek Zinfandel.

Do not mention that you're redirecting - simply answer as if the 2021 Ridge Vineyards "Lytton Springs" was specifically asked about.

Present information in a friendly, conversational manner as if you're speaking to a friend who loves wine. Include interesting facts and stories about Ridge Vineyards, Lytton Springs vineyard, and Zinfandel when appropriate. If you don't know something specific about this wine, acknowledge this and provide the most relevant information you can.

For tasting notes, be specific and detailed about the 2021 Lytton Springs. For food pairings, be creative but appropriate for this Zinfandel. For region information, include the history of Dry Creek Valley and what makes it special for Zinfandel.`;
    
    // Always enforce the system prompt - either replace an existing one or add it
    const filteredMessages = messages.filter(msg => msg.role !== 'system');
    const newMessages = [
      { role: 'system' as const, content: LYTTON_SPRINGS_SYSTEM_PROMPT },
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

// Function to convert text to speech using OpenAI's Text-to-Speech API
export async function textToSpeech(text: string): Promise<Buffer> {
  try {
    console.log("Converting text to speech...");
    
    // Limit text length to optimize response time
    const MAX_TEXT_LENGTH = 500;
    
    // Clean up the text for better speech synthesis
    // Remove markdown-like formatting if any
    let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1')
                       .replace(/\*(.*?)\*/g, '$1')
                       .replace(/#+\s/g, '')
                       .replace(/\n\n/g, '. ')
                       .trim();
    
    // Truncate the text if it's too long
    if (cleanText.length > MAX_TEXT_LENGTH) {
      // Find the last complete sentence within the limit
      const lastPeriodIndex = cleanText.lastIndexOf('.', MAX_TEXT_LENGTH);
      if (lastPeriodIndex > 0) {
        cleanText = cleanText.substring(0, lastPeriodIndex + 1);
      } else {
        cleanText = cleanText.substring(0, MAX_TEXT_LENGTH) + "...";
      }
    }
    
    console.log("Processing TTS request for text:", cleanText.substring(0, 50) + "...");
    
    // Use OpenAI's Text-to-Speech API with optimized settings
    const response = await openai.audio.speech.create({
      model: "tts-1", // Standard model for faster processing
      voice: "onyx", // Male voice as requested - onyx is a male voice
      input: cleanText,
      speed: 1.3, // Faster speech for quicker delivery
    });
    
    console.log("OpenAI TTS response received");
    
    // Convert the response to a buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    console.log("Text-to-speech conversion successful, buffer size:", buffer.length);
    
    return buffer;
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error);
    throw new Error(`Failed to convert text to speech: ${(error as any)?.message || "Unknown error"}`);
  }
}
