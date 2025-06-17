import React from 'react';

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
      {image ? (
        <img
          src={image}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "12px",
          }}
        />
      ) : (
        <div
          style={{
            color: "#666",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          No image
        </div>
      )}
    </div>
  );
};

export default WineCardImage;