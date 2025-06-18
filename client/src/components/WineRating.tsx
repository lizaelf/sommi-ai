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
        color: "white !important",
        fontWeight: "500 !important",
      },
      labelStyle: {
        ...typography.body1R,
        color: "#999999 !important",
        fontWeight: "400 !important",
        fontSize: "13px !important",
        fontFamily: "Inter, sans-serif !important",
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
          {variant === "compact" || variant === "minimal" ? (
            <span style={styles.valueStyle}>
              <span style={styles.labelStyle}>VN: </span>
              <span style={{ ...typography.num, color: "white !important" }}>{ratings.vn}</span>
            </span>
          ) : (
            <>
              <span style={styles.valueStyle}>{ratings.vn}</span>
              <span style={styles.labelStyle}>VN</span>
            </>
          )}
        </span>
      )}

      {ratings.jd && (
        <span style={styles.ratingItem}>
          {variant === "compact" || variant === "minimal" ? (
            <span style={styles.valueStyle}>
              <span style={styles.labelStyle}>JD: </span>
              <span style={{ ...typography.num, color: "white !important" }}>{ratings.jd}</span>
            </span>
          ) : (
            <>
              <span style={styles.valueStyle}>{ratings.jd}</span>
              <span style={styles.labelStyle}>JD</span>
            </>
          )}
        </span>
      )}

      {ratings.ws && (
        <span style={styles.ratingItem}>
          {variant === "compact" || variant === "minimal" ? (
            <span style={styles.valueStyle}>
              <span style={styles.labelStyle}>WS: </span>
              <span style={{ ...typography.num, color: "white !important" }}>{ratings.ws}</span>
            </span>
          ) : (
            <>
              <span style={styles.valueStyle}>{ratings.ws}</span>
              <span style={styles.labelStyle}>WS</span>
            </>
          )}
        </span>
      )}

      {ratings.abv && !hideAbv && (
        <span style={styles.ratingItem}>
          {variant === "compact" || variant === "minimal" ? (
            <span style={styles.valueStyle}>
              <span style={styles.labelStyle}>ABV: </span>
              <span style={{ ...typography.num, color: "white !important" }}>{ratings.abv}%</span>
            </span>
          ) : (
            <>
              <span style={styles.valueStyle}>{ratings.abv}%</span>
              <span style={styles.labelStyle}>ABV</span>
            </>
          )}
        </span>
      )}
    </Rating>
  );
}