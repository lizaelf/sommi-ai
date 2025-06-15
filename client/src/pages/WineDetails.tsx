import React, { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/UseToast";
import QRScanModal from "@/components/QRScanModal";
import { HeaderSpacer } from "@/components/AppHeader";
import { DataSyncManager } from "@/utils/dataSync";
import Button from "@/components/ui/Button";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import { suggestionCache } from "@/utils/suggestionCache";
import {
  createStreamingClient,
  isStreamingSupported,
} from "@/lib/streamingClient";
import ContactBottomSheet, {
  ContactFormData,
} from "@/components/ContactBottomSheet";
import typography from "@/styles/typography";
import {
  WineDetailsHeader,
  WineInfoSection,
  FoodPairingSection,
  ChatInterface,
  VoiceAssistantContainer
} from "@/components/wine-details";

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

function WineDetails() {
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

  // Handler functions for component props
  const toggleExpanded = (item: string) => {
    setExpandedItem(expandedItem === item ? null : item);
  };

  const handleDeleteAccount = () => {
    // Implementation for account deletion
    console.log('Delete account triggered');
  };
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

  // Dedicated text-only handler for chat suggestions - bypasses VoiceAssistant
  const handleTextOnlySuggestion = async (suggestion: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => {
    console.log("Chat context - handling text-only suggestion:", suggestion, "with options:", options);
    
    // Handle instant cached responses for text-only context
    if (options?.instantResponse) {
      console.log("Chat context - using cached response for instant text display");
      
      // Add user message
      const userMessage = {
        id: Date.now(),
        content: suggestion,
        role: "user" as const,
        conversationId: currentConversationId || 0,
        createdAt: new Date().toISOString(),
      };
      
      // Add assistant message with cached response
      const assistantMessage = {
        id: Date.now() + 1,
        content: options.instantResponse,
        role: "assistant" as const,
        conversationId: currentConversationId || 0,
        createdAt: new Date().toISOString(),
      };
      
      // Add both messages to conversation
      await addMessage(userMessage);
      await addMessage(assistantMessage);
      
      // Auto-scroll to show the question
      setTimeout(() => {
        const chatSection = document.querySelector('[data-chat-section="true"]');
        if (chatSection) {
          const lastMessage = chatSection.lastElementChild;
          if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }
      }, 100);
      
      return;
    }
    
    // For non-cached suggestions, use regular text-only API call
    console.log("Chat context - no cache, making text-only API call");
    handleSendMessage(suggestion, pillId, { textOnly: true });
  };

  const handleSendMessage = async (content: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => {
    if (content.trim() === "" || !currentConversationId) return;

    // Handle instant cached responses for BOTH chat and voice contexts
    if (options?.instantResponse) {
      console.log("🚀 Using instant cached response - no thinking state!");
      
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
        
        // Store for potential voice functionality (but won't be used in chat context)
        (window as any).lastAssistantMessageText = options.instantResponse;
        
        await addMessage(assistantMessage);
        refetchMessages();
        
        // Scroll to show the question for text-only suggestions
        setTimeout(() => {
          const chatSection = document.querySelector('[data-chat-section="true"]');
          if (chatSection) {
            chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        
        console.log("✅ Instant response flow completed - no API call needed!");
        return; // Exit early - no thinking state!
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
        text_only: options?.textOnly ?? true, // Default to text-only
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

        // Only store for voice if not text-only
        if (!options?.textOnly) {
          (window as any).lastAssistantMessageText = assistantMessage.content;
        }

        await addMessage(assistantMessage);
        
        // Cache the response for future instant use
        if (wine?.id && content) {
          const wineKey = `wine_${wine.id}`;
          const suggestionId = content.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          await suggestionCache.cacheResponse(wineKey, suggestionId, assistantMessage.content);
          console.log("✅ Response cached for future instant use");
        }

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
      <WineDetailsHeader
        showActions={showActions}
        onToggleActions={() => setShowActions(!showActions)}
        onDeleteAccount={handleDeleteAccount}
      />
      <HeaderSpacer />

      <WineInfoSection
        wine={wine!}
        onImageLoad={handleImageLoad}
        imageLoaded={imageLoaded}
        imageRef={imageRef}
      />

      <FoodPairingSection
        expandedItem={expandedItem}
        onToggleExpanded={toggleExpanded}
      />

      <ChatInterface
        wine={wine}
        messages={messages}
        isTyping={isTyping}
        isKeyboardFocused={isKeyboardFocused}
        showScrollToBottom={showScrollToBottom}
        onSendMessage={handleSendMessage}
        onTextOnlySuggestion={handleTextOnlySuggestion}
        onScrollToBottom={scrollToBottom}
        onFocus={() => setIsKeyboardFocused(true)}
        onBlur={() => setIsKeyboardFocused(false)}
        voiceButtonComponent={
          <VoiceAssistantContainer
            wine={wine}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
          />
        }
      />

      <ContactBottomSheet
        isOpen={animationState !== "closed"}
        onClose={handleCloseContactSheet}
        onSubmit={handleSubmit}
      />

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

export default WineDetails;
