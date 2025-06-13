import React from "react";
import wineryLogoPath from "@assets/winary-logo.png";
import typography from "@/styles/typography";

export const WelcomeSection: React.FC = () => {
  return (
    <div className="px-4">
      {/* Ridge Vineyards Logo */}
      <div className="text-center" style={{ marginBottom: "32px" }}>
        <img
          src={wineryLogoPath}
          alt="Ridge Vineyards"
          className="mx-auto"
          style={{
            height: "54px",
            width: "auto",
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
          Welcome to Ridge Vineyards where each bottle is a story of place,
          time, and the people who bring it to life.
        </p>
      </div>
    </div>
  );
};