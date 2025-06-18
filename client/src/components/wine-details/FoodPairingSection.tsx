import React from 'react';
import FoodPairingExpandableItem from './FoodPairingExpandableItem';
import typography from '@/styles/typography';

interface FoodPairingSectionProps {
  foodPairing?: string[];
  expandedItem: string | null;
  onToggleExpanded: (id: string) => void;
}

const FoodPairingSection: React.FC<FoodPairingSectionProps> = ({
  foodPairing,
  expandedItem,
  onToggleExpanded,
}) => {
  const getFoodPairingContent = () => {
    return {
      dishes: foodPairing || [
        "Grilled lamb",
        "BBQ ribs",
        "Aged cheddar",
        "Dark chocolate desserts",
      ],
    };
  };

  const getCheesePairingContent = () => {
    return {
      cheeses: ["Aged Gouda", "Manchego", "Aged Cheddar", "Pecorino Romano"],
    };
  };

  const getVegetarianPairingContent = () => {
    return {
      dishes: [
        "Roasted eggplant",
        "Mushroom risotto",
        "Grilled portobello",
        "Vegetarian lasagna",
      ],
    };
  };

  const getAvoidPairingContent = () => {
    return {
      items: [
        "Delicate fish",
        "Light salads",
        "Citrus-based dishes",
        "Spicy Asian cuisine",
      ],
    };
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "0 20px",
        marginBottom: "20px",
      }}
    >
      <h1
        style={{
          ...typography.h1,
          color: "white",
          marginBottom: "24px",
          textAlign: "left",
        }}
      >
        Food pairing
      </h1>

      {/* Red Meat Pairing */}
      <FoodPairingExpandableItem
        id="redMeat"
        emoji="🥩"
        title="Red Meat"
        badge={{
          text: "Perfect match",
          color: "black",
          backgroundColor: "#e0e0e0",
        }}
        content={getFoodPairingContent().dishes}
        isExpanded={expandedItem === "redMeat"}
        onToggle={onToggleExpanded}
      />

      {/* Cheese Pairings */}
      <FoodPairingExpandableItem
        id="cheese"
        emoji="🧀"
        title="Cheese Pairings"
        content={getCheesePairingContent().cheeses}
        isExpanded={expandedItem === "cheese"}
        onToggle={onToggleExpanded}
      />

      {/* Vegetarian Options */}
      <FoodPairingExpandableItem
        id="vegetarian"
        emoji="🥗"
        title="Vegetarian Options"
        content={getVegetarianPairingContent().dishes}
        isExpanded={expandedItem === "vegetarian"}
        onToggle={onToggleExpanded}
      />

      {/* Avoid */}
      <FoodPairingExpandableItem
        id="avoid"
        emoji="❌"
        title="Avoid"
        content={getAvoidPairingContent().items}
        isExpanded={expandedItem === "avoid"}
        onToggle={onToggleExpanded}
      />
    </div>
  );
};

export default FoodPairingSection;