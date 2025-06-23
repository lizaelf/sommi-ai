import React from "react";
import WineRating from "../../../components/wine-details/WineRating";
import { WineData } from "../../../../../shared/wine";

interface WineCardProps extends WineData {
  onClick?: (id: number) => void;
  className?: string;
  showImage?: boolean;
  showBottles?: boolean;
  showRatings?: boolean;
  compact?: boolean;
}

export function WineCard({
  id,
  name,
  year,
  image,
  bottles,
  ratings,
  onClick,
  className = "",
  showImage = true,
  showBottles = true,
  showRatings = true,
  compact = false,
}: WineCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const cardStyles = {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: compact ? "12px" : "16px",
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
      e.currentTarget.style.transform = "translateY(0)";
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={cardStyles}
    >
      {showImage && (
        <div
          style={{
            width: "100%",
            height: compact ? "80px" : "120px",
            background: image ? "transparent" : "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "8px",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.background = "rgba(255, 255, 255, 0.1)";
                  const placeholder = document.createElement("div");
                  placeholder.style.color = "rgba(255, 255, 255, 0.6)";
                  placeholder.style.fontSize = "12px";
                  placeholder.textContent = "Wine Image";
                  e.currentTarget.parentElement.appendChild(placeholder);
                }
              }}
            />
          ) : (
            <div
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              Wine Image
            </div>
          )}
        </div>
      )}

      <div
        style={{
          color: "white",
          fontFamily: "Inter, sans-serif",
          fontSize: compact ? "12px" : "14px",
          fontWeight: "500",
          marginBottom: "4px",
          lineHeight: "18px",
        }}
      >
        {year ? `${year} ${name}` : name}
      </div>

      {showBottles && bottles !== undefined && (
        <div
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontFamily: "Inter, sans-serif",
            fontSize: compact ? "10px" : "12px",
            marginBottom: showRatings && ratings ? "8px" : "0",
          }}
        >
          {bottles} bottle{bottles !== 1 ? "s" : ""}
        </div>
      )}

      {showRatings && ratings && (
        <WineRating 
          ratings={ratings}
          variant={compact ? "compact" : "minimal"}
          gap={8}
        />
      )}
    </div>
  );
}