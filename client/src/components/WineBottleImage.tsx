import React from "react";
import placeholderImage from "@assets/Placeholder.png";

import _2021_Ridge_Vineyards_Lytton_Springs_Dry_Creek_Zinfandel from "@assets/2021-Ridge-Vineyards-Lytton-Springs-Dry-Creek-Zinfandel.png";

interface WineBottleImageProps {
  image?: string;
  wineName?: string;
}

const WineBottleImage: React.FC<WineBottleImageProps> = ({
  image,
  wineName,
}) => {
  return (
    <div
      className="wine-bottle-image"
      style={{
        position: "relative",
        zIndex: 2,
        marginBottom: "40px",
        marginTop: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
      }}
    >
      {/* Blurred circle background - positioned at the top */}
      <div
        style={{
          position: "absolute",
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          backgroundColor: "#8E8E8E",
          filter: "blur(60px)",
          opacity: 0.7,
          zIndex: 1,
          top: "0px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      {/* Wine Image or Placeholder */}
      {image && image.trim() && image.startsWith("/@assets/") ? (
        <img
          src={image}
          alt={wineName || "Wine"}
          style={{
            height: "280px !important",
            zIndex: "2 !important",
          }}
          onLoad={() => console.log(`Wine bottle image loaded: ${wineName}`)}
          onError={(e) => {
            console.error(
              `Wine bottle image failed to load: ${wineName}, path: ${image}`,
            );
            // Replace with placeholder on error
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
      ) : (
        <img
          src={placeholderImage}
          alt={`${wineName || "Wine"} placeholder`}
          style={{
            height: "280px !important",
            zIndex: "2 !important",
            position: "relative !important",
            maxWidth: "none !important",
            width: "auto !important",
            objectFit: "contain !important",
          }}
          onLoad={() =>
            console.log(`Using placeholder image for wine: ${wineName}`)
          }
        />
      )}
    </div>
  );
};

export default WineBottleImage;
