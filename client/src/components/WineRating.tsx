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
  const hasRatings =
    ratings.vn || ratings.jd || ratings.ws || (ratings.abv && !hideAbv);

  // If no ratings to display, return null
  if (!hasRatings) {
    return null;
  }

  // Define styles based on variant
  const getVariantStyles = () => {
    const baseStyles = {
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
        color: "rgba(255, 255, 255, 0.6)",
      },
      labelStyle: {
        ...typography.body1R,
        color: "white",
      },
    };

    return baseStyles;
  };

  const styles = getVariantStyles();

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
        <span style={styles.ratingItem}>
          <span style={styles.valueStyle}>
            {variant === "compact" || variant === "minimal"
              ? `VN: ${ratings.vn}`
              : ratings.vn}
          </span>
          {variant === "default" && <span style={styles.labelStyle}>VN</span>}
        </span>
      )}

      {ratings.jd && (
        <span style={styles.ratingItem}>
          <span style={styles.valueStyle}>
            {variant === "compact" || variant === "minimal"
              ? `JD: ${ratings.jd}`
              : ratings.jd}
          </span>
          {variant === "default" && <span style={styles.labelStyle}>JD</span>}
        </span>
      )}

      {ratings.ws && (
        <span style={styles.ratingItem}>
          <span style={styles.valueStyle}>
            {variant === "compact" || variant === "minimal"
              ? `WS: ${ratings.ws}`
              : ratings.ws}
          </span>
          {variant === "default" && <span style={styles.labelStyle}>WS</span>}
        </span>
      )}

      {ratings.abv && !hideAbv && (
        <span style={styles.ratingItem}>
          <span style={styles.valueStyle}>
            {variant === "compact" || variant === "minimal"
              ? `ABV: ${ratings.abv}%`
              : `${ratings.abv}%`}
          </span>
          {variant === "default" && <span style={styles.labelStyle}>ABV</span>}
        </span>
      )}
    </Rating>
  );
}