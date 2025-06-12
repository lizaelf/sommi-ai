import React, { useMemo } from "react";
import ridgeEstateChardonnayImage from "@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1749209989253.png";
import monteBelloImage from "@assets/wine-2-monte-bello-cabernet-sauvignon-1749210160812.png";

interface Wine {
  id: number;
  name: string;
  year: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
  };
}

interface WineRecommendationsProps {
  currentWineId?: number;
}

const WineRecommendations: React.FC<WineRecommendationsProps> = ({ currentWineId }) => {
  // Ridge winery wine collection
  const ridgeWines: Wine[] = [
    {
      id: 1,
      name: "Estate Chardonnay",
      year: 2022,
      image: ridgeEstateChardonnayImage,
      ratings: { vn: 95, jd: 93, ws: 93 }
    },
    {
      id: 2,
      name: "Monte Bello Cabernet Sauvignon",
      year: 2021,
      image: monteBelloImage,
      ratings: { vn: 95, jd: 93, ws: 93 }
    },
    {
      id: 3,
      name: "Lytton Springs Zinfandel",
      year: 2021,
      image: ridgeEstateChardonnayImage,
      ratings: { vn: 94, jd: 92, ws: 91 }
    },
    {
      id: 4,
      name: "Three Valleys Red Blend",
      year: 2020,
      image: monteBelloImage,
      ratings: { vn: 92, jd: 90, ws: 89 }
    },
    {
      id: 5,
      name: "Geyserville Zinfandel",
      year: 2022,
      image: ridgeEstateChardonnayImage,
      ratings: { vn: 93, jd: 91, ws: 90 }
    },
    {
      id: 6,
      name: "Santa Cruz Mountains Cabernet",
      year: 2021,
      image: monteBelloImage,
      ratings: { vn: 91, jd: 89, ws: 88 }
    }
  ];

  // Randomize and filter recommendations (exclude current wine)
  const recommendations = useMemo(() => {
    const filtered = ridgeWines.filter(wine => wine.id !== currentWineId);
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2); // Show 2 recommendations
  }, [currentWineId]);

  const RatingBadge = ({ rating, label }: { rating: number; label: string }) => (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: "8px",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          fontWeight: 700,
          color: "white"
        }}
      >
        {rating}
      </span>
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          fontWeight: 500,
          color: "#CECECE"
        }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div
      style={{
        marginTop: "40px",
        padding: "0 20px"
      }}
    >
      <h2
        style={{
          fontFamily: "Lora, serif",
          fontSize: "32px",
          fontWeight: 700,
          color: "white",
          marginBottom: "24px",
          textAlign: "left"
        }}
      >
        We recommend
      </h2>

      <div
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          paddingBottom: "16px"
        }}
      >
        {recommendations.map((wine) => (
          <div
            key={wine.id}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "16px",
              padding: "24px",
              minWidth: "280px",
              flex: "0 0 auto",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            {/* Wine Image */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "20px"
              }}
            >
              <img
                src={wine.image}
                alt={wine.name}
                style={{
                  height: "180px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3))"
                }}
              />
            </div>

            {/* Wine Name */}
            <h3
              style={{
                fontFamily: "Lora, serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "white",
                marginBottom: "4px",
                textAlign: "center",
                lineHeight: "24px"
              }}
            >
              {wine.year} {wine.name}
            </h3>

            {/* Ratings */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginTop: "16px",
                flexWrap: "wrap"
              }}
            >
              <RatingBadge rating={wine.ratings.vn} label="VN" />
              <RatingBadge rating={wine.ratings.jd} label="JD" />
              <RatingBadge rating={wine.ratings.ws} label="WS" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WineRecommendations;