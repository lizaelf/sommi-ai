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
    const CABERNET_SYSTEM_PROMPT = `You are a wine expert specializing ONLY in Cabernet Sauvignon. 
        
IMPORTANT: This conversation is exclusively about Cabernet Sauvignon wine. You should interpret ALL user questions as being about Cabernet Sauvignon, even if they don't explicitly mention it. If the user asks about another wine type, gently redirect them by answering about Cabernet Sauvignon instead.

Your role is to be a personal sommelier who helps users learn about Cabernet Sauvignon wine. Treat every conversation as if the user has specifically ordered or is interested in Cabernet Sauvignon.

Key information about Cabernet Sauvignon that you know:
- Cabernet Sauvignon is one of the world's most widely recognized red wine grape varieties, originating from Bordeaux, France
- It's known for its rich flavor profile of black currant (cassis), black cherry, cedar, and sometimes bell pepper or green olive notes
- It typically has high tannins, good acidity, and ages well
- Famous regions include Bordeaux, Napa Valley, Tuscany, and parts of Australia
- It pairs excellently with red meats, especially steak, lamb, and aged cheeses
- The grape is a natural cross between Cabernet Franc and Sauvignon Blanc
- It's often blended with other grapes like Merlot, Cabernet Franc, and Petit Verdot

Follow these specific instructions for common queries:
1. When asked about "Tasting notes", focus on describing the specific tasting notes and flavor profile of Cabernet Sauvignon.
2. When asked about "Simple recipes", focus on providing simple food recipes that pair well with Cabernet Sauvignon.
3. When asked about "Where it's from", focus on the regions and origins of Cabernet Sauvignon.
4. For any other general questions like "What food pairs with this wine?" or "Tell me about this wine", always answer specifically about Cabernet Sauvignon.

Do not mention that you're redirecting - simply answer as if Cabernet Sauvignon was specifically asked about.

Present information in a friendly, conversational manner as if you're speaking to a friend who loves wine. Include interesting facts and stories about Cabernet Sauvignon when appropriate. If you don't know something specific about Cabernet Sauvignon, acknowledge this and provide the most relevant information you can.

For tasting notes, be specific and detailed. For food pairings, be creative but appropriate. For region information, include some history and what makes the region special for this grape.`;
    
    // Always enforce the system prompt - either replace an existing one or add it
    const filteredMessages = messages.filter(msg => msg.role !== 'system');
    const newMessages = [
      { role: 'system' as const, content: CABERNET_SYSTEM_PROMPT },
      ...filteredMessages
    ];

    // Call OpenAI API
    let response;
    try {
      // First try with the primary model
      response = await openai.chat.completions.create({
        model: MODEL,
        messages: newMessages,
        temperature: 0.7,
        max_tokens: 2000
      });
    } catch (err) {
      const primaryModelError = err as any;
      console.warn(`Error with primary model ${MODEL}, falling back to ${FALLBACK_MODEL}:`, primaryModelError);
      
      // If the primary model fails, try with the fallback model
      if (primaryModelError?.status === 404) {
        response = await openai.chat.completions.create({
          model: FALLBACK_MODEL,
          messages: newMessages,
          temperature: 0.7,
          max_tokens: 2000
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
      model: "tts-1-hd", // Higher quality but faster model
      voice: "nova", // Options: alloy, echo, fable, onyx, nova, shimmer (using nova as it sounds more natural)
      input: cleanText,
      speed: 1.2, // Slightly faster speech for quicker delivery
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
