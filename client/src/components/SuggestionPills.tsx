import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { suggestionCache } from "@/utils/suggestionCache";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import wineResponses from "@/../../shared/wineResponses.json";

interface SuggestionPill {
  id: string;
  text: string;
  prompt: string;
}

interface SuggestionPillsProps {
  wineKey: string;
  conversationId?: string;
  onSuggestionClick: (
    prompt: string,
    pillId?: string,
    options?: {
      textOnly?: boolean;
      instantResponse?: string;
      conversationId?: string;
      fullPrompt?: string;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentAbortController, setCurrentAbortController] =
    useState<AbortController | null>(null);

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
  const effectiveWineKeyForQuery = wineKey || "wine_1";
  const {
    data: suggestionsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/suggestion-pills", effectiveWineKeyForQuery],
    queryFn: async () => {
      const response = await fetch(
        `/api/suggestion-pills/${encodeURIComponent(effectiveWineKeyForQuery)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch suggestion pills");
      }
      return response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Critical Fix: Cleanup audio cache to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up all audio URLs to prevent memory leaks
      const audioCache = (window as any).suggestionAudioCache || {};
      console.log(
        "🧹 Cleaning up",
        Object.keys(audioCache).length,
        "cached audio URLs",
      );

      Object.values(audioCache).forEach((url: string) => {
        URL.revokeObjectURL(url);
      });

      // Clear the cache completely
      (window as any).suggestionAudioCache = {};

      // Stop any ongoing audio
      if ((window as any).currentOpenAIAudio) {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio = null;
      }

      // Cancel speech synthesis
      speechSynthesis.cancel();

      console.log("🧹 SuggestionPills: Memory cleanup complete");
    };
  }, []);

  // Safe spreadsheet data access with proper error handling
  const getSpreadsheetResponse = useCallback(
    (wineKey: string, suggestionId: string): string | null => {
      try {
        console.log("📊 Checking spreadsheet for:", { wineKey, suggestionId });

        // Check if wine key exists
        if (!(wineKey in wineResponses)) {
          console.warn(
            `📊 Wine key '${wineKey}' not found in spreadsheet data`,
          );
          console.log("📊 Available wine keys:", Object.keys(wineResponses));
          return null;
        }

        const wineData = wineResponses[wineKey as keyof typeof wineResponses];

        // Check if responses exist
        if (!wineData?.responses) {
          console.warn(`📊 No responses found for wine '${wineKey}'`);
          return null;
        }

        // Check if specific suggestion exists
        if (!(suggestionId in wineData.responses)) {
          console.warn(
            `📊 Suggestion '${suggestionId}' not found for wine '${wineKey}'`,
          );
          console.log(
            "📊 Available suggestions:",
            Object.keys(wineData.responses),
          );
          return null;
        }

        const response =
          wineData.responses[suggestionId as keyof typeof wineData.responses];

        if (!response || typeof response !== "string") {
          console.warn(
            `📊 Invalid response data for ${wineKey}/${suggestionId}`,
          );
          return null;
        }

        console.log(
          `📊 ✅ Found spreadsheet response for ${suggestionId} (${response.length} chars)`,
        );
        return response;
      } catch (error) {
        console.error("📊 Error accessing spreadsheet data:", error);
        return null;
      }
    },
    [],
  );

  // Audio cache management with size limits
  const addToAudioCache = useCallback(
    (key: string, audioBlob: Blob): string | null => {
      try {
        const MAX_CACHE_SIZE = 15; // Limit to 15 audio files max
        const audioCache = (window as any).suggestionAudioCache || {};

        // Check cache size and clean up if needed
        const cacheKeys = Object.keys(audioCache);
        if (cacheKeys.length >= MAX_CACHE_SIZE) {
          console.log(
            `🧹 Audio cache full (${cacheKeys.length}/${MAX_CACHE_SIZE}), cleaning oldest entries`,
          );

          // Remove half the cache (oldest entries)
          const keysToRemove = cacheKeys.slice(
            0,
            Math.floor(MAX_CACHE_SIZE / 2),
          );
          keysToRemove.forEach((oldKey) => {
            URL.revokeObjectURL(audioCache[oldKey]);
            delete audioCache[oldKey];
          });

          console.log(
            `🧹 Removed ${keysToRemove.length} old audio cache entries`,
          );
        }

        // Create new audio URL
        const audioUrl = URL.createObjectURL(audioBlob);
        audioCache[key] = audioUrl;
        (window as any).suggestionAudioCache = audioCache;

        console.log(
          `🎤 Added audio to cache: ${key} (cache size: ${Object.keys(audioCache).length})`,
        );
        return audioUrl;
      } catch (error) {
        console.error("Error adding to audio cache:", error);
        return null;
      }
    },
    [],
  );

  // Pre-generate TTS audio for voice context suggestions with proper cache management
  const preGenerateSuggestionAudio = useCallback(async () => {
    if (!suggestionsData?.suggestions) return;

    console.log("🎤 PRE-GEN: Starting audio pre-generation for suggestions");
    const effectiveWineKey = wineKey || "wine_1";

    // Only pre-generate for first 3 suggestions to limit memory usage
    for (const pill of suggestionsData.suggestions.slice(0, 3)) {
      const suggestionId = pill.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
      const cacheKey = `${effectiveWineKey}_${suggestionId}`;

      // Check if already cached
      const audioCache = (window as any).suggestionAudioCache || {};
      if (audioCache[cacheKey]) {
        console.log(`🎤 PRE-GEN: Audio already cached for "${pill.text}"`);
        continue;
      }

      // Get response text from spreadsheet
      const responseText = getSpreadsheetResponse(
        effectiveWineKey,
        suggestionId,
      );
      if (!responseText) {
        console.log(
          `🎤 PRE-GEN: No spreadsheet response for "${pill.text}", skipping pre-generation`,
        );
        continue;
      }

      try {
        console.log(
          `🎤 PRE-GEN: Generating audio for "${pill.text}" (${responseText.length} chars)`,
        );

        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: responseText }),
        });

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });

          // Use the safe cache management function
          const audioUrl = addToAudioCache(cacheKey, audioBlob);

          if (audioUrl) {
            console.log(`🎤 PRE-GEN: ✅ Audio cached for "${pill.text}"`);
          } else {
            console.error(
              `🎤 PRE-GEN: Failed to cache audio for "${pill.text}"`,
            );
          }
        } else {
          console.error(
            `🎤 PRE-GEN: TTS API failed for "${pill.text}": ${response.status}`,
          );
        }
      } catch (error) {
        console.error(
          `🎤 PRE-GEN: Error generating audio for "${pill.text}":`,
          error,
        );
      }
    }
  }, [suggestionsData, wineKey, getSpreadsheetResponse, addToAudioCache]);

  // Pre-generate audio for voice context
  useEffect(() => {
    if (
      context === "voice-assistant" &&
      suggestionsData?.suggestions &&
      !isLoading
    ) {
      preGenerateSuggestionAudio();
    }
  }, [context, suggestionsData, isLoading, preGenerateSuggestionAudio]);

  // Manual reset function - only triggered by user interaction
  const resetSuggestionPills = useCallback(() => {
    const effectiveWineKey = wineKey || "wine_1";
    console.log(
      "Manually resetting suggestion cycle for wine:",
      effectiveWineKey,
    );
    setIsResetting(true);

    fetch(
      `/api/suggestion-pills/${encodeURIComponent(effectiveWineKey)}/reset`,
      {
        method: "DELETE",
      },
    )
      .then(() => {
        setUsedPills(new Set());
        setIsResetting(false);
        refetch();
      })
      .catch((error) => {
        console.error("Failed to reset suggestion pills:", error);
        setIsResetting(false);
      });
  }, [wineKey, refetch]);

  // Listen for abort conversation events
  useEffect(() => {
    const handleAbortConversation = () => {
      console.log(
        "🛑 SuggestionPills: Received abort signal - stopping all API requests",
      );

      if (currentAbortController) {
        currentAbortController.abort();
        setCurrentAbortController(null);
      }

      setIsProcessing(false);

      if ((window as any).currentOpenAIAudio) {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio.currentTime = 0;
        (window as any).currentOpenAIAudio = null;
      }
    };

    window.addEventListener("abortConversation", handleAbortConversation);

    return () => {
      window.removeEventListener("abortConversation", handleAbortConversation);
    };
  }, [currentAbortController]);

  // Audio playback functions with proper cleanup
  const playAudioFromCache = useCallback(
    async (audioUrl: string, prompt: string, response: string) => {
      return new Promise<void>((resolve, reject) => {
        const audio = new Audio(audioUrl);

        const cleanup = () => {
          (window as any).currentOpenAIAudio = null;
          window.dispatchEvent(new CustomEvent("tts-audio-stop"));
          setIsProcessing(false);
        };

        audio.onplay = () => {
          console.log("🎤 Pre-generated audio started");
          window.dispatchEvent(new CustomEvent("tts-audio-start"));
        };

        audio.onended = () => {
          console.log("🎤 Pre-generated audio completed");
          cleanup();
          resolve();
        };

        audio.onerror = (e) => {
          console.error("🎤 Pre-generated audio error:", e);
          cleanup();
          reject(e);
        };

        (window as any).currentOpenAIAudio = audio;

        // Add messages to chat
        addMessagesToChat(prompt, response);

        audio.play().catch(reject);
      });
    },
    [conversationId],
  );

  const playTTSAudio = useCallback(
    async (text: string, prompt: string) => {
      try {
        const abortController = new AbortController();
        setCurrentAbortController(abortController);

        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

        const audioBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(audioBlob);

        return new Promise<void>((resolve, reject) => {
          if (abortController.signal.aborted) {
            URL.revokeObjectURL(audioUrl);
            reject(new DOMException("Operation aborted", "AbortError"));
            return;
          }

          const audio = new Audio(audioUrl);

          const cleanup = () => {
            URL.revokeObjectURL(audioUrl);
            (window as any).currentOpenAIAudio = null;
            window.dispatchEvent(new CustomEvent("tts-audio-stop"));
            setIsProcessing(false);
            setCurrentAbortController(null);
          };

          const onAbort = () => {
            audio.pause();
            cleanup();
            reject(new DOMException("Operation aborted", "AbortError"));
          };

          abortController.signal.addEventListener("abort", onAbort, {
            once: true,
          });

          audio.onplay = () => {
            console.log("🎤 TTS audio started");
            window.dispatchEvent(new CustomEvent("tts-audio-start"));
          };

          audio.onended = () => {
            console.log("🎤 TTS audio completed");
            abortController.signal.removeEventListener("abort", onAbort);
            cleanup();
            resolve();
          };

          audio.onerror = (e) => {
            console.error("🎤 TTS audio error:", e);
            abortController.signal.removeEventListener("abort", onAbort);
            cleanup();
            reject(e);
          };

          (window as any).currentOpenAIAudio = audio;

          // Add messages to chat
          addMessagesToChat(prompt, text);

          audio.play().catch(reject);
        });
      } catch (error) {
        setIsProcessing(false);
        setCurrentAbortController(null);
        window.dispatchEvent(new CustomEvent("tts-audio-stop"));
        throw error;
      }
    },
    [conversationId],
  );

  const addMessagesToChat = useCallback(
    (prompt: string, response: string) => {
      const userMessage = {
        id: Date.now(),
        content: prompt,
        role: "user" as const,
        conversationId: conversationId || 0,
        createdAt: new Date().toISOString(),
      };

      const assistantMessage = {
        id: Date.now() + 1,
        content: response,
        role: "assistant" as const,
        conversationId: conversationId || 0,
        createdAt: new Date().toISOString(),
      };

      window.dispatchEvent(
        new CustomEvent("addChatMessage", {
          detail: { userMessage, assistantMessage },
        }),
      );
    },
    [conversationId],
  );

  // Main pill click handler with all fixes applied
  const handlePillClick = async (pill: SuggestionPill) => {
    console.log("🔍 Processing pill click:", { context, pill: pill.text });
    if (isDisabled || isProcessing) return;

    // Create abort controller for this operation
    const abortController = new AbortController();
    setCurrentAbortController(abortController);

    setUsedPills((prev) => new Set(prev).add(pill.id));
    setIsProcessing(true);

    try {
      const suggestionId = pill.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
      const effectiveWineKey = wineKey || "wine_1";

      let instantResponse = null;

      // Safe spreadsheet lookup for voice context
      if (context === "voice-assistant") {
        instantResponse = getSpreadsheetResponse(
          effectiveWineKey,
          suggestionId,
        );
        if (instantResponse) {
          console.log("📊 Using spreadsheet response for voice suggestion");
        }
      }

      // Fallback to cache if no spreadsheet response
      if (!instantResponse) {
        try {
          instantResponse = await suggestionCache.getCachedResponse(
            effectiveWineKey,
            suggestionId,
          );
          if (instantResponse) {
            console.log("💾 Using cached response");
          }
        } catch (error) {
          console.error("Error accessing cache:", error);
        }
      }

      // CHAT CONTEXT
      if (context === "chat") {
        console.log(
          "💬 CHAT CONTEXT: Processing suggestion for chat interface",
        );

        if (instantResponse) {
          // Add to chat without audio
          const userMessage = {
            id: Date.now(),
            content: pill.text,
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

          window.dispatchEvent(
            new CustomEvent("addChatMessage", {
              detail: { userMessage, assistantMessage },
            }),
          );

          console.log("💬 CHAT: Messages added - no audio");
        } else {
          // Use callback for API call
          onSuggestionClick(pill.text, pill.id, {
            textOnly: true,
            conversationId,
            fullPrompt: pill.prompt,
          });
        }

        await markPillAsUsed(pill.id);
        return;
      }

      // VOICE CONTEXT
      if (context === "voice-assistant") {
        console.log(
          "🎤 VOICE CONTEXT: Processing suggestion for voice assistant",
        );
        window.dispatchEvent(new CustomEvent("tts-audio-start"));

        if (instantResponse) {
          // Check for pre-generated audio
          const audioCache = (window as any).suggestionAudioCache || {};
          const cacheKey = `${effectiveWineKey}_${suggestionId}`;

          if (audioCache[cacheKey]) {
            console.log("🎤 Using pre-generated audio");
            await playAudioFromCache(
              audioCache[cacheKey],
              pill.prompt,
              instantResponse,
            );
          } else {
            console.log("🎤 Generating TTS on demand");
            await playTTSAudio(instantResponse, pill.prompt);
          }
        } else {
          // Use callback pattern instead of direct API calls
          console.log("🎤 No cached response - using callback");
          setIsProcessing(false); // Reset since parent will handle
          onSuggestionClick(pill.prompt, pill.id, {
            conversationId,
            textOnly: false,
          });
        }

        await markPillAsUsed(pill.id);
        return;
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("🛑 Operation aborted by user");
      } else {
        console.error("Error in handlePillClick:", error);
        // Rollback optimistic update
        setUsedPills((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pill.id);
          return newSet;
        });
      }
    } finally {
      setIsProcessing(false);
      setCurrentAbortController(null);
    }
  };

  // Helper function to mark pill as used
  const markPillAsUsed = async (pillId: string) => {
    try {
      const effectiveWineKey = wineKey || "wine_1";
      await fetch("/api/suggestion-pills/used", {
        method: "POST",
        body: JSON.stringify({
          wineKey: effectiveWineKey,
          suggestionId: pillId,
          userId: null,
        }),
        headers: { "Content-Type": "application/json" },
      });
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

    // Only show unused pills
    const unusedPills = availablePills.filter(
      (pill: SuggestionPill) => !usedPills.has(pill.id),
    );

    // Always show exactly 3 unused pills if available
    if (unusedPills.length >= 3) {
      return unusedPills.slice(0, 3);
    }

    // If we have some unused pills but less than 3, show what we have
    if (unusedPills.length > 0) {
      return unusedPills;
    }

    // If all suggestions are used, show default suggestions instead of auto-resetting
    if (unusedPills.length === 0 && availablePills.length > 0) {
      console.log(
        "All suggestions used - showing default suggestions (no auto-reset)",
      );
      return defaultSuggestions.slice(0, 3);
    }

    // Fallback: show unused default suggestions if no API suggestions available
    const unusedDefaults = defaultSuggestions.filter(
      (def) => !usedPills.has(def.id),
    );
    return unusedDefaults.slice(0, 3);
  }, [suggestionsData, usedPills, isLoading]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "12px",
        padding: "0",
        margin: "0",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitScrollbar: { display: "none" },
      }}
    >
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      {visiblePills.map((pill: SuggestionPill) => (
        <Button
          key={`${context}-${pill.id}`}
          variant="secondary"
          disabled={isDisabled || isProcessing}
          onClick={() => handlePillClick(pill)}
          style={{
            ...typography.buttonPlus1,
            minWidth: "fit-content",
            whiteSpace: "nowrap",
            flexShrink: 0,
            borderRadius: "32px",
            padding: "12px 20px",
            transition: "none",
          }}
        >
          {pill.text}
        </Button>
      ))}
    </div>
  );
}
