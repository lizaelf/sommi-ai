import React from "react";
import placeholderImage from "@assets/Placeholder.png";
import ridgeWineImage from "@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1748949884152.png";

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
        src={image || ridgeWineImage}
        alt={wineName || "Ridge Lytton Springs Dry Creek Zinfandel"}
        style={{
          height: "280px",
          filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))",
        }}
        onLoad={() => console.log(`Wine bottle image loaded: ${wineName}`)}
        onError={(e) => {
          console.error(`Wine bottle image failed to load: ${wineName}`);
          (e.target as HTMLImageElement).src = ridgeWineImage;
        }}
      />
    </div>
  );
};

export default WineBottleImage;