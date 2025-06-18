import React from "react";
import typography from "@/styles/typography";
import Rating from "@/components/ui/Rating";

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
  align?: "center" | "left";
  hideAbv?: boolean;
}

export default function WineRating({
  ratings,
  variant = "default",
  gap = 16,
  className = "",
  style = {},
  align = "center",
  hideAbv = false,
}: WineRatingProps) {
  // Check if there are any ratings to display
  const hasRatings = ratings.vn || ratings.jd || ratings.ws || (ratings.abv && !hideAbv);
  
  // If no ratings to display, return null
  if (!hasRatings) {
    return null;
  }
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
            justifyContent: align === "left" ? "flex-start" : "center",
            width: "fit-content",
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
            justifyContent: align === "left" ? "flex-start" : "center",
            width: "fit-content",
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
            width: "fit-content",
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
    <Rating
      className={className}
      aria-label="Wine ratings"
      style={{
        ...styles.container,
        ...style,
      }}
    >
      {ratings.vn && (
        <span>
          <span>
            {variant === "compact" || variant === "minimal"
              ? `VN: ${ratings.vn}`
              : ratings.vn}
          </span>
          {variant === "default" && <span>VN</span>}
        </span>
      )}

      {ratings.jd && (
        <span>
          <span>
            {variant === "compact" || variant === "minimal"
              ? `JD: ${ratings.jd}`
              : ratings.jd}
          </span>
          {variant === "default" && <span>JD</span>}
        </span>
      )}

      {ratings.ws && (
        <span>
          <span>
            {variant === "compact" || variant === "minimal"
              ? `WS: ${ratings.ws}`
              : ratings.ws}
          </span>
          {variant === "default" && <span>WS</span>}
        </span>
      )}

      {ratings.abv && !hideAbv && (
        <span>
          <span>
            {variant === "compact" || variant === "minimal"
              ? `ABV: ${ratings.abv}%`
              : `${ratings.abv}%`}
          </span>
          {variant === "default" && <span>ABV</span>}
        </span>
      )}
    </Rating>
  );
}
