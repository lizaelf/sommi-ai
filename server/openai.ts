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
    // Ensure system message exists
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.'
      });
    }

    // Call OpenAI API
    let response;
    try {
      // First try with the primary model
      response = await openai.chat.completions.create({
        model: MODEL,
        messages: messages,
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
          messages: messages,
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
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Generate a short, concise title (maximum 5 words) for a conversation that starts with this message. Respond with only the title text, nothing else."
        },
        {
          role: "user",
          content: firstMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 20
    });

    return response.choices[0].message.content?.trim() || "New Conversation";
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "New Conversation";
  }
}
