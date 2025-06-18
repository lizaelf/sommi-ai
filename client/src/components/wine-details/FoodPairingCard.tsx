import React from 'react';
import FoodPairingCardContent from './FoodPairingCardContent';

interface FoodPairingCardProps {
  image: string;
  title: string;
  description: string;
}

const FoodPairingCard: React.FC<FoodPairingCardProps> = ({ image, title, description }) => {
  console.log('FoodPairingCard image path:', image);
  
  return (
    <div style={{
      width: "160px",
      height: "200px",
      backgroundColor: "#191919",
      borderRadius: "16px",
      overflow: "hidden",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Image container */}
      <div style={{
        width: "100%",
        height: "120px",
        backgroundColor: "#2a2a2a",
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "16px 16px 0 0",
      }} />
      
      {/* Debug: Show image path */}
      <div style={{ fontSize: "10px", color: "#666", padding: "2px" }}>
        {image}
      </div>
      
      {/* Content container */}
      <FoodPairingCardContent title={title} description={description} />
    </div>
  );
};

export default FoodPairingCard;