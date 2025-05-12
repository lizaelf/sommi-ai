import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@shared/schema';
import { ClientMessage } from '@/lib/types';

// Ensure window.voiceAssistant type is available
declare global {
  interface Window {
    voiceAssistant?: {
      speakResponse: (text: string) => Promise<void>;
      playLastAudio: () => void;
      speakLastAssistantMessage: () => void;
    };
  }
}

interface ChatMessageProps {
  message: Message | ClientMessage;
}

// Helper to convert Markdown-style bold text (**text**) to actual bold elements
function processMarkdownBold(text: string) {
  if (!text) return null;
  
  // Regular expression to match text between double asterisks
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  if (parts.length === 1) {
    return text;
  }
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={i}>{boldText}</strong>;
    }
    return part;
  });
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
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    processedText = processedText.replace(/\*(.*?)\*/g, '$1');     // Italic
    processedText = processedText.replace(/`(.*?)`/g, '$1');       // Code
    
    // Replace bullet points with natural pauses
    processedText = processedText.replace(/- /g, ', ');
    processedText = processedText.replace(/• /g, ', ');
    processedText = processedText.replace(/✧ /g, ', ');
    
    // Add periods for natural pauses
    processedText = processedText.replace(/\n/g, '. ');
    
    // Clean up double periods
    processedText = processedText.replace(/\.\./g, '.');
    
    return processedText;
  };
  
  // Function to get text-to-speech audio from the server
  const getAudioForText = async (text: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      console.log("Fetching TTS audio from server...");
      
      // Make a request to the server's text-to-speech endpoint
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Get the blob from the response
      const audioBlob = await response.blob();
      
      // Create an object URL for the blob
      const url = URL.createObjectURL(audioBlob);
      console.log("Created audio URL:", url);
      
      return url;
    } catch (error) {
      console.error("Error getting audio:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to play audio
  const playAudio = () => {
    if (!audioRef.current || !audioUrl) {
      console.log("Cannot play audio - missing audioRef or audioUrl");
      return;
    }
    
    try {
      console.log("Attempting to play audio with URL:", audioUrl);
      
      // Make sure audio is ready to play
      if (audioRef.current.readyState >= 2) {
        // Ready to play
        audioRef.current.play()
          .then(() => {
            console.log("Audio playback started successfully");
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
      } else {
        // Wait for it to be ready
        console.log("Audio not ready yet (readyState:", audioRef.current.readyState, ") - setting up event listener");
        const canPlayHandler = () => {
          console.log("canplay event fired - now playing");
          audioRef.current?.play()
            .then(() => {
              console.log("Audio playback started after canplay event");
              setIsPlaying(true);
            })
            .catch(e => console.error("Error playing after canplay:", e));
          
          // Remove the event listener
          audioRef.current?.removeEventListener('canplay', canPlayHandler);
        };
        
        // Add event listener
        audioRef.current.addEventListener('canplay', canPlayHandler);
        
        // Also try to load it
        audioRef.current.load();
      }
    } catch (error) {
      console.error("Error in playAudio:", error);
    }
  };
  
  // Function to pause audio
  const pauseAudio = () => {
    if (!audioRef.current) return;
    
    try {
      // Pause the audio
      audioRef.current.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error in pauseAudio:", error);
    }
  };
  
  // Toggle play/pause
  const toggleAudio = async () => {
    console.log("Toggle audio button clicked - isUser:", isUser, "isPlaying:", isPlaying, "audioUrl:", !!audioUrl);
    
    // Only allow for assistant messages
    if (isUser) return;
    
    try {
      if (isPlaying) {
        // If playing, pause
        pauseAudio();
      } else {
        // If not playing and we have an audio URL, play it
        if (audioUrl) {
          playAudio();
        } 
        // Otherwise, fetch the audio first
        else {
          if (message.content) {
            console.log("Fetching audio for text");
            // Process the text
            const speechText = processTextForSpeech(message.content);
            
            // Get the audio URL
            const url = await getAudioForText(speechText);
            if (url) {
              setAudioUrl(url);
              
              // Wait a bit for the audio element to update
              setTimeout(() => {
                if (audioRef.current) {
                  playAudio();
                }
              }, 100);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in toggleAudio:", error);
    }
  };
  
  // Setup audio when assistant message is rendered
  useEffect(() => {
    // Only for assistant messages with content
    if (isUser || !message.content) return;
    
    // Preload audio for assistant message
    const preloadAudio = async () => {
      const speechText = processTextForSpeech(message.content);
      if (speechText) {
        console.log("Preloading audio for assistant message");
        const url = await getAudioForText(speechText);
        if (url) {
          console.log("Audio URL received:", url);
          setAudioUrl(url);
        }
      }
    };
    
    // Call the preload function
    preloadAudio();
    
    // Cleanup
    return () => {
      // Revoke object URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [message.content, isUser]);
  
  // Function to format text with bold and code blocks
  const formatContent = (content: string) => {
    // Handle undefined or empty content
    if (!content) {
      return null;
    }
    
    try {
      // Check if there are any code blocks
      if (!content.includes('```')) {
        // No code blocks, apply bold formatting and return
        return <p>{processMarkdownBold(content)}</p>;
      }
      
      // Split content by code block markers and process each part
      const segments = [];
      let isCodeBlock = false;
      let buffer = '';
      
      // Split by newline to process line by line
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('```')) {
          // We found a code block delimiter
          // Add the current buffer as the appropriate type
          if (buffer) {
            segments.push({
              type: isCodeBlock ? 'code' : 'text',
              content: buffer.trim()
            });
            buffer = '';
          }
          // Toggle the code block state
          isCodeBlock = !isCodeBlock;
          // Skip the delimiter line
          continue;
        }
        
        // Add the line to our buffer with the appropriate separator
        if (buffer) {
          buffer += '\n' + line;
        } else {
          buffer = line;
        }
      }
      
      // Add any remaining content
      if (buffer) {
        segments.push({
          type: isCodeBlock ? 'code' : 'text',
          content: buffer.trim()
        });
      }
      
      // Render the segments
      return (
        <>
          {segments.map((segment, index) => (
            segment.type === 'text' ? 
              <p key={index}>{processMarkdownBold(segment.content)}</p> : 
              <pre key={index} className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                {segment.content}
              </pre>
          ))}
        </>
      );
    } catch (error) {
      console.error("Error formatting message content:", error);
      return <p>{content}</p>;
    }
  };

  // Function to detect wine information from content
  const formatWineInfo = (content: string) => {
    if (isUser) return formatContent(content); // Only apply special formatting to AI responses
    
    // Add wine-specific formatting
    try {
      // Convert content to paragraphs
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      
      return (
        <div className="text-sm sm:text-base space-y-4">
          {/* Format paragraphs with wine-specific styling */}
          {paragraphs.map((paragraph, idx) => {
            // Check if paragraph might be a header or section title
            if (paragraph.includes('Aromas') || paragraph.includes('Flavors') || 
                paragraph.includes('Region') || paragraph.includes('Pairs with') ||
                paragraph.includes('Story') || paragraph.includes('Origin')) {
              
              // It's a section header, format with wine emoji if appropriate
              const emoji = 
                paragraph.includes('Aromas') ? '🍷 ' :
                paragraph.includes('Flavors') ? '✨ ' :
                paragraph.includes('Pairs') ? '🍽️ ' :
                paragraph.includes('Region') || paragraph.includes('Origin') ? '🌍 ' : '';
              
              return (
                <div key={idx} className="mt-3">
                  <p className="font-medium text-gray-800">{emoji}{processMarkdownBold(paragraph)}</p>
                </div>
              );
            }
            
            // Check if it's a list-like item
            if (paragraph.includes('- ')) {
              const items = paragraph.split('- ').filter(item => item.trim().length > 0);
              return (
                <div key={idx} className="space-y-1">
                  {items.map((item, i) => (
                    <p key={i} className="flex items-start">
                      <span className="text-[#6A53E7] mr-2">✧</span>
                      <span>{processMarkdownBold(item.trim())}</span>
                    </p>
                  ))}
                </div>
              );
            }
            
            // Regular paragraph with bold text formatting
            return <p key={idx} className="text-gray-700">{processMarkdownBold(paragraph)}</p>;
          })}
        </div>
      );
    } catch (error) {
      console.error("Error formatting wine info:", error);
      return formatContent(content);
    }
  };

  // Audio element finished playing
  const handleAudioEnded = () => {
    console.log("Audio playback ended");
    setIsPlaying(false);
  };

  return (
    <div className="w-full my-2 sm:my-3">
      {/* Hidden audio element - using key to force reload when URL changes */}
      {!isUser && (
        <audio 
          key={audioUrl || 'no-audio'}
          ref={audioRef}
          src={audioUrl || ''}
          onEnded={handleAudioEnded}
          onCanPlay={() => console.log("Audio can now play")}
          onError={(e) => {
            console.error("Audio playback error", e);
            setIsPlaying(false);
          }}
          style={{ display: 'none' }}
          preload="auto"
        />
      )}
      
      {isUser ? (
        // User Message - Smaller and right-aligned
        <div className="flex justify-end mb-2">
          <div className="bg-[#F5F3FF] text-gray-800 rounded-lg py-1.5 sm:py-2 px-3 sm:px-4 max-w-[85%] border border-[#6A53E7]/10 text-sm sm:text-base">
            {formatContent(message.content)}
          </div>
        </div>
      ) : (
        // AI Message - Wine info style with special formatting (direct rendering)
        <div data-role="assistant" className="relative">
          {formatWineInfo(message.content)}
          
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
                className="p-2 rounded-full bg-[#6A53E7] text-white hover:bg-[#5842d6] transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                disabled={isLoading}
                title={isPlaying ? "Pause audio" : "Play audio"}
                style={{ pointerEvents: 'auto' }}
              >
                {isPlaying ? (
                  // Pause icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  // Play icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
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