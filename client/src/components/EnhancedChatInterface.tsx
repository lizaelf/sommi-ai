import React, { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/UseToast";
import { X } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import VoiceAssistant from "./VoiceAssistant";
import WineBottleImage from "./WineBottleImage";
import USFlagImage from "./USFlagImage";
import Button from "./ui/Button";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import typography from "@/styles/typography";
import {
  getWineDisplayName,
  getWineRegion,
  getWineVintage,
  WINE_CONFIG,
} from "@shared/wineConfig";
import { DataSyncManager } from "@/utils/dataSync";
import { ShiningText } from "@/components/ShiningText";

import { createStreamingClient, isStreamingSupported } from "@/lib/streamingClient";
// Import typography styles

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

// Create an enhanced chat interface that uses IndexedDB for persistence
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
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  showBuyButton = false,
  selectedWine = null,
}) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  // Contact form states
  const [animationState, setAnimationState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [selectedCountry, setSelectedCountry] = useState({
    code: "+1",
    flag: "🇺🇸",
    name: "United States"
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { 
    currentConversationId, 
    messages, 
    addMessage, 
    createNewConversation
  } = useConversation();

  const currentWine = selectedWine || {
    id: 1,
    name: getWineDisplayName(),
    image: "/wine-bottle.png",
    bottles: 1,
    ratings: {
      vn: 92,
      jd: 93,
      ws: 91,
      abv: 14.3
    }
  };
  
  const wineYear = selectedWine ? 2021 : getWineVintage();

  useEffect(() => {
    setPortalElement(document.body);
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;

    try {
      setIsTyping(true);
      const newAbortController = new AbortController();
      setAbortController(newAbortController);

      // Add user message to conversation
      const tempUserMessage: ClientMessage = {
        id: Date.now(),
        content: messageText,
        role: "user",
        conversationId: currentConversationId || 0,
        createdAt: new Date().toISOString(),
      };

      await addMessage(tempUserMessage);

      // Call API for assistant response
      const response = await fetch("/api/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: messageText }
          ],
          conversationId: currentConversationId,
        }),
        signal: newAbortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: ClientMessage = {
        id: Date.now() + 1,
        content: data.message.content,
        role: "assistant",
        conversationId: currentConversationId || 0,
        createdAt: new Date().toISOString(),
      };

      await addMessage(assistantMessage);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
      setAbortController(null);
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight);
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleOpenContactSheet = () => {
    setAnimationState("opening");
    setTimeout(() => setAnimationState("open"), 100);
  };

  const handleCloseContactSheet = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsTyping(false);
    }
    setAnimationState("closing");
    setTimeout(() => setAnimationState("closed"), 300);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          countryCode: selectedCountry.code,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your information has been saved successfully!",
        });
        handleCloseContactSheet();
      } else {
        throw new Error("Failed to save contact information");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contact information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getWineHistory = () => {
    return selectedWine
      ? "Selected wine from our curated collection, known for its exceptional quality and distinctive character."
      : WINE_CONFIG.history || "A wine with rich heritage and tradition, crafted with care and expertise.";
  };

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh]">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col bg-background overflow-hidden" style={{
          backgroundColor: "#0A0A0A !important",
          backgroundImage: "none !important"
        }}>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto scrollbar-hide"
          >
            <div
              className="w-full flex flex-col items-center justify-center py-8 relative"
              style={{
                backgroundColor: "#0A0A0A",
                paddingTop: "75px",
                minHeight: "100vh",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              <WineBottleImage 
                image={selectedWine?.image || currentWine?.image} 
                wineName={selectedWine?.name || currentWine?.name} 
              />

              <div
                style={{
                  width: "100%",
                  textAlign: "center",
                  justifyContent: "center",
                  display: "flex",
                  flexDirection: "column",
                  color: "white",
                  wordWrap: "break-word",
                  position: "relative",
                  zIndex: 2,
                  padding: "0 20px",
                  marginBottom: "0",
                  ...typography.h1,
                }}
              >
                {selectedWine ? `2021 ${selectedWine.name}` : `${wineYear} ${currentWine.name}`}
              </div>

              <div
                style={{
                  textAlign: "center",
                  justifyContent: "center",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  color: "rgba(255, 255, 255, 0.60)",
                  wordWrap: "break-word",
                  position: "relative",
                  zIndex: 2,
                  padding: "20px 20px",
                  gap: "6px",
                  marginBottom: "0",
                  ...typography.body1R,
                }}
              >
                <USFlagImage />
                <span>{selectedWine ? "Santa Cruz Mountains | California | United States" : getWineRegion()}</span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 4,
                  display: "inline-flex",
                  position: "relative",
                  zIndex: 2,
                  padding: "0 20px",
                  marginBottom: "40px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    padding: 8,
                    alignItems: "baseline",
                    gap: 4,
                    background: "rgba(255, 255, 255, 0.10)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "white",
                      wordWrap: "break-word",
                      height: "16px",
                      ...typography.num,
                    }}
                  >
                    {currentWine ? currentWine.ratings.vn : '92'}
                  </div>
                  <div
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "rgba(255, 255, 255, 0.60)",
                      wordWrap: "break-word",
                      height: "16px",
                      ...typography.body1R,
                    }}
                  >
                    VN
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: 8,
                    alignItems: "baseline",
                    gap: 4,
                    background: "rgba(255, 255, 255, 0.10)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "white",
                      wordWrap: "break-word",
                      height: "16px",
                      ...typography.num,
                    }}
                  >
                    {currentWine ? currentWine.ratings.jd : '93'}
                  </div>
                  <div
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "rgba(255, 255, 255, 0.60)",
                      wordWrap: "break-word",
                      height: "16px",
                      ...typography.body1R,
                    }}
                  >
                    JD
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: 8,
                    alignItems: "baseline",
                    gap: 4,
                    background: "rgba(255, 255, 255, 0.10)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "white",
                      wordWrap: "break-word",
                      height: "16px",
                      ...typography.num,
                    }}
                  >
                    {currentWine ? currentWine.ratings.ws : '91'}
                  </div>
                  <div
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "rgba(255, 255, 255, 0.60)",
                      wordWrap: "break-word",
                      height: "16px",
                      ...typography.body1R,
                    }}
                  >
                    WS
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: 8,
                    alignItems: "baseline",
                    gap: 4,
                    background: "rgba(255, 255, 255, 0.10)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "white",
                      wordWrap: "break-word",
                      height: "16px",
                      ...typography.num,
                    }}
                  >
                    {currentWine ? `${currentWine.ratings.abv}%` : '14.3%'}
                  </div>
                  <div
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "rgba(255, 255, 255, 0.60)",
                      wordWrap: "break-word",
                      height: "16px",
                      ...typography.body1R,
                    }}
                  >
                    ABV
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  padding: "0 20px",
                  marginTop: "48px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    color: "white",
                    marginBottom: "16px",
                    ...typography.body,
                  }}
                >
                  {getWineHistory()}
                </p>
              </div>

              <div
                style={{
                  width: "100%",
                  padding: "0 20px",
                  marginBottom: "20px",
                }}
              >
                <h1
                  style={{
                    ...typography.h1,
                    color: "white",
                    marginBottom: "24px",
                    textAlign: "left",
                  }}
                >
                  Food pairing
                </h1>

                <div
                  onClick={() => {
                    setExpandedItem(
                      expandedItem === "redMeat" ? null : "redMeat",
                    );
                  }}
                  style={{
                    backgroundColor: "#191919",
                    borderRadius: "16px",
                    padding: "0 20px",
                    marginBottom: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "20px 0",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        ...typography.body,
                      }}
                    >
                      Red meat & game
                    </span>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "18px",
                        transform: expandedItem === "redMeat" ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                  {expandedItem === "redMeat" && (
                    <div
                      style={{
                        paddingBottom: "20px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                        paddingTop: "20px",
                        color: "rgba(255, 255, 255, 0.8)",
                        ...typography.body1R,
                        lineHeight: "1.5",
                      }}
                    >
                      Perfect with grilled ribeye steak, lamb chops, venison, and duck breast. The wine's bold tannins complement the rich, savory flavors of red meat.
                    </div>
                  )}
                </div>

                <div
                  onClick={() => {
                    setExpandedItem(
                      expandedItem === "aged" ? null : "aged",
                    );
                  }}
                  style={{
                    backgroundColor: "#191919",
                    borderRadius: "16px",
                    padding: "0 20px",
                    marginBottom: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "20px 0",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        ...typography.body,
                      }}
                    >
                      Aged cheeses
                    </span>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "18px",
                        transform: expandedItem === "aged" ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                  {expandedItem === "aged" && (
                    <div
                      style={{
                        paddingBottom: "20px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                        paddingTop: "20px",
                        color: "rgba(255, 255, 255, 0.8)",
                        ...typography.body1R,
                        lineHeight: "1.5",
                      }}
                    >
                      Pairs beautifully with aged cheddar, parmesan, gouda, and blue cheese. The wine's complexity enhances the nutty, sharp flavors of mature cheeses.
                    </div>
                  )}
                </div>

                <div
                  onClick={() => {
                    setExpandedItem(
                      expandedItem === "dark" ? null : "dark",
                    );
                  }}
                  style={{
                    backgroundColor: "#191919",
                    borderRadius: "16px",
                    padding: "0 20px",
                    marginBottom: "20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "20px 0",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        ...typography.body,
                      }}
                    >
                      Dark chocolate
                    </span>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "18px",
                        transform: expandedItem === "dark" ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                  {expandedItem === "dark" && (
                    <div
                      style={{
                        paddingBottom: "20px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                        paddingTop: "20px",
                        color: "rgba(255, 255, 255, 0.8)",
                        ...typography.body1R,
                        lineHeight: "1.5",
                      }}
                    >
                      Exceptional with dark chocolate desserts, cocoa-dusted truffles, and chocolate-based sauces. The wine's berry notes complement chocolate's richness.
                    </div>
                  )}
                </div>
              </div>

              {showBuyButton && (
                <div
                  style={{
                    width: "100%",
                    padding: "0 20px",
                    marginBottom: "40px",
                  }}
                >
                  <Button
                    onClick={handleOpenContactSheet}
                    style={{
                      width: "100%",
                      height: "48px",
                      backgroundColor: "white",
                      color: "black",
                      borderRadius: "16px",
                      border: "none",
                      ...typography.body,
                      fontWeight: 500,
                    }}
                  >
                    Buy again
                  </Button>
                </div>
              )}

              {currentConversationId && messages.length > 0 && (
                <>
                  <div style={{ width: "100%", padding: "0 20px", marginBottom: "40px" }}>
                    {messages.map((message, index) => (
                      <ChatMessage key={`${message.id}-${index}`} message={message} />
                    ))}
                  </div>

                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isProcessing={isTyping}
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
      </div>

      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16l-4-4h8l-4 4z"
              fill="#333"
            />
            <path
              d="M12 20l-4-4h8l-4 4z"
              fill="#333"
              opacity="0.6"
            />
          </svg>
        </button>
      )}

      {animationState !== "closed" &&
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
                backgroundColor: "#1A1A1A",
                borderRadius: "24px 24px 0 0",
                padding: "24px",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "80vh",
                overflowY: "auto",
                transform:
                  animationState === "open"
                    ? "translateY(0)"
                    : animationState === "opening"
                      ? "translateY(20px)"
                      : "translateY(100%)",
                transition: "transform 0.3s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
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
                  Enter your details and we'll send you the complete wine history and tasting notes.
                </p>

                <button
                  onClick={handleCloseContactSheet}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="contact-form-input"
                  style={{
                    display: "flex",
                    height: "64px",
                    padding: "16px 24px",
                    alignItems: "center",
                    width: "100%",
                    color: "white !important",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                    backgroundColor: "#2A2A2A",
                    border: errors.firstName ? "2px solid #FF4444" : "2px solid transparent",
                    borderRadius: "16px",
                  }}
                />
                {errors.firstName && (
                  <span style={{ color: "#FF4444", fontSize: "14px" }}>
                    {errors.firstName}
                  </span>
                )}

                <input
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="contact-form-input"
                  style={{
                    display: "flex",
                    height: "64px",
                    padding: "16px 24px",
                    alignItems: "center",
                    width: "100%",
                    color: "white !important",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                    backgroundColor: "#2A2A2A",
                    border: errors.lastName ? "2px solid #FF4444" : "2px solid transparent",
                    borderRadius: "16px",
                  }}
                />
                {errors.lastName && (
                  <span style={{ color: "#FF4444", fontSize: "14px" }}>
                    {errors.lastName}
                  </span>
                )}

                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="contact-form-input"
                  style={{
                    display: "flex",
                    height: "64px",
                    padding: "16px 24px",
                    alignItems: "center",
                    width: "100%",
                    color: "white !important",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                    backgroundColor: "#2A2A2A",
                    border: errors.email ? "2px solid #FF4444" : "2px solid transparent",
                    borderRadius: "16px",
                  }}
                />
                {errors.email && (
                  <span style={{ color: "#FF4444", fontSize: "14px" }}>
                    {errors.email}
                  </span>
                )}

                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      height: "64px",
                      backgroundColor: "#2A2A2A",
                      border: errors.phoneNumber ? "2px solid #FF4444" : "2px solid transparent",
                      borderRadius: "16px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        gap: "8px",
                      }}
                    >
                      <span>{selectedCountry.flag}</span>
                      <span>{selectedCountry.code}</span>
                      <span style={{ fontSize: "12px" }}>▼</span>
                    </button>

                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      style={{
                        flex: 1,
                        padding: "16px 24px 16px 0",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "white",
                        fontSize: "16px",
                        outline: "none",
                      }}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <span style={{ color: "#FF4444", fontSize: "14px" }}>
                      {errors.phoneNumber}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button
                    onClick={handleCloseContactSheet}
                    style={{
                      flex: 1,
                      height: "48px",
                      backgroundColor: "#191919",
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "16px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    style={{
                      flex: 1,
                      height: "48px",
                      backgroundColor: "white",
                      color: "black",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "16px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>,
          portalElement,
        )}
    </div>
  );
};

export default EnhancedChatInterface;