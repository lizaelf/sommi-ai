import React from 'react';
import FoodPairingCardContent from './FoodPairingCardContent';

interface FoodPairingCardProps {
  image: string;
  title: string;
  description: string;
}

const FoodPairingCard: React.FC<FoodPairingCardProps> = ({ image, title, description }) => {
  return (
    <div style={{
      width: "100px",
      height: "140px",
      backgroundColor: "#191919",
      borderRadius: "16px",
      overflow: "hidden",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Image container */}
      <div style={{
        width: "100px",
        height: "100px",
        backgroundColor: "#2a2a2a",
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "16px 16px 0 0",
        margin: "0 auto",
      }} />
      
      {/* Content container */}
      <FoodPairingCardContent title={title} description={description} />
    </div>
  );
};

export default FoodPairingCard;