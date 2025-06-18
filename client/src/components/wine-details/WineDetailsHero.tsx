import React from "react";
import { MapPin } from "lucide-react";
import USFlagImage from "./USFlagImage";
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



      {/* Technical Details Section */}
      <WineTechnicalDetailsSection wine={wine} />

      {/* Wine Ratings below Technical Details Section */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "flex-start",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "white",
            fontSize: "14px",
            fontWeight: 400,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "white", fontFamily: "Inter, sans-serif" }}>
              {wine.ratings.vn}
            </span>
            <span style={{ color: "#999999", fontFamily: "Inter, sans-serif" }}>
              VN
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "white", fontFamily: "Inter, sans-serif" }}>
              {wine.ratings.jd}
            </span>
            <span style={{ color: "#999999", fontFamily: "Inter, sans-serif" }}>
              JD
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "white", fontFamily: "Inter, sans-serif" }}>
              {wine.ratings.ws}
            </span>
            <span style={{ color: "#999999", fontFamily: "Inter, sans-serif" }}>
              WS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WineDetailsHero;
