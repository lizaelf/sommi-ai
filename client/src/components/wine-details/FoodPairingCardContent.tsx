import React from 'react';
import typography from '@/styles/typography';

interface FoodPairingCardContentProps {
  title: string;
  description: string;
}

const FoodPairingCardContent: React.FC<FoodPairingCardContentProps> = ({ title, description }) => {
  return (
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
  );
};

export default FoodPairingCardContent;