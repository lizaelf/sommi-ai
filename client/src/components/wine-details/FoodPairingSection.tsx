import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import FoodPairingCard from './FoodPairingCard';
import SectionHeaderButton from '@/components/ui/buttons/SectionHeaderButton';
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

  const detectedWineType = wineTypeData?.detectedType || 'Red';

  // Show ALL food pairing categories from the database
  const foodPairingCards = foodCategories
    ? foodCategories.map((category: any) => ({
        image: category.imagePath,
        title: category.type,
        description: `Perfect pairing for ${detectedWineType.toLowerCase()} wines`
      }))
    : [];

  const handleSeeAllClick = () => {
    setLocation('/food-pairings-ai');
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
        <SectionHeaderButton onClick={handleSeeAllClick}>
          See all
        </SectionHeaderButton>
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