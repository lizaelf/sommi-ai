import React from 'react';
import Button from '@/components/pages/ui/Button';
import typography from '@/styles/typography';

interface BuyAgainSectionProps {
  buyAgainLink?: string;
}

const BuyAgainSection: React.FC<BuyAgainSectionProps> = ({ buyAgainLink }) => {
  return (
    <div
      style={{
        width: "100%",
        padding: "0 20px",
        marginBottom: "20px",
      }}
    >
      <h1
        style={{
          ...typography.h1,
          color: "white",
          marginBottom: "24px",
          textAlign: "left",
        }}
      >
        Want more?
      </h1>

      <Button
        onClick={() => {
          if (buyAgainLink) {
            window.open(buyAgainLink, "_blank");
          }
        }}
        variant="secondary"
        style={{
          width: "100%",
          height: "56px",
          borderRadius: "16px",
          marginBottom: "24px",
          color: "white",
          backgroundColor: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          ...typography.body,
        }}
      >
        Buy again
      </Button>
    </div>
  );
};

export default BuyAgainSection;