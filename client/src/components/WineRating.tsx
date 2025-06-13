import React from "react";
import typography from "@/styles/typography";

interface WineRatingProps {
  ratings: {
    vn?: number;
    jd?: number;
    ws?: number;
    abv?: number;
  };
  variant?: "default" | "compact" | "minimal";
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
  align?: "left" | "center";
}

export default function WineRating({
  ratings,
  variant = "default",
  gap = 20,
  className = "",
  style = {},
  align = "center",
}: WineRatingProps) {
  // Define styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return {
          container: {
            display: "flex",
            alignItems: "center",
            gap: `${gap / 2}px`,
            flexWrap: "wrap" as const,
          },
          ratingItem: {
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          },
          valueStyle: {
            ...typography.body1R,
            color: "white",
            fontSize: "11px",
          },
          labelStyle: {
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "10px",
          },
        };
      case "minimal":
        return {
          container: {
            display: "flex",
            alignItems: "center",
            gap: `${gap / 4}px`,
            flexWrap: "wrap" as const,
          },
          ratingItem: {
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          },
          valueStyle: {
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "11px",
          },
          labelStyle: {
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "11px",
          },
        };
      default:
        return {
          container: {
            display: "flex",
            alignItems: "center",
            gap: `${gap}px`,
            flexWrap: "wrap" as const,
            justifyContent: align === "left" ? "flex-start" : "center",
          },
          ratingItem: {
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          },
          valueStyle: {
            ...typography.num,
            color: "white",
          },
          labelStyle: {
            ...typography.body1R,
            color: "#999999",
          },
        };
    }
  };

  const styles = getVariantStyles();

  // Format ABV value
  const formatABV = (value: number) => {
    return variant === "compact" || variant === "minimal" 
      ? `${value}% ABV` 
      : `${value}%`;
  };

  // Format rating value and label
  const formatRating = (value: number, label: string) => {
    if (variant === "compact" || variant === "minimal") {
      return { value: `${label}: ${value}`, label: "" };
    }
    return { value: value.toString(), label };
  };

  return (
    <div
      className={className}
      style={{
        ...styles.container,
        ...style,
      }}
    >
      {ratings.vn && (
        <span style={styles.ratingItem}>
          <span style={styles.valueStyle}>
            {variant === "compact" || variant === "minimal" 
              ? `VN: ${ratings.vn}` 
              : ratings.vn}
          </span>
          {(variant === "default") && (
            <span style={styles.labelStyle}>VN</span>
          )}
        </span>
      )}
      
      {ratings.jd && (
        <span style={styles.ratingItem}>
          <span style={styles.valueStyle}>
            {variant === "compact" || variant === "minimal" 
              ? `JD: ${ratings.jd}` 
              : ratings.jd}
          </span>
          {(variant === "default") && (
            <span style={styles.labelStyle}>JD</span>
          )}
        </span>
      )}
      
      {ratings.ws && (
        <span style={styles.ratingItem}>
          <span style={styles.valueStyle}>
            {variant === "compact" || variant === "minimal" 
              ? `WS: ${ratings.ws}` 
              : ratings.ws}
          </span>
          {(variant === "default") && (
            <span style={styles.labelStyle}>WS</span>
          )}
        </span>
      )}
      
      {ratings.abv && (
        <span style={styles.ratingItem}>
          <span style={styles.valueStyle}>
            {formatABV(ratings.abv)}
          </span>
          {(variant === "default") && (
            <span style={styles.labelStyle}>ABV</span>
          )}
        </span>
      )}
    </div>
  );
}