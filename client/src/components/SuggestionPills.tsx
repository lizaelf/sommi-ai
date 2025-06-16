import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface SuggestionPill {
  id: string;
  text: string;
  prompt: string;
}

interface SuggestionPillsProps {
  wineKey: string;
  conversationId?: number;
  onSuggestionClick: (
    prompt: string,
    suggestionId: string,
    options?: { textOnly?: boolean; conversationId?: number }
  ) => void;
  isDisabled?: boolean;
  preferredResponseType?: "text" | "voice";
  context?: "chat" | "voice-assistant";
}

export default function SuggestionPills({
  wineKey,
  conversationId,
  onSuggestionClick,
  isDisabled = false,
  preferredResponseType = "text",
  context = "chat",
}: SuggestionPillsProps) {
  const [usedPills, setUsedPills] = useState<Set<string>>(new Set());
  const [isResetting, setIsResetting] = useState(false);

  // Default suggestions to show immediately while API loads
  const defaultSuggestions: SuggestionPill[] = [
    {
      id: "default-1",
      text: "Tell me about this wine",
      prompt: "Tell me about this wine",
    },
    {
      id: "default-2",
      text: "What's the story behind it?",
      prompt: "What's the story behind this wine?",
    },
    {
      id: "default-3",
      text: "Food pairing suggestions",
      prompt: "What food pairs well with this wine?",
    },
  ];

  // Fetch available suggestion pills for this wine
  const {
    data: suggestionsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/suggestion-pills", wineKey],
    queryFn: async () => {
      const response = await fetch(
        `/api/suggestion-pills/${encodeURIComponent(wineKey)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      return response.json();
    },
    enabled: !!wineKey,
    retry: 1,
  });

  // Load cached responses for instant display
  const [cachedResponses, setCachedResponses] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const loadCachedResponses = () => {
      try {
        const cached = localStorage.getItem("suggestion_responses");
        if (cached) {
          const responses = JSON.parse(cached);
          setCachedResponses(responses);
          console.log(
            `Loaded ${Object.keys(responses).length} cached suggestion responses`,
          );
        }
      } catch (error) {
        console.error("Failed to load cached responses:", error);
      }
    };

    loadCachedResponses();
  }, []);

  // Get available suggestions (API data or defaults)
  const availableSuggestions = suggestionsData?.suggestions || defaultSuggestions;

  // Filter out used suggestions and limit to 3
  const displayedSuggestions = availableSuggestions
    .filter((pill: SuggestionPill) => !usedPills.has(pill.id))
    .slice(0, 3);

  // If no unused suggestions, show some used ones to maintain 3 pills
  const suggestionsToShow =
    displayedSuggestions.length === 0
      ? availableSuggestions.slice(0, 3)
      : displayedSuggestions.length < 3
      ? [
          ...displayedSuggestions,
          ...availableSuggestions
            .filter((pill: SuggestionPill) => usedPills.has(pill.id))
            .slice(0, 3 - displayedSuggestions.length),
        ]
      : displayedSuggestions;

  // Mark pill as used and handle suggestion click
  const handlePillClick = async (pill: SuggestionPill) => {
    if (isDisabled || isResetting) return;

    console.log(
      `🔍 DEBUGGING: handlePillClick called with context: ${context}, preferredResponseType: ${preferredResponseType}`,
    );

    try {
      // Optimistically mark as used
      setUsedPills((prev) => new Set([...prev, pill.id]));

      // Check for cached response for instant display
      const cacheKey = `${wineKey}:${pill.id}`;
      const instantResponse = cachedResponses[cacheKey];

      console.log(
        "💾 Cached response found:",
        !!instantResponse,
        "Context:",
        context,
        "PillId:",
        pill.id,
        "PreferredType:",
        preferredResponseType
      );

      // CHAT CONTEXT: Handle text-only, no audio
      if (context === "chat") {
        console.log(
          "💬 CHAT CONTEXT: Processing suggestion for chat interface",
        );

        if (instantResponse) {
          console.log(
            "💬 CHAT: Using cached response - adding to chat WITHOUT audio",
          );

          // Add messages to chat using the event system
          const userMessage = {
            id: Date.now(),
            content: pill.text, // Use pill.text to match what's shown on the button
            role: "user" as const,
            conversationId: conversationId || 0,
            createdAt: new Date().toISOString(),
          };

          const assistantMessage = {
            id: Date.now() + 1,
            content: instantResponse,
            role: "assistant" as const,
            conversationId: conversationId || 0,
            createdAt: new Date().toISOString(),
          };

          // Use chat event system - NO AUDIO
          window.dispatchEvent(
            new CustomEvent("addChatMessage", {
              detail: { userMessage, assistantMessage },
            }),
          );

          console.log("💬 CHAT: Messages added to chat - NO AUDIO PLAYED");
        } else {
          console.log("💬 CHAT: No cache - using normal API flow");
          // No cached response - let chat handle API call
          // Send the button text to display in chat, but use the full prompt for the API
          onSuggestionClick(pill.prompt, pill.id, {
            textOnly: true,
            conversationId,
          });
        }

        // Mark as used in background for chat context
        markPillAsUsed(pill.id);
        return; // EXIT EARLY - Chat context handled
      }

      // VOICE CONTEXT: Handle with audio
      if (context === "voice-assistant") {
        console.log(
          "🎤 VOICE CONTEXT: Processing suggestion for voice assistant",
        );

        if (instantResponse) {
          console.log("🎤 VOICE: Using cached response - playing audio");

          // Add messages to chat
          const userMessage = {
            id: Date.now(),
            content: pill.prompt,
            role: "user" as const,
            conversationId: conversationId || 0,
            createdAt: new Date().toISOString(),
          };

          const assistantMessage = {
            id: Date.now() + 1,
            content: instantResponse,
            role: "assistant" as const,
            conversationId: conversationId || 0,
            createdAt: new Date().toISOString(),
          };

          // Use chat event system
          window.dispatchEvent(
            new CustomEvent("addChatMessage", {
              detail: { userMessage, assistantMessage },
            }),
          );

          // For voice context, trigger TTS using browser speech
          console.log("🎤 VOICE: Playing cached response with browser TTS");
          const utterance = new SpeechSynthesisUtterance(instantResponse);
          
          // Use consistent male voice
          const voices = speechSynthesis.getVoices();
          const maleVoice = voices.find(voice => 
            voice.name.includes("Google UK English Male") ||
            voice.name.includes("Google US English Male") ||
            (voice.name.includes("Male") && voice.lang.startsWith("en"))
          ) || voices[0];
          
          if (maleVoice) utterance.voice = maleVoice;
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          speechSynthesis.cancel();
          speechSynthesis.speak(utterance);
          console.log("🎤 VOICE: Browser TTS initiated for cached response");
        } else {
          console.log("🎤 VOICE: No cache - making direct API call for voice response");
          
          // No cached response - use normal flow but ensure voice context
          onSuggestionClick(pill.prompt, pill.id, {
            textOnly: false,
            conversationId,
          });
        }

        // Mark as used in background for voice context
        markPillAsUsed(pill.id);
        return; // EXIT EARLY - Voice context handled
      }

      // Fallback for unknown context
      console.warn("⚠️ Unknown context:", context, "- using default behavior");
      onSuggestionClick(pill.prompt, pill.id, {
        textOnly: context === "chat",
        conversationId,
      });
    } catch (error) {
      // Rollback optimistic update on error
      setUsedPills((prev) => {
        const newSet = new Set(prev);
        newSet.delete(pill.id);
        return newSet;
      });
      console.error("Error handling pill click:", error);
    }
  };

  // Helper function to mark pill as used
  const markPillAsUsed = async (suggestionId: string) => {
    try {
      await fetch("/api/suggestion-pills/used", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineKey,
          suggestionId,
        }),
      });
    } catch (error) {
      console.error("Failed to mark suggestion as used:", error);
    }
  };

  // Reset used pills when all are exhausted
  useEffect(() => {
    if (
      availableSuggestions.length > 0 &&
      usedPills.size >= availableSuggestions.length &&
      !isResetting
    ) {
      const resetUsedPills = async () => {
        setIsResetting(true);
        try {
          await fetch(`/api/suggestion-pills/reset/${encodeURIComponent(wineKey)}`, {
            method: "DELETE",
          });
          setUsedPills(new Set());
          await refetch();
        } catch (error) {
          console.error("Failed to reset used pills:", error);
        } finally {
          setIsResetting(false);
        }
      };

      resetUsedPills();
    }
  }, [usedPills.size, availableSuggestions.length, wineKey, isResetting, refetch]);

  if (isLoading && availableSuggestions.length === 0) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 rounded-full px-4 py-2 min-w-fit"
          >
            <div className="w-20 h-4 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {suggestionsToShow.map((pill: SuggestionPill) => {
        const isUsed = usedPills.has(pill.id);
        return (
          <button
            key={`${context}-${pill.id}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePillClick(pill);
            }}
            disabled={isDisabled || isResetting}
            className={`
              px-4 py-2 rounded-full text-sm min-w-fit transition-all duration-200
              ${
                isUsed
                  ? "bg-gray-100 text-gray-500 border border-gray-200"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
              }
              ${isDisabled || isResetting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {pill.text}
          </button>
        );
      })}
    </div>
  );
}