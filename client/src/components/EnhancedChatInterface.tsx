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
  location?: string;
  description?: string;
  foodPairing?: string[];
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

  // Load wine data from DataSyncManager
  useEffect(() => {
    const loadWineData = async () => {
      try {
        const wineData = await DataSyncManager.getWineById(1);
        if (wineData) {
          console.log('WineDetails: Found wine:', wineData);
          setCurrentWine(wineData);
        } else {
          console.log('WineDetails: No wine found for ID 1');
        }
      } catch (error) {
        console.error('WineDetails: Error loading wine data:', error);
      }
    };

    if (!selectedWine) {
      loadWineData();
    } else {
      setCurrentWine(selectedWine);
    }
  }, [selectedWine]);

  const getWineHistory = () => {
    if (currentWine?.description) {
      return currentWine.description;
    }
    console.log('⚠️ No wine description found, using fallback config');
    return WINE_CONFIG.history;
  };

  const getWineName = () => {
    if (currentWine) {
      return currentWine.name;
    }
    return getWineDisplayName();
  };

  const getFoodPairingContent = () => {
    if (currentWine && currentWine.foodPairing && currentWine.foodPairing.length > 0) {
      return {
        description: `${currentWine.name}'s unique character makes it perfect for these carefully selected dishes`,
        dishes: currentWine.foodPairing,
        conclusion: `The wine's distinctive profile complements these food pairings beautifully.`
      };
    }
    
    if (currentWine) {
      return {
        description: `${currentWine.name}'s elegant structure and complex flavor profile makes it perfect for premium red meat preparations`,
        dishes: [
          "Grilled ribeye steak with herbs",
          "Braised short ribs with rich sauce",
          "Roasted rack of lamb with Mediterranean herbs",
          "Aged beef tenderloin with mushrooms"
        ],
        conclusion: "The wine's refined tannins and mineral complexity complement sophisticated meat dishes beautifully."
      };
    }
    
    return {
      description: `${getWineDisplayName()}'s elegant structure and complex flavor profile makes it perfect for premium red meat preparations`,
      dishes: [
        "Grilled bistecca with herbs",
        "Braised short ribs with rich sauce",
        "Roasted rack of lamb with Mediterranean herbs",
        "Aged beef tenderloin with mushrooms"
      ],
      conclusion: "The wine's refined tannins and mineral complexity complement sophisticated meat dishes beautifully."
    };
  };

  const getCheesePairingContent = () => {
    if (currentWine) {
      return {
        description: `${currentWine.name}'s sophisticated profile pairs beautifully with these artisanal cheeses`,
        cheeses: [
          "Aged Cheddar (5+ years)",
          "Roquefort or Stilton blue cheese", 
          "Aged Gouda or aged Gruyère",
          "Pecorino Romano or aged Manchego"
        ],
        conclusion: "The wine's structure and complexity create excellent harmony with bold, aged cheeses."
      };
    }
    return {
      description: `${getWineDisplayName()}'s sophisticated tannin structure and complex flavors pair beautifully with these artisanal cheeses`,
      cheeses: [
        "Aged Parmigiano-Reggiano (24+ months)",
        "Aged Gouda or Manchego",
        "Gorgonzola or blue cheese varieties",
        "Aged sheep's milk cheese"
      ],
      conclusion: "The wine's elegant mineral backbone and structured tannins create perfect harmony with aged cheeses."
    };
  };

  const getVegetarianPairingContent = () => {
    if (currentWine) {
      return {
        description: `${currentWine.name} pairs wonderfully with these vegetarian options`,
        dishes: [
          "Hearty bean and vegetable stew",
          "Grilled portobello with herbs and olive oil",
          "Pasta with truffle and aged cheese",
          "Roasted eggplant parmigiana"
        ]
      };
    }
    return {
      description: `${getWineDisplayName()} pairs wonderfully with these vegetarian options`,
      dishes: [
        "Hearty bean and vegetable stew",
        "Grilled portobello with herbs and olive oil", 
        "Pasta with truffle and aged cheese",
        "Roasted eggplant parmigiana"
      ]
    };
  };

  const getAvoidPairingContent = () => {
    if (currentWine) {
      return {
        description: `To fully appreciate ${currentWine.name}, avoid pairing with these items`,
        items: [
          "Delicate fish preparations like sole or sea bass",
          "Fresh shellfish or raw oysters",
          "Very spicy Asian curries or hot dishes",
          "Light salads with acidic vinaigrettes",
          "Sweet desserts or milk chocolate"
        ]
      };
    }
    return {
      description: `To fully appreciate ${getWineDisplayName()}, avoid pairing with these items`,
      items: [
        "Delicate fish preparations like sole or sea bass",
        "Fresh shellfish or raw oysters",
        "Very spicy Asian curries or hot dishes", 
        "Light salads with acidic vinaigrettes",
        "Sweet desserts or milk chocolate"
      ]
    };
  };

  // Check if user has shared contact information
  const [hasSharedContact, setHasSharedContact] = useState(() => {
    return localStorage.getItem("hasSharedContact") === "true";
  });

  // State to control showing chat input interface instead of contact form
  const [showChatInput, setShowChatInput] = useState(() => {
    return localStorage.getItem("hasSharedContact") === "true";
  });

  // Add state for contact form
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [animationState, setAnimationState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  // Create portal element on mount
  useEffect(() => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    setPortalElement(element);

    return () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, []);

  // Contact form state
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

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: "US", name: "United States", dial_code: "+1" });
  const [filteredCountries] = useState([
    { code: "US", name: "United States", dial_code: "+1" },
    { code: "CA", name: "Canada", dial_code: "+1" },
    { code: "GB", name: "United Kingdom", dial_code: "+44" },
    { code: "FR", name: "France", dial_code: "+33" },
    { code: "DE", name: "Germany", dial_code: "+49" },
    { code: "IT", name: "Italy", dial_code: "+39" },
    { code: "ES", name: "Spain", dial_code: "+34" },
    { code: "AU", name: "Australia", dial_code: "+61" },
    { code: "JP", name: "Japan", dial_code: "+81" },
    { code: "CN", name: "China", dial_code: "+86" },
  ]);

  // Handle opening contact sheet
  const handleOpenContactSheet = () => {
    setShowContactSheet(true);
    setAnimationState("opening");
    setTimeout(() => setAnimationState("open"), 50);
  };

  // Handle closing contact sheet
  const handleCloseContactSheet = () => {
    setAnimationState("closing");
    setTimeout(() => {
      setAnimationState("closed");
      setShowContactSheet(false);
    }, 300);
  };

  // Enhanced content formatting with bold text support and list handling
  const formatContent = (content: string) => {
    if (!content) return <></>;

    // Helper function to format text with bold support
    const formatText = (text: string) => {
      if (!text) return "";
      
      // Split by ** to find bold text
      const parts = text.split(/\*\*(.*?)\*\*/g);
      
      return parts.map((part, index) => {
        // Odd indices are the content between ** markers (bold text)
        if (index % 2 === 1) {
          return (
            <strong key={index} style={{ fontWeight: 600 }}>
              {part}
            </strong>
          );
        }
        return part;
      });
    };

    // Split content into lines
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    lines.forEach((line, i) => {
      const isListItem = /^[-•*]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim());
      
      if (isListItem) {
        listItems.push(line.trim().replace(/^[-•*]\s|^\d+\.\s/, ""));
      } else {
        // Render accumulated list items
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

        // Regular text
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

    // Handle remaining list items
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

  // Use our enhanced conversation hook
  const {
    currentConversationId,
    setCurrentConversationId,
    messages,
    addMessage,
    conversations,
    createNewConversation,
    clearConversation,
    refetchMessages,
  } = useConversation(currentWine ? `wine_${currentWine.id}` : 'default');

  // Clear old conversation data if wine doesn't match stored messages
  useEffect(() => {
    if (currentWine && messages.length > 0) {
      const hasOldRidgeContent = messages.some(msg => 
        msg.content.includes("Ridge \"Lytton Springs\"") && 
        !currentWine.name.includes("Ridge")
      );
      
      if (hasOldRidgeContent) {
        console.log("Clearing outdated conversation data for wine:", currentWine.name);
        clearConversation();
      }
    }
  }, [currentWine, messages, clearConversation]);

  // Basic states
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [latestMessageId, setLatestMessageId] = useState<number | null>(null);
  const [showFullConversation, setShowFullConversation] = useState(false);
  const [, setLocation] = useLocation();
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasTriggeredAutoQuestion, setHasTriggeredAutoQuestion] = useState(false);
  const [currentEventSource, setCurrentEventSource] = useState<EventSource | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const { toast } = useToast();

  // Create a ref for the chat container to allow scrolling
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

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // API status check
  const { data: apiStatus } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 30000,
  });

  // Scroll behavior - only when suggestions are clicked or user asks questions
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // If the last message is from the user, scroll immediately to show it at the top
      if (lastMessage && lastMessage.role === "user") {
        setTimeout(() => {
          console.log(
            "Auto-scrolling to show user question at top immediately",
          );

          // Find the conversation container
          const conversationContainer = document.getElementById("conversation");
          if (conversationContainer) {
            // Get all message elements within the conversation
            const messageElements = conversationContainer.children;

            if (messageElements.length > 0) {
              const lastUserMessageElement = messageElements[
                messageElements.length - 1
              ] as HTMLElement;

              // Scroll to show the user's question at the top of the screen
              lastUserMessageElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
              });

              console.log("Scrolled to user question immediately");
            }
          }
        }, 100); // Short delay to ensure DOM is updated
      }
      // Also scroll when AI response arrives but question was already at top
      else if (
        lastMessage &&
        lastMessage.role === "assistant" &&
        messages.length >= 2
      ) {
        const userQuestion = messages[messages.length - 2];
        if (userQuestion && userQuestion.role === "user") {
          setTimeout(() => {
            console.log("Maintaining user question at top after AI response");

            const conversationContainer =
              document.getElementById("conversation");
            if (conversationContainer) {
              const messageElements = conversationContainer.children;

              if (messageElements.length >= 2) {
                const lastUserMessageElement = messageElements[
                  messageElements.length - 2
                ] as HTMLElement;

                lastUserMessageElement.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                  inline: "nearest",
                });

                console.log("Maintained user question at top");
              }
            }
          }, 500); // Allow time for AI response to render
        }
      }
    }
  }, [messages.length]);

  // Handle sending messages to the API
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    try {
      console.log("Sending message:", content);
      setIsTyping(true);
      setHideSuggestions(true);

      // Add the user's message immediately to the UI
      const userMessage: ClientMessage = {
        id: Date.now(),
        content: content.trim(),
        role: "user",
        conversationId: currentConversationId,
        createdAt: new Date().toISOString(),
      };

      addMessage(userMessage);

      // Prepare the request body for the API
      const requestBody = {
        message: content.trim(),
        conversationId: currentConversationId,
        wineData: currentWine,
      };

      console.log("API request body:", requestBody);

      // Try streaming if supported
      if (isStreamingSupported()) {
        console.log("Using streaming API");
        
        const streamingClient = createStreamingClient();
        const eventSource = streamingClient.createEventSource('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(requestBody)
        });
        
        setCurrentEventSource(eventSource);
        
        let streamingContent = '';
        let assistantMessageId = Date.now() + 1;
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Streaming event received:', data);
            
            switch (data.type) {
              case 'start':
                console.log("Streaming started");
                streamingContent = data.content || '';
                
                // Create initial message in UI
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
                // Accumulate streaming content and update UI
                if (data.content) {
                  streamingContent += data.content;
                  console.log(`Token ${data.token_count} received`);
                  
                  // Update messages state directly since setMessages is not available
                  refetchMessages();
                }
                break;
                
              case 'tts_chunk':
                // Progressive TTS processing for chunked audio
                if (data.content && window.voiceAssistant?.speakResponse) {
                  console.log(`Progressive TTS chunk (${data.chunk_size} chars):`, data.content);
                  // Queue additional TTS chunks for smoother audio playback
                  window.voiceAssistant.speakResponse(data.content);
                }
                break;
                
              case 'complete':
                console.log("Streaming completed successfully");
                
                // Store the complete message for Listen Response button
                (window as any).lastAssistantMessageText = streamingContent;
                
                // Trigger unmute button to show after response is ready
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
          // Fallback to regular request
          throw new Error('Streaming connection failed');
        };
        
        return;
      }
      
      // Fallback to regular non-streaming request
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

      console.log("API response status:", response.status);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      console.log("API response data:", responseData);

      // Add the assistant's response to the UI
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

        // Auto-play TTS if enabled and voice assistant is available
        if (window.voiceAssistant?.speakResponse) {
          await window.voiceAssistant.speakResponse(assistantMessage.content);
        }

        // Trigger unmute button to show after response is ready
        window.dispatchEvent(new CustomEvent('showUnmuteButton'));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message to UI to provide user feedback
      const errorMessage: ClientMessage = {
        id: Date.now() + 1,
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        role: "assistant",
        conversationId: currentConversationId,
        createdAt: new Date().toISOString(),
      };
      
      addMessage(errorMessage);
      
      toast({
        title: "Connection Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Cleanup event source on unmount or when starting new conversation
  useEffect(() => {
    const abortConversation = () => {
      if (currentEventSource) {
        currentEventSource.close();
        setCurrentEventSource(null);
        setIsTyping(false);
      }
    };
    
    // Listen for abort events
    window.addEventListener('abortConversation', abortConversation);
    
    return () => {
      window.removeEventListener('abortConversation', abortConversation);
      abortConversation(); // Clean up on unmount
    };
  }, [currentEventSource]);

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
            {/* Wine bottle image with fixed size and glow effect - fullscreen height from top */}
            <div
              className="w-full flex flex-col items-center justify-center py-8 relative"
              style={{
                backgroundColor: "#0A0A0A",
                paddingTop: "75px", // Match the header height exactly
                minHeight: "100vh", // Make the div full screen height
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
                {selectedWine ? `2021 ${selectedWine.name}` : currentWine ? `${currentWine.year} ${currentWine.name}` : `${getWineVintage()} ${getWineDisplayName()}`}
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
                <span>{selectedWine ? "Santa Cruz Mountains | California | United States" : getWineRegion()}</span>
              </div>

              {/* Wine ratings section */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "16px",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                  position: "relative",
                  zIndex: 2,
                  marginBottom: "40px",
                }}
              >
                {/* Vinous */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.60)",
                      ...typography.body2R,
                    }}
                  >
                    VN
                  </span>
                  <span
                    style={{
                      color: "white",
                      ...typography.h3,
                      lineHeight: "20px",
                    }}
                  >
                    {selectedWine ? selectedWine.ratings.vn : currentWine?.ratings.vn || 95}
                  </span>
                </div>

                {/* Jeb Dunnuck */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.60)",
                      ...typography.body2R,
                    }}
                  >
                    JD
                  </span>
                  <span
                    style={{
                      color: "white",
                      ...typography.h3,
                      lineHeight: "20px",
                    }}
                  >
                    {selectedWine ? selectedWine.ratings.jd : currentWine?.ratings.jd || 93}
                  </span>
                </div>

                {/* Wine Spectator */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.60)",
                      ...typography.body2R,
                    }}
                  >
                    WS
                  </span>
                  <span
                    style={{
                      color: "white",
                      ...typography.h3,
                      lineHeight: "20px",
                    }}
                  >
                    {selectedWine ? selectedWine.ratings.ws : currentWine?.ratings.ws || 92}
                  </span>
                </div>

                {/* ABV */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.60)",
                      ...typography.body2R,
                    }}
                  >
                    ABV
                  </span>
                  <span
                    style={{
                      color: "white",
                      ...typography.h3,
                      lineHeight: "20px",
                    }}
                  >
                    {selectedWine ? `${selectedWine.ratings.abv}%` : currentWine?.ratings.abv ? `${currentWine.ratings.abv}%` : "14.8%"}
                  </span>
                </div>
              </div>

              {/* History Section */}
              <div
                style={{
                  width: "100%",
                  padding: "0 20px",
                  marginBottom: "20px",
                  textAlign: "left",
                  position: "relative",
                  zIndex: 2,
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

              {/* Food Pairing Section */}
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

                {/* Red Meat Pairing - Expandable */}
                <div
                  onClick={() => {
                    // Toggle expanded state for this item
                    setExpandedItem(
                      expandedItem === "redMeat" ? null : "redMeat",
                    );
                  }}
                  style={{
                    backgroundColor: "#191919",
                    borderRadius: "16px",
                    padding: "0 20px",
                    minHeight: "64px", // Use minHeight instead of fixed height to allow expansion
                    marginBottom: "8px",
                    display: "flex",
                    flexDirection: "column", // Change to column for expanded view
                    gap: "10px",
                    alignSelf: "stretch",
                    cursor: "pointer", // Show pointer cursor to indicate clickable
                    transition: "all 0.3s ease", // Smooth transition for expanding
                  }}
                >
                  {/* Header row - always visible */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: "64px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>🥩</span>
                      <span
                        style={{
                          color: "white",
                          ...typography.body,
                        }}
                      >
                        Red Meat
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: "black",
                          backgroundColor: "#e0e0e0",
                          padding: "6px 14px",
                          borderRadius: "999px",
                          ...typography.buttonPlus1,
                        }}
                      >
                        Perfect match
                      </span>
                      {/* Rotating chevron icon for expanded state */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          transform:
                            expandedItem === "redMeat"
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition: "transform 0.3s ease",
                        }}
                      >
                        <path
                          d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                          fill="white"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === "redMeat" && (
                    <div
                      style={{
                        padding: "0 0 20px 0",
                        color: "white",
                        ...typography.body,
                      }}
                    >
                      <p style={{ margin: "0 0 12px 0", color: "rgba(255, 255, 255, 0.8)" }}>
                        {getFoodPairingContent().description}
                      </p>
                      <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                        {getFoodPairingContent().dishes.map((dish: string, index: number) => (
                          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "16px" }}>🥩</span>
                            <span>{dish}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ margin: "12px 0 0 0", color: "rgba(255, 255, 255, 0.8)" }}>
                        {getFoodPairingContent().conclusion}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cheese Pairing - Expandable */}
                <div
                  onClick={() => {
                    // Toggle expanded state for this item
                    setExpandedItem(
                      expandedItem === "cheese" ? null : "cheese",
                    );
                  }}
                  style={{
                    backgroundColor: "#191919",
                    borderRadius: "16px",
                    padding: "0 20px",
                    minHeight: "64px",
                    marginBottom: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignSelf: "stretch",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Header row - always visible */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: "64px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>🧀</span>
                      <span style={{ color: "white", ...typography.body }}>
                        Cheese
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: "black",
                          backgroundColor: "#e0e0e0",
                          padding: "6px 14px",
                          borderRadius: "999px",
                          ...typography.buttonPlus1,
                        }}
                      >
                        Great match
                      </span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          transform:
                            expandedItem === "cheese"
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition: "transform 0.3s ease",
                        }}
                      >
                        <path
                          d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                          fill="white"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === "cheese" && (
                    <div
                      style={{
                        padding: "0 0 20px 0",
                        color: "white",
                        ...typography.body,
                      }}
                    >
                      <p style={{ margin: "0 0 12px 0", color: "rgba(255, 255, 255, 0.8)" }}>
                        {getCheesePairingContent().description}
                      </p>
                      <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                        {getCheesePairingContent().cheeses.map((cheese: string, index: number) => (
                          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "16px" }}>🧀</span>
                            <span>{cheese}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ margin: "12px 0 0 0", color: "rgba(255, 255, 255, 0.8)" }}>
                        {getCheesePairingContent().conclusion}
                      </p>
                    </div>
                  )}
                </div>

                {/* Vegetarian Pairing - Expandable */}
                <div
                  onClick={() => {
                    setExpandedItem(expandedItem === "vegetarian" ? null : "vegetarian");
                  }}
                  style={{
                    backgroundColor: "#191919",
                    borderRadius: "16px",
                    padding: "0 20px",
                    minHeight: "64px",
                    marginBottom: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignSelf: "stretch",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Header row - always visible */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: "64px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>🥗</span>
                      <span style={{ color: "white", ...typography.body }}>
                        Vegetarian
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: "black",
                          backgroundColor: "#e0e0e0",
                          padding: "6px 14px",
                          borderRadius: "999px",
                          ...typography.buttonPlus1,
                        }}
                      >
                        Good match
                      </span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          transform:
                            expandedItem === "vegetarian"
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition: "transform 0.3s ease",
                        }}
                      >
                        <path
                          d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                          fill="white"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === "vegetarian" && (
                    <div
                      style={{
                        padding: "0 0 20px 0",
                        color: "white",
                        ...typography.body,
                      }}
                    >
                      <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                        {getVegetarianPairingContent().dishes.map((dish: string, index: number) => (
                          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "16px" }}>🥗</span>
                            <span>{dish}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avoid pairing with - Expandable */}
                <div
                  onClick={() => {
                    // Toggle expanded state for this item
                    setExpandedItem(expandedItem === "avoid" ? null : "avoid");
                  }}
                  style={{
                    backgroundColor: "#191919",
                    borderRadius: "16px",
                    padding: "0 20px",
                    minHeight: "64px",
                    marginBottom: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignSelf: "stretch",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Header row - always visible */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: "64px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span style={{ fontSize: "24px", color: "red" }}>❌</span>
                      <span style={{ color: "white", ...typography.body }}>
                        Avoid pairing with
                      </span>
                    </div>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        transform:
                          expandedItem === "avoid"
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                      }}
                    >
                      <path
                        d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                        fill="white"
                      />
                    </svg>
                  </div>

                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === "avoid" && (
                    <div
                      style={{
                        padding: "0 0 20px 0",
                        color: "white",
                        ...typography.body,
                      }}
                    >
                      <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                        {getAvoidPairingContent().items.map((item: string, index: number) => (
                          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "16px", color: "red" }}>❌</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Section - Only show on Home page, not Wine Details */}
              {messages.length > 0 && !showBuyButton && (
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
                  >Chat summary</h1>

                  {/* Discussion Summary */}
                  <div style={{ marginBottom: "32px" }}>
                    {(() => {
                      // Generate a comprehensive summary based on the conversation
                      const summaryText = messages.length > 0 
                        ? "Based on your conversation, you've explored the unique characteristics, flavor profile, and pairing possibilities of this exceptional wine. The discussion covered various aspects including its distinctive terroir, winemaking traditions, and what makes it a standout choice for wine enthusiasts. Your questions and our AI sommelier's responses have provided valuable insights into this wine's complexity and versatility."
                        : "This wine offers a rich tapestry of flavors and aromas that reflect its prestigious terroir and traditional winemaking methods. From its complex tasting profile to perfect food pairings, this bottle represents the finest expression of its varietal and region.";

                      return (
                        <div>
                          <p
                            style={{
                              ...typography.body,
                              color: "rgba(255, 255, 255, 0.8)",
                              lineHeight: "1.6",
                              margin: "0 0 16px 0",
                              paddingBottom: "16px",
                            }}
                          >
                            {summaryText}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Show whole dialog button */}
                    <button
                      onClick={() => setLocation("/wine/conversation")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.16)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.16)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.16)";
                      }}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        borderRadius: "32px",
                        height: "56px",
                        minHeight: "56px",
                        maxHeight: "56px",
                        padding: "0 16px",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "16px",
                        fontWeight: 500,
                        cursor: "pointer",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                        lineHeight: "1",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      Show whole dialog
                    </button>

                    {/* Buy again button */}
                    <button
                      onClick={() => {
                        if (currentWine?.buyAgainLink) {
                          window.open(currentWine.buyAgainLink, '_blank');
                        } else {
                          console.log("No buy again link available");
                        }
                      }}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        borderRadius: "32px",
                        height: "56px",
                        minHeight: "56px",
                        maxHeight: "56px",
                        padding: "0 16px",
                        margin: "8px 0 0 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "16px",
                        fontWeight: 500,
                        cursor: "pointer",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                        lineHeight: "1",
                      }}
                    >
                      Buy again
                    </button>
                  </div>
                </div>
              )}

              {/* Conversation Section - Want more? section always visible when showBuyButton is true */}
              <div
                style={{
                  width: "100%",
                  padding: "0 20px",
                  marginBottom: "20px",
                }}
              >
                {showBuyButton && (
                  <>
                    <h1
                      style={{
                        ...typography.h1,
                        color: "white",
                        marginBottom: "24px",
                        textAlign: "left",
                      }}
                    >Want more?</h1>

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
                      style={{
                        margin: "0 0 32px 0",
                        width: "100%",
                      }}
                    >
                      Buy again
                    </Button>

                    {/* Chat with AI Section */}
                    <div style={{ marginBottom: "32px" }}>
                      <h1
                        style={{
                          ...typography.h1,
                          color: "white",
                          marginBottom: "16px",
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
                                <div
                                  style={{
                                    backgroundColor: message.role === "user" ? "#F5F5F5" : "transparent",
                                    borderRadius: "16px",
                                    padding: message.role === "user" ? "12px 16px" : "12px 0",
                                    width: message.role === "user" ? "fit-content" : "100%",
                                    maxWidth: message.role === "user" ? "80%" : "100%",
                                  }}
                                >
                                  {message.role === "assistant" ? (
                                    <div
                                      style={{
                                        ...typography.body,
                                        color: "#DBDBDB",
                                      }}
                                    >
                                      {formatContent(message.content)}
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        ...typography.body,
                                        color: "#000000",
                                      }}
                                    >
                                      {formatContent(message.content)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                          
                          {/* View full conversation button */}
                          <Button
                            onClick={() => setLocation("/wine/conversation")}
                            variant="secondary"
                            style={{
                              height: "48px",
                              margin: "8px 0 0 0",
                              width: "100%",
                            }}
                          >View all</Button>
                        </div>
                      )}
                    </div>

                    {/* Discussion Summary */}
                    {messages.length > 0 && (
                      <div style={{ marginBottom: "32px" }}>
                        {(() => {
                          // Generate a comprehensive summary based on the conversation
                          const summaryText = messages.length > 0 
                            ? "Based on your conversation, you've explored the unique characteristics, flavor profile, and pairing possibilities of this exceptional wine. The discussion covered various aspects including its distinctive terroir, winemaking traditions, and what makes it a standout choice for wine enthusiasts. Your questions and our AI sommelier's responses have provided valuable insights into this wine's complexity and versatility."
                            : "This wine offers a rich tapestry of flavors and aromas that reflect its prestigious terroir and traditional winemaking methods. From its complex tasting profile to perfect food pairings, this bottle represents the finest expression of its varietal and region.";

                          return (
                            <div>
                              {/* Hide summary text on scanned page */}
                              {!showBuyButton && (
                                <p
                                  style={{
                                    ...typography.body,
                                    color: "rgba(255, 255, 255, 0.8)",
                                    lineHeight: "1.6",
                                    margin: "0",
                                  }}
                                >
                                  {summaryText}
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* Show whole dialog button - hide on scanned page */}
                        {!showBuyButton && (
                          <Button
                            onClick={() => setLocation("/wine/conversation")}
                            variant="secondary"
                            style={{
                              height: "56px",
                              width: "100%",
                            }}
                          >
                            Show whole dialog
                          </Button>
                        )}

                      </div>
                    )}
                  </>
                )}

                {/* Conversation Content */}
                <div id="conversation" className="space-y-4 mb-96">
                  {messages.length > 0 ? (
                    showFullConversation ? (
                      // Show full conversation with date headers
                      (<>
                        {(() => {
                          // Filter messages to show only current session (today's messages)
                          const today = new Date().toDateString();
                          const currentSessionMessages = messages.filter((message: any) => {
                            const messageDate = new Date(message.createdAt || Date.now());
                            return messageDate.toDateString() === today;
                          });
                          
                          // Group current session messages by date
                          const messagesByDate = currentSessionMessages.reduce((groups: any, message: any, index: number) => {
                            const messageDate = new Date(message.createdAt || Date.now());
                            const dateKey = messageDate.toDateString();
                            
                            if (!groups[dateKey]) {
                              groups[dateKey] = [];
                            }
                            groups[dateKey].push({ ...message, originalIndex: index });
                            return groups;
                          }, {});

                          return Object.entries(messagesByDate).map(([dateKey, dayMessages]: [string, any]) => (
                            <div key={dateKey}>
                              {/* Sticky Date Header */}
                              <div
                                style={{
                                  position: "sticky",
                                  top: "75px", // Account for main header
                                  zIndex: 10,
                                  display: "flex",
                                  justifyContent: "center",
                                  marginBottom: "16px",
                                  marginTop: Object.keys(messagesByDate).indexOf(dateKey) > 0 ? "24px" : "0px",
                                }}
                              >
                                <div
                                  style={{
                                    backgroundColor: "rgba(28, 28, 28, 0.9)",
                                    backdropFilter: "blur(8px)",
                                    borderRadius: "16px",
                                    padding: "6px 12px",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "rgba(255, 255, 255, 0.7)",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {new Date(dateKey).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Messages for this date */}
                              {dayMessages.map((message: any, messageIndex: number) => (
                                <ChatMessage
                                  key={`${dateKey}-${message.id}-${messageIndex}`}
                                  message={message}
                                  isLatest={message.id === latestMessageId}
                                  formatContent={formatContent}
                                />
                              ))}
                            </div>
                          ));
                        })()}
                      </>)
                    ) : (
                      // Show only the most recent messages (default view)
                      messages.slice(-4).map((message: any, index: number) => (
                        <ChatMessage
                          key={`${message.id}-${index}`}
                          message={message}
                          isLatest={message.id === latestMessageId}
                          formatContent={formatContent}
                        />
                      ))
                    )
                  ) : (
                    // Loading state when no messages
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="typing-indicator mb-4">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <p className="text-gray-500 text-sm">Initializing conversation...</p>
                      </div>
                    </div>
                  )}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Space for fixed input - 80px bottom padding */}
                <div style={{ height: "80px" }}></div>
              </div>
            </div>
          </div>

          {/* Input Area or Buy Button - Fixed to Bottom */}
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
                // Show Buy Again Button for WineDetails page
                (<Button
                  onClick={() => {
                    if (currentWine?.buyAgainLink) {
                      window.open(currentWine.buyAgainLink, '_blank');
                    } else {
                      console.log("No buy again link available");
                    }
                  }}
                  variant="primary"
                  style={{
                    margin: 0,
                    width: "100%",
                  }}
                >Buy again
                                  </Button>)
              ) : (
                // Show suggestions and input for Home page
                (<>
                  {/* Suggestion chips - always visible above input */}
                  <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
                    <Button
                      onClick={() => handleSendMessage("Tasting notes")}
                      variant="suggestion"
                      size="sm"
                      className="whitespace-nowrap flex-shrink-0"
                    >
                      Tasting notes
                    </Button>
                    <Button
                      onClick={() => handleSendMessage("Food pairing")}
                      variant="suggestion"
                      size="sm"
                      className="whitespace-nowrap flex-shrink-0"
                    >
                      Food pairing
                    </Button>
                    <Button
                      onClick={() => handleSendMessage("Serving temperature")}
                      variant="suggestion"
                      size="sm"
                      className="whitespace-nowrap flex-shrink-0"
                    >
                      Serving temperature
                    </Button>
                    <Button
                      onClick={() => handleSendMessage("Aging potential")}
                      variant="suggestion"
                      size="sm"
                      className="whitespace-nowrap flex-shrink-0"
                    >
                      Aging potential
                    </Button>
                  </div>

                  {/* Voice Assistant and Chat Input */}
                  <div className="flex gap-2 sm:gap-3 items-end w-full">
                    <VoiceAssistant onSendMessage={handleSendMessage} />
                    <div className="flex-1">
                      <ChatInput 
                        onSendMessage={handleSendMessage} 
                        disabled={isTyping}
                        onFocus={() => setIsKeyboardFocused(true)}
                        onBlur={() => setIsKeyboardFocused(false)}
                      />
                    </div>
                  </div>
                </>)
              )}
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <Button
              onClick={scrollToBottom}
              style={{
                position: 'fixed',
                bottom: '100px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#000',
                border: 'none',
                width: '48px',
                height: '48px',
                borderRadius: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                zIndex: 1000,
                backdropFilter: 'blur(8px)',
                padding: '0',
                minHeight: '48px',
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
                  fill="white"
                />
                <path
                  d="M12 20l-4-4h8l-4 4z"
                  fill="white"
                  opacity="0.6"
                />
              </svg>
            </Button>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;