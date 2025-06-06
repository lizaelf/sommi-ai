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
        marginBottom: "40px",
        marginTop: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
      }}
    >
      <img
        src={image && image.trim() && image.startsWith("/@assets/") ? image : placeholderImage}
        alt={wineName || "Wine"}
        style={{
          height: "280px",
          // Add a subtle drop shadow instead of blur
          filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))",
        }}
        onLoad={() => console.log(`Wine bottle image loaded: ${wineName}`)}
        onError={(e) => {
          console.error(`Wine bottle image failed to load: ${wineName}`);
          (e.target as HTMLImageElement).src = placeholderImage;
        }}
      />
    </div>
  );
};

export default WineBottleImage;