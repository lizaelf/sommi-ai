import React from 'react';
import { useLocation } from 'wouter';
import FoodPairingCard from './FoodPairingCard';
import { Button } from '@/components/ui/Button';
import typography from '@/styles/typography';

interface FoodPairingSectionProps {
  foodPairing?: string[];
  wineId?: number;
}

const FoodPairingSection: React.FC<FoodPairingSectionProps> = ({
  foodPairing,
  wineId,
}) => {
  const [, setLocation] = useLocation();
  const wineTypeCards = [
    {
      image: "/wine-types/red.svg",
      title: "Red Wine",
      description: "Bold flavors with rich tannins"
    },
    {
      image: "/wine-types/white.svg", 
      title: "White Wine",
      description: "Crisp and refreshing profiles"
    },
    {
      image: "/wine-types/rose.svg",
      title: "Rosé Wine", 
      description: "Light and elegant pink wines"
    },
    {
      image: "/wine-types/sparkling.svg",
      title: "Sparkling Wine",
      description: "Effervescent celebration wines"
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
          Wine Types
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
        {wineTypeCards.map((card, index) => (
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