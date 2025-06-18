import React, { useRef } from "react";
import WineBottleImage from "./WineBottleImage";

import WineRating from "./WineRating";
import typography from "@/styles/typography";

interface SelectedWine {
  id: number;
  name: string;
  year?: number;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  location?: string;
  description?: string;
  foodPairing?: string[];
  buyAgainLink?: string;
}

interface WineHeroSectionProps {
  wine: SelectedWine;
  imageLoaded: boolean;
  onImageLoad: () => void;
}

const WineHeroSection: React.FC<WineHeroSectionProps> = ({
  wine,
  imageLoaded,
  onImageLoad,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "linear-gradient(135deg, #0A0A0A 0%, #1A0A0A 100%)",
        overflow: "hidden",
      }}
    >
      {/* Wine Bottle Image */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1,
          opacity: imageLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <WineBottleImage
          image={wine.image}
          wineName={wine.name}
        />
        <img
          ref={imageRef}
          src={wine.image}
          alt={wine.name}
          onLoad={() => {
            console.log(`Wine bottle image loaded: ${wine.name}`);
            onImageLoad();
          }}
          style={{
            maxHeight: "70vh",
            width: "auto",
            maxWidth: "300px",
            filter: "drop-shadow(0 0 40px rgba(255, 255, 255, 0.1))",
            position: "absolute",
            opacity: 0,
          }}
        />
      </div>

      {/* Wine Information Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "120px",
          left: "0",
          right: "0",
          zIndex: 2,
          padding: "0 24px",
        }}
      >
        {/* Wine Name */}
        <h1
          style={{
            ...typography.h1,
            textAlign: "center",
            marginBottom: "16px",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
          }}
        >
          {wine.name}
        </h1>

        {/* Location */}
        {wine.location && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <img src="/us-flag.png" alt="US Flag" style={{ width: '20px', height: '15px' }} />
            <span
              style={{
                ...typography.body1R,
                color: "#CECECE",
              }}
            >
              {wine.location}
            </span>
          </div>
        )}

        {/* Wine Ratings */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <WineRating ratings={wine.ratings} variant="default" />
        </div>

        {/* Bottles Count */}
        <div
          style={{
            textAlign: "center",
          }}
        >
          <span
            style={{
              ...typography.body1R,
              color: "#999999",
            }}
          >
            {wine.bottles} bottle{wine.bottles !== 1 ? "s" : ""} available
          </span>
        </div>
      </div>
    </div>
  );
};

export default WineHeroSection;