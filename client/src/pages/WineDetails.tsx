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

  const handleSendMessage = async (content: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => {
    if (content.trim() === "" || !currentConversationId) return;

    // Handle instant cached responses from voice assistant
    if (options?.instantResponse) {
      console.log("Received instant response from voice assistant - bypassing normal flow");
      
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
        
        // Store for unmute functionality
        (window as any).lastAssistantMessageText = options.instantResponse;
        
        await addMessage(assistantMessage);
        refetchMessages();
        
        console.log("Instant voice response flow completed successfully");
        return;
      } catch (error) {
        console.error("Error in instant response flow:", error);
        // Fall back to normal flow if instant fails
      }
    }

    console.log("=== STARTING CHAT MESSAGE ===");
    console.log("Content:", content);
    console.log("Conversation ID:", currentConversationId);
    console.log("Text-only mode:", options?.textOnly);

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
      console.log("User message added successfully");

      const requestBody = {
        messages: [{ role: "user", content }],
        conversationId: currentConversationId,
        wineData: wine,
        optimize_for_speed: true,
        text_only: options?.textOnly || true, // Force text-only for suggestion pills
      };

      console.log("Request body:", requestBody);

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

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error text:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log("=== RESPONSE DATA ===");
      console.log("Full response:", JSON.stringify(responseData, null, 2));
      console.log("Has message:", !!responseData.message);
      console.log("Has message.content:", !!(responseData.message && responseData.message.content));

      if (responseData.message && responseData.message.content) {
        console.log("Processing assistant message...");
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          content: responseData.message.content,
          role: "assistant",
          conversationId: currentConversationId,
          createdAt: new Date().toISOString(),
        };

        console.log("Assistant message created:", assistantMessage);

        // For text-only responses (suggestion pills), don't store for voice functionality
        if (options?.textOnly) {
          console.log("Text-only suggestion - no voice storage:", assistantMessage.content.substring(0, 100) + "...");
          // Don't store in lastAssistantMessageText to prevent voice responses
        } else {
          // For regular chat, store for unmute button functionality
          (window as any).lastAssistantMessageText = assistantMessage.content;
          console.log("Stored regular chat assistant message for unmute:", assistantMessage.content.substring(0, 100) + "...");
        }

        console.log("Adding assistant message to conversation...");
        await addMessage(assistantMessage);
        console.log("Assistant message added successfully!");

        // Check if this is an error response that should show a toast
        if (responseData.error) {
          console.log("Server returned error:", responseData.error);
          
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
              description: "The AI is taking longer than usual. Your message has been received.",
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
        // No valid message content received
        throw new Error("No response content received from server");
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
    }
  };

  const handleCloseContactSheet = () => {
    setShowContactSheet(false);
    setAnimationState("closing");
    setTimeout(() => setAnimationState("closed"), 300);
  };

  const handleSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("hasSharedContact", "true");
        setHasSharedContact(true);
        handleCloseContactSheet();

        toast({
          description: "Contact saved successfully!",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact information",
        variant: "destructive",
      });
    }
  };

  // Helper functions for wine data
  const getWineHistory = () => {
    return (
      wine?.description ||
      "Lytton Springs is a renowned single-vineyard red wine produced by Ridge Vineyards, located in the Dry Creek Valley of Sonoma County, California. Celebrated for its rich heritage and distinctive field-blend style, Lytton Springs has become a benchmark for Zinfandel-based wines in the United States."
    );
  };

  const getFoodPairingContent = () => {
    return {
      dishes: wine?.foodPairing || [
        "Grilled lamb",
        "BBQ ribs",
        "Aged cheddar",
        "Dark chocolate desserts",
      ],
    };
  };

  const getCheesePairingContent = () => {
    return {
      cheeses: ["Aged Gouda", "Manchego", "Aged Cheddar", "Pecorino Romano"],
    };
  };

  const getVegetarianPairingContent = () => {
    return {
      dishes: [
        "Roasted eggplant",
        "Mushroom risotto",
        "Grilled portobello",
        "Vegetarian lasagna",
      ],
    };
  };

  const getAvoidPairingContent = () => {
    return {
      items: [
        "Delicate fish",
        "Light salads",
        "Citrus-based dishes",
        "Spicy Asian cuisine",
      ],
    };
  };

  // Initialize DataSyncManager once on component mount
  useEffect(() => {
    DataSyncManager.initialize();
  }, []);

  // Initialize chat interface ready state
  useEffect(() => {
    setChatInterfaceReady(true);
    console.log("Chat interface ready");
  }, []);

  // Initialize portal element for modals
  useEffect(() => {
    setPortalElement(document.body);
  }, []);

  // Check if contact has been shared
  useEffect(() => {
    const hasShared = localStorage.getItem("hasSharedContact") === "true";
    setHasSharedContact(hasShared);
  }, []);

  // Scroll management
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollToBottom(!isNearBottom && scrollHeight > clientHeight);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Pre-cache responses for all suggestions with error handling
  const preCacheSuggestionResponses = useCallback(async (wineData: any) => {
    if (!wineData?.id) return;

    try {
      const wineKey = `wine_${wineData.id}`;
      
      // Get all available suggestions from the standard wine suggestions
      const allSuggestions = [
        "What makes this wine special?",
        "Tell me about the vineyard", 
        "What food pairs well with this?",
        "How should I serve this wine?",
        "What's the tasting profile?",
        "Tell me about the vintage",
        "What's the alcohol content?",
        "How long can I age this?",
        "What's the best temperature?",
        "Tell me about the winemaker"
      ];
      
      console.log(`Starting pre-cache for ${allSuggestions.length} suggestions for wine: ${wineData.name}`);
      
      // Convert suggestions to format expected by cache manager
      const suggestionsToCache = allSuggestions.map(suggestion => ({
        id: suggestion.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        text: suggestion
      }));

      // Start pre-caching in background with proper error boundaries
      try {
        await suggestionCache.preCacheSuggestions(wineKey, suggestionsToCache);
        console.log('Pre-caching completed successfully');
        const stats = suggestionCache.getCacheStats();
        console.log(`Cache now contains ${stats.totalEntries} entries (${stats.cacheSize})`);
      } catch (cacheError) {
        console.warn('Pre-caching failed but not blocking UI:', cacheError);
        // Continue without caching - suggestions will work without pre-cache
      }
    } catch (error) {
      console.warn('Error starting pre-cache but continuing:', error);
    }
  }, []);

  // Load wine data when ID changes - optimized for speed
  useEffect(() => {
    if (!id) {
      setLoadingState("error");
      return;
    }

    try {
      // Synchronous data loading for faster response
      const wineData = DataSyncManager.getWineById(parseInt(id));
      
      if (!wineData) {
        setLoadingState("error");
        return;
      }

      setWine(wineData);
      setLoadingState("loaded");
      
      // Start pre-caching suggestion responses in background
      preCacheSuggestionResponses(wineData);
    } catch (error) {
      console.error("Error loading wine data:", error);
      setLoadingState("error");
    }
  }, [id, preCacheSuggestionResponses]);

  // Optimized scrolling initialization
  useEffect(() => {
    // Streamlined scroll setup
    window.scrollTo(0, 0);
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, []);

  // Detect QR code access and show interaction choice
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isQRAccess =
      urlParams.get("qr") === "true" ||
      urlParams.get("source") === "qr" ||
      document.referrer === "" ||
      !document.referrer.includes(window.location.hostname);

    // Check if user hasn't made interaction choice yet and this appears to be QR access
    if (isQRAccess && !interactionChoiceMade && loadingState === "loaded") {
      // Small delay to ensure page is fully loaded before showing modal
      setTimeout(() => {
        setShowQRModal(true);
      }, 500);
    }
  }, [loadingState, interactionChoiceMade]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Component for when no wine is found
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
          <button
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              ...typography.body,
              fontWeight: "600",
            }}
          >
            Go Back Home
          </button>
        </Link>
      </div>
    </div>
  );

  // Component for loading state
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
    <div
      className="bg-black text-white"
      style={{ minHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}
    >
      <AppHeader />
      <HeaderSpacer />

      {/* Wine bottle image with fixed size and glow effect - fullscreen height from top */}
      <div
        className="w-full flex flex-col items-center justify-center py-8 relative"
        style={{
          minHeight: "100vh", // Make the div full screen height
        }}
      >
        {/* Wine bottle image - THIS CONTAINS THE BLURRED CIRCLE/GLOW EFFECT */}
        <WineBottleImage image={wine?.image} wineName={wine?.name} />

        {/* Wine name with typography styling */}
        <div
          style={{
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            color: "white",
            wordWrap: "break-word",
            position: "relative",
            zIndex: 2,
            padding: "0 20px",
            marginBottom: "20px",
            ...typography.h1,
          }}
        >
          {wine ? `2021 ${wine.name}` : `2021 Wine Name`}
        </div>

        {/* Wine region with typography styling and flag */}
        <div
          style={{
            textAlign: "left",
            justifyContent: "flex-start",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            color: "rgba(255, 255, 255, 0.60)",
            wordWrap: "break-word",
            position: "relative",
            zIndex: 2,
            padding: "0 20px",
            gap: "6px",
            marginBottom: "20px",
            ...typography.body1R,
          }}
        >
          <USFlagImage />
          <span>
            {wine?.location ||
              "Santa Cruz Mountains | California | United States"}
          </span>
        </div>

        {/* Wine ratings section */}
        <WineRating
          ratings={wine ? wine.ratings : { vn: 95, jd: 93, ws: 93, abv: 14.3 }}
          align="left"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0 20px",
            marginBottom: "32px",
          }}
        />

        {/* Historic Heritage Section - Moved below ratings */}
        <div
          style={{
            width: "100%",
            padding: "0 20px",
            marginBottom: "32px",
          }}
        >
          <p
            style={{
              color: "white",
              textAlign: "left",
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
              setExpandedItem(expandedItem === "redMeat" ? null : "redMeat");
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
                <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  {getFoodPairingContent().dishes.map(
                    (dish: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ ...typography.body }}>🥩</span>
                        <span style={{ ...typography.body }}>{dish}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cheese Pairings - Expandable */}
          <div
            onClick={() => {
              setExpandedItem(expandedItem === "cheese" ? null : "cheese");
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

            {/* Expanded content */}
            {expandedItem === "cheese" && (
              <div
                style={{
                  padding: "0 0 20px 0",
                  color: "white",
                  ...typography.body,
                }}
              >
                <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  {getCheesePairingContent().cheeses.map(
                    (cheese: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ ...typography.body }}>🧀</span>
                        <span style={{ ...typography.body }}>{cheese}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vegetarian Options - Expandable */}
          <div
            onClick={() => {
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

            {/* Expanded content */}
            {expandedItem === "vegetarian" && (
              <div
                style={{
                  padding: "0 0 20px 0",
                  color: "white",
                  ...typography.body,
                }}
              >
                <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  {getVegetarianPairingContent().dishes.map(
                    (dish: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ ...typography.body }}>🥗</span>
                        <span style={{ ...typography.body }}>{dish}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avoid pairing with - Expandable */}
          <div
            onClick={() => {
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

            {/* Expanded content */}
            {expandedItem === "avoid" && (
              <div
                style={{
                  padding: "0 0 20px 0",
                  color: "white",
                  ...typography.body,
                }}
              >
                <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
                  {getAvoidPairingContent().items.map(
                    (item: string, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ ...typography.body, color: "red" }}>
                          ❌
                        </span>
                        <span style={{ ...typography.body }}>{item}</span>
                      </div>
                    ),
                  )}
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
              if (wine?.buyAgainLink) {
                window.open(wine.buyAgainLink, "_blank");
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
              paddingLeft: "4px",
              paddingRight: "4px",
              marginLeft: "-4px",
              marginRight: "-4px",
            }}
          >
            {(() => {
              const adminWines = JSON.parse(
                localStorage.getItem("admin-wines") || "[]",
              );
              const currentWineId = wine?.id;
              const filteredWines = adminWines.filter(
                (wine: any) => wine.id !== currentWineId,
              );

              if (filteredWines.length === 0) {
                return (
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "32px",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.8)",
                        marginBottom: "8px",
                        ...typography.body,
                      }}
                    >
                      No other wines available
                    </span>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.6)",
                        ...typography.body1R,
                      }}
                    >
                      Add more wines in the admin panel to see recommendations
                    </span>
                  </div>
                );
              }

              return filteredWines.map((recommendedWine: any) => (
                <div
                  key={recommendedWine.id}
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
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.08)";
                  }}
                  onClick={() => {
                    if (recommendedWine.id) {
                      setLocation(`/wine-details/${recommendedWine.id}`);
                    }
                  }}
                >
                  {/* Wine Bottle Image */}
                  <div
                    style={{
                      width: "120px",
                      height: "200px",
                      backgroundImage: recommendedWine.image
                        ? `url('${recommendedWine.image}')`
                        : "none",
                      backgroundColor: "transparent",
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!recommendedWine.image && (
                      <span
                        style={{
                          color: "rgba(255, 255, 255, 0.6)",
                          textAlign: "center",
                          ...typography.body1M,
                        }}
                      >
                        No Image
                      </span>
                    )}
                  </div>

                  {/* Wine Name */}
                  <h2
                    style={{
                      ...typography.buttonPlus1,
                      color: "white",
                      textAlign: "center",
                      margin: "0 0 12px 0",
                      height: "50px",
                      width: "100%",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                      lineHeight: "1.2",
                    }}
                  >
                    {recommendedWine.year ? `${recommendedWine.year} ` : ""}
                    {recommendedWine.name}
                  </h2>

                  {/* Rating Badges */}
                  {recommendedWine.ratings && (
                    <WineRating
                      ratings={recommendedWine.ratings}
                      gap={15}
                      hideAbv={true}
                    />
                  )}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="mt-0 pb-10">
          <div className="flex flex-col h-auto" style={{ width: "100%" }}>
            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Chat Area */}
              <main
                className="flex-1 flex flex-col overflow-hidden"
                style={{
                  width: "100%",
                }}
              >
                {/* Scrollable container */}
                <div
                  ref={chatContainerRef}
                  style={{
                    flex: "1",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {/* Conversation Content */}
                  <div
                    style={{
                      width: "100%",
                    }}
                  >
                    {/* Chat Title */}
                    <div
                      style={{
                        marginBottom: "24px",
                        paddingLeft: "16px",
                        paddingRight: "16px",
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
                    </div>

                    <div
                      id="conversation"
                      className="space-y-4 mb-96"
                      style={{
                        paddingLeft: "16px",
                        paddingRight: "16px",
                      }}
                    >
                      {messages.length > 0 ? (
                        <>
                          {messages.map((message: any, index: number) => (
                            <div
                              key={`${message.id}-${index}`}
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
                                  padding:
                                    message.role === "user"
                                      ? "12px 16px 12px 16px"
                                      : "16px 0",
                                  width:
                                    message.role === "user"
                                      ? "fit-content"
                                      : "100%",
                                  maxWidth:
                                    message.role === "user" ? "80%" : "100%",
                                }}
                              >
                                {message.role === "assistant" ? (
                                  <div
                                    style={{
                                      color: "#DBDBDB",
                                      fontFamily:
                                        "Inter, system-ui, sans-serif",
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
                                      fontFamily:
                                        "Inter, system-ui, sans-serif",
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
                  <div className={messages.length > 0 ? "max-w-3xl mx-auto" : "w-full"}>
                    <>
                      {/* Dynamic Suggestion Pills - Wine-specific */}
                      <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 w-full">
                        <SuggestionPills
                          wineKey={wine ? `${wine.name}_${wine.year || ''}` : ''}
                          onSuggestionClick={(prompt, pillId, options) => {
                            // Always use text-only responses for main interface suggestion pills
                            handleSuggestionClick(prompt);
                          }}
                          isDisabled={isTyping}
                        />
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
                            wineKey={wine ? `${wine.name}_${wine.year || ''}` : ''}
                          />
                        }
                      />
                    </>
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
