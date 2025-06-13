import React, { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/UseToast";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import { DataSyncManager } from "@/utils/dataSync";
import { createStreamingClient, isStreamingSupported } from "@/lib/streamingClient";
import typography from "@/styles/typography";
import ChatMessageList, { Message } from "./ChatMessageList";
import ChatInputArea from "./ChatInputArea";
import ContactBottomSheet, { ContactFormData } from "./ContactBottomSheet";
import ScrollToBottomButton from "./ScrollToBottomButton";

// Extend Window interface to include voiceAssistant
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
}

interface ChatInterfaceProps {
  showBuyButton?: boolean;
  selectedWine?: SelectedWine | null;
  onReady?: () => void;
}

export default function ChatInterface({ 
  showBuyButton = false, 
  selectedWine, 
  onReady 
}: ChatInterfaceProps) {
  const [location, setLocation] = useLocation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [currentEventSource, setCurrentEventSource] = useState<EventSource | null>(null);
  const { toast } = useToast();
  
  // Wine and conversation state
  const [currentWine, setCurrentWine] = useState<any>(null);
  const [showChatInput, setShowChatInput] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const {
    messages,
    addMessage,
    conversations,
    currentConversationId: hookConversationId,
    setCurrentConversationId: setHookConversationId,
    refetchMessages,
  } = useConversation();

  // Format content for message display
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      console.log("Initializing conversation...");
      try {
        const conversations = await getAllConversations();
        
        if (conversations && conversations.length > 0) {
          const mostRecent = conversations[0];
          console.log(`Using most recent conversation from backend: ${mostRecent.id}`);
          
          const conversationWithMessages = await getConversationById(mostRecent.id);
          if (conversationWithMessages) {
            setCurrentConversationId(mostRecent.id);
            setMessages(conversationWithMessages.messages || []);
            console.log(`Loaded ${conversationWithMessages.messages?.length || 0} messages from backend`);
          }
        }
        
        setIsComponentReady(true);
        console.log("Chat interface ready");
        onReady?.();
      } catch (error) {
        console.error("Error initializing conversation:", error);
        setIsComponentReady(true);
        onReady?.();
      }
    };

    initializeConversation();
  }, [getAllConversations, getConversationById, setMessages, onReady]);

  // Wine data initialization
  useEffect(() => {
    const loadWineData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const wineIdFromUrl = urlParams.get('wineId');
        const wineIdFromPath = window.location.pathname.match(/wine-details\/(\d+)/)?.[1];
        const wineId = wineIdFromUrl || wineIdFromPath || selectedWine?.id?.toString() || "1";
        
        const wineData = DataSyncManager.getWineById(parseInt(wineId));
        if (wineData) {
          setCurrentWine(wineData);
        }
      } catch (error) {
        console.error("Error loading wine data:", error);
      }
    };

    loadWineData();
  }, [selectedWine]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Message handling
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;

    try {
      setIsTyping(true);
      
      const userMessage: ClientMessage = {
        role: "user",
        content: messageText.trim(),
        conversationId: currentConversationId || undefined,
      };

      addMessage(userMessage);

      if (isStreamingSupported()) {
        await handleStreamingResponse(userMessage);
      } else {
        await handleRegularResponse(userMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleStreamingResponse = async (userMessage: ClientMessage) => {
    const client = createStreamingClient();
    let assistantMessage = "";

    try {
      const stream = await client.sendMessage({
        messages: [...messages, userMessage],
        wineId: currentWine?.id,
      });

      const assistantMessageObj: ClientMessage = {
        role: "assistant",
        content: "",
        conversationId: currentConversationId || undefined,
      };

      addMessage(assistantMessageObj);

      for await (const chunk of stream) {
        if (chunk.content) {
          assistantMessage += chunk.content;
          assistantMessageObj.content = assistantMessage;
          
          setMessages(prev => [
            ...prev.slice(0, -1),
            assistantMessageObj
          ]);
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      throw error;
    }
  };

  const handleRegularResponse = async (userMessage: ClientMessage) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        wineId: currentWine?.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const assistantMessage: ClientMessage = {
      role: "assistant",
      content: data.content,
      conversationId: currentConversationId || undefined,
    };

    addMessage(assistantMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleContactSubmit = async (contactData: ContactFormData) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contact information saved successfully!",
        });
      } else {
        throw new Error("Failed to save contact information");
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact information. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentEventSource) {
        currentEventSource.close();
        setCurrentEventSource(null);
      }
    };
  }, [currentEventSource]);

  // Show loading state while initializing
  if (!isComponentReady || !currentConversationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <span className="text-gray-400 text-sm">Loading chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-auto mx-auto" style={{ maxWidth: "1200px" }}>
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main
          className="flex-1 flex flex-col bg-background overflow-hidden"
          style={{
            backgroundColor: "#0A0A0A !important",
            backgroundImage: "none !important",
          }}
        >
          {/* Scrollable container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto scrollbar-hide"
          >
            {/* Conversation Content */}
            <div>
              {/* Chat Title */}
              <div style={{ marginBottom: "24px" }}>
                <h1
                  style={{
                    color: "white",
                    textAlign: "left",
                    margin: "0",
                    ...typography.h1,
                  }}
                >
                  Chat
                </h1>
              </div>
              
              <ChatMessageList
                messages={messages as Message[]}
                isTyping={isTyping}
                formatContent={formatContent}
              />
            </div>

            {/* Extra space at the bottom */}
            <div style={{ height: "80px" }}></div>
          </div>

          <ChatInputArea
            showBuyButton={showBuyButton}
            showChatInput={showChatInput}
            currentWine={currentWine}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            onKeyboardFocus={setIsKeyboardFocused}
            onSuggestionClick={handleSuggestionClick}
          />
        </main>

        <ScrollToBottomButton
          visible={showScrollToBottom}
          onClick={scrollToBottom}
        />
      </div>

      <ContactBottomSheet
        isOpen={showContactSheet}
        onClose={() => setShowContactSheet(false)}
        onSubmit={handleContactSubmit}
      />
    </div>
  );
}

export type { SelectedWine };