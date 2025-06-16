import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { suggestionCache } from "@/utils/suggestionCache";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";

interface SuggestionPill {
  id: string;
  text: string;
  prompt: string;
}

interface SuggestionPillsProps {
  wineKey: string;
  conversationId?: string; // Add conversation context
  onSuggestionClick: (
    prompt: string,
    pillId?: string,
    options?: {
      textOnly?: boolean;
      instantResponse?: string;
      conversationId?: string;
    },
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
        throw new Error("Failed to fetch suggestion pills");
      }
      return response.json();
    },
    enabled: !!wineKey,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Handle resetting pills when all are used
  useEffect(() => {
    const availablePills = suggestionsData?.suggestions || [];
    if (availablePills.length === 0) return;

    const unusedPills = availablePills.filter(
      (pill: SuggestionPill) => !usedPills.has(pill.id),
    );

    if (unusedPills.length === 0 && !isResetting) {
      console.log("All suggestions used - resetting cycle for wine:", wineKey);
      setIsResetting(true);

      fetch(`/api/suggestion-pills/${encodeURIComponent(wineKey)}/reset`, {
        method: "DELETE",
      })
        .then(() => {
          setUsedPills(new Set());
          setIsResetting(false);
        })
        .catch((error) => {
          console.error("Failed to reset suggestion pills:", error);
          setIsResetting(false);
        });
    }
  }, [suggestionsData, usedPills, wineKey, isResetting]);

  const handlePillClick = async (pill: SuggestionPill) => {
    if (isDisabled) return;

    // Optimistically mark as used
    setUsedPills((prev) => {
      const newSet = new Set(prev);
      newSet.add(pill.id);
      return newSet;
    });

    try {
      // Check for instant response (cached)
      let instantResponse = null;
      const suggestionId = pill.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");

      instantResponse = await suggestionCache.getCachedResponse(
        wineKey,
        suggestionId,
      );
      console.log(
        "💾 Cached response found:",
        !!instantResponse,
        "Context:",
        context,
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
          onSuggestionClick(pill.text, pill.id, {
            textOnly: true,
            conversationId,
            fullPrompt: pill.prompt, // Include full prompt for API processing
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

          // Play audio for voice context
          const utterance = new SpeechSynthesisUtterance(instantResponse);

          // Use consistent male voice
          const voices = speechSynthesis.getVoices();
          const maleVoice =
            voices.find(
              (voice) =>
                voice.name.includes("Google UK English Male") ||
                voice.name.includes("Google US English Male") ||
                (voice.name.includes("Male") && voice.lang.startsWith("en")),
            ) || voices[0];

          if (maleVoice) utterance.voice = maleVoice;
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          utterance.onstart = () => {
            console.log("🎤 VOICE: Audio started playing");
          };

          utterance.onend = () => {
            console.log("🎤 VOICE: Audio finished playing");
          };

          speechSynthesis.cancel(); // Clear any existing speech
          speechSynthesis.speak(utterance);

          console.log("🎤 VOICE: Audio playback initiated");
        } else {
          console.log("🎤 VOICE: No cache - suggestion pills should NOT call voice assistant API");
          console.log("🎤 VOICE: Voice context should only use cached responses to prevent bottom sheet closing");
          // DO NOT call onSuggestionClick - it causes bottom sheet to close
          // Voice suggestions without cache should be ignored to maintain UI state
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
  const markPillAsUsed = async (pillId: string) => {
    try {
      await fetch("/api/suggestion-pills/used", {
        method: "POST",
        body: JSON.stringify({
          wineKey,
          suggestionId: pillId,
          userId: null,
        }),
        headers: { "Content-Type": "application/json" },
      });
      refetch();
    } catch (error) {
      console.error("Error marking pill as used:", error);
    }
  };

  // Always show exactly 3 pills
  const visiblePills = useMemo(() => {
    const availablePills = suggestionsData?.suggestions || [];

    if (isLoading || availablePills.length === 0) {
      return defaultSuggestions.slice(0, 3);
    }

    // Start with unused pills
    let pills = availablePills.filter(
      (pill: SuggestionPill) => !usedPills.has(pill.id),
    );

    // If we don't have enough unused pills, add used ones to reach 3
    if (pills.length < 3) {
      const usedPillsToAdd = availablePills
        .filter((pill: SuggestionPill) => usedPills.has(pill.id))
        .slice(0, 3 - pills.length);
      pills = [...pills, ...usedPillsToAdd];
    }

    // Always return exactly 3 pills (slice to ensure exactly 3)
    return pills.slice(0, 3);
  }, [suggestionsData, usedPills, isLoading]);

  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {visiblePills.map((pill: SuggestionPill) => (
        <Button
          key={pill.id}
          variant="secondary"
          onClick={() => handlePillClick(pill)}
          disabled={isDisabled || usedPills.has(pill.id)}
          className="h-auto py-2 px-4 whitespace-nowrap hover:bg-gray-100 transition-colors border border-gray-300 rounded-full flex-shrink-0 min-w-fit"
          style={{
            ...typography.body, // 📝 Apply body typography style
            // You can override specific properties if needed:
            // fontSize: typography.body.fontSize,
            // fontWeight: typography.body.fontWeight,
            // lineHeight: typography.body.lineHeight,
            // fontFamily: typography.body.fontFamily,
          }}
        >
          {pill.text}
        </Button>
      ))}
    </div>
  );
}
