import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { VoiceButton } from './VoiceButton';
import { useConversation } from '@/hooks/useConversation';
import { ClientMessage } from '@/lib/types';
import { speakText, getOpenAIVoiceAudio } from '@/lib/voiceUtils';

// Create an enhanced chat interface that uses IndexedDB for persistence
const EnhancedChatInterface: React.FC = () => {
  // Use our enhanced conversation hook
  const {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations,
    createNewConversation,
    clearConversation,
    refetchMessages
  } = useConversation();

  // Basic states 
  const [isTyping, setIsTyping] = useState(false);
  const [useVoiceResponse, setUseVoiceResponse] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  // Create a ref for the chat container to allow scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });
  
  // Improved scroll behavior for better user experience
  useEffect(() => {
    // Always scroll to bottom when messages change or typing status changes
    if (chatContainerRef.current) {
      // Add a small delay to ensure DOM is fully updated
      setTimeout(() => {
        // Calculate the position to scroll to the bottom
        const scrollToPosition = chatContainerRef.current?.scrollHeight || 0;
        
        // Smooth scroll to the position
        chatContainerRef.current?.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages, isTyping]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === '' || !currentConversationId) return;
    
    setIsTyping(true);
    
    try {
      // Add user message to UI immediately
      const tempUserMessage: ClientMessage = {
        id: Date.now(),
        content,
        role: 'user',
        conversationId: currentConversationId,
        createdAt: new Date().toISOString()
      };
      
      // Add message to the conversation
      await addMessage(tempUserMessage);
      
      // Create a system message containing the prompt
      const systemPrompt = "You are a friendly wine expert specializing in Cabernet Sauvignon. Your responses should be warm, engaging, and informative. Focus on providing interesting facts, food pairings, and tasting notes specific to Cabernet Sauvignon. Keep your responses concise but informative.";
      
      // Make the API request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content }
          ],
          conversationId: currentConversationId
        })
      });
      
      const responseData = await response.json();
      
      // Add the assistant's response to the UI immediately
      if (responseData.message && responseData.message.content) {
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1, // Ensure unique ID
          content: responseData.message.content,
          role: 'assistant',
          conversationId: currentConversationId,
          createdAt: new Date().toISOString()
        };
        
        // Add assistant message to the conversation
        await addMessage(assistantMessage);

        // If voice response is enabled, speak the response
        if (useVoiceResponse && responseData.message.content) {
          try {
            setIsPlaying(true);
            
            // Attempt to use OpenAI's TTS API
            try {
              const audio = await getOpenAIVoiceAudio(responseData.message.content);
              if (audio) {
                audioRef.current = audio;
                audio.onended = () => {
                  setIsPlaying(false);
                };
                audio.play();
              }
            } catch (voiceError) {
              console.error("Error using OpenAI TTS:", voiceError);
              // Fallback to browser's speech synthesis
              speakText(responseData.message.content, () => {
                setIsPlaying(false);
              });
            }
          } catch (speechError) {
            console.error("Speech synthesis error:", speechError);
            setIsPlaying(false);
          }
        }
      }
      
      // Refresh all messages
      refetchMessages();
      
    } catch (error) {
      console.error('Error in chat request:', error);
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Display loading state if no currentConversationId
  if (!currentConversationId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
          {/* Scrollable container */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Wine bottle image (always show at top with responsive height) */}
            <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-200 flex items-center justify-center">
              <img 
                src="https://t3.ftcdn.net/jpg/02/22/85/16/360_F_222851624_jfoMGbJxwRi5AWGdPgXKSABMnzCQo9RN.jpg" 
                alt="Wine bottle collection" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Chat Messages */}
            <div className="px-3 sm:px-4 py-3 sm:py-4 pb-36 space-y-0 max-w-3xl mx-auto w-full">
              {/* Always show the welcome message */}
              <div className="mx-auto p-3 sm:p-5 max-w-lg" style={{ marginBottom: '0' }}>
                
                <p className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-purple-800">
                  Hi! I'm your personal sommelier.
                </p>
                <p className="text-sm sm:text-base text-gray-700 mb-0">
                  I see you've ordered Cabernet Sauvignon. You've got excellent taste! Would you like me to tell you a short story about this wine?
                </p>
                
                {messages.length === 0 && <div className="h-10 sm:h-16"></div>}
              </div>
              
              {/* Show any conversation messages directly below the welcome message */}
              {messages.length > 0 && 
                messages.map((message, index) => (
                  <ChatMessage 
                    key={`${message.id}-${index}`} 
                    message={message} 
                  />
                ))
              }

              {/* Typing Indicator */}
              {isTyping && (
                <div className="mx-auto max-w-2xl">
                  <div className="p-2 sm:p-4">
                    <div className="text-gray-700">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Fixed to Bottom */}
          <div className="bg-white p-2 sm:p-3 shadow-lg border-t border-gray-100 z-50 fixed bottom-0 left-0 right-0">
            <div className="max-w-3xl mx-auto">
              {/* Suggestion chips */}
              <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                <button 
                  onClick={() => handleSendMessage("Tasting notes")}
                  className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-xs sm:text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  Tasting notes
                </button>
                <button 
                  onClick={() => handleSendMessage("Simple recipes for this wine")}
                  className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-xs sm:text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  Simple recipes
                </button>
                <button 
                  onClick={() => handleSendMessage("Where is this wine from?")}
                  className="whitespace-nowrap py-1.5 sm:py-2 px-3 sm:px-4 bg-transparent text-[#6A53E7] rounded-full border border-[#6A53E7] text-xs sm:text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  Where it's from
                </button>
              </div>
              
              <div className="relative flex items-center gap-1.5 sm:gap-2">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isProcessing={isTyping}
                />
                <div className="flex items-center">
                  <VoiceButton
                    onTranscript={handleSendMessage}
                    isProcessing={isTyping || isPlaying}
                    className="ml-1"
                  />
                  <button 
                    className={`ml-1 p-2 rounded-full ${useVoiceResponse ? 'text-purple-600 bg-purple-100' : 'text-gray-400'}`}
                    onClick={() => setUseVoiceResponse(!useVoiceResponse)}
                    title={useVoiceResponse ? "Disable voice responses" : "Enable voice responses"}
                  >
                    {useVoiceResponse ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;