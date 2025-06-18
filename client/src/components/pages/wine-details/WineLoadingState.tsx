import React from "react";
import ShiningText from "@/components/pages/ui/ShiningText";
import typography from "@/styles/typography";

export const WineLoadingState: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        padding: "20px",
      }}
    >
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <ShiningText text="Loading wine details..." />
      </div>
      <p
        style={{
          ...typography.body1R,
          color: "#666666",
          textAlign: "center",
        }}
      >
        Please wait while we prepare your wine experience
      </p>
    </div>
  );
};