import React from 'react';
import { Link } from 'wouter';
import WineRating from '@/components/WineRating';
import WineCardImage from './WineCardImage';
import typography from '@/styles/typography';

interface Wine {
  id: number;
  name: string;
  year?: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
}

interface WineRecommendationCardProps {
  wine: Wine;
}

const WineRecommendationCard: React.FC<WineRecommendationCardProps> = ({ wine }) => {
  return (
    <Link to={`/wine-details/${wine.id}`}>
      <div
        style={{
          minWidth: "208px",
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
        <WineCardImage 
          image={wine.image}
          alt={wine.name}
          variant="medium"
        />

        <div
          style={{
            color: "white",
            marginBottom: "8px",
            textAlign: "center",
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
  );
};

export default WineRecommendationCard;