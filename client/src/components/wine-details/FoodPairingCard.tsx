import React from 'react';
import typography from '@/styles/typography';

interface FoodPairingCardProps {
  image: string;
  title: string;
  description: string;
}

const FoodPairingCard: React.FC<FoodPairingCardProps> = ({ image, title, description }) => {
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
      
      {/* Content container */}
      <div style={{
        padding: "12px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
        <h3 style={{
          ...typography.body1M,
          color: "white",
          margin: 0,
          marginBottom: "4px",
        }}>
          {title}
        </h3>
        <p style={{
          ...typography.body1R,
          color: "rgba(255, 255, 255, 0.6)",
          margin: 0,
          fontSize: "12px",
          lineHeight: "16px",
        }}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default FoodPairingCard;