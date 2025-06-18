import React from 'react';
import WineBottleImageDisplay from './WineBottleImageDisplay';

interface WineCardImageProps {
  image: string;
  alt: string;
  width?: string;
  height?: string;
  variant?: 'small' | 'medium' | 'large' | 'custom';
}

const WineCardImage: React.FC<WineCardImageProps> = ({ 
  image, 
  alt, 
  width = "100%", 
  height = "120px",
  variant = 'custom'
}) => {
  // Define size variations
  const getVariantStyles = () => {
    switch (variant) {
      case 'small':
        return { width: "100%", height: "120px" };
      case 'medium':
        return { width: "100%", height: "180px" };
      case 'large':
        return { width: "100%", height: "240px" };
      case 'custom':
      default:
        return { width, height };
    }
  };

  const variantStyles = getVariantStyles();
  return (
    <div
      style={{
        width: variantStyles.width,
        height: variantStyles.height,
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