import React from "react";
import { MapPin } from "lucide-react";

import WineRating from "./WineRating";
import WineTechnicalDetailsSection from "./WineTechnicalDetailsSection";
import typography from "@/styles/typography";
import { Wine } from "@/types/wine";

const WineDetailsHero: React.FC<Wine> = ( wine ) => {
  if (!wine) return null;

  return (
    <div
      style={{
        backgroundColor: "transparent",
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
            marginBottom: "24px",
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
