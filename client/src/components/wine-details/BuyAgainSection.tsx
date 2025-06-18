import React from 'react';
import Button from '@/components/ui/Button';
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
        variant="brand"
        size="lg"
        className="w-full mb-6 h-14 rounded-2xl"
      >
        Buy again
      </Button>
    </div>
  );
};

export default BuyAgainSection;