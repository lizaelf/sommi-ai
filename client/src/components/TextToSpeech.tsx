import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface TextToSpeechProps {
  text: string;
}

/**
 * Component that converts text to speech using OpenAI's TTS API
 */
const TextToSpeech: React.FC<TextToSpeechProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to handle text-to-speech conversion
  const handleSpeak = async () => {
    // If already playing, stop playback
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Call the API to convert text to speech
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate speech');
      }
      
      // Get audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      // Set up audio event handlers
      audioRef.current.src = audioUrl;
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl); // Clean up
      };
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl); // Clean up
        console.error('Audio playback error');
      };
      
      // Play the audio
      audioRef.current.play();
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsLoading(false);
    }
  };

  // No text, no speech
  if (!text.trim()) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={handleSpeak}
      variant="ghost"
      size="sm"
      disabled={isLoading}
      className={`p-1 h-8 w-8 rounded-full ${isPlaying ? 'bg-purple-100 text-[#6A53E7]' : 'text-gray-500 hover:text-[#6A53E7]'}`}
      title={isPlaying ? 'Stop speaking' : 'Listen to this response'}
    >
      {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </Button>
  );
};

export default TextToSpeech;