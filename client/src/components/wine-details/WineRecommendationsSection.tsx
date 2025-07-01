import React, { useState, useEffect } from 'react';
import WineRecommendationCard from './WineRecommendationCard';
import typography from '@/styles/typography';
import { Wine } from '@/types/wine';

interface WineRecommendationsSectionProps {
  currentWineId: number;
}

const WineRecommendationsSection: React.FC<WineRecommendationsSectionProps> = ({ currentWineId }) => {
  const [recommendedWines, setRecommendedWines] = useState<Wine[]>([]);

  useEffect(() => {
    const loadRecommendedWines = async () => {
      try {
        const response = await fetch('/api/wines');
        if (response.ok) {
          const allWines = await response.json();
          const filtered = allWines
            .filter((wine: Wine) => wine.id !== currentWineId)
            .slice(0, 3);
          setRecommendedWines(filtered);
        }
      } catch (error) {
        console.error('Error loading recommended wines:', error);
      }
    };

    loadRecommendedWines();
  }, [currentWineId]);

  return (
    <div
      style={{
        width: "100%",
        padding: "0 20px",
        marginBottom: "40px",
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
        We recommend
      </h1>

      <div
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        {recommendedWines.map((wine, index) => (
          <WineRecommendationCard key={wine.id} {...wine} />
        ))}
      </div>
    </div>
  );
};

export default WineRecommendationsSection;