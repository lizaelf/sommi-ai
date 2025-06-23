import React from "react";
import typography from "../../styles/typography";
import Rating from "../ui/data-display/Rating";
import type { WineData } from "../../../../shared/wine";

interface WineRatingProps {
  ratings: WineData["ratings"];
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
    ratings?.vn || ratings?.jd || ratings?.ws || (ratings?.abv && !hideAbv);

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
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: "8px",
        width: "fit-content",
        ...style,
      }}
    >
      {/* First line: VN, JD, WS ratings */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "12px",
      }}>
        {ratings.vn && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ ...typography.num, color: "white" }}>{ratings.vn}</span>
            <span style={{ ...typography.body1R, color: "#999999" }}>VN</span>
          </span>
        )}

        {ratings.jd && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ ...typography.num, color: "white" }}>{ratings.jd}</span>
            <span style={{ ...typography.body1R, color: "#999999" }}>JD</span>
          </span>
        )}

        {ratings.ws && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ ...typography.num, color: "white" }}>{ratings.ws}</span>
            <span style={{ ...typography.body1R, color: "#999999" }}>WS</span>
          </span>
        )}
      </div>

      {/* Second line: ABV */}
      {ratings.abv && !hideAbv && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ ...typography.num, color: "white" }}>{ratings.abv}%</span>
            <span style={{ ...typography.body1R, color: "#999999" }}>ABV</span>
          </span>
        </div>
      )}
    </Rating>
  );
}