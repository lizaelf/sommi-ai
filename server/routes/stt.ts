import { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Speech-to-text endpoint
export async function handleSTTRequest(req: Request, res: Response) {
  // Check if file exists in request
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }
  
  // Save file temporarily
  const tempFilePath = path.join(__dirname, '..', '..', 'temp', `${uuidv4()}.wav`);
  
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write file to disk
    await writeFileAsync(tempFilePath, req.file.buffer);
    
    // Initialize OpenAI with API key from environment
    const openai = new OpenAI();
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }
    
    // Open file for transcription
    const audioFile = fs.createReadStream(tempFilePath);
    
    // Transcribe audio
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });
    
    // Return transcription
    res.json({
      text: transcription.text
    });
    
  } catch (error) {
    console.error('Error in STT request:', error);
    
    if (error.status === 429) {
      return res.status(429).json({ error: 'OpenAI rate limit exceeded' });
    }
    
    res.status(500).json({
      error: 'Failed to transcribe speech',
      details: error.message
    });
  } finally {
    // Clean up temp file
    try {
      if (fs.existsSync(tempFilePath)) {
        await unlinkAsync(tempFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }
  }
}