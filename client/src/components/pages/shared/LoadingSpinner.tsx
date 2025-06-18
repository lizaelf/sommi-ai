import React from "react";
import { ShiningText } from "@/components/ShiningText";
import typography from "@/styles/typography";

interface LoadingSpinnerProps {
  text?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Loading...",
  description,
  size = "md",
}) => {
  const getContainerStyle = () => {
    switch (size) {
      case "sm":
        return { padding: "20px" };
      case "lg":
        return { 
          minHeight: "100vh", 
          padding: "40px",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
        };
      default:
        return { 
          padding: "30px",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
        };
    }
  };

  return (
    <div style={getContainerStyle()}>
      <div style={{ marginBottom: description ? "16px" : "0" }}>
        <ShiningText text={text} />
      </div>
      {description && (
        <p
          style={{
            ...typography.body1R,
            color: "#666666",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
};