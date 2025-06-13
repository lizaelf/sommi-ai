import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreHorizontal, Trash2, X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/UseToast";
import QRScanModal from "@/components/QRScanModal";
import AppHeader, { HeaderSpacer } from "@/components/AppHeader";
import { DataSyncManager } from "@/utils/dataSync";
import WineBottleImage from "@/components/WineBottleImage";
import USFlagImage from "@/components/USFlagImage";
import WineRating from "@/components/WineRating";
import Button from "@/components/ui/Button";
import ChatInput from "@/components/ChatInput";
import VoiceAssistant from "@/components/VoiceAssistant";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import { ShiningText } from "@/components/ShiningText";
import {
  createStreamingClient,
  isStreamingSupported,
} from "@/lib/streamingClient";
import ContactBottomSheet, { ContactFormData } from "@/components/ContactBottomSheet";
import typography from "@/styles/typography";

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
  location?: string;
  description?: string;
  foodPairing?: string[];
  buyAgainLink?: string;
}

export default function WineDetails() {
  const [location, setLocation] = useLocation();
  const { id } = useParams();
  const [wine, setWine] = useState<SelectedWine | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [interactionChoiceMade, setInteractionChoiceMade] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [currentEventSource, setCurrentEventSource] = useState<EventSource | null>(null);
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
  });
  const [selectedCountry, setSelectedCountry] = useState({
    flag: "🇺🇸",
    dial_code: "+1",
    name: "United States"
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Chat conversation management
  const {
    messages,
    currentConversationId,
    addMessage,
    refetchMessages,
  } = useConversation();

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 30000,
  });

  // Chat functions
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

  const handleSuggestionClick = async (content: string) => {
    if (isTyping) return;

    try {
      const newMessage: ClientMessage = {
        id: Date.now(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      addMessage(newMessage);
      setIsTyping(true);

      setTimeout(scrollToBottom, 100);

      if (!isStreamingSupported()) {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, newMessage].map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            wineData: wine,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.content,
          timestamp: Date.now(),
        };

        addMessage(assistantMessage);
        setTimeout(scrollToBottom, 100);
      } else {
        const streamingClient = createStreamingClient();
        await streamingClient.streamCompletion(
          [...messages, newMessage],
          wine || undefined,
          (content) => {
            const assistantMessage: ClientMessage = {
              id: Date.now() + 1,
              role: "assistant",
              content,
              timestamp: Date.now(),
            };
            addMessage(assistantMessage);
            setTimeout(scrollToBottom, 100);
          },
          () => setIsTyping(false)
        );
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

  const handleSendMessage = async (content: string) => {
    if (isTyping) return;

    try {
      const newMessage: ClientMessage = {
        id: Date.now(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      addMessage(newMessage);
      setIsTyping(true);

      setTimeout(scrollToBottom, 100);

      if (!isStreamingSupported()) {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, newMessage].map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            wineData: wine,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.content,
          timestamp: Date.now(),
        };

        addMessage(assistantMessage);
        setTimeout(scrollToBottom, 100);
      } else {
        const streamingClient = createStreamingClient();
        await streamingClient.streamCompletion(
          [...messages, newMessage],
          wine || undefined,
          (content) => {
            const assistantMessage: ClientMessage = {
              id: Date.now() + 1,
              role: "assistant",
              content,
              timestamp: Date.now(),
            };
            addMessage(assistantMessage);
            setTimeout(scrollToBottom, 100);
          },
          () => setIsTyping(false)
        );
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

  const handleCloseContactSheet = () => {
    setAnimationState('closing');
    setTimeout(() => {
      setAnimationState('closed');
    }, 300);
  };

  const handleSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your information has been submitted successfully!",
        });
        handleCloseContactSheet();
        setFormData({ name: "", email: "", phone: "" });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your information. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load wine data
  useEffect(() => {
    let mounted = true;

    const loadWineData = async () => {
      try {
        setLoadingState('loading');
        
        await DataSyncManager.initialize();
        
        const urlParams = new URLSearchParams(window.location.search);
        const wineIdFromQuery = urlParams.get('wine');
        const wineId = id || wineIdFromQuery || '1';
        
        console.log('DataSyncManager: Looking for wine ID', wineId);
        
        const wineData = DataSyncManager.getWineById(parseInt(wineId));
        
        if (mounted) {
          if (wineData) {
            console.log('DataSyncManager: Found wine data:', wineData);
            setWine(wineData);
            setLoadingState('loaded');
          } else {
            console.error('DataSyncManager: Wine not found for ID:', wineId);
            setLoadingState('error');
          }
        }
      } catch (error) {
        console.error('Error loading wine data:', error);
        if (mounted) {
          setLoadingState('error');
        }
      }
    };

    loadWineData();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Fix scrolling initialization
  useEffect(() => {
    const initializeScrolling = () => {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.body.offsetHeight;
    };

    initializeScrolling();
    setTimeout(initializeScrolling, 100);
  }, []);

  // Detect QR code access and show interaction choice
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isQRAccess = urlParams.get('qr') === 'true' || 
                       urlParams.get('source') === 'qr' ||
                       document.referrer === '' || 
                       !document.referrer.includes(window.location.hostname);
    
    if (isQRAccess && !interactionChoiceMade && loadingState === 'loaded') {
      setTimeout(() => {
        setShowQRModal(true);
      }, 500);
    }
  }, [loadingState, interactionChoiceMade]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Error component
  const ErrorComponent = () => (
    <div className="flex items-center justify-center h-[calc(100vh-100px)]">
      <div className="text-center">
        <div 
          style={{
            color: "white",
            marginBottom: "16px",
            ...typography.h1,
          }}
        >
          Wine Not Found
        </div>
        <p 
          style={{
            color: "#999999",
            marginBottom: "24px",
            ...typography.body,
          }}
        >
          The wine you're looking for could not be found.
        </p>
        <Link href="/">
          <Button variant="secondary">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );

  // Loading component
  const LoadingComponent = () => (
    <div className="flex items-center justify-center h-[calc(100vh-100px)]">
      <div className="text-center">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p 
          style={{
            marginTop: "16px",
            color: "#999999",
            ...typography.body,
          }}
        >
          Loading wine details...
        </p>
      </div>
    </div>
  );

  if (loadingState === "loading") {
    return <LoadingComponent />;
  }

  if (loadingState === "error") {
    return <ErrorComponent />;
  }

  return (
    <div className="bg-black text-white" style={{ minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
      <AppHeader />
      <HeaderSpacer />

      {/* Wine bottle image with fixed size and glow effect - fullscreen height from top */}
      <div
        className="w-full flex flex-col items-center justify-center py-8 relative"
        style={{
          minHeight: "100vh",
        }}
      >
        <WineBottleImage 
          image={wine?.image} 
          wineName={wine?.name} 
        />

        {/* Wine name with typography styling */}
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
          {wine ? `2021 ${wine.name}` : "2021 Ridge Lytton Springs Dry Creek Zinfandel"}
        </div>

        {/* Wine region with typography styling and flag */}
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
          <span>Santa Cruz Mountains | California | United States</span>
        </div>

        {/* Wine ratings section */}
        <div
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            display: "flex",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 2,
            padding: "0 20px",
            marginBottom: "0",
          }}
        >
          <WineRating 
            ratings={wine?.ratings || {}} 
            variant="default" 
          />
        </div>

        {/* Food pairing and other sections would go here */}
        {/* ... (keeping existing food pairing sections) ... */}
      </div>

      {/* Chat Interface */}
      <div className="mt-0 pb-10" style={{ backgroundColor: "transparent" }}>
        <div
          className="flex flex-col h-auto"
          style={{ width: "100%" }}
        >
          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Chat Area - Direct content without wrapper div */}
            <main
              className="flex-1 flex flex-col overflow-hidden"
              ref={chatContainerRef}
              style={{
                backgroundColor: "transparent",
                backgroundImage: "none",
                width: "100%",
                flex: "1",
                overflowY: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
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
              
              <div id="conversation" className="space-y-4 mb-96" style={{ paddingLeft: "16px", paddingRight: "16px", backgroundColor: "transparent" }}>
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

              {/* Extra space at the bottom */}
              <div style={{ height: "80px" }}></div>
            </main>

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
                  />
                </>
              </div>
            </div>
          </div>

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

          <ContactBottomSheet
            isOpen={animationState !== "closed"}
            onClose={handleCloseContactSheet}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* QR Scan Modal */}
      <QRScanModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onTextChoice={() => {
          setInteractionChoiceMade(true);
          setShowQRModal(false);
        }}
        onVoiceChoice={() => {
          setInteractionChoiceMade(true);
          setShowQRModal(false);
        }}
      />
    </div>
  );
}