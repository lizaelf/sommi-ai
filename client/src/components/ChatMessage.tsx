import React from 'react';
import { Message } from '@shared/schema';
import { ClientMessage } from '@/lib/types';

// Need to ensure the window.voiceAssistant type is available
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
  
  // Process message content to be suitable for speech synthesis
  // but retain the exact message content without significant alterations
  const processTextForSpeech = (content: string): string => {
    if (!content) return '';
    
    let processedText = content;
    
    // Only remove markdown formatting - keep the actual content intact
    // Replace bold markdown formatting with plain text
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Replace other markdown formatting that might cause issues in speech
    processedText = processedText.replace(/\*(.*?)\*/g, '$1');  // Italic
    processedText = processedText.replace(/`(.*?)`/g, '$1');     // Code
    
    // Clean up unnecessary whitespace without changing structure
    // Just convert multiple spaces to single spaces
    processedText = processedText.replace(/[ \t]+/g, ' ');
    
    return processedText;
  };

  // Auto-play the response audio when assistant message is rendered
  React.useEffect(() => {
    // Only attempt to speak for assistant messages with content
    if (isUser || !message.content || message.content.trim().length === 0) return;
    
    // Play response audio with a slight delay
    const timer = setTimeout(() => {
      try {
        console.log("Auto-playing assistant message");
        
        // Process the message content to make it more suitable for speech
        const messageContent = message.content || '';
        const speechText = processTextForSpeech(messageContent);
        
        // Only attempt to speak if we have valid text
        if (speechText && speechText.trim().length > 0 && window.speechSynthesis) {
          // Use browser's speech synthesis directly
          window.speechSynthesis.cancel(); // Cancel any previous speech
          
          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.lang = 'en-US';
          
          // Set event handlers
          utterance.onstart = () => {
            setIsPlaying(true);
            document.dispatchEvent(new CustomEvent('audioPlaying'));
          };
          
          utterance.onend = () => {
            setIsPlaying(false);
            document.dispatchEvent(new CustomEvent('audioPaused'));
          };
          
          utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            setIsPlaying(false);
          };
          
          // Speak the text
          window.speechSynthesis.speak(utterance);
          setAudioAvailable(true);
        } else {
          console.warn('No valid text to speak or speech synthesis unavailable');
        }
      } catch (error) {
        console.error('Error auto-playing message:', error);
      }
    }, 500);
    
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

  // State for controlling audio playback
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioAvailable, setAudioAvailable] = React.useState(false);
  
  // Function to toggle play/pause
  const toggleAudio = () => {
    if (isUser) return; // Only for AI messages
    
    try {
      if (isPlaying) {
        // If audio is playing, pause it
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setIsPlaying(false);
          document.dispatchEvent(new CustomEvent('audioPaused'));
        }
      } else {
        // If audio is paused, play the message content directly
        if (message.content && window.speechSynthesis) {
          // Process the text to remove markdown formatting only
          const speechText = processTextForSpeech(message.content);
          
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();
          
          // Create a new utterance with the text
          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.lang = 'en-US';
          
          // Set up event handlers
          utterance.onstart = () => {
            setIsPlaying(true);
            document.dispatchEvent(new CustomEvent('audioPlaying'));
          };
          
          utterance.onend = () => {
            setIsPlaying(false);
            document.dispatchEvent(new CustomEvent('audioPaused'));
          };
          
          utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            setIsPlaying(false);
            document.dispatchEvent(new CustomEvent('audioPaused'));
          };
          
          // Speak the text
          window.speechSynthesis.speak(utterance);
          setAudioAvailable(true);
        } else {
          console.warn("No text content to speak or speech synthesis unavailable");
        }
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
      setIsPlaying(false);
    }
  };
  
  // Listen for audio events from the voice assistant
  React.useEffect(() => {
    // Event handler functions
    const handleAudioEnded = () => {
      console.log("Audio ended event received");
      setIsPlaying(false);
    };
    
    const handleAudioPlaying = () => {
      console.log("Audio playing event received");
      setIsPlaying(true);
    };
    
    const handleAudioPaused = () => {
      console.log("Audio paused event received");
      setIsPlaying(false);
    };
    
    // Add document-level event listeners for custom events from voiceScript.js
    document.addEventListener('audioEnded', handleAudioEnded);
    document.addEventListener('audioPlaying', handleAudioPlaying);
    document.addEventListener('audioPaused', handleAudioPaused);
    
    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener('audioEnded', handleAudioEnded);
      document.removeEventListener('audioPlaying', handleAudioPlaying);
      document.removeEventListener('audioPaused', handleAudioPaused);
    };
  }, []);
  
  // When a new response is added, update audio availability
  React.useEffect(() => {
    if (!isUser) {
      // When assistant message is added, assume audio will be available
      setAudioAvailable(true);
    }
  }, [message.content, isUser]);

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
