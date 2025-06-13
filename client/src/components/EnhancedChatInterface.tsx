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
  const [currentWine, setCurrentWine] = useState<any>(null);

  // Load current wine data from CRM or use selectedWine prop
  useEffect(() => {
    if (selectedWine) {
      setCurrentWine(selectedWine);
    } else {
      // Get wine ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const wineId = urlParams.get('wine');
      
      if (wineId) {
        // Load wine from unified data system
        const unifiedWines = DataSyncManager.getUnifiedWineData();
        const wine = unifiedWines.find((w: any) => w.id === parseInt(wineId));
        if (wine) {
          // Get full wine data from CRM
          const crmWines = JSON.parse(localStorage.getItem('admin-wines') || '[]');
          const fullWine = crmWines.find((w: any) => w.id === parseInt(wineId));
          setCurrentWine(fullWine || wine);
          return;
        }
      }
      
      // Fallback to first wine in CRM
      const crmWines = JSON.parse(localStorage.getItem('admin-wines') || '[]');
      const wine = crmWines.find((w: any) => w.id === 1) || crmWines[0];
      if (wine) {
        setCurrentWine(wine);
      }
    }
  }, [selectedWine]);
  // Get wine-specific content based on current wine
  const getWineHistory = () => {
    if (currentWine && currentWine.description) {
      console.log('🍷 Displaying wine description for:', currentWine.name, 'Description length:', currentWine.description.length);
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
  const [showChatInput, setShowChatInput] = useState(true);

  // State for contact bottom sheet - using same structure as Cellar page
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

  // Form validation and handling from Cellar page
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

        // Show success toast notification
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

    // Handle bold text first
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

  // Listen for chat history clearing events
  useEffect(() => {
    const handleChatHistoryCleared = () => {
      console.log('Chat history cleared event received');
      clearConversation();
      createNewConversation();
    };

    window.addEventListener('chat-history-cleared', handleChatHistoryCleared);
    
    return () => {
      window.removeEventListener('chat-history-cleared', handleChatHistoryCleared);
    };
  }, [clearConversation, createNewConversation]);

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
              }
            }
          }, 300);
        }
      }
    }
    // On initial load, scroll to top to show beginning of page
    else if (chatContainerRef.current && messages.length === 0) {
      chatContainerRef.current.scrollTo({
        top: 0,
        behavior: "auto",
      });
    }
  }, [messages.length]); // Only depend on messages.length to trigger when new messages are added

  // Reset suggestions visibility when conversation changes
  useEffect(() => {
    if (messages.length === 0) {
      setHideSuggestions(false);
    }
  }, [messages.length]);

  // Auto-conversation starter after 2 seconds of inactivity
  useEffect(() => {
    // Clear existing timer
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // Only trigger if no messages exist and user hasn't been auto-prompted yet
    if (messages.length === 0 && !hasTriggeredAutoQuestion && !isTyping) {
      const timer = setTimeout(() => {
        if (messages.length === 0 && !hasTriggeredAutoQuestion) {
          console.log("Triggering automatic conversation starter after 2 seconds of inactivity");
          setHasTriggeredAutoQuestion(true);
          
          const autoQuestions = [
            "Tell me about this wine's flavor profile",
            "What food pairs well with this wine?",
            "What makes this wine special?",
            "How should I serve this wine?",
            "What's the story behind this wine?"
          ];
          
          const randomQuestion = autoQuestions[Math.floor(Math.random() * autoQuestions.length)];
          handleSendMessage(randomQuestion);
        }
      }, 2000); // 2 seconds
      
      setInactivityTimer(timer);
    }

    // Cleanup timer on unmount
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [messages.length, hasTriggeredAutoQuestion, isTyping]);

  // Reset auto-question trigger when user manually sends a message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        setHasTriggeredAutoQuestion(false);
      }
    }
  }, [messages]);

  // Listen for precomputed suggestion responses
  useEffect(() => {
    const handleImmediateResponse = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, audio } = customEvent.detail;
      
      // Add the precomputed response immediately to conversation
      const immediateMessage: ClientMessage = {
        ...message,
        conversationId: currentConversationId || 0,
        createdAt: new Date().toISOString()
      };
      
      await addMessage(immediateMessage);
      setIsTyping(false);
      
      // Handle audio playback if available
      if (audio) {
        try {
          const audioUrl = URL.createObjectURL(audio);
          const audioElement = new Audio(audioUrl);
          
          // Set up global audio reference for mute controls
          (window as any).currentOpenAIAudio = audioElement;
          
          console.log("Playing precomputed TTS audio");
          await audioElement.play();
          
          // Clean up URL when done and reset to Ask button state
          audioElement.onended = () => {
            URL.revokeObjectURL(audioUrl);
            (window as any).currentOpenAIAudio = null;
            // Signal that suggestion playback ended to show Ask button
            window.dispatchEvent(new CustomEvent('suggestionPlaybackEnded'));
          };
        } catch (error) {
          console.warn("Failed to play precomputed audio:", error);
          // If audio fails, still signal playback ended
          window.dispatchEvent(new CustomEvent('suggestionPlaybackEnded'));
        }
      }
    };

    window.addEventListener('immediateResponse', handleImmediateResponse);
    
    return () => {
      window.removeEventListener('immediateResponse', handleImmediateResponse);
    };
  }, [currentConversationId, addMessage]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (content.trim() === "" || !currentConversationId) return;

    // Hide suggestions after sending a message
    setHideSuggestions(true);
    setIsTyping(true);

    try {
      // Add user message to UI immediately
      const tempUserMessage: ClientMessage = {
        id: Date.now(),
        content,
        role: "user",
        conversationId: currentConversationId,
        createdAt: new Date().toISOString(),
      };

      // Add message to the conversation
      await addMessage(tempUserMessage);

      // Debug log the wine data being sent
      console.log("Sending wine data to API:", currentWine);
      
      // Make the API request - system prompt will be dynamically generated based on wine data
      // Safari compatibility: ensure proper headers and body formatting
      const requestBody = {
        messages: [
          { role: "user", content },
        ],
        conversationId: currentConversationId,
        wineData: currentWine, // Include wine data from CRM - this will generate dynamic system prompt
        optimize_for_speed: true, // Additional flag to optimize for speed
      };

      console.log("Making API request with data:", requestBody);

      // Check if streaming is enabled for first-token TTS
      const enableStreaming = import.meta.env.VITE_ENABLE_STREAMING === 'true';
      
      if (enableStreaming && isStreamingSupported()) {
        console.log("Starting real-time streaming with first-token TTS");
        
        // Create streaming request with Server-Sent Events
        const eventSource = new EventSource(`/api/chat-stream?${new URLSearchParams({
          messages: JSON.stringify([{ role: "user", content }]),
          conversationId: currentConversationId?.toString() || '',
          wineData: JSON.stringify(currentWine),
          optimize_for_speed: 'true'
        })}`);
        
        // Store the current event source for abort functionality
        setCurrentEventSource(eventSource);
        
        let streamingContent = '';
        let firstTokenReceived = false;
        let assistantMessageId = Date.now() + 1;
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'first_token':
                console.log(`First token received in ${data.latency?.toFixed(2)}ms:`, data.content);
                streamingContent = data.content;
                firstTokenReceived = true;
                
                // Start TTS with first token for maximum responsiveness
                if (data.start_tts && window.voiceAssistant?.speakResponse) {
                  console.log("Starting immediate TTS with first token");
                  window.voiceAssistant.speakResponse(data.content);
                }
                
                // Create initial assistant message
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
        await addMessage(assistantMessage);
        window.dispatchEvent(new CustomEvent('showUnmuteButton'));
        console.log("Response received - autoplay disabled, user must click to listen");
      }

      // Refresh all messages
      refetchMessages();
    } catch (error) {
      console.error("Error in chat request:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
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

  // Abort ongoing conversation when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      if (currentEventSource) {
        console.log("Aborting ongoing conversation due to component cleanup");
        currentEventSource.close();
        setCurrentEventSource(null);
      }
    };
  }, [currentEventSource]);

  // Global function to abort conversation when bottom sheet closes
  useEffect(() => {
    const abortConversation = () => {
      if (currentEventSource) {
        console.log("Aborting conversation due to bottom sheet close");
        currentEventSource.close();
        setCurrentEventSource(null);
        setIsTyping(false);
      }
    };

    // Listen for bottom sheet close events
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
                <span
                  style={{
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ ...typography.num, color: "white" }}>
                    {currentWine ? currentWine.ratings.vn : 95}
                  </span>
                  <span style={{ ...typography.body1R, color: "#999999" }}>
                    VN
                  </span>
                </span>
                <span
                  style={{
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ ...typography.num, color: "white" }}>
                    {currentWine ? currentWine.ratings.jd : 93}
                  </span>
                  <span style={{ ...typography.body1R, color: "#999999" }}>
                    JD
                  </span>
                </span>
                <span
                  style={{
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ ...typography.num, color: "white" }}>
                    {currentWine ? currentWine.ratings.ws : 93}
                  </span>
                  <span style={{ ...typography.body1R, color: "#999999" }}>
                    WS
                  </span>
                </span>
                <span
                  style={{
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ ...typography.num, color: "white" }}>
                    {currentWine ? `${currentWine.ratings.abv}%` : '14.3%'}
                  </span>
                  <span style={{ ...typography.body1R, color: "#999999" }}>
                    ABV
                  </span>
                </span>
              </div>

              {/* Historic Heritage Section */}
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
                        padding: "0 0 20px 0", // Remove left padding
                        color: "white",
                        ...typography.body, // Using Body text style as requested
                      }}
                      className="pl-[0px] pr-[0px]"
                    >
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

                {/* Cheese Pairings - Expandable */}
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
                        Cheese Pairings
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

                  {/* Expanded content - only visible when expanded */}
                  {expandedItem === "cheese" && (
                    <div
                      style={{
                        padding: "0 0 20px 0",
                        color: "white",
                        ...typography.body,
                      }}
                    >
                      <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                        {getCheesePairingContent().cheeses.map((cheese: string, index: number) => (
                          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "16px" }}>🧀</span>
                            <span>{cheese}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vegetarian Options - Expandable */}
                <div
                  onClick={() => {
                    // Toggle expanded state for this item
                    setExpandedItem(
                      expandedItem === "vegetarian" ? null : "vegetarian",
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
                      <span style={{ fontSize: "24px" }}>🥗</span>
                      <span style={{ color: "white", ...typography.body }}>
                        Vegetarian Options
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

              {/* More Section */}
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
                  style={{
                    margin: "0 0 24px 0",
                    width: "100%",
                    height: "56px",
                  }}
                >
                  Buy again
                </Button>


              </div>

              {/* We recommend Section */}
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
                  We recommend
                </h1>

                {/* Wine Recommendation Cards - Horizontal Scroll */}
                <div
                  className="wine-recommendations-container"
                  style={{
                    display: "flex",
                    gap: "16px",
                    overflowX: "auto",
                    paddingBottom: "8px",
                  }}
                >
                  {/* Recommendation 1 - Estate Chardonnay */}
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "16px 16px 24px 16px",
                      width: "208px",
                      minWidth: "208px",
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                    }}
                  >
                    {/* Wine Bottle Image */}
                    <div
                      style={{
                        width: "120px",
                        height: "200px",
                        backgroundImage: "url('/@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1748949884152.jpeg')",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        marginBottom: "20px",
                      }}
                    />
                    
                    {/* Wine Name */}
                    <h2
                      style={{
                        ...typography.h2,
                        color: "white",
                        textAlign: "center",
                        margin: "0 0 16px 0",
                        height: "72px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      2022 Estate Chardonnay
                    </h2>
                    
                    {/* Rating Badges */}
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ ...typography.num, color: "white" }}>
                          95
                        </span>
                        <span style={{ ...typography.body1R, color: "#999999" }}>
                          VN
                        </span>
                      </span>
                      <span
                        style={{
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ ...typography.num, color: "white" }}>
                          93
                        </span>
                        <span style={{ ...typography.body1R, color: "#999999" }}>
                          JD
                        </span>
                      </span>
                      <span
                        style={{
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ ...typography.num, color: "white" }}>
                          93
                        </span>
                        <span style={{ ...typography.body1R, color: "#999999" }}>
                          WS
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Recommendation 2 - Monte Bello Cabernet */}
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "16px 16px 24px 16px",
                      width: "208px",
                      minWidth: "208px",
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                    }}
                  >
                    {/* Wine Bottle Image */}
                    <div
                      style={{
                        width: "120px",
                        height: "200px",
                        backgroundImage: "url('/@assets/wine-2-monte-bello-cabernet-sauvignon-1748949884152.jpeg')",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        marginBottom: "20px",
                      }}
                    />
                    
                    {/* Wine Name */}
                    <h2
                      style={{
                        ...typography.h2,
                        color: "white",
                        textAlign: "center",
                        margin: "0 0 16px 0",
                        height: "72px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      2021 Monte Bello Cabernet Sauvignon
                    </h2>
                    
                    {/* Rating Badges */}
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ ...typography.num, color: "white" }}>
                          95
                        </span>
                        <span style={{ ...typography.body1R, color: "#999999" }}>
                          VN
                        </span>
                      </span>
                      <span
                        style={{
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ ...typography.num, color: "white" }}>
                          93
                        </span>
                        <span style={{ ...typography.body1R, color: "#999999" }}>
                          JD
                        </span>
                      </span>
                      <span
                        style={{
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ ...typography.num, color: "white" }}>
                          93
                        </span>
                        <span style={{ ...typography.body1R, color: "#999999" }}>
                          WS
                        </span>
                      </span>
                    </div>
                  </div>
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

              {/* Conversation Section */}
              <div
                style={{
                  width: "100%",
                  padding: "0 20px",
                  marginBottom: "20px",
                }}
              >
                {showBuyButton && (
                  <>
                    {hasSharedContact ? (
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
                    ) : (
                      // Show "Chat history" section when user hasn't shared contact info
                      (<div
                        style={{ textAlign: "center", marginBottom: "32px" }}
                      >
                        <h1
                          style={{
                            ...typography.h1,
                            color: "white",
                            margin: "0 0 24px 0",
                            textAlign: "left",
                          }}
                        >
                          Chat history
                        </h1>

                      </div>)
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
                                      color: "rgba(255, 255, 255, 0.8)",
                                      fontSize: "12px",
                                      fontWeight: 500,
                                      fontFamily: "Inter, sans-serif",
                                    }}
                                  >
                                    {new Date(dateKey).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Messages for this date */}
                              {dayMessages.map((message: any, msgIndex: number) => (
                                <div
                                  key={`${message.id}-${message.originalIndex}`}
                                  style={{
                                    display: "flex",
                                    justifyContent:
                                      message.role === "user"
                                        ? "flex-end"
                                        : "flex-start",
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
                                      padding: "16px",
                                      width:
                                        message.role === "user"
                                          ? "fit-content"
                                          : "100%",
                                      maxWidth:
                                        message.role === "user" ? "80%" : "100%",
                                    }}
                                    data-role={message.role}
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
                            </div>
                          ));
                        })()}
                        {/* Back to Summary Button */}
                        <div
                          style={{
                            textAlign: "center",
                            marginBottom: "20px",
                            paddingTop: "20px",
                          }}
                        >
                          <Button
                            onClick={() => setShowFullConversation(false)}
                            variant="secondary"
                            style={{
                              height: "56px",
                              width: "100%",
                              maxWidth: "320px",
                              marginLeft: "auto",
                              marginRight: "auto",
                            }}
                          >
                            Back to Summary
                          </Button>
                        </div>
                      </>)
                    ) : (
                      // Show summary
                      ((() => {
                        // Generate summary content for 3 main topics
                        const summaryTopics = [
                          {
                            title: "Tasting Profile",
                            summary:
                              "Discover the complex flavors and aromas that make this wine unique, from initial notes to the lingering finish.",
                          },
                          {
                            title: "Food Pairing",
                            summary:
                              "Learn which dishes complement this wine best and how to create perfect pairings for your dining experience.",
                          },
                          {
                            title: "Wine Origin",
                            summary:
                              "Explore the terroir, region, and winemaking traditions that shaped this bottle's distinctive character.",
                          },
                        ];

                        return (
                          <div
                            style={{
                              color: "#DBDBDB",
                              fontFamily: "Inter, system-ui, sans-serif",
                            }}
                          ></div>
                        );
                      })())
                    )
                  ) : null}

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

                {/* Hidden Audio Controls - kept for compatibility */}
                <div
                  id="audio-controls"
                  style={{ display: "none", visibility: "hidden" }}
                >
                  <button id="play-audio-btn">Play Response Audio</button>
                </div>
              </div>
            </div>

            {/* Extra space at the bottom */}
            <div style={{ height: "80px" }}></div>
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
                      variant="secondary"
                      style={{ height: "32px" }}
                    >
                      Tasting notes
                    </Button>
                    <Button
                      onClick={() =>
                        handleSendMessage("Simple recipes for this wine")
                      }
                      variant="secondary"
                      style={{ height: "32px" }}
                    >
                      Simple recipes
                    </Button>
                    <Button
                      onClick={() =>
                        handleSendMessage("Where is this wine from?")
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
                </>)
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
              position: 'fixed',
              bottom: '100px',
              right: '20px',
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
      </div>
      {/* Contact Bottom Sheet */}
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
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    color: "white !important",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.firstName && (
                  <div
                    style={{
                      color: "#ff4444",
                      fontSize: "14px",
                      marginTop: "-12px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {errors.firstName}
                  </div>
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
                  }}
                />
                {errors.lastName && (
                  <div
                    style={{
                      color: "#ff4444",
                      fontSize: "14px",
                      marginTop: "-12px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {errors.lastName}
                  </div>
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
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.email && (
                  <div
                    style={{
                      color: "#ff4444",
                      fontSize: "14px",
                      marginTop: "-12px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {errors.email}
                  </div>
                )}

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
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="contact-form-input"
                      style={{
                        display: "flex",
                        height: "56px",
                        padding: "16px 24px",
                        alignItems: "center",
                        flex: 1,
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "16px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <div
                      style={{
                        color: "#ff4444",
                        fontSize: "14px",
                        marginTop: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {errors.phone}
                    </div>
                  )}
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
          portalElement,
        )}
    </div>
  );
};

export default EnhancedChatInterface;
