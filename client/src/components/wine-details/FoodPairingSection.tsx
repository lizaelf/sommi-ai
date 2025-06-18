import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import FoodPairingCard from './FoodPairingCard';
import { Button } from '@/components/ui/Button';
import typography from '@/styles/typography';
import { useQuery } from '@tanstack/react-query';

interface FoodPairingSectionProps {
  foodPairing?: string[];
  wineId?: number;
  wineName?: string;
}

const FoodPairingSection: React.FC<FoodPairingSectionProps> = ({
  foodPairing,
  wineId,
  wineName,
}) => {
  const [, setLocation] = useLocation();

  // Fetch wine type detection
  const { data: wineTypeData } = useQuery({
    queryKey: ['wine-type', wineName],
    queryFn: async () => {
      if (!wineName) return null;
      const response = await fetch('/api/detect-wine-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wineName })
      });
      return response.json();
    },
    enabled: !!wineName
  });

  // Fetch food pairing categories
  const { data: foodCategories } = useQuery({
    queryKey: ['food-pairing-categories'],
    queryFn: async () => {
      const response = await fetch('/api/food-pairing-categories');
      return response.json();
    }
  });

  // Define wine type specific food pairing recommendations
  const getFoodPairingsByWineType = (wineType: string): string[] => {
    const pairingMap: Record<string, string[]> = {
      'Red': ['Meat', 'Cheese', 'Pasta', 'Side Dishes'],
      'White': ['Seafood', 'Poultry', 'Veggie', 'Appetizers'],
      'Rose': ['Appetizers', 'Side Dishes', 'Cheese', 'Seafood'],
      'Sparkling': ['Appetizers', 'Seafood', 'Cheese', 'Poultry']
    };
    return pairingMap[wineType] || ['Meat', 'Cheese', 'Appetizers'];
  };

  const detectedWineType = wineTypeData?.detectedType || 'Red';
  const recommendedCategories = getFoodPairingsByWineType(detectedWineType);

  const foodPairingCards = foodCategories
    ? recommendedCategories
        .map((categoryType: string) => foodCategories.find((cat: { type: string; imagePath: string; id: number }) => cat.type === categoryType))
        .filter(Boolean)
        .map((category: any) => ({
          image: category.imagePath,
          title: category.type,
          description: `Perfect pairing for ${detectedWineType.toLowerCase()} wines`
        }))
    : [];

  const handleSeeAllClick = () => {
    setLocation(`/food-pairings/${wineId || 1}`);
  };

  return (
    <div style={{ padding: "0 16px", marginBottom: "32px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
      }}>
        <h1 style={{
          ...typography.h1,
          color: "white",
          margin: 0,
          textAlign: "left",
        }}>
          Food pairings
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSeeAllClick}
          style={{ 
            width: "auto",
            flexShrink: 0,
            whiteSpace: "nowrap" 
          }}
        >
          See all
        </Button>
      </div>
      
      <div style={{
        display: "flex",
        gap: "16px",
        overflowX: "auto",
        paddingBottom: "8px",
      }}>
        {foodPairingCards.map((card: any, index: number) => (
          <FoodPairingCard
            key={index}
            image={card.image}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>
    </div>
  );
};

export default FoodPairingSection;