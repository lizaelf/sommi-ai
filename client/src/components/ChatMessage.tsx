import React, { useState, useEffect } from 'react';
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
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Load voices when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Set initial voices
      const initialVoices = window.speechSynthesis.getVoices();
      if (initialVoices.length > 0) {
        setVoices(initialVoices);
      }
      
      // Set up listener for when voices change (important for Chrome)
      const voicesChangedHandler = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        setVoices(updatedVoices);
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
      };
    }
  }, []);
  
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
  
  // Basic speech function that just uses the browser's built-in speech synthesis
  const speakText = (text: string): boolean => {
    try {
      if (!window.speechSynthesis) return false;
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to set a voice if available
      if (voices.length > 0) {
        // Prefer a Google US English voice if available
        const googleVoice = voices.find(v => 
          v.name.includes('Google') && v.lang.includes('en')
        );
        
        // Otherwise use any English voice
        const englishVoice = voices.find(v => 
          v.lang.includes('en')
        );
        
        if (googleVoice) {
          console.log("Using Google voice:", googleVoice.name);
          utterance.voice = googleVoice;
        } else if (englishVoice) {
          console.log("Using English voice:", englishVoice.name);
          utterance.voice = englishVoice;
        }
      }
      
      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        document.dispatchEvent(new CustomEvent('audioPlaying'));
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        document.dispatchEvent(new CustomEvent('audioPaused'));
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        document.dispatchEvent(new CustomEvent('audioPaused'));
      };
      
      // Speak!
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.error('Speech synthesis error:', e);
      setIsPlaying(false);
      return false;
    }
  };
  
  // Toggle play/pause
  const toggleAudio = () => {
    if (isUser) return;
    
    if (isPlaying) {
      // If playing, stop
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    } else {
      // If not playing, start
      if (message.content) {
        const speechText = processTextForSpeech(message.content);
        speakText(speechText);
      }
    }
  };
  
  // Auto-play assistant messages
  useEffect(() => {
    // Only auto-play for assistant messages
    if (isUser || !message.content) return;
    
    // Small delay to make sure UI is ready
    const timer = setTimeout(() => {
      const speechText = processTextForSpeech(message.content);
      if (speechText) {
        speakText(speechText);
        setAudioAvailable(true);
      }
    }, 800);
    
    return () => clearTimeout(timer);
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

  return (
    <div className="w-full my-2 sm:my-3">
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
          
          {/* Play/Pause Button */}
          {audioAvailable && (
            <div className="absolute top-0 right-0 mt-1 mr-1">
              <button 
                onClick={toggleAudio}
                className="p-1.5 rounded-full bg-[#6A53E7] text-white hover:bg-[#5842d6] transition-all"
                title={isPlaying ? "Pause audio" : "Play audio"}
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