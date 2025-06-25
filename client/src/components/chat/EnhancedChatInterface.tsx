import React, { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatInputArea from "./ChatInputArea";
import ChatAnswer from "./ChatAnswer";
import { VoiceController } from "@/components/voice";
import SuggestionPills from "@/components/chat/SuggestionPills";
import Button from "@/components/ui/buttons/Button";
import SectionHeaderButton from "@/components/ui/buttons/SectionHeaderButton";
import { FormInput } from "@/components/ui/forms/FormInput";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import { DataSyncManager } from "@/utils/dataSync";
import { ShiningText } from "@/components/animations/ShiningText";
import {
  createStreamingClient,
  isStreamingSupported,
} from "@/lib/streamingClient";
import typography from "@/styles/typography";
import { Wine } from "@/types/wine";

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

interface EnhancedChatInterfaceProps {
  showBuyButton?: boolean;
  selectedWine?: Wine | null;
  onReady?: () => void;
  isScannedPage?: boolean; 
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  showBuyButton = false,
  selectedWine = null,
  onReady,
  isScannedPage = false,
}) => {
  const [currentWine, setCurrentWine] = useState<Wine | null>(selectedWine || null);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(false); // FIX: Define missing variable

  // Initialize component and signal when ready
  useEffect(() => {

    if (selectedWine) {
      setCurrentWine(selectedWine);
      setIsComponentReady(true);

      // Signal parent that component is ready
      const timer = setTimeout(() => {
        onReady?.();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Get wine ID from URL parameters as fallback
      const urlParams = new URLSearchParams(window.location.search);
      const wineId = urlParams.get("wine");

      if (wineId) {
        DataSyncManager.getUnifiedWineData().then((unifiedWines) => {
          const wine = unifiedWines.find((w: Wine) => w.id === parseInt(wineId));
          if (wine) {
            const crmWines = JSON.parse(localStorage.getItem("admin-wines") || "[]");
            const fullWine = crmWines.find((w: any) => w.id === parseInt(wineId));
            setCurrentWine(fullWine || wine);
            setIsComponentReady(true);
            onReady?.();
          }
        });
      }

      // Fallback to first wine in CRM
      const crmWines = JSON.parse(localStorage.getItem("admin-wines") || "[]");
      const wine = crmWines.find((w: any) => w.id === 1) || crmWines[0];
      if (wine) {
        setCurrentWine(wine);
        setIsComponentReady(true);
        onReady?.();
      }
    }
  }, [selectedWine, onReady]);

  // Use conversation hook
  const {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations,
    createNewConversation,
    clearConversation,
    refetchMessages,
    updateLastAssistantMessage,
  } = useConversation(currentWine ? `wine_${currentWine.id}` : "default");

  // Clear old conversation data if wine doesn't match stored messages
  useEffect(() => {
    if (currentWine && messages.length > 0) {
      const hasOldRidgeContent = messages.some(
        (msg) =>
          msg.content.includes('Ridge "Lytton Springs"') &&
          !currentWine.name.includes("Ridge"),
      );

      if (hasOldRidgeContent) {
        console.log(
          "Clearing outdated conversation data for wine:",
          currentWine.name,
        );
        clearConversation();
      }
    }
  }, [currentWine, messages, clearConversation]);

  // Listen for chat history clearing events
  useEffect(() => {
    const handleChatHistoryCleared = () => {
      console.log("Chat history cleared event received");
      clearConversation();
      createNewConversation();
    };

    window.addEventListener("chat-history-cleared", handleChatHistoryCleared);

    return () => {
      window.removeEventListener(
        "chat-history-cleared",
        handleChatHistoryCleared,
      );
    };
  }, [clearConversation, createNewConversation]);

  // Listen for cached suggestion messages from SuggestionPills
  useEffect(() => {
    const handleAddChatMessage = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userMessage, assistantMessage } = customEvent.detail;

      console.log("EnhancedChatInterface: Received cached suggestion messages");

      // Add both messages to the conversation
      if (userMessage) {
        await addMessage(userMessage);
      }
      if (assistantMessage) {
        await addMessage(assistantMessage);
      }

      // Hide suggestions after use
      setHideSuggestions(true);

      // Refresh messages to ensure they appear
      refetchMessages();
    };

    window.addEventListener("addChatMessage", handleAddChatMessage);

    return () => {
      window.removeEventListener("addChatMessage", handleAddChatMessage);
    };
  }, [addMessage, refetchMessages]);

  // Chat interface states
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const [latestMessageId, setLatestMessageId] = useState<number | null>(null);
  const [showFullConversation, setShowFullConversation] = useState(false);
  // Для стрімінгу: локальний стейт для поточного assistant-повідомлення
  const [assistantStreamingMessage, setAssistantStreamingMessage] = useState<ClientMessage | null>(null);

  // Voice assistant state
  const voiceControllerRef = useRef<any>(null);
  const [, setLocation] = useLocation();
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [hasTriggeredAutoQuestion, setHasTriggeredAutoQuestion] =
    useState(false);
  const [currentEventSource, setCurrentEventSource] =
    useState<EventSource | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Create a ref for the chat container
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll detection for showing/hiding scroll to bottom button
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom && messages.length > 3);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages.length]);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 30000,
  });

  // Auto-scroll behavior
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.role === "user") {
        setTimeout(() => {
          const conversationContainer = document.getElementById("conversation");
          if (conversationContainer) {
            const messageElements = conversationContainer.children;
            if (messageElements.length > 0) {
              const lastUserMessageElement = messageElements[
                messageElements.length - 1
              ] as HTMLElement;

              lastUserMessageElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
              });
            }
          }
        }, 100);
      }
    }
  }, [messages.length]);

  // Reset suggestions visibility when conversation changes
  useEffect(() => {
    if (messages.length === 0) {
      setHideSuggestions(false);
    }
  }, [messages.length]);

  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);
  const [voiceState, setVoiceState] = useState({
    isListening: false,
    isThinking: false,
    isResponding: false,
    isPlayingAudio: false,
    showUnmuteButton: false,
    showAskButton: false,
    showSuggestions: true,
  });

  const [showUnmuteButton, setShowUnmuteButton] = useState(false);

  // onMicClick — просто тригерить глобальну подію
  const handleMicClick = () => {
    window.dispatchEvent(new CustomEvent('triggerMicButton'));
  };

  // Stop - stops everything and resets states
  const handleStop = () => {
    // here we stop recording, audio, TTS
    setVoiceState({
      isListening: false,
      isThinking: false,
      isResponding: false,
      isPlayingAudio: false,
      showUnmuteButton: false,
      showAskButton: true,
      showSuggestions: true,
    });
  };

  // Unmute - restores audio
  const handleUnmute = () => {
    // here we restore audio
    setVoiceState({
      ...voiceState,
      isListening: false,
      isThinking: false,
      isResponding: true,
      isPlayingAudio: true,
      showUnmuteButton: false,
      showAskButton: false,
      showSuggestions: false,
    });
    setShowUnmuteButton(false);
  };

  // Ask - starts a new recording
  const handleAsk = () => {
    setVoiceState({
      isListening: true,
      isThinking: false,
      isResponding: false,
      isPlayingAudio: false,
      showUnmuteButton: false,
      showAskButton: false,
      showSuggestions: false,
    });
    // here we start recording
  };

  // onSuggestionClick immediately adds text to chat
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
    setVoiceSheetOpen(false);
    setVoiceState({
      isListening: false,
      isThinking: false,
      isResponding: false,
      isPlayingAudio: false,
      showUnmuteButton: false,
      showAskButton: false,
      showSuggestions: true,
    });
  };

  // onTranscribe - when recording is finished and there's text
  const handleTranscribe = (text: string) => {
    handleSendMessage(text);
    setVoiceSheetOpen(false);
    setVoiceState({
      isListening: false,
      isThinking: false,
      isResponding: false,
      isPlayingAudio: false,
      showUnmuteButton: false,
      showAskButton: false,
      showSuggestions: true,
    });
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === "" || !currentConversationId) return;

    // Expand chat to show full conversation history
    setShowFullConversation(true);

    setHideSuggestions(true);
    setIsTyping(true);

    try {
      const tempUserMessage: ClientMessage = {
        id: Date.now(),
        content,
        role: "user",
        conversationId: currentConversationId,
        createdAt: new Date().toISOString(),
      };

      await addMessage(tempUserMessage);

      const requestBody = {
        messages: [{ role: "user", content }],
        conversationId: currentConversationId,
        wineData: currentWine,
        optimize_for_speed: true,
      };

      // ВІДМІНЯЄМО СТРІМІНГ: завжди використовуємо простий fetch

      // Fallback to regular request
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Priority": "high",
        },
        body: JSON.stringify(requestBody),
        credentials: "same-origin",
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
        handleAddMessage(assistantMessage);
        window.dispatchEvent(new CustomEvent("showUnmuteButton"));
      }
    } catch (error) {
      console.error("Error in chat request:", error);
      // toastError(`Failed to get a response: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsTyping(false);
      setCurrentEventSource(null);
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

  // Обертка для addMessage, чтобы показывать Unmute и готовить текст для озвучки
  const handleAddMessage = (message: ClientMessage) => {
    if (message.role === 'assistant' && voiceControllerRef.current?.showUnmuteForText) {
      voiceControllerRef.current.showUnmuteForText(message.content);
    }
    addMessage(message);
  };

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
    <div className="flex flex-col h-auto" style={{ width: "100%" }}>
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main
          className="flex-1 flex flex-col bg-background overflow-hidden"
          style={{
            backgroundColor: "#0A0A0A !important",
            backgroundImage: "none !important",
            width: "100%",
          }}
        >
          {/* Scrollable container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto scrollbar-hide"
          >
            {/* Conversation Content */}
            <div style={{ width: "100%" }}>
              {/* Chat Title */}
              <div
                style={{
                  marginBottom: "16px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
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
                <SectionHeaderButton
                  onClick={() => {
                    // Navigate to dedicated chat page
                    window.location.href = "/chat";
                  }}
                >
                  See all
                </SectionHeaderButton>
              </div>

              <div
                id="conversation"
                className="space-y-4 mb-96"
                style={{
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  width: "100%",
                }}
              >
                {showFullConversation || messages.length > 0 ? (
                  <>
                    {/* Show full conversation history when expanded */}
                    {messages.map((message: any, index: number) => (
                      <div
                        key={`${message.id}-${index}`}
                        style={{
                          display: "flex",
                          justifyContent:
                            message.role === "user" ? "flex-end" : "flex-start",
                          width: "100%",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor:
                              message.role === "user"
                                ? "#DBDBDB"
                                : "transparent",
                            borderRadius: "16px",
                            padding:
                              message.role === "user" ? "16px" : "0 0 16px 0",
                            width:
                              message.role === "user" ? "fit-content" : "100%",
                            maxWidth: message.role === "user" ? "80%" : "100%",
                          }}
                        >
                          <ChatAnswer
                            content={message.content}
                            isUserMessage={message.role === "user"}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                ) : !isScannedPage && !isUserRegistered ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      minHeight: "200px",
                      width: "100%",
                      padding: "0 0 16px 0",
                    }}
                  >
                    {/* Sample Question */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#DBDBDB",
                          borderRadius: "16px",
                          padding: "16px",
                          width: "fit-content",
                          maxWidth: "80%",
                        }}
                      >
                        <div
                          style={{
                            color: "#000000",
                            ...typography.body,
                          }}
                        >
                          What makes this Zinfandel special?
                        </div>
                      </div>
                    </div>

                    {/* Sample Answer (5 lines max) */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "transparent",
                          borderRadius: "16px",
                          padding: "0 0 16px 0",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            color: "#DBDBDB",
                            ...typography.body,
                            display: "-webkit-box",
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {selectedWine?.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "200px",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.6)",
                        ...typography.body,
                        textAlign: "center",
                        margin: "0",
                      }}
                    >
                      Ask a question to see chat history
                    </p>
                  </div>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      marginBottom: "12px",
                      padding: "16px",
                    }}
                  >
                    <ShiningText text="Thinking..." />
                  </div>
                )}
              </div>
            </div>

            {/* Extra space at the bottom */}
            <div style={{ height: "80px" }}></div>
          </div>

          {/* Input Area - Fixed to Bottom */}
          <ChatInputArea
            currentWine={currentWine}
            currentConversationId={currentConversationId}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onSuggestionClick={handleSuggestionClick}
            onKeyboardFocus={(focused: boolean) =>
              setIsKeyboardFocused(focused)
            }
            onMicClick={handleMicClick}
          />
        </main>

      </div>

      {/* VoiceController — один раз на сторінку, слухає події, керує всім флоу */}
      <VoiceController
        ref={voiceControllerRef}
        onSendMessage={handleSendMessage}
        onAddMessage={handleAddMessage}
        isProcessing={isTyping}
      />

    </div>
  );
};

export default EnhancedChatInterface;
