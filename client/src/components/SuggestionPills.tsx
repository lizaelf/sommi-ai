import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { suggestionCache } from "@/utils/suggestionCache";
import Button from "@/components/ui/Button";

interface SuggestionPill {
  id: string;
  text: string;
  prompt: string;
}

interface SuggestionPillsProps {
  wineKey: string;
  conversationId?: string; // Add conversation context
  onSuggestionClick: (prompt: string, pillId?: string, options?: { 
    textOnly?: boolean; 
    instantResponse?: string;
    conversationId?: string;
  }) => void;
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
  context = "chat" 
}: SuggestionPillsProps) {
  const [usedPills, setUsedPills] = useState<Set<string>>(new Set());
  const [isResetting, setIsResetting] = useState(false);
  
  // Default suggestions to show immediately while API loads
  const defaultSuggestions: SuggestionPill[] = [
    { id: "default-1", text: "Tell me about this wine", prompt: "Tell me about this wine" },
    { id: "default-2", text: "What's the story behind it?", prompt: "What's the story behind this wine?" },
    { id: "default-3", text: "Food pairing suggestions", prompt: "What food pairs well with this wine?" }
  ];

  // Fetch available suggestion pills for this wine
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Handle resetting pills when all are used
  useEffect(() => {
    const availablePills = suggestionsData?.suggestions || [];
    if (availablePills.length === 0) return;

    const unusedPills = availablePills.filter((pill: SuggestionPill) => !usedPills.has(pill.id));
    
    if (unusedPills.length === 0 && !isResetting) {
      console.log("All suggestions used - resetting cycle for wine:", wineKey);
      setIsResetting(true);
      
      fetch(`/api/suggestion-pills/${encodeURIComponent(wineKey)}/reset`, {
        method: 'DELETE'
      })
      .then(() => {
        setUsedPills(new Set());
        setIsResetting(false);
      })
      .catch(error => {
        console.error('Failed to reset suggestion pills:', error);
        setIsResetting(false);
      });
    }
  }, [suggestionsData, usedPills, wineKey, isResetting]);

  const handlePillClick = async (pill: SuggestionPill) => {
    if (isDisabled) return;

    // Optimistically mark as used
    setUsedPills(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.add(pill.id);
      return newSet;
    });

    try {
      // Check cache for instant responses
      let cachedResponse = null;
      const suggestionId = pill.prompt.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      cachedResponse = await suggestionCache.getCachedResponse(wineKey, suggestionId);

      // Prepare options for parent
      const options = {
        textOnly: context === "chat",
        instantResponse: cachedResponse || undefined,
        conversationId,
      };

      // Always use the parent callback - no bypassing!
      onSuggestionClick(pill.prompt, pill.id, options);

      // Mark as used in background
      try {
        await fetch('/api/suggestion-pills/used', {
          method: 'POST',
          body: JSON.stringify({
            wineKey,
            suggestionId: pill.id,
            userId: null,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
        refetch();
      } catch (error) {
        console.error('Error marking pill as used:', error);
      }

    } catch (error) {
      // Rollback optimistic update on error
      setUsedPills(prev => {
        const newSet = new Set(prev);
        newSet.delete(pill.id);
        return newSet;
      });
      console.error('Error handling pill click:', error);
    }
  };

  // Memoize visible pills calculation
  const visiblePills = useMemo(() => {
    const availablePills = suggestionsData?.suggestions || [];
    
    if (isLoading || availablePills.length === 0) {
      return defaultSuggestions.slice(0, 3);
    }

    let pills = availablePills.filter((pill: SuggestionPill) => !usedPills.has(pill.id)).slice(0, 3);
    
    // Fill up to 3 suggestions if we have fewer
    if (pills.length < 3 && availablePills.length >= 3) {
      const remainingSlots = 3 - pills.length;
      const additionalPills = availablePills
        .filter((pill: SuggestionPill) => !pills.some((p: SuggestionPill) => p.id === pill.id))
        .slice(0, remainingSlots);
      pills = [...pills, ...additionalPills];
    }

    return pills;
  }, [suggestionsData, usedPills, isLoading]);

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