import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import { suggestionCache } from "@/utils/suggestionCache";

interface SuggestionButton {
  id: string;
  text: string;
  prompt: string;
}

interface SuggestionButtonsProps {
  wineKey: string;
  onSuggestionClick: (prompt: string, buttonId: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isDisabled?: boolean;
}

export default function SuggestionButtons({ wineKey, onSuggestionClick, isDisabled = false }: SuggestionButtonsProps) {
  const [usedButtons, setUsedButtons] = useState<Set<string>>(new Set());

  // Fetch available suggestion buttons for this wine
  const { data: suggestionsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/suggestion-pills', wineKey],
    queryFn: async () => {
      const response = await fetch(`/api/suggestion-pills/${encodeURIComponent(wineKey)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestion buttons');
      }
      return response.json();
    },
    enabled: !!wineKey,
  });

  const handleButtonClick = async (button: SuggestionButton) => {
    if (isDisabled) return;

    console.log("Voice suggestion button clicked:", button.text);

    try {
      // Check cache immediately for instant voice response
      const suggestionId = button.prompt.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const cachedResponse = await suggestionCache.getCachedResponse(wineKey, suggestionId);
      
      // Mark button as used in database for tracking
      const response = await fetch('/api/suggestion-pills/used', {
        method: 'POST',
        body: JSON.stringify({
          wineKey,
          suggestionId: button.id,
          userId: null,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark button as used');
      }

      // Update local state to track usage
      setUsedButtons(prev => new Set(Array.from(prev).concat(button.id)));

      // Call the voice assistant with cached response if available
      if (cachedResponse) {
        console.log("Voice button - using cached response for instant playback");
        onSuggestionClick(button.prompt, button.id, { instantResponse: cachedResponse });
      } else {
        console.log("Voice button - no cache, using normal API flow");
        onSuggestionClick(button.prompt, button.id);
      }

      // Refetch to get updated data
      refetch();
    } catch (error) {
      console.error('Error with suggestion button:', error);
      // Fallback to normal flow if there's an error
      onSuggestionClick(button.prompt, button.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 flex-wrap animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 bg-gray-200 rounded-full px-4 py-2 w-24"
          />
        ))}
      </div>
    );
  }

  const availableButtons = suggestionsData?.suggestions || [];
  let visibleButtons = availableButtons.filter((button: SuggestionButton) => !usedButtons.has(button.id)).slice(0, 3);
  
  // If no unused buttons available, reset and show all buttons again
  if (visibleButtons.length === 0 && availableButtons.length > 0) {
    console.log("All voice suggestions used - resetting cycle for wine:", wineKey);
    
    // Reset the used buttons in the database to allow cycling
    fetch(`/api/suggestion-pills/${encodeURIComponent(wineKey)}/reset`, {
      method: 'DELETE'
    }).catch(error => console.error('Failed to reset suggestion buttons:', error));
    
    setUsedButtons(new Set()); // Reset local state
    visibleButtons = availableButtons.slice(0, 3); // Show first 3 buttons again
  }

  // Always show buttons - cycle through all suggestions for voice assistant
  if (visibleButtons.length === 0 && availableButtons.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        Loading voice suggestions...
      </div>
    );
  }

  return (
    <div 
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {visibleButtons.map((button: SuggestionButton) => (
        <button
          key={button.id}
          onClick={() => handleButtonClick(button)}
          disabled={isDisabled}
          className="whitespace-nowrap flex-shrink-0 text-white border border-white/20 hover:bg-white/10 bg-transparent disabled:opacity-50"
          style={{
            minWidth: 'fit-content',
            padding: '6px 12px',
            fontSize: '14px',
            fontWeight: '400',
            borderRadius: '20px',
            transition: 'all 0.2s ease'
          }}
        >
          {button.text}
        </button>
      ))}
    </div>
  );
}