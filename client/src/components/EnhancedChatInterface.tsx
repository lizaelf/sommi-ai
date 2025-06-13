import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreHorizontal, Trash2, X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { createPortal } from "react-dom";
import ChatInput from "./ChatInput";
// Remove unused imports
import { saveMessageToDB, getChatHistory } from "../lib/indexedDB";

// Typography system
const typography = {
  h1: {
    fontFamily: "Lora, serif",
    fontSize: "32px",
    fontWeight: 400,
    lineHeight: "1.2",
  },
  h2: {
    fontFamily: "Lora, serif", 
    fontSize: "24px",
    fontWeight: 400,
    lineHeight: "1.3",
  },
  body: {
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: "1.5",
  },
  bodySmall: {
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "1.4",
  },
  buttonPlus1: {
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
    fontWeight: 500,
    lineHeight: "1",
  },
};

// Define the country data interface and the default selected country
interface Country {
  dial_code: string;
  flag: string;
  name: string;
  code: string;
}

const US_COUNTRY: Country = {
  dial_code: "+1",
  flag: "🇺🇸",
  name: "United States",
  code: "+1",
};

// Wine data interface
interface Wine {
  id: number;
  name: string;
  year?: number;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  buyAgainLink: string;
  qrCode: string;
  qrLink: string;
  location?: string;
  description?: string;
  foodPairing?: string[];
  conversationHistory?: any[];
}

// Selected wine interface
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
  const [location, setLocation] = useLocation();
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [showFullConversation, setShowFullConversation] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [hasSharedContact, setHasSharedContact] = useState(false);
  const [animationState, setAnimationState] = useState<"hidden" | "opening" | "visible" | "closing">("hidden");
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(US_COUNTRY);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    phone: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentWine = selectedWine;

  useEffect(() => {
    setPortalElement(document.body);
  }, []);

  useEffect(() => {
    const loadConversationHistory = async () => {
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          setMessages(history);
        }
      } catch (error) {
        console.error("Error loading conversation history:", error);
      }
    };

    loadConversationHistory();
  }, []);

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      setIsTyping(true);
      
      const userMessage = {
        id: Date.now(),
        role: "user" as const,
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      
      await saveMessageToDB(userMessage);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          wineData: currentWine,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from chat API");
      }

      const data = await response.json();

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant" as const,
        content: data.content,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessageToDB(assistantMessage);

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          company: formData.company,
          phone: formData.phone ? `${selectedCountry.dial_code}${formData.phone}` : "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save contact information");
      }

      setHasSharedContact(true);
      handleCloseContactSheet();
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  };

  const handleCloseContactSheet = () => {
    setAnimationState("closing");
    setTimeout(() => {
      setAnimationState("hidden");
    }, 300);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center">
            <Link href="/">
              <ArrowLeft className="h-6 w-6 text-white cursor-pointer" />
            </Link>
          </div>
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-lg font-medium text-white">
            {showBuyButton ? "Wine Details" : "Chat History"}
          </h1>
          <div className="flex items-center space-x-2">
            <MoreHorizontal className="h-6 w-6 text-white" />
            <Trash2 className="h-6 w-6 text-white" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-background overflow-hidden" style={{
          backgroundColor: "#0A0A0A !important",
          backgroundImage: "none !important"
        }}>
          {/* Scrollable container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto scrollbar-hide"
          >
            {/* Chat History Section */}
            <div
              className="w-full flex flex-col py-8 relative"
              style={{
                backgroundColor: "#0A0A0A",
                paddingTop: "75px",
                minHeight: "50vh",
              }}
            >
              {/* Chat History Header */}
              <div
                style={{
                  width: "100%",
                  padding: "0 20px",
                  marginBottom: "24px",
                }}
              >
                <h1
                  style={{
                    ...typography.h1,
                    color: "white",
                    marginBottom: "8px",
                    textAlign: "left",
                  }}
                >
                  Chat History
                </h1>
              </div>

              {/* Chat Messages Container */}
              <div
                style={{
                  width: "100%",
                  padding: "0 20px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {messages.length > 0 ? (
                  messages.map((message: any, index: number) => (
                    <div
                      key={`chat-${message.id}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "12px 16px",
                          borderRadius: "16px",
                          backgroundColor: message.role === "user" ? "#333" : "#1a1a1a",
                          color: "white",
                          ...typography.body,
                          wordWrap: "break-word",
                        }}
                      >
                        {formatContent(message.content)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "rgba(255, 255, 255, 0.6)",
                      ...typography.body,
                      padding: "40px 20px",
                    }}
                  >
                    No conversation history yet. Start chatting to see your messages here.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Input Section */}
          <div
            style={{
              padding: "20px",
              zIndex: 40,
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "#0A0A0A",
            }}
          >
            {/* Show chat input only if showBuyButton is false or showChatInput is true */}
            {(!showBuyButton || showChatInput) && (
              <ChatInput
                onSendMessage={handleSendMessage}
                isProcessing={isTyping}
                onFocus={() => setIsKeyboardFocused(true)}
                onBlur={() => setIsKeyboardFocused(false)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          style={{
            position: "fixed",
            bottom: "100px",
            right: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            cursor: "pointer",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ↓
        </button>
      )}

      {/* Contact Sheet Modal */}
      {animationState !== "hidden" && portalElement &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              zIndex: 9999,
              display: "flex",
              alignItems: "flex-end",
              opacity: animationState === "visible" ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
            onClick={handleCloseContactSheet}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#1a1a1a",
                width: "100%",
                maxHeight: "80vh",
                borderRadius: "16px 16px 0 0",
                padding: "24px",
                transform: animationState === "visible" ? "translateY(0)" : "translateY(100%)",
                transition: "transform 0.3s ease",
                overflow: "auto",
              }}
            >
              {/* Close button */}
              <button
                onClick={handleCloseContactSheet}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "none",
                  border: "none",
                  color: "white",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>

              <h2 style={{ color: "white", marginBottom: "24px", fontSize: "24px" }}>
                Share Contact Information
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "white", marginBottom: "8px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #333",
                      backgroundColor: "#2a2a2a",
                      color: "white",
                      fontSize: "16px",
                    }}
                    required
                  />
                  {errors.fullName && (
                    <span style={{ color: "#ff6b6b", fontSize: "14px" }}>
                      {errors.fullName}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "white", marginBottom: "8px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #333",
                      backgroundColor: "#2a2a2a",
                      color: "white",
                      fontSize: "16px",
                    }}
                    required
                  />
                  {errors.email && (
                    <span style={{ color: "#ff6b6b", fontSize: "14px" }}>
                      {errors.email}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "white", marginBottom: "8px" }}>
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #333",
                      backgroundColor: "#2a2a2a",
                      color: "white",
                      fontSize: "16px",
                    }}
                  />
                  {errors.company && (
                    <span style={{ color: "#ff6b6b", fontSize: "14px" }}>
                      {errors.company}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "white", marginBottom: "8px" }}>
                    Phone Number
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #333",
                          backgroundColor: "#2a2a2a",
                          color: "white",
                          fontSize: "16px",
                          cursor: "pointer",
                          minWidth: "80px",
                        }}
                      >
                        {selectedCountry.flag} {selectedCountry.code}
                      </button>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #333",
                        backgroundColor: "#2a2a2a",
                        color: "white",
                        fontSize: "16px",
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <span style={{ color: "#ff6b6b", fontSize: "14px" }}>
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    width: "100%",
                  }}
                >
                  <button
                    type="submit"
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
              </form>
            </div>
          </div>,
          portalElement,
        )}
    </div>
  );
};

export default EnhancedChatInterface;