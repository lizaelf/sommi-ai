import React from 'react';
import { Link } from 'wouter';
import WineRating from '@/components/WineRating';
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
          <Link key={wine.id} to={`/wine-details/${wine.id}`}>
            <div
              style={{
                minWidth: "240px",
                backgroundColor: "#191919",
                borderRadius: "16px",
                padding: "16px",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "120px",
                  backgroundColor: "#333",
                  borderRadius: "12px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {wine.image ? (
                  <img
                    src={wine.image}
                    alt={wine.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      color: "#666",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    No image
                  </div>
                )}
              </div>

              <div
                style={{
                  color: "white",
                  marginBottom: "8px",
                  lineHeight: "1.3",
                  ...typography.buttonPlus1,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  height: "3.9em",
                }}
              >
                {wine.year ? `${wine.year} ` : ""}{wine.name}
              </div>

              <WineRating
                ratings={wine.ratings}
                variant="compact"
                hideAbv={true}
                style={{ gap: "12px" }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WineRecommendationsSection;