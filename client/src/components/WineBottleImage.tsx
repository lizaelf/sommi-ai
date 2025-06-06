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
        width: "100%",
        height: "300px",
      }}
    >
      {/* Subtle background blur for depth */}
      <div
        style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)",
          filter: "blur(40px)",
          opacity: 0.5,
          zIndex: 1,
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <img
        src={image || ridgeWineImage}
        alt={wineName || "Ridge Lytton Springs Dry Creek Zinfandel"}
        style={{
          maxHeight: "280px",
          maxWidth: "100%",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          zIndex: 2,
          position: "relative",
          filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))",
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