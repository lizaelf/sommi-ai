import React, { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/UseToast";
import { X } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import VoiceAssistant from "./VoiceAssistant";
import Button from "./ui/Button";
import { FormInput } from "./ui/FormInput";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import { DataSyncManager } from "@/utils/dataSync";
import { ShiningText } from "@/components/ShiningText";
import {
  createStreamingClient,
  isStreamingSupported,
} from "@/lib/streamingClient";
import typography from "@/styles/typography";
import ContactBottomSheet, { ContactFormData } from "./ContactBottomSheet";

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

interface EnhancedChatInterfaceProps {
  showBuyButton?: boolean;
  selectedWine?: SelectedWine | null;
  onReady?: () => void;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  showBuyButton = false,
  selectedWine = null,
  onReady,
}) => {
  const [currentWine, setCurrentWine] = useState<any>(selectedWine || null);
  const [isComponentReady, setIsComponentReady] = useState(false);

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
        const unifiedWines = DataSyncManager.getUnifiedWineData();
        const wine = unifiedWines.find((w: any) => w.id === parseInt(wineId));
        if (wine) {
          const crmWines = JSON.parse(
            localStorage.getItem("admin-wines") || "[]",
          );
          const fullWine = crmWines.find((w: any) => w.id === parseInt(wineId));
          setCurrentWine(fullWine || wine);
          setIsComponentReady(true);
          onReady?.();
          return;
        }
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

  // Check if user has shared contact information
  const [hasSharedContact, setHasSharedContact] = useState(() => {
    return localStorage.getItem("hasSharedContact") === "true";
  });

  // State to control showing chat input interface instead of contact form
  const [showChatInput, setShowChatInput] = useState(true);

  // State for contact bottom sheet
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [animationState, setAnimationState] = useState<
    "closed" | "opening" | "open" | "closing"
  >("closed");
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [selectedCountry, setSelectedCountry] = useState({
    dial_code: "+1",
    flag: "🇺🇸",
    name: "United States",
    code: "US",
  });

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  // Set up portal element for contact bottom sheet
  useEffect(() => {
    const portal = document.createElement("div");
    document.body.appendChild(portal);
    setPortalElement(portal);

    return () => {
      document.body.removeChild(portal);
    };
  }, []);

  const handleCloseContactSheet = () => {
    setShowContactSheet(false);
    setAnimationState("closing");
    setTimeout(() => setAnimationState("closed"), 300);
  };

  // Form validation and handling
  const validateForm = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          phone: `${selectedCountry.dial_code}${formData.phone}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("hasSharedContact", "true");
        setHasSharedContact(true);
        handleCloseContactSheet();

        toast({
          description: (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Contact saved successfully!
            </span>
          ),
          duration: 3000,
          className: "bg-white text-black border-none",
          style: {
            position: "fixed",
            top: "91px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            maxWidth: "none",
            padding: "8px 24px",
            borderRadius: "32px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
        });
      } else {
        console.error("Failed to save contact:", data);
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Simplified content formatter for lists and bold text
  const formatContent = (content: string) => {
    if (!content) return null;

    const formatText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      );
    };

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    lines.forEach((line, i) => {
      const isListItem = /^[-•*]\s|^\d+\.\s/.test(line.trim());

      if (isListItem) {
        listItems.push(line.trim().replace(/^[-•*]\s|^\d+\.\s/, ""));
      } else {
        if (listItems.length > 0) {
          elements.push(
            <div key={`list-${i}`} style={{ margin: "8px 0" }}>
              {listItems.map((item, j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    marginBottom: "4px",
                    paddingLeft: "8px",
                  }}
                >
                  <span style={{ color: "#6A53E7", marginRight: "8px" }}>
                    •
                  </span>
                  <span>{formatText(item)}</span>
                </div>
              ))}
            </div>,
          );
          listItems = [];
        }

        if (line.trim()) {
          elements.push(
            <div
              key={i}
              style={{ marginBottom: "8px", whiteSpace: "pre-wrap" }}
            >
              {formatText(line)}
            </div>,
          );
        }
      }
    });

    if (listItems.length > 0) {
      elements.push(
        <div key="final-list" style={{ margin: "8px 0" }}>
          {listItems.map((item, j) => (
            <div
              key={j}
              style={{
                display: "flex",
                marginBottom: "4px",
                paddingLeft: "8px",
              }}
            >
              <span style={{ color: "#6A53E7", marginRight: "8px" }}>•</span>
              <span>{formatText(item)}</span>
            </div>
          ))}
        </div>,
      );
    }

    return <>{elements}</>;
  };

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

  // Chat interface states
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const [latestMessageId, setLatestMessageId] = useState<number | null>(null);
  const [showFullConversation, setShowFullConversation] = useState(false);
  const [, setLocation] = useLocation();
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [hasTriggeredAutoQuestion, setHasTriggeredAutoQuestion] =
    useState(false);
  const [currentEventSource, setCurrentEventSource] =
    useState<EventSource | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const { toast } = useToast();

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

  // Handle suggestion button clicks - TEXT ONLY responses
  const handleSuggestionClick = async (content: string) => {
    if (content.trim() === "" || !currentConversationId) return;

    console.log("EnhancedChatInterface: Handling text-only suggestion:", content);
    
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
        text_only: true, // Ensure text-only response
        disable_audio: true, // Explicitly disable any audio processing
      };

      console.log("EnhancedChatInterface: Sending text-only request:", requestBody);

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

        await addMessage(assistantMessage);
        console.log("EnhancedChatInterface: Text-only response added successfully");
      }

      refetchMessages();
    } catch (error) {
      console.error("Error in suggestion request:", error);
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === "" || !currentConversationId) return;

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

      // Check if streaming is enabled
      const enableStreaming = import.meta.env.VITE_ENABLE_STREAMING === "true";

      if (enableStreaming && isStreamingSupported()) {
        // Streaming implementation
        const eventSource = new EventSource(
          `/api/chat-stream?${new URLSearchParams({
            messages: JSON.stringify([{ role: "user", content }]),
            conversationId: currentConversationId?.toString() || "",
            wineData: JSON.stringify(currentWine),
            optimize_for_speed: "true",
          })}`,
        );

        setCurrentEventSource(eventSource);

        let streamingContent = "";
        let assistantMessageId = Date.now() + 1;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case "first_token":
                streamingContent = data.content;

                if (data.start_tts && window.voiceAssistant?.speakResponse) {
                  window.voiceAssistant.speakResponse(data.content);
                }

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

              case "token":
                if (data.content) {
                  streamingContent += data.content;
                  refetchMessages();
                }
                break;

              case "complete":
                (window as any).lastAssistantMessageText = streamingContent;
                window.dispatchEvent(new CustomEvent("showUnmuteButton"));
                eventSource.close();
                setCurrentEventSource(null);
                refetchMessages();
                break;

              case "error":
                console.error("Streaming error:", data.message);
                eventSource.close();
                setCurrentEventSource(null);
                throw new Error(data.message || "Streaming failed");
            }
          } catch (parseError) {
            console.error("Error parsing streaming event:", parseError);
            eventSource.close();
            setCurrentEventSource(null);
          }
        };

        eventSource.onerror = (error) => {
          console.error("EventSource error:", error);
          eventSource.close();
          setCurrentEventSource(null);
          throw new Error("Streaming connection failed");
        };

        return;
      }

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
        await addMessage(assistantMessage);
        window.dispatchEvent(new CustomEvent("showUnmuteButton"));
      }

      refetchMessages();
    } catch (error) {
      console.error("Error in chat request:", error);
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
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
    <div
      className="flex flex-col h-auto"
      style={{ width: "100%" }}
    >
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
              <div style={{ marginBottom: "24px", paddingLeft: "16px", paddingRight: "16px" }}>
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
              
              <div id="conversation" className="space-y-4 mb-96" style={{ paddingLeft: "16px", paddingRight: "16px", width: "100%" }}>
                {messages.length > 0 ? (
                  <>
                    {messages.map((message: any, index: number) => (
                      <div
                        key={`${message.id}-${index}`}
                        style={{
                          display: "flex",
                          justifyContent:
                            message.role === "user" ? "flex-end" : "flex-start",
                          width: "100%",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor:
                              message.role === "user"
                                ? "#F5F5F5"
                                : "transparent",
                            borderRadius: "16px",
                            padding: message.role === "user" ? "12px 16px 12px 16px" : "16px 0",
                            width:
                              message.role === "user" ? "fit-content" : "100%",
                            maxWidth: message.role === "user" ? "80%" : "100%",
                          }}
                        >
                          {message.role === "assistant" ? (
                            <div
                              style={{
                                color: "#DBDBDB",
                                fontFamily: "Inter, system-ui, sans-serif",
                                fontSize: "16px",
                                lineHeight: "1.6",
                              }}
                            >
                              {formatContent(message.content)}
                            </div>
                          ) : (
                            <div
                              style={{
                                color: "#000000",
                                fontFamily: "Inter, system-ui, sans-serif",
                                fontSize: "16px",
                                lineHeight: "1.6",
                              }}
                            >
                              {formatContent(message.content)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
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
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: "16px",
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
          <div
            style={{
              backgroundColor: "#1C1C1C",
              padding: "16px",
              zIndex: 50,
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div className="max-w-3xl mx-auto">
              {showBuyButton && !showChatInput ? (
                <Button
                  onClick={() => {
                    if (currentWine?.buyAgainLink) {
                      window.open(currentWine.buyAgainLink, "_blank");
                    } else {
                      console.log("No buy again link available");
                    }
                  }}
                  variant="primary"
                  style={{
                    margin: 0,
                    width: "100%",
                  }}
                >
                  Buy again
                </Button>
              ) : (
                <>
                  {/* Suggestion chips */}
                  <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                    <Button
                      onClick={() => handleSuggestionClick("Tasting notes")}
                      variant="secondary"
                      style={{ height: "32px" }}
                    >
                      Tasting notes
                    </Button>
                    <Button
                      onClick={() =>
                        handleSuggestionClick("Simple recipes for this wine")
                      }
                      variant="secondary"
                      style={{ height: "32px" }}
                    >
                      Simple recipes
                    </Button>
                    <Button
                      onClick={() =>
                        handleSuggestionClick("Where is this wine from?")
                      }
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
                </>
              )}
            </div>
          </div>
        </main>

        {/* Scroll to Bottom Floating Button */}
        {showScrollToBottom && (
          <Button
            onClick={scrollToBottom}
            variant="secondary"
            style={{
              position: "fixed",
              bottom: "100px",
              right: "20px",
              width: "48px",
              height: "48px",
              borderRadius: "24px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              zIndex: 1000,
              backdropFilter: "blur(8px)",
              padding: "0",
              minHeight: "48px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 16l-4-4h8l-4 4z" fill="white" />
              <path d="M12 20l-4-4h8l-4 4z" fill="white" opacity="0.6" />
            </svg>
          </Button>
        )}
      </div>

      <ContactBottomSheet
        isOpen={animationState !== "closed"}
        onClose={handleCloseContactSheet}
        onSubmit={handleSubmit}
      />

      {/* Legacy Contact Bottom Sheet - keeping for reference but commented out */}
      {false && animationState !== "closed" &&
        portalElement &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 9999,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              opacity:
                animationState === "open"
                  ? 1
                  : animationState === "opening"
                    ? 0.8
                    : 0,
              transition: "opacity 0.3s ease-out",
            }}
            onClick={handleCloseContactSheet}
          >
            <div
              style={{
                background:
                  "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
                backdropFilter: "blur(20px)",
                width: "100%",
                maxWidth: "500px",
                borderRadius: "24px 24px 0px 0px",
                borderTop: "1px solid rgba(255, 255, 255, 0.20)",
                paddingTop: "24px",
                paddingLeft: "24px",
                paddingRight: "24px",
                paddingBottom: "28px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
                transform:
                  animationState === "open"
                    ? "translateY(0)"
                    : "translateY(100%)",
                transition: "transform 0.3s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <Button
                onClick={handleCloseContactSheet}
                variant="secondary"
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  zIndex: 10,
                  width: "40px",
                  height: "40px",
                  padding: "0",
                  minHeight: "40px",
                  borderRadius: "20px",
                }}
              >
                <X size={24} color="white" />
              </Button>

              {/* Header */}
              <div style={{ marginBottom: "24px", marginTop: "0px" }}>
                <h2
                  style={{
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "20px",
                    fontWeight: 500,
                    textAlign: "center",
                    margin: "0 0 12px 0",
                  }}
                >
                  Want to see wine history?
                </h2>

                <p
                  style={{
                    color: "#CECECE",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    fontWeight: 400,
                    lineHeight: "1.3",
                    textAlign: "center",
                    margin: "0 0 8px 0",
                  }}
                >
                  Enter your contact info
                </p>
              </div>

              {/* Form Fields */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <FormInput
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(value) => handleInputChange("firstName", value)}
                  error={errors.firstName}
                />

                <FormInput
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange("lastName", value)}
                  error={errors.lastName}
                />

                <FormInput
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(value) => handleInputChange("email", value)}
                  error={errors.email}
                />

                {/* Phone number with country selector */}
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      height: "64px",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                    className="contact-form-input"
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "24px",
                        paddingRight: "12px",
                        cursor: "pointer",
                        borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                      onClick={() => setShowCountryDropdown(true)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>
                          {selectedCountry.flag}
                        </span>
                        <span
                          style={{
                            color: "white",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "14px",
                          }}
                        >
                          {selectedCountry.dial_code}
                        </span>
                      </div>
                    </div>
                    <FormInput
                      type="tel"
                      name="phone"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(value) => handleInputChange("phone", value)}
                      error={errors.phone}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div
                  style={{
                    width: "100%",
                  }}
                >
                  <button
                    onClick={handleSubmit}
                    className="save-button"
                    style={{
                      width: "100%",
                      height: "56px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "black",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "16px",
                      fontWeight: 500,
                      cursor: "pointer",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>,
          portalElement || document.body
        )}
    </div>
  );
};

export default EnhancedChatInterface;
