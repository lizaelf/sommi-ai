import React from 'react';
import FoodPairingCard from './FoodPairingCard';
import typography from '@/styles/typography';

interface FoodPairingSectionProps {
  foodPairing?: string[];
}

const FoodPairingSection: React.FC<FoodPairingSectionProps> = ({
  foodPairing,
}) => {
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

  return (
    <div style={{ padding: "0 16px", marginBottom: "32px" }}>
      <h1 style={{
        ...typography.h1,
        color: "white",
        marginBottom: "20px",
        textAlign: "left",
      }}>
        Food pairings
      </h1>
      
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