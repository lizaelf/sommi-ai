import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

// Interface for chat message
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    // Return the assistant's response
    return {
      content: response.choices[0].message.content || "I don't know how to respond to that.",
      usage: response.usage
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    
    // Check if it's an API key error
    if (error.message?.includes('API key')) {
      throw new Error("Invalid OpenAI API key. Please check your environment variables.");
    }
    
    // Handle rate limiting
    if (error.status === 429) {
      throw new Error("OpenAI API rate limit exceeded. Please try again later.");
    }
    
    // Generic error
    throw new Error(`OpenAI API error: ${error.message || "Unknown error"}`);
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
