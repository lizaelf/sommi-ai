import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Button from "@/components/ui/Button";

interface SuggestionPill {
  id: string;
  text: string;
  prompt: string;
}

interface SuggestionPillsProps {
  wineKey: string;
  onSuggestionClick: (prompt: string, pillId: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isDisabled?: boolean;
}

export default function SuggestionPills({ wineKey, onSuggestionClick, isDisabled = false }: SuggestionPillsProps) {
  const [usedPills, setUsedPills] = useState<Set<string>>(new Set());
  
  console.log("🔍 SuggestionPills DEBUG:", {
    wineKey,
    isDisabled,
    usedPillsCount: usedPills.size,
    usedPillsArray: Array.from(usedPills)
  });

  // Fetch available suggestion pills for this wine
  const { data: suggestionsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/suggestion-pills', wineKey],
    queryFn: async () => {
      console.log("🔍 Fetching suggestions for wineKey:", wineKey);
      const response = await fetch(`/api/suggestion-pills/${encodeURIComponent(wineKey)}`);
      if (!response.ok) {
        console.error("❌ Failed to fetch suggestion pills:", response.status, response.statusText);
        throw new Error('Failed to fetch suggestion pills');
      }
      const data = await response.json();
      console.log("✓ Suggestions fetched:", data);
      return data;
    },
    enabled: !!wineKey,
  });

  const handlePillClick = async (pill: SuggestionPill) => {
    if (isDisabled) return;

    console.log("🔍 Pill Click DEBUG:", {
      pillId: pill.id,
      pillText: pill.text,
      wineKey,
      isDisabled,
      currentUsedPills: Array.from(usedPills)
    });

    try {
      // Mark pill as used in database
      const response = await fetch('/api/suggestion-pills/used', {
        method: 'POST',
        body: JSON.stringify({
          wineKey,
          suggestionId: pill.id,
          userId: null, // Optional user tracking
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark pill as used');
      }

      console.log("✓ Pill marked as used in database:", pill.id);

      // Update local state to track used pills
      setUsedPills(prev => {
        const newSet = new Set(Array.from(prev).concat(pill.id));
        console.log("✓ Updated local used pills:", Array.from(newSet));
        return newSet;
      });

      // Trigger the suggestion with the prompt (text-only response)
      onSuggestionClick(pill.prompt, pill.id, { textOnly: true });

      // Refetch to get updated available pills
      refetch();
    } catch (error) {
      console.error('❌ Error marking pill as used:', error);
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

  const availablePills = suggestionsData?.suggestions || [];
  let visiblePills = availablePills.filter((pill: SuggestionPill) => !usedPills.has(pill.id)).slice(0, 3);
  
  console.log("🔍 Pills Filter DEBUG:", {
    totalAvailable: availablePills.length,
    afterFilter: visiblePills.length,
    availablePillIds: availablePills.map((p: any) => p.id),
    visiblePillIds: visiblePills.map((p: any) => p.id),
    usedPillsSet: Array.from(usedPills)
  });
  
  // If no unused pills available, reset and show all pills again
  if (visiblePills.length === 0 && availablePills.length > 0) {
    console.log("🔄 All suggestions used - resetting cycle for wine:", wineKey);
    
    // Reset the used pills in the database to allow cycling
    fetch(`/api/suggestion-pills/${encodeURIComponent(wineKey)}/reset`, {
      method: 'DELETE'
    }).catch(error => console.error('Failed to reset suggestion pills:', error));
    
    setUsedPills(new Set()); // Reset local state
    visiblePills = availablePills.slice(0, 3); // Show first 3 pills again
    
    console.log("🔄 After reset - showing pills:", visiblePills.map((p: any) => p.id));
  }

  // Always show at least some suggestions if available
  if (visiblePills.length === 0 && availablePills.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        Loading suggestions...
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