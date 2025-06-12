import React, { useRef, useEffect, useState } from "react";
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
} from "@shared/wineConfig";
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

interface EnhancedChatInterfaceProps {
  showBuyButton?: boolean;
  selectedWine?: SelectedWine | null;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  showBuyButton = false,
  selectedWine = null,
}) => {
  const [currentWine, setCurrentWine] = useState<any>(null);
  const [, setLocation] = useLocation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasTriggeredAutoQuestion, setHasTriggeredAutoQuestion] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Contact form state
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Conversation hook
  const {
    currentConversationId,
    messages,
    addMessage,
  } = useConversation(selectedWine?.id);

  // Get all wine data
  const getAllWineData = () => {
    return DataSyncManager.getUnifiedWineData() || [];
  };

  // Show chat input only on home page (not scanned page)
  const showChatInput = !showBuyButton;

  // Load wine data on component mount
  useEffect(() => {
    const loadWineData = () => {
      if (selectedWine) {
        setCurrentWine(selectedWine);
        return;
      }

      const wines = DataSyncManager.getUnifiedWineData();
      
      if (wines && wines.length > 0) {
        const wine = wines.find((w: any) => w.id === 1) || wines[0];
        setCurrentWine(wine);
      }
    };

    loadWineData();
  }, [selectedWine]);

  // Food pairing content generator
  const getFoodPairingContent = () => {
    if (currentWine?.foodPairing) {
      return {
        dishes: currentWine.foodPairing
      };
    }
    
    return {
      dishes: ["Grilled lamb", "BBQ ribs", "Aged cheddar", "Dark chocolate desserts"]
    };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollElement = chatContainerRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  // Handle scroll behavior for showing scroll to bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight);
      }
    };

    const scrollElement = chatContainerRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Send message handler
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    try {
      setIsTyping(true);
      
      // Clear any existing timers
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
      }

      // Add user message
      const userMessage: ClientMessage = {
        id: Date.now(),
        role: 'user',
        content: content.trim(),
        conversationId: currentConversationId || 0,
        createdAt: new Date().toISOString()
      };

      await addMessage(userMessage);

      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationId: currentConversationId,
          wineData: currentWine
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          conversationId: currentConversationId || 0,
          createdAt: new Date().toISOString()
        };
        await addMessage(assistantMessage);
      }
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  // Auto-trigger question after 2 seconds of inactivity
  useEffect(() => {
    if (messages.length === 0 && !hasTriggeredAutoQuestion && !isTyping) {
      console.log('Triggering automatic conversation starter after 2 seconds of inactivity');
      
      const timer = setTimeout(() => {
        if (!hasTriggeredAutoQuestion) {
          setHasTriggeredAutoQuestion(true);
          handleSendMessage("Hello! Tell me about this wine.");
        }
      }, 2000);
      
      setInactivityTimer(timer);
    }

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [messages.length, hasTriggeredAutoQuestion, isTyping]);

  // Contact form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          source: 'wine_app'
        })
      });

      if (response.ok) {
        localStorage.setItem('hasSharedContact', 'true');
        setShowContactSheet(false);
        toast({ title: "Contact shared successfully!" });
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
      toast({ title: "Error sharing contact", variant: "destructive" });
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
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] mx-auto" style={{ maxWidth: "1200px" }}>
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
              {/* Wine bottle image */}
              <WineBottleImage 
                image={selectedWine?.image || currentWine?.image} 
                wineName={selectedWine?.name || currentWine?.name} 
              />

              {/* Wine name */}
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
                {selectedWine ? `2021 ${selectedWine.name}` : currentWine ? `${currentWine.year} ${currentWine.name}` : `${getWineVintage()} ${getWineDisplayName()}`}
              </div>

              {/* Wine region */}
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

              {/* Wine ratings */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "32px",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "white",
                  position: "relative",
                  zIndex: 2,
                  padding: "0 20px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <div style={{ ...typography.num, color: "white" }}>
                    {currentWine ? currentWine.ratings.vn : 95}
                  </div>
                  <div style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)" }}>
                    VN
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <div style={{ ...typography.num, color: "white" }}>
                    {currentWine ? currentWine.ratings.jd : 93}
                  </div>
                  <div style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)" }}>
                    JD
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <div style={{ ...typography.num, color: "white" }}>
                    {currentWine ? currentWine.ratings.ws : 93}
                  </div>
                  <div style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)" }}>
                    WS
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <div style={{ ...typography.num, color: "white" }}>
                    {currentWine ? `${currentWine.ratings.abv}%` : '14.3%'}
                  </div>
                  <div style={{ ...typography.body1R, color: "rgba(255, 255, 255, 0.60)" }}>
                    ABV
                  </div>
                </div>
              </div>

              {/* Food Pairings */}
              <div style={{ width: "100%", padding: "0 20px", marginBottom: "20px", zIndex: 2, position: "relative" }}>
                <div
                  onClick={() => setExpandedItem(expandedItem === "redMeat" ? null : "redMeat")}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "64px", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>🥩</span>
                      <span style={{ color: "white", ...typography.body }}>Red Meat</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "black", backgroundColor: "#e0e0e0", padding: "6px 14px", borderRadius: "999px", ...typography.buttonPlus1 }}>
                        Perfect match
                      </span>
                    </div>
                  </div>
                  {expandedItem === "redMeat" && (
                    <div style={{ padding: "0 0 20px 0", color: "white", ...typography.body }}>
                      <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                        {getFoodPairingContent().dishes.map((dish: string, index: number) => (
                          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "16px" }}>🥩</span>
                            <span>{dish}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Want more section - ALWAYS VISIBLE */}
              <div style={{ width: "100%", padding: "0 20px", marginBottom: "20px" }}>
                <h1 style={{ ...typography.h1, color: "white", marginBottom: "24px", textAlign: "left" }}>
                  Want more?
                </h1>

                {/* Buy again button */}
                <Button
                  onClick={() => {
                    if (currentWine?.buyAgainLink) {
                      window.open(currentWine.buyAgainLink, '_blank');
                    } else {
                      console.log("No buy again link available");
                    }
                  }}
                  variant="primary"
                  style={{ margin: "0 0 32px 0", width: "100%" }}
                >
                  Buy again
                </Button>

                {/* Chat with AI Section */}
                <div style={{ marginBottom: "32px" }}>
                  <h1 style={{ ...typography.h1, color: "white", margin: "0 0 24px 0", textAlign: "left" }}>
                    Chat with AI
                  </h1>
                  <Button
                    onClick={() => setLocation("/wine/conversation")}
                    variant="secondary"
                    style={{ height: "56px", width: "100%" }}
                  >
                    Ask me about this wine
                  </Button>
                </div>

                {/* Wine Recommendations Section */}
                <div style={{ marginBottom: "32px" }}>
                  <h1 style={{ ...typography.h1, color: "white", margin: "0 0 24px 0", textAlign: "left" }}>
                    Explore similar wines
                  </h1>
                  <div style={{ display: "flex", gap: "16px", width: "100%", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "8px" }}>
                    {getAllWineData()
                      .filter((wine: any) => wine.id !== currentWine?.id)
                      .slice(0, 3)
                      .map((wine: any) => (
                        <div
                          key={wine.id}
                          onClick={() => setLocation(`/?wine=${wine.id}`)}
                          style={{
                            flexShrink: 0,
                            width: "140px",
                            padding: "12px",
                            borderRadius: "16px",
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                            cursor: "pointer",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "120px",
                              borderRadius: "8px",
                              backgroundImage: `url(${wine.image})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              marginBottom: "8px",
                            }}
                          />
                          <div style={{ color: "white", fontSize: "14px", fontWeight: 500, lineHeight: 1.3, textAlign: "center" }}>
                            {wine.name}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Share your contact */}
                <div style={{ marginBottom: "32px" }}>
                  <h1 style={{ ...typography.h1, color: "white", margin: "0 0 24px 0", textAlign: "left" }}>
                    Share your contact
                  </h1>
                  <Button
                    onClick={() => setShowContactSheet(true)}
                    variant="secondary"
                    style={{ height: "56px", width: "100%" }}
                  >
                    Get recommendations over text
                  </Button>
                </div>

                {/* Conversation Content */}
                <div id="conversation" className="space-y-4 mb-96">
                  {messages.length > 0 ? (
                    <>
                      {messages.map((message, index) => (
                        <ChatMessage
                          key={`message-${message.id}-${index}`}
                          message={message}
                        />
                      ))}
                      {isTyping && (
                        <div className="flex items-center space-x-2 p-3">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      Start a conversation about this wine
                    </div>
                  )}
                </div>
              </div>

              {/* Spacer */}
              <div style={{ height: "80px" }}></div>
            </div>
          </div>

          {/* Fixed Bottom Input/Button */}
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
                      window.open(currentWine.buyAgainLink, '_blank');
                    } else {
                      console.log("No buy again link available");
                    }
                  }}
                  variant="primary"
                  style={{ margin: 0, width: "100%" }}
                >
                  Buy again
                </Button>
              ) : (
                <>
                  <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                    <Button
                      onClick={() => handleSendMessage("Tasting notes")}
                      variant="secondary"
                      style={{ flexShrink: 0, fontSize: "14px", height: "36px", padding: "0 12px", whiteSpace: "nowrap" }}
                    >
                      Tasting notes
                    </Button>
                    <Button
                      onClick={() => handleSendMessage("Food pairings")}
                      variant="secondary"
                      style={{ flexShrink: 0, fontSize: "14px", height: "36px", padding: "0 12px", whiteSpace: "nowrap" }}
                    >
                      Food pairings
                    </Button>
                  </div>
                  
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <ChatInput onSendMessage={handleSendMessage} isProcessing={isTyping} />
                    </div>
                    <VoiceAssistant onSendMessage={handleSendMessage} isProcessing={isTyping} />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <Button
            onClick={scrollToBottom}
            variant="secondary"
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '20px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            ↓
          </Button>
        )}
      </div>

      {/* Contact Sheet */}
      {showContactSheet && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowContactSheet(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '24px 24px 0 0',
              padding: '32px 24px 24px 24px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ ...typography.h1, color: 'white', margin: 0 }}>Share your contact</h2>
              <Button
                onClick={() => setShowContactSheet(false)}
                variant="secondary"
                style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
              >
                <X size={20} />
              </Button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                }}
                placeholder="First Name"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                }}
                placeholder="Last Name"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                }}
                placeholder="Phone Number"
              />
            </div>

            <Button
              onClick={handleSubmit}
              variant="primary"
              style={{ width: '100%', height: '48px' }}
            >
              Share Contact
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EnhancedChatInterface;