import React, { useState, useEffect, useRef, useCallback } from "react";
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
import SuggestionPills from "@/components/SuggestionPills";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import { ShiningText } from "@/components/ShiningText";
import { suggestionCache } from "@/utils/suggestionCache";
import {
  createStreamingClient,
  isStreamingSupported,
} from "@/lib/streamingClient";
import ContactBottomSheet, {
  ContactFormData,
} from "@/components/ContactBottomSheet";
import typography from "@/styles/typography";

interface SelectedWine {
  id: number;
  name: string;
  year?: number;
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
  const [loadingState, setLoadingState] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [chatInterfaceReady, setChatInterfaceReady] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Chat interface state
  const [isTyping, setIsTyping] = useState(false);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const [showChatInput, setShowChatInput] = useState(true);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [animationState, setAnimationState] = useState<
    "closed" | "opening" | "open" | "closing"
  >("closed");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasSharedContact, setHasSharedContact] = useState(false);
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
    flag: "🇺🇸",
    dial_code: "+1",
    name: "United States",
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Chat conversation management
  const { messages, currentConversationId, addMessage, refetchMessages } =
    useConversation();

  // Listen for direct chat message addition (bypassing voice system)
  useEffect(() => {
    const handleDirectChatMessage = async (event: CustomEvent) => {
      const { userMessage, assistantMessage } = event.detail;
      console.log("Direct chat message received - adding to conversation");
      
      try {
        await addMessage(userMessage);
        await addMessage(assistantMessage);
        
        // Auto-scroll to show the new messages
        setTimeout(() => {
          const chatSection = document.querySelector('[data-chat-section="true"]');
          if (chatSection) {
            const lastMessage = chatSection.lastElementChild;
            if (lastMessage) {
              lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error adding direct chat message:', error);
      }
    };

    window.addEventListener('addChatMessage', handleDirectChatMessage as any);
    
    return () => {
      window.removeEventListener('addChatMessage', handleDirectChatMessage as any);
    };
  }, [addMessage]);

  // API status check - reduced frequency for faster loading
  const { data: apiStatus } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Chat functions
  const formatContent = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
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

  // Text-only suggestion handler
  const handleSuggestionClick = async (content: string) => {
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

      // Generate suggestion ID for caching
      const suggestionId = content.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const wineKey = wine?.id ? `wine_${wine.id}` : 'default_wine';

      // Check cache first
      console.log(`Checking cache for suggestion: ${suggestionId} (wine: ${wineKey})`);
      const cachedResponse = await suggestionCache.getCachedResponse(wineKey, suggestionId);

      let assistantContent: string;

      if (cachedResponse) {
        console.log("Using cached response for suggestion");
        assistantContent = cachedResponse;
        // Simulate a brief delay to show it's working
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        console.log("No cached response found, making API call");
        const requestBody = {
          messages: [{ role: "user", content }],
          conversationId: currentConversationId,
          wineData: wine,
          optimize_for_speed: true,
          text_only: true,
        };

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
          assistantContent = responseData.message.content;
          
          // Cache the response for future use
          await suggestionCache.cacheResponse(wineKey, suggestionId, assistantContent);
          console.log("Response cached for future use");

          // Check if this is an error response that should show a toast
          if (responseData.error) {
            console.log("Server returned error for suggestion:", responseData.error);
            
            // Show user-friendly error toast for specific error types
            if (responseData.error === "API_QUOTA_EXCEEDED") {
              toast({
                title: "Service Notice",
                description: "The AI service is currently at capacity. Please try again later.",
                variant: "destructive",
              });
            } else if (responseData.error === "API_TIMEOUT") {
              toast({
                title: "Response Delayed",
                description: "The AI is taking longer than usual. Your suggestion has been received.",
                variant: "default",
              });
            } else if (responseData.error?.startsWith("API_ERROR_")) {
              toast({
                title: "Service Issue",
                description: "Experiencing temporary difficulties. Please try again.",
                variant: "destructive",
              });
            }
          }
        } else {
          throw new Error("No response content received from server");
        }
      }

      // Create and add assistant message
      const assistantMessage: ClientMessage = {
        id: Date.now() + 1,
        content: assistantContent,
        role: "assistant",
        conversationId: currentConversationId,
        createdAt: new Date().toISOString(),
      };

      // Store the latest assistant message text for unmute button functionality
      (window as any).lastAssistantMessageText = assistantMessage.content;
      console.log("Stored text-only suggestion assistant message for unmute:", assistantMessage.content.substring(0, 100) + "...");

      await addMessage(assistantMessage);
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
      setHideSuggestions(false);
    }
  };

  // Text + Voice suggestion handler with caching and instant TTS
  const handleSuggestionWithVoiceClick = async (content: string, pillId: string = '', options?: { instantResponse?: string }) => {
    if (content.trim() === "" || !currentConversationId) return;

    // Handle instant cached responses without showing thinking mode
    if (options?.instantResponse) {
      console.log("Using instant cached response - bypassing thinking mode");
      
      try {
        // Add user message
        const tempUserMessage: ClientMessage = {
          id: Date.now(),
          content,
          role: "user",
          conversationId: currentConversationId,
          createdAt: new Date().toISOString(),
        };
        await addMessage(tempUserMessage);

        // Add assistant message with cached response
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          content: options.instantResponse,
          role: "assistant",
          conversationId: currentConversationId,
          createdAt: new Date().toISOString(),
        };
        
        await addMessage(assistantMessage);
        refetchMessages();
        
        console.log("Instant cached response flow completed - no thinking/unmute required");
        return;
      } catch (error) {
        console.error("Error in instant response flow:", error);
        // Fall back to normal flow if instant fails
      }
    }

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

      // Generate suggestion ID for caching
      const suggestionId = content.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const wineKey = wine?.id ? `wine_${wine.id}` : 'default_wine';

      // Check cache first for text content
      console.log(`Checking cache for voice suggestion: ${suggestionId} (wine: ${wineKey})`);
      const cachedResponse = await suggestionCache.getCachedResponse(wineKey, suggestionId);

      let assistantContent: string;

      if (cachedResponse) {
        console.log("Using cached response for voice suggestion - instant TTS");
        assistantContent = cachedResponse;
        // Simulate brief delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        console.log("No cached response found, making API call for voice suggestion");
        const requestBody = {
          messages: [{ role: "user", content }],
          conversationId: currentConversationId,
          wineData: wine,
          optimize_for_speed: false,
          text_only: false,
        };

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
          assistantContent = responseData.message.content;
          
          // Cache the response for future use
          await suggestionCache.cacheResponse(wineKey, suggestionId, assistantContent);
          console.log("Voice suggestion response cached for future use");
        } else {
          throw new Error("No response content received from server");
        }
      }

      // Create and add assistant message
      const assistantMessage: ClientMessage = {
        id: Date.now() + 1,
        content: assistantContent,
        role: "assistant",
        conversationId: currentConversationId,
        createdAt: new Date().toISOString(),
      };

      // Store the latest assistant message text for unmute button functionality
      (window as any).lastAssistantMessageText = assistantMessage.content;
      console.log("Stored voice suggestion assistant message for unmute:", assistantMessage.content.substring(0, 100) + "...");

      await addMessage(assistantMessage);

      // Play TTS immediately for voice suggestions without requiring unmute
      console.log("Playing instant TTS for voice suggestion response");
      try {
        // Use browser TTS for instant voice playback
        const utterance = new SpeechSynthesisUtterance(assistantMessage.content);
        
        // Apply voice settings to match the male voice system
        const voices = speechSynthesis.getVoices();
        const maleVoice = voices.find(voice => 
          voice.name.includes('Google UK English Male') ||
          voice.name.includes('Male') ||
          voice.name.includes('masculine')
        );
        
        if (maleVoice) {
          utterance.voice = maleVoice;
          console.log("Using male voice for instant TTS:", maleVoice.name);
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        speechSynthesis.speak(utterance);
        console.log("Instant TTS started for voice suggestion");
      } catch (ttsError) {
        console.error("Instant TTS failed for voice suggestion:", ttsError);
        
        // Fallback to unmute button system if TTS fails
        window.dispatchEvent(new CustomEvent("showUnmuteButton"));
      }

      refetchMessages();

    } catch (error) {
      console.error("Error in voice suggestion request:", error);
      toast({
        title: "Error",
        description: `Failed to get a response: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
      setHideSuggestions(false);
    }
  };

  // Load wine data
  useEffect(() => {
    const initializeWineData = async () => {
      try {
        console.log("WineDetails: Initializing wine data...");
        await DataSyncManager.initialize();
        const wines = DataSyncManager.getUnifiedWineData();
        console.log("WineDetails: Available wines:", wines.length);

        if (id) {
          const wineId = parseInt(id);
          console.log("WineDetails: Checking for wine ID:", {
            id,
            wineIdFromQuery: wineId,
            wineId: id,
            location: location,
          });

          const foundWine = wines.find((w: any) => w.id === wineId);
          console.log("WineDetails: Looking for wine ID", id, "found:", foundWine);

          if (foundWine) {
            setWine({
              id: foundWine.id,
              name: foundWine.name,
              year: foundWine.year,
              image: foundWine.image,
              bottles: foundWine.bottles,
              ratings: foundWine.ratings,
              location: foundWine.location || "",
              description: foundWine.description || "",
              foodPairing: foundWine.foodPairing || [],
              buyAgainLink: foundWine.buyAgainLink || "",
            });
            console.log("WineDetails: Wine loaded successfully:", foundWine.name);
            setLoadingState("loaded");
          } else {
            console.error("WineDetails: Wine not found for ID:", id);
            setLoadingState("error");
          }
        }
      } catch (error) {
        console.error("WineDetails: Error loading wine data:", error);
        setLoadingState("error");
      }
    };

    initializeWineData();
  }, [id, location]);

  // Initialize portal element
  useEffect(() => {
    const portalRoot = document.getElementById("portal-root");
    if (portalRoot) {
      setPortalElement(portalRoot);
    }
  }, []);

  // Handle image loading
  useEffect(() => {
    if (wine?.image && imageRef.current) {
      const handleImageLoad = () => {
        console.log("Wine image loaded successfully:", wine.image);
        setImageLoaded(true);
      };

      const handleImageError = () => {
        console.error("Wine image failed to load:", wine.image);
        setImageLoaded(true); // Still set to true to show UI
      };

      imageRef.current.onload = handleImageLoad;
      imageRef.current.onerror = handleImageError;

      // If image is already loaded
      if (imageRef.current.complete) {
        handleImageLoad();
      }
    }
  }, [wine?.image]);

  // Contact form handlers
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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleCloseContactSheet = () => {
    setAnimationState("closing");
    setTimeout(() => {
      setShowContactSheet(false);
      setAnimationState("closed");
    }, 300);
  };

  const handleSubmit = async (data: ContactFormData) => {
    console.log("Contact form submitted:", data);
    setHasSharedContact(true);
    handleCloseContactSheet();
    
    toast({
      title: "Contact Information Shared",
      description: "Thank you for sharing your contact information. We'll be in touch!",
      variant: "default",
    });
  };

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollToBottom(!isNearBottom);
      }
    };

    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => chatContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 100);
      }
    }
  }, [messages]);

  const toggleExpanded = (item: string) => {
    setExpandedItem(expandedItem === item ? null : item);
  };

  if (loadingState === "loading") {
    return (
      <div className="wine-details-loading min-h-screen bg-zinc-950 flex items-center justify-center">
        <AppHeader />
        <HeaderSpacer />
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p style={typography.body1R} className="text-zinc-400">
            Loading wine details...
          </p>
        </div>
      </div>
    );
  }

  if (loadingState === "error" || !wine) {
    return (
      <div className="wine-details-error min-h-screen bg-zinc-950 flex items-center justify-center">
        <AppHeader />
        <HeaderSpacer />
        <div className="flex flex-col items-center space-y-4 p-6">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h1 style={typography.h1} className="text-white text-center">
            Wine Not Found
          </h1>
          <p style={typography.body1R} className="text-zinc-400 text-center">
            Sorry, we couldn't find the wine you're looking for.
          </p>
          <Link href="/">
            <Button variant="secondary">Return to Collection</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wine-details-ready min-h-screen bg-zinc-950 text-white relative">
      <AppHeader />
      <HeaderSpacer />

      <div className="relative h-[calc(100vh-75px)] overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Main Content Container */}
          <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
            <div className="max-w-6xl mx-auto">
              {/* Wine Details Section */}
              <main className="px-4 pb-6">
                <div className="flex flex-col lg:flex-row lg:gap-12">
                  {/* Wine Image and Details */}
                  <div className="lg:w-1/2">
                    {/* Wine Image */}
                    <div 
                      className="relative mb-8"
                      style={{
                        height: '240px',
                        background: 'radial-gradient(circle at center, rgba(139, 69, 19, 0.3) 0%, rgba(139, 69, 19, 0.1) 40%, transparent 70%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        ref={imageRef}
                        src={wine.image}
                        alt={wine.name}
                        style={{
                          maxHeight: '200px',
                          maxWidth: '120px',
                          objectFit: 'contain'
                        }}
                      />
                    </div>

                    {/* Wine Title */}
                    <div className="mb-6">
                      <h1 style={typography.h1} className="text-left mb-4">
                        {wine.year ? `${wine.year} ${wine.name}` : wine.name}
                      </h1>
                      
                      {/* Wine Ratings */}
                      <WineRating ratings={wine.ratings} variant="default" />
                    </div>

                    {/* Wine Location */}
                    {wine.location && (
                      <div className="mb-8 flex items-center gap-3">
                        <img src="/us-flag.png" alt="US Flag" className="w-6 h-4" />
                        <span style={typography.body1R} className="text-zinc-300">
                          {wine.location}
                        </span>
                      </div>
                    )}

                    {/* History Section */}
                    {wine.description && (
                      <div className="mb-8">
                        <h1 style={typography.h1} className="text-left mb-2">
                          History
                        </h1>
                        <p style={typography.body1R} className="text-zinc-300 leading-relaxed">
                          {wine.description}
                        </p>
                      </div>
                    )}

                    {/* Food Pairing Section */}
                    {wine.foodPairing && wine.foodPairing.length > 0 && (
                      <div className="mb-8">
                        <h1 style={typography.h1} className="text-left mb-2">
                          Food Pairing
                        </h1>
                        <div className="flex flex-wrap gap-2">
                          {wine.foodPairing.map((pairing, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300"
                            >
                              {pairing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Section */}
                  <div className="lg:w-1/2">
                    <div className="h-full flex flex-col">
                      {/* Chat Title */}
                      <div className="mb-6">
                        <h1 style={typography.h1} className="text-left">
                          Chat
                        </h1>
                      </div>

                      {/* Messages Container */}
                      <div 
                        className="flex-1 min-h-0 mb-4"
                        data-chat-section="true"
                      >
                        {messages.length === 0 ? (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="mb-4">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="text-zinc-400"
                                  >
                                    <path
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <h3 style={typography.h2} className="text-white mb-2">
                                Start a conversation
                              </h3>
                              <p style={typography.body1R} className="text-zinc-400 mb-6">
                                Ask me about this wine's flavor profile, food pairings, or anything else you'd like to know.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${
                                  message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] p-4 rounded-2xl ${
                                    message.role === "user"
                                      ? "bg-blue-600 text-white ml-4"
                                      : "bg-zinc-800 text-white mr-4"
                                  }`}
                                >
                                  <div style={typography.body1R}>
                                    {formatContent(message.content)}
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {isTyping && (
                              <div className="flex justify-start">
                                <div className="bg-zinc-800 text-white mr-4 p-4 rounded-2xl">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                                    </div>
                                    <span style={typography.body1R} className="text-zinc-400">
                                      Thinking...
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Suggestions */}
                      {!hideSuggestions && (
                        <div className="mb-4">
                          <SuggestionPills
                            onSuggestionClick={handleSuggestionClick}
                            isDisabled={isTyping}
                            wineKey={wine ? `wine_${wine.id}` : 'default_wine'}
                            context="chat"
                            preferredResponseType="text"
                          />
                        </div>
                      )}

                      {/* Chat Input */}
                      {showChatInput && (
                        <ChatInput
                          onSendMessage={async (message) => {
                            if (!currentConversationId) return;

                            const userMessage: ClientMessage = {
                              id: Date.now(),
                              content: message,
                              role: "user",
                              conversationId: currentConversationId,
                              createdAt: new Date().toISOString(),
                            };

                            await addMessage(userMessage);
                            setIsTyping(true);

                            try {
                              const response = await fetch("/api/chat", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  messages: [{ role: "user", content: message }],
                                  conversationId: currentConversationId,
                                  wineData: wine,
                                }),
                              });

                              if (!response.ok) {
                                throw new Error("Failed to get response");
                              }

                              const data = await response.json();
                              const assistantMessage: ClientMessage = {
                                id: Date.now() + 1,
                                content: data.message.content,
                                role: "assistant",
                                conversationId: currentConversationId,
                                createdAt: new Date().toISOString(),
                              };

                              await addMessage(assistantMessage);
                              refetchMessages();
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
                          }}
                          placeholder="Ask about this wine..."
                          disabled={isTyping}
                          showVoiceButton={false}
                          voiceComponent={
                            <VoiceAssistant
                              onSuggestionClick={handleSuggestionClick}
                              onSuggestionWithVoiceClick={handleSuggestionWithVoiceClick}
                              isDisabled={isTyping}
                              isProcessing={isTyping}
                              wineKey={wine ? `wine_${wine.id}` : 'default_wine'}
                            />
                          }
                        />
                      )}
                    </div>
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
          </div>
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