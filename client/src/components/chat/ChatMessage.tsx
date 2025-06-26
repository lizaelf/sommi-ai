import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@shared/schema';
import { ClientMessage } from '@/lib/types';
import { TextGenerateEffect } from '@/components/ui/misc/TextGenerateEffect';
import ChatAnswer from './ChatAnswer';

// Ensure window.voiceAssistant type is available
declare global {
  interface Window {
    voiceAssistant?: {
      speakResponse: (text: string) => Promise<void>;
      playLastAudio: () => void;
      speakLastAssistantMessage: () => void;
      muteAndSavePosition: () => void;
      resumeFromMute: () => void;
    };
  }
}

interface ChatMessageProps {
  message: Message | ClientMessage;
  isUserMessage?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Create ref for the audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Process message content for speech synthesis
  const processTextForSpeech = (content: string): string => {
    if (!content) return '';
    
    let processedText = content;
    
    // Handle wine-specific emoji by adding spaces or replacing with text
    processedText = processedText.replace(/🍷/g, ' wine ');
    processedText = processedText.replace(/✨/g, ' sparkle ');
    processedText = processedText.replace(/🍽️/g, ' food ');
    processedText = processedText.replace(/🌍/g, ' region ');
    
    // Remove markdown formatting
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '$1');
    processedText = processedText.replace(/```([\s\S]*?)```/g, '$1');
    
    // Clean up extra spaces
    processedText = processedText.replace(/\s+/g, ' ').trim();
    
    return processedText;
  };
  
  // Function to handle play/pause
  const toggleAudio = async () => {
    if (isUser) return; // Only AI messages can be played
    
    try {
      if (isPlaying) {
        // Pause audio
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      // Check if we already have audio loaded
      if (audioUrl && audioRef.current) {
        // Play existing audio
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          return;
        } catch (playError) {
          console.error("Error playing existing audio:", playError);
          // Fall through to regenerate audio
        }
      }

      // Generate new audio
      setIsLoading(true);
      
      // Process the message content for TTS
      const textToSpeak = processTextForSpeech(message.content);
      
      console.log("Generating TTS for:", textToSpeak.substring(0, 100) + "...");
      
      // Make TTS request
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToSpeak,
          voice: 'alloy', // Use consistent voice
          speed: 1.0
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      // Get audio blob and create URL
      const audioBlob = await response.blob();
      const newAudioUrl = URL.createObjectURL(audioBlob);
      
      // Clean up old URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(newAudioUrl);
      
      // Wait a moment for the audio element to load the new source
      setTimeout(async () => {
        try {
          if (audioRef.current) {
            await audioRef.current.play();
            setIsPlaying(true);
          }
        } catch (playError) {
          console.error("Error playing new audio:", playError);
          setIsPlaying(false);
        }
      }, 100);

    } catch (error) {
      console.error("Error in toggleAudio:", error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Revoke object URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Audio element finished playing
  const handleAudioEnded = () => {
    console.log("Audio playback ended");
    setIsPlaying(false);
  };

  return (
    <div className="w-full my-2 sm:my-3">
      {/* Hidden audio element - using key to force reload when URL changes */}
      <audio 
        key={audioUrl || 'no-audio'}
        ref={audioRef}
        src={audioUrl || ''}
        onEnded={handleAudioEnded}
        onCanPlay={() => console.log("Audio can now play")}
        onLoadedData={() => console.log("Audio data loaded")}
        onError={(e) => {
          console.error("Audio playback error", e);
          setIsPlaying(false);
        }}
        style={{ display: 'none' }}
        preload="auto"
        controls={false}
      />
      
      {isUser ? (
        // User Message - Smaller and right-aligned
        <div className="flex justify-end mb-2">
          <div className="bg-primary/10 text-foreground rounded-lg py-1.5 sm:py-2 px-3 sm:px-4 max-w-[85%] border border-primary/20 text-sm sm:text-base">
            <ChatAnswer content={message.content} isUserMessage={true} />
          </div>
        </div>
      ) : (
        // AI Message - Wine info style with full text display
        <div data-role="assistant" className="relative">
          <div className="text-foreground font-normal whitespace-pre-wrap">
            <ChatAnswer content={message.content} isUserMessage={false} />
          </div>
          
          {/* Play/Pause Button - Always show for assistant messages */}
          {!isUser && (
            <div className="absolute top-0 right-0 mt-1 mr-1 z-10 pointer-events-auto">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Play button DOM click event");
                  toggleAudio();
                }}
                className="p-2 rounded-full bg-primary text-white hover:bg-primary/80 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                disabled={isLoading}
                title={isPlaying ? "Pause audio" : "Play audio"}
                style={{ pointerEvents: 'auto' }}
              >
                {isPlaying ? (
                  // Pause icon
                  <img 
                    src="/icons/pause.svg" 
                    alt="Pause"
                    width="16" 
                    height="16"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                ) : (
                  // Play icon
                  <img 
                    src="/icons/play.svg" 
                    alt="Play"
                    width="16" 
                    height="16"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;