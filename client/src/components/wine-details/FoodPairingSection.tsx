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
}) => {
  const [, setLocation] = useLocation();
  const foodPairingCards = [
    {
      image: "/food-pairing-meat.svg",
      title: "Red Meat",
      description: "Perfect for grilled steaks and lamb"
    },
    {
      image: "/food-pairing-cheese.svg", 
      title: "Aged Cheese",
      description: "Pairs wonderfully with aged cheddar"
    },
    {
      image: "/food-pairing-herbs.svg",
      title: "Herbs & Spices", 
      description: "Complements rosemary and thyme"
    }
  ];

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
        {foodPairingCards.map((card, index) => (
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