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
    console.log("🔍 DEBUGGING: handlePillClick called with context:", context, "preferredResponseType:", preferredResponseType);
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

          // Play audio using OpenAI TTS for consistency with voice assistant
          console.log("🎤 VOICE: Generating TTS audio for suggestion response");
          
          try {
            console.log("🎤 VOICE: Making TTS API request for cached response");
            const response = await fetch("/api/text-to-speech", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: instantResponse }),
            });

            console.log("🎤 VOICE: TTS API response status:", response.status, response.ok);

            if (response.ok) {
              const audioBlob = await response.blob();
              console.log("🎤 VOICE: Audio blob created, size:", audioBlob.size);
              
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              console.log("🎤 VOICE: Audio element created with URL:", audioUrl);

              // Store reference for stop functionality
              (window as any).currentOpenAIAudio = audio;

              audio.onplay = () => {
                console.log("🎤 VOICE: ✅ OpenAI TTS audio started playing successfully");
              };

              audio.onended = () => {
                console.log("🎤 VOICE: OpenAI TTS audio finished playing");
                URL.revokeObjectURL(audioUrl);
                (window as any).currentOpenAIAudio = null;
              };

              audio.onerror = (e) => {
                console.error("🎤 VOICE: OpenAI TTS audio error:", e, "falling back to browser TTS");
                URL.revokeObjectURL(audioUrl);
                (window as any).currentOpenAIAudio = null;
                
                // Fallback to browser TTS
                const utterance = new SpeechSynthesisUtterance(instantResponse);
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
                console.log("🎤 VOICE: Browser TTS fallback initiated");
              };

              try {
                await audio.play();
                console.log("🎤 VOICE: OpenAI TTS audio playback initiated successfully");
              } catch (playError) {
                console.error("🎤 VOICE: Audio.play() failed for cached response:", playError);
                // Try to unlock audio context and retry
                if (window.AudioContext || (window as any).webkitAudioContext) {
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                  if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                    console.log("🎤 VOICE: Audio context resumed, retrying cached audio play");
                    try {
                      await audio.play();
                      console.log("🎤 VOICE: Cached audio play retry successful");
                    } catch (retryError) {
                      console.error("🎤 VOICE: Cached audio play retry failed, using browser TTS:", retryError);
                      // Fallback to browser TTS
                      const utterance = new SpeechSynthesisUtterance(instantResponse);
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
                      console.log("🎤 VOICE: Browser TTS fallback initiated for cached response");
                    }
                  }
                }
              }
            } else {
              throw new Error("TTS API failed");
            }
          } catch (error) {
            console.error("🎤 VOICE: TTS generation failed, using browser TTS fallback:", error);
            
            // Fallback to browser TTS
            const utterance = new SpeechSynthesisUtterance(instantResponse);
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
            console.log("🎤 VOICE: Browser TTS fallback initiated");
          }
        } else {
          console.log("🎤 VOICE: No cache - making direct API call for voice response");
          
          // Make direct API call without routing through voice assistant
          try {
            setIsDisabled(true);
            
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [
                  { role: "user", content: pill.prompt }
                ],
                wineKey: wineKey,
                textOnly: false // Enable voice for voice assistant context
              }),
            });

            if (response.ok) {
              const data = await response.json();
              
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
                content: data.response,
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

              // Play audio using OpenAI TTS
              console.log("🎤 VOICE: Playing audio response for API result");
              
              const ttsResponse = await fetch("/api/text-to-speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: data.response }),
              });

              console.log("🎤 VOICE: TTS API response for new request - status:", ttsResponse.status, ttsResponse.ok);

              if (ttsResponse.ok) {
                const audioBlob = await ttsResponse.blob();
                console.log("🎤 VOICE: Audio blob created for new request, size:", audioBlob.size);
                
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                console.log("🎤 VOICE: Audio element created for new request with URL:", audioUrl);

                // Store reference for stop functionality
                (window as any).currentOpenAIAudio = audio;

                audio.onplay = () => {
                  console.log("🎤 VOICE: ✅ OpenAI TTS audio for new request started playing successfully");
                };

                audio.onended = () => {
                  console.log("🎤 VOICE: OpenAI TTS audio for new request finished playing");
                  URL.revokeObjectURL(audioUrl);
                  (window as any).currentOpenAIAudio = null;
                };

                audio.onerror = (e) => {
                  console.error("🎤 VOICE: OpenAI TTS audio error for new request:", e, "falling back to browser TTS");
                  URL.revokeObjectURL(audioUrl);
                  (window as any).currentOpenAIAudio = null;
                  
                  // Fallback to browser TTS
                  const utterance = new SpeechSynthesisUtterance(data.response);
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
                  console.log("🎤 VOICE: Browser TTS fallback initiated for new request");
                };

                try {
                  await audio.play();
                  console.log("🎤 VOICE: OpenAI TTS audio playback initiated successfully");
                } catch (playError) {
                  console.error("🎤 VOICE: Audio.play() failed:", playError);
                  // Try to unlock audio context and retry
                  if (window.AudioContext || (window as any).webkitAudioContext) {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    if (audioContext.state === 'suspended') {
                      await audioContext.resume();
                      console.log("🎤 VOICE: Audio context resumed, retrying play");
                      try {
                        await audio.play();
                        console.log("🎤 VOICE: Audio play retry successful");
                      } catch (retryError) {
                        console.error("🎤 VOICE: Audio play retry failed, using browser TTS:", retryError);
                        // Fallback to browser TTS
                        const utterance = new SpeechSynthesisUtterance(data.response);
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
                        console.log("🎤 VOICE: Browser TTS fallback initiated");
                      }
                    }
                  }
                }
              } else {
                throw new Error("TTS API failed");
              }
            } else {
              throw new Error("Chat API failed");
            }
          } catch (error) {
            console.error("🎤 VOICE: API call failed:", error);
          } finally {
            setIsDisabled(false);
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
      data-suggestion-context={context} // Add context identifier
    >
      {visiblePills.map((pill: SuggestionPill) => (
        <Button
          key={`${context}-${pill.id}`} // Make keys unique per context
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            handlePillClick(pill);
          }}
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
          data-pill-context={context} // Add context data attribute
        >
          {pill.text}
        </Button>
      ))}
    </div>
  );
}
