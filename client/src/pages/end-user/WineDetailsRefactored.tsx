import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useStandardToast } from "@/components/ui/feedback/StandardToast";
import QRScanModal from "@/components/QRScanModal";
import AppHeader, { HeaderSpacer } from "@/components/AppHeader";
import { DataSyncManager } from "@/utils/dataSync";
import { useConversation } from "@/hooks/UseConversation";
import { ClientMessage } from "@/lib/types";
import { 
  createStreamingClient,
  isStreamingSupported,
} from "@/lib/streamingClient";


// Refactored components
import { WineDetailsHeader } from "@/components/wine-details/WineDetailsHeader";
import { WineHeroSection } from "@/components/wine-details/WineHeroSection";
import { WineChatSection } from "@/components/chat";
import { WineLoadingState } from "@/components/wine-details/WineLoadingState";
import { WineErrorState } from "@/components/wine-details/WineErrorState";

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

export default function WineDetailsRefactored() {
  const [location, setLocation] = useLocation();
  const { id } = useParams();
  const [wine, setWine] = useState<SelectedWine | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [interactionChoiceMade, setInteractionChoiceMade] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [chatInterfaceReady, setChatInterfaceReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Chat interface state
  const [isTyping, setIsTyping] = useState(false);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const [showChatInput, setShowChatInput] = useState(true);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  const { toastError } = useStandardToast();

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

  // Load wine data
  useEffect(() => {
    const loadWineData = async () => {
      try {
        setLoadingState('loading');
        
        if (!id) {
          setLoadingState('error');
          return;
        }

        const wineId = parseInt(id);
        if (isNaN(wineId)) {
          setLoadingState('error');
          return;
        }

        // Initialize DataSyncManager if needed
        await DataSyncManager.initialize();
        
        const wineData = DataSyncManager.getWineById(wineId);
        
        if (!wineData) {
          console.log(`Wine with ID ${wineId} not found`);
          setLoadingState('error');
          return;
        }

        const selectedWine: SelectedWine = {
          id: wineData.id,
          name: wineData.name,
          image: wineData.image || "/placeholder.png",
          bottles: 1, // Default value
          ratings: {
            vn: 0,
            jd: 0,
            ws: 0,
            abv: 0,
          },
          location: "California, USA",
          description: "Premium wine selection",
          foodPairing: ["Red meat", "Cheese"],
        };

        setWine(selectedWine);
        setLoadingState('loaded');
        
      } catch (error) {
        console.error("Error loading wine data:", error);
        setLoadingState('error');
      }
    };

    loadWineData();
  }, [id]);

  // Chat handlers
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
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          content: responseData.message.content,
          role: "assistant",
          conversationId: currentConversationId,
          createdAt: new Date().toISOString(),
        };

        await addMessage(assistantMessage);
      }

      refetchMessages();
    } catch (error) {
      console.error("Error in message request:", error);
      toastError(`Failed to get a response: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = async (content: string) => {
    await handleSendMessage(content);
  };



  // Render loading state
  if (loadingState === 'loading') {
    return <WineLoadingState />;
  }

  // Render error state
  if (loadingState === 'error' || !wine) {
    return <WineErrorState error="Wine not found or failed to load" />;
  }

  return (
    <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
      <WineDetailsHeader 
        showActions={showActions}
        onToggleActions={() => setShowActions(!showActions)}
      />

      {/* Wine Hero Section - Full screen */}
      <WineHeroSection
        wine={wine}
        imageLoaded={imageLoaded}
        onImageLoad={() => setImageLoaded(true)}
      />

      {/* Chat Section - Full screen */}
      <WineChatSection
        wine={wine}
        messages={messages}
        isTyping={isTyping}
        hideSuggestions={hideSuggestions}
        showChatInput={showChatInput}
        isKeyboardFocused={isKeyboardFocused}
        currentConversationId={currentConversationId}
        onSendMessage={handleSendMessage}
        onSuggestionClick={handleSuggestionClick}
        onKeyboardFocus={setIsKeyboardFocused}
      />



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