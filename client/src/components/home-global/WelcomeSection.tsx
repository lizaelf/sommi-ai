import React from "react";
import wineryLogoPath from "@assets/winary-logo.png";
import typography from "@/styles/typography";

export const WelcomeSection: React.FC<{ logoUrl?: string; wineryName?: string }> = ({ logoUrl, wineryName }) => {
  return (
    <div className="px-4">
      {/* Ridge Vineyards Logo */}
      <div 
        className="text-center" 
        style={{ 
          marginBottom: "32px",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Blurred circle background */}
        <div
          style={{
            position: "absolute",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            backgroundColor: "#8E8E8E",
            filter: "blur(60px)",
            opacity: 0.7,
            zIndex: 1,
          }}
        />
        <img
          src={logoUrl || wineryLogoPath}
          alt={wineryName || "Winery Logo"}
          className="mx-auto"
          style={{
            height: "54px",
            width: "auto",
            position: "relative",
            zIndex: 2,
          }}
        />
      </div>

      {/* Welcome Text */}
      <div style={{ marginBottom: "40px" }}>
        <p
          className="leading-relaxed"
          style={{
            ...typography.body,
            color: "#CECECE",
          }}
        >
          Welcome to {wineryName || 'the winery'} where each bottle is a story of place,
          time, and the people who bring it to life.
        </p>
      </div>
    </div>
  );
};