import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { suggestionCache } from "@/utils/suggestionCache"; // Add this import
import Button from "@/components/ui/Button";

interface SuggestionPill {
  id: string;
  text: string;
  prompt: string;
}

interface SuggestionPillsProps {
  wineKey: string;
  onSuggestionClick: (prompt: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isDisabled?: boolean;
  preferredResponseType?: "text" | "voice";
  context?: "chat" | "voice-assistant";
}

export default function SuggestionPills({ 
  wineKey, 
  onSuggestionClick, 
  isDisabled = false, 
  preferredResponseType = "text", 
  context = "chat" 
}: SuggestionPillsProps) {
  const [usedPills, setUsedPills] = useState<Set<string>>(new Set());
  
  // Default suggestions to show immediately while API loads
  const defaultSuggestions: SuggestionPill[] = [
    { id: "default-1", text: "Tell me about this wine", prompt: "Tell me about this wine" },
    { id: "default-2", text: "What's the story behind it?", prompt: "What's the story behind this wine?" },
    { id: "default-3", text: "Food pairing suggestions", prompt: "What food pairs well with this wine?" }
  ];

  // Fetch available suggestion pills for this wine with faster loading
  const { data: suggestionsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/suggestion-pills', wineKey],
    queryFn: async () => {
      const response = await fetch(`/api/suggestion-pills/${encodeURIComponent(wineKey)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestion pills');
      }
      return response.json();
    },
    enabled: !!wineKey,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const handlePillClick = async (pill: SuggestionPill) => {
    if (isDisabled) return;

    try {
      console.log(`=== PILL CLICK DEBUG ===`);
      console.log(`Pill clicked: ${pill.text}`);
      console.log(`Context: ${context}`);
      console.log(`Preferred response type: ${preferredResponseType}`);
      console.log(`Wine key: ${wineKey}`);

      // Check cache for BOTH contexts (not just voice-assistant)
      let cachedResponse = null;
      const suggestionId = pill.prompt.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      console.log(`Suggestion ID for cache: ${suggestionId}`);
      cachedResponse = await suggestionCache.getCachedResponse(wineKey, suggestionId);
      console.log(`Cache result for ${pill.text}:`, cachedResponse ? `Found (${cachedResponse.substring(0, 50)}...)` : 'Not found');

      // Mark pill as used in database (background operation)
      fetch('/api/suggestion-pills/used', {
        method: 'POST',
        body: JSON.stringify({
          wineKey,
          suggestionId: pill.id,
          userId: null,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(() => {
        // Update local state to track used pills
        setUsedPills(prev => {
          const newSet = new Set(prev);
          newSet.add(pill.id);
          return newSet;
        });
        // Refetch to get updated available pills
        refetch();
      }).catch(error => console.error('Error marking pill as used:', error));

      // Handle based on context and cache availability
      if (context === "chat") {
        console.log("SuggestionPills - Chat context detected, cached response:", !!cachedResponse);
        if (cachedResponse) {
          // For chat context with cached response - bypass VoiceAssistant entirely
          console.log("Chat context - instant cached display, bypassing voice system");
          
          // Directly add messages to conversation without voice processing
          const userMessage = {
            id: Date.now(),
            content: pill.prompt,
            role: "user" as const,
            conversationId: 20, // Use current conversation
            createdAt: new Date().toISOString(),
          };
          
          const assistantMessage = {
            id: Date.now() + 1,
            content: cachedResponse,
            role: "assistant" as const,
            conversationId: 20,
            createdAt: new Date().toISOString(),
          };
          
          // Use window messaging to add messages directly
          window.dispatchEvent(new CustomEvent('addChatMessage', { 
            detail: { userMessage, assistantMessage } 
          }));
          
          return; // Skip voice system entirely
        } else {
          // No cache - use text-only API call
          console.log("Chat context - no cache, using text-only API");
          onSuggestionClick(pill.prompt, pill.id, { textOnly: true });
        }
      } else if (context === "voice-assistant") {
        if (cachedResponse) {
          // Use cached response for instant voice playback
          console.log("Voice assistant context - using cached response for instant voice");
          onSuggestionClick(pill.prompt, pill.id, { instantResponse: cachedResponse });
        } else {
          // No cache available - use API + TTS (will show thinking state)
          console.log("Voice assistant context - no cache, using API + TTS");
          onSuggestionClick(pill.prompt, pill.id, { textOnly: false });
        }
      } else {
        // Default behavior - text only
        onSuggestionClick(pill.prompt, pill.id, { textOnly: true });
      }

    } catch (error) {
      console.error('Error handling pill click:', error);
    }
  };

  // Always show suggestions immediately - use API data if available, otherwise show defaults
  const availablePills = suggestionsData?.suggestions || [];
  let visiblePills: SuggestionPill[] = [];
  
  if (isLoading || availablePills.length === 0) {
    // Show default suggestions while loading or if no API suggestions available
    visiblePills = defaultSuggestions.slice(0, 3);
  } else {
    // Use API suggestions when available
    visiblePills = availablePills.filter((pill: SuggestionPill) => !usedPills.has(pill.id)).slice(0, 3);
    
    // If no unused pills available, reset and show all pills again
    if (visiblePills.length === 0 && availablePills.length > 0) {
      console.log("All suggestions used - resetting cycle for wine:", wineKey);
      
      // Reset the used pills in the database to allow cycling
      fetch(`/api/suggestion-pills/${encodeURIComponent(wineKey)}/reset`, {
        method: 'DELETE'
      }).catch(error => console.error('Failed to reset suggestion pills:', error));
      
      setUsedPills(new Set()); // Reset local state
      visiblePills = availablePills.slice(0, 3); // Show first 3 pills again
    }

    // Ensure we always show 3 suggestions if any are available
    if (visiblePills.length < 3 && availablePills.length >= 3) {
      // Fill up to 3 suggestions, cycling if needed
      const remainingSlots = 3 - visiblePills.length;
      const additionalPills = availablePills
        .filter((pill: SuggestionPill) => !visiblePills.some((vp: SuggestionPill) => vp.id === pill.id))
        .slice(0, remainingSlots);
      visiblePills = [...visiblePills, ...additionalPills];
    }
  }

  return (
    <div 
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {visiblePills.map((pill: SuggestionPill) => (
        <Button
          key={pill.id}
          variant="secondary"
          onClick={() => handlePillClick(pill)}
          disabled={isDisabled || usedPills.has(pill.id)}
          className="h-auto py-2 px-4 text-sm whitespace-nowrap hover:bg-gray-100 transition-colors border border-gray-300 rounded-full flex-shrink-0 min-w-fit"
        >
          {pill.text}
        </Button>
      ))}
    </div>
  );
}