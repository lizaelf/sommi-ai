import { Request, Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';

// Input validation schema
const ttsRequestSchema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().default('nova')
});

// Text-to-speech endpoint
export async function handleTTSRequest(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = ttsRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validationResult.error.format()
      });
    }
    
    // Extract validated data
    const { text, voice } = validationResult.data;
    
    // Initialize OpenAI with API key from environment
    const openai = new OpenAI();
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }
    
    // Create speech audio
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text
    });
    
    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Send audio as response
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
    
  } catch (error: any) {
    console.error('Error in TTS request:', error);
    
    if (error?.status === 429) {
      return res.status(429).json({ error: 'OpenAI rate limit exceeded' });
    }
    
    res.status(500).json({
      error: 'Failed to generate speech',
      details: error?.message || 'Unknown error'
    });
  }
}