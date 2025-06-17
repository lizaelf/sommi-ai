import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { suggestionCache } from "@/utils/suggestionCache";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import wineResponses from "@/../../shared/wineResponses.json";

// Standard skeleton pill component with shimmer effect
const SkeletonPill = ({
  index,
  width = "120px",
}: {
  index: number;
  width?: string;
}) => (
  <div
    className="skeleton-pill-shimmer"
    style={{
      width: width ?? "120px",
      height: "40px",
      borderRadius: "32px",
      flexShrink: 0,
    }}
  />
);

// Helper function to generate cache keys for suggestions
function getSuggestionCacheKey(
  wineKey: string,
  suggestionId: string,
  type: string = "text",
): string {
  return `${wineKey}:${suggestionId}:${type}`;
}

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
  const [preGenerationStatus, setPreGenerationStatus] = useState<
    Map<string, "loading" | "ready" | "failed">
  >(new Map());
  const [loadingPillId, setLoadingPillId] = useState<string | null>(null);

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

  // FIX 2: Add component cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up all audio URLs to prevent memory leaks
      const audioCache = (window as any).suggestionAudioCache || {};
      console.log(
        "🧹 Cleaning up",
        Object.keys(audioCache).length,
        "cached audio URLs",
      );

      Object.values(audioCache).forEach((url: unknown) => {
        if (typeof url === "string") {
          URL.revokeObjectURL(url);
        }
      });

      // Clear the cache completely
      (window as any).suggestionAudioCache = {};

      // Stop any ongoing audio
      if ((window as any).currentOpenAIAudio) {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio = null;
      }

      console.log("🧹 SuggestionPills: Memory cleanup complete");
    };
  }, []);

  // Pre-generation for voice context with proper error handling
  const preGenerateSuggestionAudio = useCallback(
    async (suggestions?: SuggestionPill[]) => {
      const pillsToProcess =
        suggestions || suggestionsData?.suggestions || defaultSuggestions;
      if (!pillsToProcess?.length) return;

      console.log("🎤 PRE-GEN: Starting enhanced audio pre-generation");
      const audioCache = (window as any).suggestionAudioCache || {};

      // FIX 3: Add cache size limit to prevent unlimited memory growth
      const MAX_CACHE_SIZE = 15;
      const cacheKeys = Object.keys(audioCache);
      if (cacheKeys.length >= MAX_CACHE_SIZE) {
        console.log("🧹 Audio cache full, cleaning oldest entries");
        const keysToRemove = cacheKeys.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
        keysToRemove.forEach((oldKey) => {
          URL.revokeObjectURL(audioCache[oldKey]);
          delete audioCache[oldKey];
        });
      }

      (window as any).suggestionAudioCache = audioCache;
      const effectiveWineKey = wineKey || "wine_1";

      for (const pill of pillsToProcess.slice(0, 3)) {
        const suggestionId = pill.prompt
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_");
        const cacheKey = getSuggestionCacheKey(
          effectiveWineKey,
          suggestionId,
          "audio",
        );

        setPreGenerationStatus((prev) =>
          new Map(prev).set(cacheKey, "loading"),
        );

        if (audioCache[cacheKey]) {
          setPreGenerationStatus((prev) =>
            new Map(prev).set(cacheKey, "ready"),
          );
          continue;
        }

        try {
          const wineData =
            wineResponses[effectiveWineKey as keyof typeof wineResponses];
          if (wineData?.responses) {
            const responseText =
              wineData.responses[
                suggestionId as keyof typeof wineData.responses
              ];
            if (responseText) {
              const response = await fetch("/api/text-to-speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: responseText }), // FIX 4: Send full text, no truncation
              });

              if (response.ok) {
                const audioBuffer = await response.arrayBuffer();
                const audioBlob = new Blob([audioBuffer], {
                  type: "audio/mpeg",
                });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioCache[cacheKey] = audioUrl;
                setPreGenerationStatus((prev) =>
                  new Map(prev).set(cacheKey, "ready"),
                );
                console.log(`🎤 PRE-GEN: ✅ Audio cached for "${pill.text}"`);
              } else {
                setPreGenerationStatus((prev) =>
                  new Map(prev).set(cacheKey, "failed"),
                );
              }
            }
          }
        } catch (error) {
          setPreGenerationStatus((prev) =>
            new Map(prev).set(cacheKey, "failed"),
          );
          console.error(
            `🎤 PRE-GEN: Failed to generate audio for "${pill.text}":`,
            error,
          );
        }
      }
    },
    [wineKey, suggestionsData],
  );

  // Pre-generate audio for voice context
  useEffect(() => {
    if (context === "voice-assistant") {
      if (suggestionsData?.suggestions && !isLoading) {
        preGenerateSuggestionAudio(suggestionsData.suggestions);
      }
      preGenerateSuggestionAudio(defaultSuggestions);
    }
  }, [context, suggestionsData, isLoading, preGenerateSuggestionAudio]);

  // Listen for abort conversation events
  useEffect(() => {
    const handleAbortConversation = () => {
      setIsProcessing(false);
      setLoadingPillId(null);

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
  }, []);

  const handlePillClick = async (pill: SuggestionPill) => {
    // Fix 2: Debounce or guard against overlapping clicks
    if ((window as any).audioLock) {
      console.log("Audio lock active, ignoring click");
      return;
    }

    if (isDisabled || isProcessing) return;

    setLoadingPillId(pill.id);
    setIsProcessing(true);

    try {
      const suggestionId = pill.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
      const effectiveWineKey = wineKey || "wine_1";

      let instantResponse = null;

      // Check spreadsheet data for voice context
      if (context === "voice-assistant") {
        const wineData =
          wineResponses[effectiveWineKey as keyof typeof wineResponses];
        if (wineData?.responses) {
          const spreadsheetResponse =
            wineData.responses[suggestionId as keyof typeof wineData.responses];
          if (spreadsheetResponse) {
            instantResponse = spreadsheetResponse;
          }
        }
      }

      // Fallback to cache if no spreadsheet response
      if (!instantResponse) {
        instantResponse = await suggestionCache.getCachedResponse(
          effectiveWineKey,
          suggestionId,
        );
      }

      // CHAT CONTEXT: Handle text-only
      if (context === "chat") {
        if (instantResponse) {
          // Add messages instantly
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
        } else {
          // FIX 5: Use callback pattern consistently
          onSuggestionClick(pill.text, pill.id, {
            textOnly: true,
            conversationId,
          });
        }

        setUsedPills((prev) => new Set(prev).add(pill.id));
        await markPillAsUsed(pill.id);
        return;
      }

      // VOICE CONTEXT: FIX 6: Use callback pattern instead of direct API calls
      if (context === "voice-assistant") {
        if (instantResponse) {
          // Check for pre-generated audio
          const audioCache = (window as any).suggestionAudioCache || {};
          const cacheKey = getSuggestionCacheKey(
            effectiveWineKey,
            suggestionId,
            "audio",
          );

          if (audioCache[cacheKey]) {
            // Fix 2: Set audio lock
            (window as any).audioLock = true;

            try {
              // Fix 3: Track Audio Lifecycle More Safely
              const previousAudio = (window as any).currentOpenAIAudio;
              if (previousAudio) {
                try {
                  previousAudio.pause();
                  previousAudio.currentTime = 0;
                } catch (e) {
                  console.warn("Error while stopping previous audio:", e);
                }
              }

              // Play pre-generated audio
              const audio = new Audio(audioCache[cacheKey]);

              // Fix 4: Use loadedmetadata or canplaythrough to guarantee audio is ready
              await new Promise((resolve, reject) => {
                audio.oncanplaythrough = resolve;
                audio.onerror = reject;
                audio.load();
              });

              audio.onplay = () =>
                window.dispatchEvent(new CustomEvent("tts-audio-start"));
              audio.onended = () => {
                setIsProcessing(false);
                window.dispatchEvent(new CustomEvent("tts-audio-stop"));
              };
              audio.onerror = () => {
                setIsProcessing(false);
                window.dispatchEvent(new CustomEvent("tts-audio-stop"));
              };

              (window as any).currentOpenAIAudio = audio;

              // Fix 1: Wrap all calls to audio.play() in a try/catch, and await it explicitly
              try {
                await audio.play();
              } catch (e) {
                console.warn("Playback failed or was interrupted:", e);
                setIsProcessing(false);
                window.dispatchEvent(new CustomEvent("tts-audio-stop"));
                return;
              }

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

              window.dispatchEvent(
                new CustomEvent("addChatMessage", {
                  detail: { userMessage, assistantMessage },
                }),
              );
            } finally {
              // Fix 2: Release audio lock
              (window as any).audioLock = false;
            }
          } else {
            // No pre-generated audio - use callback to let parent handle
            onSuggestionClick(pill.prompt, pill.id, {
              textOnly: false,
              conversationId,
              instantResponse,
            });
          }
        } else {
          // No cached response - use callback pattern
          onSuggestionClick(pill.prompt, pill.id, {
            textOnly: false,
            conversationId,
          });
        }

        setUsedPills((prev) => new Set(prev).add(pill.id));
        await markPillAsUsed(pill.id);
        return;
      }
    } catch (error) {
      console.error("Error handling pill click:", error);
      setUsedPills((prev) => {
        const newSet = new Set(prev);
        newSet.delete(pill.id);
        return newSet;
      });
    } finally {
      setIsProcessing(false);
      setLoadingPillId(null);
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

  const sourceSuggestions = useMemo(() => {
    const apiSuggestions = suggestionsData?.suggestions || [];
    const isStable = !isLoading && apiSuggestions.length >= 3;
    return isStable ? apiSuggestions : defaultSuggestions;
  }, [isLoading, suggestionsData]);

  const visiblePills = useMemo(() => {
    const unused = sourceSuggestions.filter(
      (pill: any) => !usedPills.has(pill.id),
    );
    const used = sourceSuggestions.filter((pill: any) =>
      usedPills.has(pill.id),
    );
    const combined = [...unused, ...used];

    if (combined.length < 3) {
      combined.push(...defaultSuggestions);
    }

    const uniqueById = Array.from(
      new Map(combined.map((p) => [p.id, p])).values(),
    );
    return uniqueById.slice(0, 3);
  }, [sourceSuggestions, usedPills]);

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
      }}
    >
      {/* FIX 7: Move styles to proper location */}
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}
      </style>

      {isLoading
        ? Array.from({ length: 3 }).map((_, index) => (
            <SkeletonPill key={`skeleton-${index}`} index={index} />
          ))
        : visiblePills.map((pill: SuggestionPill) => {
            const effectiveWineKey = wineKey || "wine_1";
            const suggestionId = pill.prompt
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_");
            const cacheKey = getSuggestionCacheKey(
              effectiveWineKey,
              suggestionId,
              "audio",
            );
            const preGenStatus = preGenerationStatus.get(cacheKey);
            const isPillLoading = loadingPillId === pill.id;

            return (
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
                  position: "relative",
                  opacity: isPillLoading ? 0.7 : 1,
                  background:
                    preGenStatus === "ready" && context === "voice-assistant"
                      ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                      : undefined,
                  color:
                    preGenStatus === "ready" && context === "voice-assistant"
                      ? "#ffffff"
                      : undefined,
                }}
              >
                {pill.text}
                {isPillLoading && (
                  <div
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "12px",
                      height: "12px",
                      border: "2px solid #ffffff",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
              </Button>
            );
          })}
    </div>
  );
}
