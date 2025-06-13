import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import ChatInput from "@/components/ChatInput";
import VoiceAssistant from "@/components/VoiceAssistant";
import ChatMessage from "@/components/ChatMessage";
import type { Message as ClientMessage } from "@shared/schema";

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

interface SelectedWine {
  id: number;
  name: string;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  buyAgainLink?: string;
}

interface EnhancedChatInterfaceProps {
  showBuyButton?: boolean;
  selectedWine?: SelectedWine | null;
  onReady?: () => void;
}

function EnhancedChatInterface({
  showBuyButton = false,
  selectedWine,
  onReady,
}: EnhancedChatInterfaceProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const currentWine = selectedWine;
  const showChatInput = true;

  // Get recent conversation
  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: true,
  });

  // Load messages for the most recent conversation
  const { data: conversationMessages } = useQuery({
    queryKey: ["/api/messages", currentConversationId],
    enabled: !!currentConversationId,
  });

  useEffect(() => {
    if (conversations && Array.isArray(conversations) && conversations.length > 0) {
      const mostRecent = conversations[0];
      setCurrentConversationId(mostRecent.id);
    }
  }, [conversations]);

  useEffect(() => {
    if (conversationMessages && Array.isArray(conversationMessages)) {
      setMessages(conversationMessages);
    }
  }, [conversationMessages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    setIsTyping(true);
    setHideSuggestions(true);

    try {
      const tempUserMessage: ClientMessage = {
        id: Date.now(),
        content,
        role: "user",
        conversationId: currentConversationId || 0,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, tempUserMessage]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, tempUserMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          wineData: currentWine,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      const assistantMessage: ClientMessage = {
        id: Date.now() + 1,
        content: data.content,
        role: "assistant",
        conversationId: currentConversationId || 0,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const formatContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return (
      <span>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={index} style={{ fontWeight: 600 }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  // Call onReady when component is initialized
  useEffect(() => {
    if (onReady) {
      const timer = setTimeout(() => {
        onReady();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onReady]);

  if (!currentConversationId && (!conversations || !Array.isArray(conversations) || conversations.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] mx-auto" style={{ maxWidth: "1200px" }}>
      {/* Keep only the conversation and input sections */}
      <div className="flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col bg-background overflow-hidden">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Conversation Content */}
            <div id="conversation" className="space-y-4 mb-96 pt-6 px-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={`${message.id}-${index}`}
                  message={message}
                />
              ))}

              {isTyping && (
                <ChatMessage
                  key="typing"
                  message={{
                    id: -1,
                    content: "Typing...",
                    role: "assistant",
                    conversationId: currentConversationId || 0,
                    createdAt: new Date().toISOString(),
                  }}
                />
              )}
            </div>
          </div>

          {/* Fixed Input Area */}
          <div
            style={{
              backgroundColor: "#0A0A0A",
              padding: "20px",
              zIndex: 10,
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {showBuyButton && showChatInput && (
              <Button
                variant="primary"
                onClick={() => window.open(currentWine?.buyAgainLink)}
                className="w-full mb-4 bg-white text-black hover:bg-gray-200"
              >
                Buy Again
              </Button>
            )}

            {!hideSuggestions && !isTyping && (
              <div className="mb-4 space-y-2">
                <button
                  onClick={() => handleSuggestionClick("What makes this wine special?")}
                  className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
                >
                  What makes this wine special?
                </button>
                <button
                  onClick={() => handleSuggestionClick("What food pairs well with this wine?")}
                  className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
                >
                  What food pairs well with this wine?
                </button>
                <button
                  onClick={() => handleSuggestionClick("Tell me about the winemaking process")}
                  className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
                >
                  Tell me about the winemaking process
                </button>
              </div>
            )}

            <ChatInput
              onSendMessage={handleSendMessage}
              isProcessing={isTyping}
              onFocus={() => setIsKeyboardFocused(true)}
              onBlur={() => setIsKeyboardFocused(false)}
            />
            <VoiceAssistant
              onSendMessage={handleSendMessage}
              isProcessing={isTyping}
            />
          </div>
        </main>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 z-20"
        >
          ↓
        </button>
      )}
    </div>
  );
}

export default EnhancedChatInterface;