import React from 'react';
import WineBottleImageDisplay from './WineBottleImageDisplay';

interface WineCardImageProps {
  image: string;
  alt: string;
  width?: string;
  height?: string;
}

const WineCardImage: React.FC<WineCardImageProps> = ({ 
  image, 
  alt, 
  width = "100%", 
  height = "120px" 
}) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#333",
        borderRadius: "12px",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <WineBottleImageDisplay 
        image={image}
        wineName={alt}
        height="100%"
        zIndex={1}
      />
    </div>
  );
};

export default WineCardImage;