import React, { useRef, useEffect, useState } from "react";
import { useToast } from "@/hooks/UseToast";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import VoiceAssistant from "./VoiceAssistant";
import Button from "./ui/Button";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import typography from "@/styles/typography";
import { DataSyncManager } from "@/utils/dataSync";

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

interface ChatOnlyProps {
  showBuyButton?: boolean;
  selectedWine?: SelectedWine | null;
}

const ChatOnly: React.FC<ChatOnlyProps> = ({
  showBuyButton = false,
  selectedWine = null,
}) => {
  const [currentWine, setCurrentWine] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    currentConversationId,
    messages,
    refetchMessages,
    addMessage,
  } = useConversation();

  // Load current wine data
  useEffect(() => {
    if (selectedWine) {
      setCurrentWine(selectedWine);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const wineId = urlParams.get('wine');
      
      if (wineId) {
        const unifiedWines = DataSyncManager.getUnifiedWineData();
        const wine = unifiedWines.find((w: any) => w.id === parseInt(wineId));
        if (wine) {
          const crmWines = JSON.parse(localStorage.getItem('admin-wines') || '[]');
          const fullWine = crmWines.find((w: any) => w.id === parseInt(wineId));
          setCurrentWine(fullWine || wine);
          return;
        }
      }
      
      const crmWines = JSON.parse(localStorage.getItem('admin-wines') || '[]');
      const wine = crmWines.find((w: any) => w.id === 1) || crmWines[0];
      if (wine) {
        setCurrentWine(wine);
      }
    }
  }, [selectedWine]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;

    setIsTyping(true);

    try {
      const userMessage: ClientMessage = {
        id: Date.now(),
        content: messageText,
        role: "user",
        conversationId: currentConversationId,
        createdAt: new Date().toISOString(),
      };

      addMessage(userMessage);

      const requestBody = {
        message: messageText,
        conversationId: currentConversationId,
        wineData: currentWine,
      };

      // Try streaming first if supported
      if (isStreamingSupported()) {
        const eventSource = createStreamingClient("/api/chat/stream", requestBody);
        setCurrentEventSource(eventSource);
        
        let streamingContent = '';
        const assistantMessageId = Date.now() + 1;
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
              case 'start':
                const initialMessage: ClientMessage = {
                  id: assistantMessageId,
                  content: streamingContent,
                  role: "assistant",
                  conversationId: currentConversationId,
                  createdAt: new Date().toISOString(),
                };
                
                addMessage(initialMessage);
                setLatestMessageId(assistantMessageId);
                break;
                
              case 'token':
                if (data.content) {
                  streamingContent += data.content;
                  refetchMessages();
                }
                break;
                
              case 'complete':
                console.log("Streaming completed successfully");
                (window as any).lastAssistantMessageText = streamingContent;
                window.dispatchEvent(new CustomEvent('showUnmuteButton'));
                eventSource.close();
                setCurrentEventSource(null);
                refetchMessages();
                break;
                
              case 'error':
                console.error("Streaming error:", data.message);
                eventSource.close();
                setCurrentEventSource(null);
                throw new Error(data.message || 'Streaming failed');
            }
          } catch (parseError) {
            console.error('Error parsing streaming event:', parseError);
            eventSource.close();
            setCurrentEventSource(null);
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          eventSource.close();
          setCurrentEventSource(null);
          throw new Error('Streaming connection failed');
        };
        
        return;
      }
      
      // Fallback to regular request
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Priority": "high",
        },
        body: JSON.stringify(requestBody),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.message && responseData.message.content) {
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          content: responseData.message.content,
          role: "assistant",
          conversationId: currentConversationId,
          createdAt: new Date().toISOString(),
        };

        setLatestMessageId(assistantMessage.id);
        (window as any).lastAssistantMessageText = assistantMessage.content;
        addMessage(assistantMessage);
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

  return (
    <div style={{ 
      backgroundColor: "#0A0A0A", 
      padding: "24px",
      marginTop: "24px" 
    }}>
      {/* Chat with AI Section */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            ...typography.h1,
            color: "white",
            marginBottom: "24px",
            textAlign: "left",
          }}
        >
          Chat
        </h1>
        
        {/* Show recent conversation messages */}
        {messages.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            {(() => {
              // Show last 2-3 conversation exchanges (4-6 messages)
              const recentMessages = messages.slice(-6);
              
              return recentMessages.map((message: any, index: number) => (
                <div
                  key={`recent-${message.id}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                    width: "100%",
                    marginBottom: "12px",
                  }}
                >
                  <ChatMessage
                    message={message}
                    isLatest={message.id === latestMessageId}
                    isUserMessage={message.role === "user"}
                  />
                </div>
              ));
            })()}
          </div>
        )}

        {/* Chat Input Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button
              onClick={() => handleSendMessage("What are the tasting notes?")}
              variant="secondary"
              style={{ height: "32px" }}
            >
              Tasting notes
            </Button>
            <Button
              onClick={() => handleSendMessage("Simple recipes for this wine")}
              variant="secondary"
              style={{ height: "32px" }}
            >
              Simple recipes
            </Button>
            <Button
              onClick={() => handleSendMessage("Where is this wine from?")}
              variant="secondary"
              style={{ height: "32px" }}
            >
              Where it's from
            </Button>
          </div>
          <ChatInput
            onSendMessage={handleSendMessage}
            isProcessing={isTyping}
            onFocus={() => setIsKeyboardFocused(true)}
            onBlur={() => setIsKeyboardFocused(false)}
            voiceButtonComponent={
              <VoiceAssistant
                onSendMessage={handleSendMessage}
                isProcessing={isTyping}
              />
            }
          />
        </div>

        {/* Show Buy Again button if enabled */}
        {showBuyButton && currentWine && currentWine.buyAgainLink && (
          <div style={{ marginTop: "16px" }}>
            <Button
              onClick={() => window.open(currentWine.buyAgainLink, '_blank')}
              variant="primary"
              style={{ width: "100%", height: "56px" }}
            >
              Buy Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatOnly;