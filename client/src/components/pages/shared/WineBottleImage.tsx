import React from "react";
import WineBottleImageDisplay from "../wine-details/WineBottleImageDisplay";

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
      <WineBottleImageDisplay 
        image={image}
        wineName={wineName}
        height="280px"
        zIndex={2}
      />
    </div>
  );
};

export default WineBottleImage;