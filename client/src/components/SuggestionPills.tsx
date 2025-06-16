import React, { useEffect, useState, useMemo } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentAbortController, setCurrentAbortController] = useState<AbortController | null>(null);

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
    enabled: true, // Always enabled since we have fallback wine key
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
      const effectiveWineKey = wineKey || "wine_1";
      console.log("All suggestions used - resetting cycle for wine:", effectiveWineKey);
      setIsResetting(true);

      fetch(`/api/suggestion-pills/${encodeURIComponent(effectiveWineKey)}/reset`, {
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

  // Pre-generate TTS audio for voice context suggestions
  useEffect(() => {
    if (context === "voice-assistant" && suggestionsData?.suggestions && !isLoading) {
      preGenerateSuggestionAudio();
    }
  }, [context, suggestionsData, isLoading, wineKey]);

  const preGenerateSuggestionAudio = async () => {
    if (!suggestionsData?.suggestions) return;

    console.log("🎤 PRE-GEN: Starting audio pre-generation for suggestions");
    const audioCache = (window as any).suggestionAudioCache || {};
    (window as any).suggestionAudioCache = audioCache;

    const effectiveWineKey = wineKey || "wine_1";
    
    for (const pill of suggestionsData.suggestions.slice(0, 3)) {
      const suggestionId = pill.prompt.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const cacheKey = `${effectiveWineKey}_${suggestionId}`;
      
      if (audioCache[cacheKey]) continue;

      const wineData = wineResponses[effectiveWineKey as keyof typeof wineResponses];
      if (wineData?.responses) {
        const responseText = wineData.responses[suggestionId as keyof typeof wineData.responses];
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
              const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
              audioCache[cacheKey] = audioUrl;
              console.log(`🎤 PRE-GEN: ✅ Audio cached for "${pill.text}"`);
            }
          } catch (error) {
            console.error(`🎤 PRE-GEN: Failed to generate audio for "${pill.text}":`, error);
          }
        }
      }
    }
  };

  // Listen for abort conversation events (when user closes voice assistant)
  useEffect(() => {
    const handleAbortConversation = () => {
      console.log("🛑 SuggestionPills: Received abort signal - stopping all API requests");
      
      // Abort current API request if ongoing
      if (currentAbortController) {
        currentAbortController.abort();
        setCurrentAbortController(null);
      }
      
      // Reset processing state
      setIsProcessing(false);
      
      // Stop any ongoing audio
      if ((window as any).currentOpenAIAudio) {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio.currentTime = 0;
        (window as any).currentOpenAIAudio = null;
      }
    };

    window.addEventListener('abortConversation', handleAbortConversation);
    
    return () => {
      window.removeEventListener('abortConversation', handleAbortConversation);
    };
  }, [currentAbortController]);

  const handlePillClick = async (pill: SuggestionPill) => {
    console.log("🔍 DEBUGGING: handlePillClick called with context:", context, "preferredResponseType:", preferredResponseType);
    console.log("🔍 DEBUGGING: wineKey:", wineKey, "pill:", pill);
    if (isDisabled) return;

    // Optimistically mark as used
    setUsedPills((prev) => {
      const newSet = new Set(prev);
      newSet.add(pill.id);
      return newSet;
    });

    try {
      // Check for instant response (cached or spreadsheet)
      let instantResponse = null;
      const suggestionId = pill.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");

      // Use effective wine key for cache lookup
      const effectiveWineKey = wineKey || "wine_1"; // Default to wine_1 when wineKey is empty
      console.log("🔍 Cache lookup using effectiveWineKey:", effectiveWineKey);

      // First check spreadsheet data for voice suggestions
      if (context === "voice-assistant") {
        console.log("🔍 VOICE DEBUG: Looking for wine data with key:", effectiveWineKey);
        console.log("🔍 VOICE DEBUG: Available wine keys:", Object.keys(wineResponses));
        const wineData = wineResponses[effectiveWineKey as keyof typeof wineResponses];
        console.log("🔍 VOICE DEBUG: Found wine data:", !!wineData);
        if (wineData && wineData.responses) {
          console.log("🔍 VOICE DEBUG: Available response keys:", Object.keys(wineData.responses));
          console.log("🔍 VOICE DEBUG: Looking for suggestion ID:", suggestionId);
          const spreadsheetResponse = wineData.responses[suggestionId as keyof typeof wineData.responses];
          if (spreadsheetResponse) {
            console.log("📊 Using spreadsheet response for voice suggestion:", suggestionId);
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
        
        setIsProcessing(true);
        
        // Immediately dispatch TTS start event to show stop button
        window.dispatchEvent(new CustomEvent("tts-audio-start"));
        console.log("🎤 VOICE: Dispatched TTS start event for stop button");

        if (instantResponse) {
          const responseSource = instantResponse.length > 200 ? "spreadsheet" : "cache";
          console.log(`🎤 VOICE: Using ${responseSource} response - starting TTS immediately`);

          // Check if we have pre-generated audio for this suggestion
          const audioCache = (window as any).suggestionAudioCache || {};
          const cacheKey = `${effectiveWineKey}_${suggestionId}`;
          
          if (audioCache[cacheKey]) {
            console.log("🎤 VOICE: Using pre-generated audio for instant playback");
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
            await audio.play();
            
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

            markPillAsUsed(pill.id);
            return;
          }

          // Start TTS generation in parallel with chat message handling
          const ttsPromise = (async () => {
            try {
              console.log("🎤 VOICE: Making TTS API request (no pre-generated audio)");
              const response = await fetch("/api/text-to-speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: instantResponse }),
                signal: currentAbortController?.signal,
              });

              if (response.ok) {
                const audioBuffer = await response.arrayBuffer();
                const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                console.log("🎤 VOICE: Immediate TTS ready - playing audio");
                
                audio.onplay = () => {
                  console.log("🎤 VOICE: ✅ Audio playback started successfully");
                  // Dispatch TTS audio start event for VoiceAssistant
                  window.dispatchEvent(new CustomEvent("tts-audio-start"));
                };

                audio.onended = () => {
                  console.log("🎤 VOICE: Audio playback completed");
                  URL.revokeObjectURL(audioUrl);
                  setIsProcessing(false);
                  // Dispatch TTS audio stop event for VoiceAssistant
                  window.dispatchEvent(new CustomEvent("tts-audio-stop"));
                };
                
                audio.onerror = (e) => {
                  console.error("🎤 VOICE: Audio playback error:", e);
                  URL.revokeObjectURL(audioUrl);
                  setIsProcessing(false);
                  // Dispatch TTS audio stop event for VoiceAssistant
                  window.dispatchEvent(new CustomEvent("tts-audio-stop"));
                };

                // Store reference for potential stopping
                (window as any).currentOpenAIAudio = audio;
                
                try {
                  console.log("🎤 VOICE: Attempting to play audio...");
                  await audio.play();
                  console.log("🎤 VOICE: ✅ Audio play() call succeeded");
                } catch (playError) {
                  console.error("🎤 VOICE: Audio play() failed:", playError);
                  // Try to unlock audio context and retry
                  if (window.AudioContext || (window as any).webkitAudioContext) {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    if (audioContext.state === 'suspended') {
                      await audioContext.resume();
                      console.log("🎤 VOICE: Audio context resumed, retrying...");
                      try {
                        await audio.play();
                        console.log("🎤 VOICE: ✅ Audio play() retry succeeded");
                      } catch (retryError) {
                        console.error("🎤 VOICE: Audio play() retry failed:", retryError);
                      }
                    }
                  }
                }
              }
            } catch (error: any) {
              if (error.name === 'AbortError') {
                console.log("🛑 VOICE: Immediate TTS aborted by user");
              } else {
                console.error("🎤 VOICE: Immediate TTS error:", error);
              }
              setIsProcessing(false);
            }
          })();

          // Add messages to chat in parallel
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

          // Mark pill as used and complete processing
          markPillAsUsed(pill.id);
          return; // Exit early - TTS already started above
        } else {
          // No cached response - make API call
          console.log("🎤 VOICE: No cache - making direct API call for voice response");
          
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: pill.prompt }],
              wineKey: effectiveWineKey,
              wineData: { id: null, name: "Ridge \"Lytton Springs\" Dry Creek Zinfandel" },
              textOnly: false,
            }),
            signal: currentAbortController?.signal,
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const data = await response.json();
          const responseText = data.message?.content || "";

          if (responseText && data.audioBuffers && data.audioBuffers.length > 0) {
            // Store response in cache for future use
            await suggestionCache.storeResponse(
              effectiveWineKey,
              suggestionId,
              responseText,
            );

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
              content: responseText,
              role: "assistant" as const,
              conversationId: conversationId || 0,
              createdAt: new Date().toISOString(),
            };

            window.dispatchEvent(
              new CustomEvent("addChatMessage", {
                detail: { userMessage, assistantMessage },
              }),
            );

            // Play audio from API response
            for (const buffer of data.audioBuffers) {
              const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              
              await new Promise((resolve, reject) => {
                audio.onended = () => {
                  URL.revokeObjectURL(audioUrl);
                  resolve(undefined);
                };
                audio.onerror = reject;
                audio.play();
              });
            }
          }
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

    // Only show unused pills - never show used ones
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

    // If all suggestions are used, reset and start fresh
    if (unusedPills.length === 0 && availablePills.length > 0) {
      console.log("🔄 All suggestions used - resetting to show fresh suggestions");
      // Reset used pills and show first 3 suggestions
      setUsedPills(new Set());
      // Trigger a reset on the backend using effective wine key
      const effectiveWineKey = wineKey || "wine_1";
      fetch(`/api/suggestion-pills/${encodeURIComponent(effectiveWineKey)}/reset`, {
        method: 'DELETE'
      }).catch(console.error);
      return availablePills.slice(0, 3);
    }

    // Fallback: show unused default suggestions if no API suggestions available
    const unusedDefaults = defaultSuggestions.filter(def => !usedPills.has(def.id));
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
