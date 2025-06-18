import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { suggestionCache } from "@/utils/suggestionCache";
import Button from "@/components/ui/Button";
import typography from "@/styles/typography";
import wineResponses from "@/../../shared/wineResponses.json";

// Helper function to generate cache keys for suggestions
const getSuggestionCacheKey = (
  wineKey: string,
  suggestionId: string,
  type: string = "text",
): string => {
  return `${wineKey}:${suggestionId}:${type}`;
};

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
  const [isResetting, setIsResetting] = useState(false);
  const [currentAbortController, setCurrentAbortController] =
    useState<AbortController | null>(null);
  const [preGenerationStatus, setPreGenerationStatus] = useState<
    Map<string, "loading" | "ready" | "failed">
  >(new Map());
  const [loadingPillId, setLoadingPillId] = useState<string | null>(null);
  const [audioLoadTimeout, setAudioLoadTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [allPillsReady, setAllPillsReady] = useState(false);

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

  // Eager pre-generation for all contexts to improve responsiveness
  useEffect(() => {
    if (context === "voice-assistant" && !isLoading) {
      // Prevent recursive calls by checking if already processing
      const isAlreadyProcessing = (window as any).isPreGenerating;
      if (isAlreadyProcessing) return;
      
      (window as any).isPreGenerating = true;
      
      const processAudio = async () => {
        try {
          if (suggestionsData?.suggestions) {
            await preGenerateSuggestionAudio(suggestionsData.suggestions);
          } else {
            await preGenerateSuggestionAudio(defaultSuggestions);
          }
        } finally {
          (window as any).isPreGenerating = false;
        }
      };
      
      processAudio();
    }
  }, [context, suggestionsData?.suggestions?.length, isLoading]);

  // Enhanced pre-generation with status tracking and fallbacks
  const preGenerateSuggestionAudio = async (suggestions?: SuggestionPill[]) => {
    const pillsToProcess =
      suggestions || suggestionsData?.suggestions || defaultSuggestions;
    if (!pillsToProcess?.length) return;

    console.log("🎤 PRE-GEN: Starting enhanced audio pre-generation");
    const audioCache = (window as any).suggestionAudioCache || {};
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

      setPreGenerationStatus((prev) => new Map(prev).set(cacheKey, "loading"));

      if (audioCache[cacheKey]) {
        setPreGenerationStatus((prev) => new Map(prev).set(cacheKey, "ready"));
        console.log(`🎤 PRE-GEN: Audio already cached for "${pill.text}"`);
        continue;
      }

      const wineData =
        wineResponses[effectiveWineKey as keyof typeof wineResponses];
      if (wineData?.responses) {
        const responseText =
          wineData.responses[suggestionId as keyof typeof wineData.responses];
        if (responseText) {
          try {
            console.log(`🎤 PRE-GEN: Generating audio for "${pill.text}"`);
            const response = await fetch("/api/text-to-speech", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: responseText }),
            });

            if (response.ok) {
              const audioBuffer = await response.arrayBuffer();
              const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
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
              console.error(
                `🎤 PRE-GEN: TTS request failed for "${pill.text}"`,
              );
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
        } else {
          setPreGenerationStatus((prev) =>
            new Map(prev).set(cacheKey, "failed"),
          );
          console.log(
            `🎤 PRE-GEN: No spreadsheet response for "${pill.text}", skipping pre-generation`,
          );
        }
      } else {
        setPreGenerationStatus((prev) => new Map(prev).set(cacheKey, "failed"));
        console.log(`🎤 PRE-GEN: No wine data found for "${effectiveWineKey}"`);
      }
    }
  };

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

  const handlePillClick = async (pill: SuggestionPill) => {
    console.log(
      "🔍 DEBUGGING: handlePillClick called with context:",
      context,
      "preferredResponseType:",
      preferredResponseType,
    );
    console.log("🔍 DEBUGGING: wineKey:", wineKey, "pill:", pill);

    if (isDisabled) return;

    try {
      let instantResponse = null;
      const suggestionId = pill.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");

      const effectiveWineKey = wineKey || "wine_1";
      console.log("🔍 Cache lookup using effectiveWineKey:", effectiveWineKey);

      // First check spreadsheet data for voice suggestions
      if (context === "voice-assistant") {
        console.log(
          "🔍 VOICE DEBUG: Looking for wine data with key:",
          effectiveWineKey,
        );
        console.log(
          "🔍 VOICE DEBUG: Available wine keys:",
          Object.keys(wineResponses),
        );
        const wineData =
          wineResponses[effectiveWineKey as keyof typeof wineResponses];
        console.log("🔍 VOICE DEBUG: Found wine data:", !!wineData);
        if (wineData && wineData.responses) {
          console.log(
            "🔍 VOICE DEBUG: Available response keys:",
            Object.keys(wineData.responses),
          );
          console.log(
            "🔍 VOICE DEBUG: Looking for suggestion ID:",
            suggestionId,
          );
          const spreadsheetResponse =
            wineData.responses[suggestionId as keyof typeof wineData.responses];
          if (spreadsheetResponse) {
            console.log(
              "📊 Using spreadsheet response for voice suggestion:",
              suggestionId,
            );
            instantResponse = spreadsheetResponse;
          } else {
            console.log("❌ No spreadsheet response found for:", suggestionId);
          }
        }
      }

      // Fallback to cache lookup if no spreadsheet response
      if (!instantResponse) {
        instantResponse = await suggestionCache.getCachedResponse(
          effectiveWineKey,
          suggestionId,
        );
      }
      console.log(
        "💾 Cached response found:",
        !!instantResponse,
        "Context:",
        context,
        "PillId:",
        pill.id,
        "PreferredType:",
        preferredResponseType,
      );

      // CHAT CONTEXT: Handle text-only, no audio
      if (context === "chat") {
        console.log(
          "💬 CHAT CONTEXT: Processing suggestion for chat interface",
        );

        if (instantResponse) {
          console.log("💬 CHAT: Using cached response - displaying instantly");

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

          console.log("💬 CHAT: Messages added to chat - NO AUDIO PLAYED");
        } else {
          console.log(
            "💬 CHAT: No cache - using API call with instant feedback",
          );

          const userMessage = {
            id: Date.now(),
            content: pill.text,
            role: "user" as const,
            conversationId: conversationId || 0,
            createdAt: new Date().toISOString(),
          };

          window.dispatchEvent(
            new CustomEvent("addChatMessage", {
              detail: { userMessage },
            }),
          );

          onSuggestionClick(pill.prompt, pill.id, {
            textOnly: true,
            conversationId,
          });
        }

        // Mark as used temporarily during processing
        setUsedPills((prev) => new Set(prev).add(pill.id));

        // Reset the used state after a short delay to make the pill available again
        setTimeout(() => {
          setUsedPills((prev) => {
            const newSet = new Set(prev);
            newSet.delete(pill.id);
            return newSet;
          });
        }, 2000);

        markPillAsUsed(pill.id);
        return;
      }

      // VOICE CONTEXT: Handle with audio
      if (context === "voice-assistant") {
        console.log(
          "🎤 VOICE CONTEXT: Processing suggestion for voice assistant",
        );

        setIsProcessing(true);
        window.dispatchEvent(new CustomEvent("tts-audio-start"));
        console.log("🎤 VOICE: Dispatched TTS start event for stop button");

        if (instantResponse) {
          console.log(
            "🎤 VOICE: Using cached response - starting TTS immediately",
          );

          const audioCache = (window as any).suggestionAudioCache || {};
          const cacheKey = getSuggestionCacheKey(
            effectiveWineKey,
            suggestionId,
            "audio",
          );

          if (audioCache[cacheKey]) {
            console.log(
              "🎤 VOICE: Using pre-generated audio for instant playback",
            );
            const audio = new Audio(audioCache[cacheKey]);

            audio.onplay = () => {
              console.log("🎤 VOICE: ✅ Pre-generated audio started");
              window.dispatchEvent(new CustomEvent("tts-audio-start"));
            };

            audio.onended = () => {
              console.log("🎤 VOICE: Pre-generated audio completed");
              setIsProcessing(false);
              window.dispatchEvent(new CustomEvent("tts-audio-stop"));
            };

            audio.onerror = (e) => {
              console.error("🎤 VOICE: Pre-generated audio error:", e);
              setIsProcessing(false);
              window.dispatchEvent(new CustomEvent("tts-audio-stop"));
            };

            (window as any).currentOpenAIAudio = audio;
            try {
              await audio.play();
            } catch (playError) {
              console.error("🎤 VOICE: Audio play failed:", playError);
              setIsProcessing(false);
              window.dispatchEvent(new CustomEvent("tts-audio-stop"));
              return;
            }

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

            // Mark as used temporarily
            setUsedPills((prev) => new Set(prev).add(pill.id));
            setTimeout(() => {
              setUsedPills((prev) => {
                const newSet = new Set(prev);
                newSet.delete(pill.id);
                return newSet;
              });
            }, 2000);

            markPillAsUsed(pill.id);
            return;
          }

          // Generate TTS if not cached
          console.log("🎤 VOICE: Making high-priority TTS request");
          try {
            const response = await fetch("/api/text-to-speech", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                Priority: "urgent",
              },
              body: JSON.stringify({
                text: instantResponse.slice(0, 1000),
                optimize: "speed",
              }),
              signal: currentAbortController?.signal,
            });

            if (response.ok) {
              const audioBuffer = await response.arrayBuffer();
              const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);

              audio.preload = "auto";
              audio.crossOrigin = "anonymous";

              console.log("🎤 VOICE: TTS ready - starting immediate playback");

              audio.onloadeddata = () => {
                console.log("🎤 VOICE: Audio data loaded, starting playback");
                audio.play().catch(console.error);
              };

              audio.onplay = () => {
                console.log("🎤 VOICE: ✅ Audio playback started successfully");
                window.dispatchEvent(new CustomEvent("tts-audio-start"));
              };

              audio.onended = () => {
                console.log("🎤 VOICE: Audio playback completed");
                URL.revokeObjectURL(audioUrl);
                setIsProcessing(false);
                window.dispatchEvent(new CustomEvent("tts-audio-stop"));
              };

              audio.onerror = (e) => {
                console.error("🎤 VOICE: Audio playback error:", e);
                URL.revokeObjectURL(audioUrl);
                setIsProcessing(false);
                window.dispatchEvent(new CustomEvent("tts-audio-stop"));
              };

              (window as any).currentOpenAIAudio = audio;

              try {
                console.log("🎤 VOICE: Starting immediate audio playback");
                await audio.play();
                console.log("🎤 VOICE: ✅ Audio playback initiated successfully");
              } catch (playError) {
                console.error("🎤 VOICE: Immediate playback failed:", playError);
                audio.addEventListener("canplay", () => {
                  audio.play().catch(console.error);
                });
                setIsProcessing(false);
              }
            } else {
              console.error("🎤 VOICE: TTS request failed:", response.status);
              setIsProcessing(false);
              window.dispatchEvent(new CustomEvent("tts-audio-stop"));
            }
          } catch (fetchError) {
            console.error("🎤 VOICE: TTS fetch failed:", fetchError);
            setIsProcessing(false);
            window.dispatchEvent(new CustomEvent("tts-audio-stop"));
          }

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

          // Mark as used temporarily
          setUsedPills((prev) => new Set(prev).add(pill.id));
          setTimeout(() => {
            setUsedPills((prev) => {
              const newSet = new Set(prev);
              newSet.delete(pill.id);
              return newSet;
            });
          }, 2000);

          markPillAsUsed(pill.id);
          return;
        }

        // No cached response - make API call
        console.log(
          "🎤 VOICE: No cache - making direct API call for voice response",
        );

        onSuggestionClick(pill.prompt, pill.id, {
          textOnly: false,
          conversationId,
        });

        // Mark as used temporarily
        setUsedPills((prev) => new Set(prev).add(pill.id));
        setTimeout(() => {
          setUsedPills((prev) => {
            const newSet = new Set(prev);
            newSet.delete(pill.id);
            return newSet;
          });
        }, 2000);

        markPillAsUsed(pill.id);
        return;
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
    } finally {
      setIsProcessing(false);
      setCurrentAbortController(null);
      setLoadingPillId(null);
      if (audioLoadTimeout) {
        clearTimeout(audioLoadTimeout);
        setAudioLoadTimeout(null);
      }
    }
  };

  // Fixed: Stable pill display with unique keys
  const visiblePills = useMemo(() => {
    // Get the source pills (API or default)
    const sourcePills =
      suggestionsData?.suggestions && !isLoading
        ? suggestionsData.suggestions
        : defaultSuggestions;

    // Create unique pills by adding index suffix to prevent key duplication
    const createUniquePills = (pills: SuggestionPill[], startIndex = 0) => {
      return pills.map((pill, index) => ({
        ...pill,
        id: `${pill.id}_${startIndex + index}`, // Make IDs unique
      }));
    };

    // Always return exactly 3 unique pills
    const availablePills = sourcePills.filter(
      (pill: SuggestionPill) => !usedPills.has(pill.id),
    );

    if (availablePills.length >= 3) {
      return createUniquePills(availablePills.slice(0, 3));
    }

    // If we need to fill slots, create unique versions
    const fillPills = [...availablePills];
    let fillIndex = 0;
    
    while (fillPills.length < 3 && sourcePills.length > 0) {
      const pillToAdd = sourcePills[fillIndex % sourcePills.length];
      const uniquePill = {
        ...pillToAdd,
        id: `${pillToAdd.id}_fill_${fillIndex}`,
      };
      fillPills.push(uniquePill);
      fillIndex++;
    }

    return fillPills.slice(0, 3);
  }, [suggestionsData, usedPills, isLoading]);

  return (
    <div
      className="suggestion-pills-container"
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
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      {visiblePills.map((pill: SuggestionPill) => {
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
        const isLoading = loadingPillId === pill.id;
        const showFallback = isLoading && context === "voice-assistant";
        const isRecentlyUsed = usedPills.has(pill.id);

        return (
          <Button
            key={`${context}-${pill.id}`}
            variant="suggestion"
            disabled={isDisabled || isProcessing || isRecentlyUsed}
            onClick={() => handlePillClick(pill)}
            className={`suggestion-pill-button react-button
              ${isLoading ? 'opacity-70' : isRecentlyUsed ? 'opacity-60' : 'opacity-100'}
              ${preGenStatus === "ready" && context === "voice-assistant" ? 'bg-gradient-to-br from-blue-600 to-blue-700' : ''}
              ${isRecentlyUsed ? 'bg-gray-100' : ''}
            `}
            style={{
              ...typography.buttonPlus1,
              minWidth: "fit-content",
              transition: "none",
              position: "relative",
            }}
          >
            {showFallback ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid #e5e7eb",
                    borderTop: "2px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Loading...
              </div>
            ) : (
              pill.text
            )}
          </Button>
        );
      })}
    </div>
  );
}