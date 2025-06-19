import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  color = "white", 
  className = "" 
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const spinnerSize = sizeMap[size];

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        width: spinnerSize,
        height: spinnerSize,
        border: `2px solid rgba(255, 255, 255, 0.2)`,
        borderTop: `2px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
  );
}

// Add CSS animation if not already present
if (typeof document !== "undefined" && !document.querySelector("#spinner-styles")) {
  const style = document.createElement("style");
  style.id = "spinner-styles";
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}