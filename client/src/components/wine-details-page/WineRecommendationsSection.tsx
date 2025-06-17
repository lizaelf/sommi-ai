import React from 'react';
import WineRecommendationCard from './WineRecommendationCard';
import { DataSyncManager } from '@/utils/dataSync';
import typography from '@/styles/typography';

interface WineRecommendationsSectionProps {
  currentWineId: number;
}

const WineRecommendationsSection: React.FC<WineRecommendationsSectionProps> = ({ currentWineId }) => {
  const getRecommendedWines = () => {
    const allWines = DataSyncManager.getUnifiedWineData();
    return allWines
      .filter(wine => wine.id !== currentWineId)
      .slice(0, 3);
  };

  const recommendedWines = getRecommendedWines();

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
          WebkitScrollbar: { display: "none" },
        }}
      >
        {recommendedWines.map((wine, index) => (
          <WineRecommendationCard key={wine.id} wine={wine} />
        ))}
      </div>
    </div>
  );
};

export default WineRecommendationsSection;