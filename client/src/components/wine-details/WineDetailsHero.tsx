import React from "react";
import { MapPin } from "lucide-react";
import USFlagImage from "@/components/USFlagImage";
import WineRating from "@/components/WineRating";
import WineTechnicalDetailsSection from "./WineTechnicalDetailsSection";
import typography from "@/styles/typography";

interface WineDetailsHeroProps {
  wine: {
    id: number;
    name: string;
    year?: number;
    image: string;
    location?: string;
    ratings: {
      vn: number;
      jd: number;
      ws: number;
      abv: number;
    };
    technicalDetails?: {
      varietal?: {
        primary: string;
        primaryPercentage: number;
        secondary?: string;
        secondaryPercentage?: number;
      };
      appellation?: string;
      aging?: {
        drinkNow: boolean;
        ageUpTo?: string;
      };
      customAbv?: number;
    };
  } | null;
}

const WineDetailsHero: React.FC<WineDetailsHeroProps> = ({ wine }) => {
  if (!wine) return null;

  return (
    <div
      style={{
        backgroundColor: "#0a0a0a",
        color: "white",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Wine Title */}
      <div
        style={{
          marginBottom: "24px",
          textAlign: "left",
          padding: "0 16px",
        }}
      >
        <h1
          style={{
            ...typography.h1,
            marginBottom: "8px",
          }}
        >
          {wine.year} {wine.name}
        </h1>
      </div>

      {/* Wine Ratings */}
      <div
        style={{
          marginBottom: "32px",
          padding: "0 16px",
        }}
      >
        <WineRating
          ratings={wine.ratings}
          variant="default"
          style={{ justifyContent: "center" }}
        />
      </div>

      {/* Technical Details Section */}
      <WineTechnicalDetailsSection wine={wine} />
    </div>
  );
};

export default WineDetailsHero;
