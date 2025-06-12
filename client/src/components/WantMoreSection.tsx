import React from 'react';
import Button from './ui/Button';

interface WantMoreSectionProps {
  wine?: {
    id: number;
    name: string;
    buyAgainLink?: string;
  } | null;
}

const WantMoreSection: React.FC<WantMoreSectionProps> = ({ wine }) => {
  return (
    <div style={{ 
      width: "100%",
      padding: "0 20px",
      marginBottom: "32px"
    }}>
      <h1 style={{
        fontFamily: "Lora, serif",
        fontSize: "32px",
        fontWeight: 700,
        color: "white",
        marginBottom: "24px",
        textAlign: "left"
      }}>
        Want more?
      </h1>

      <Button
        onClick={() => {
          const buyLink = wine?.buyAgainLink || "https://www.ridgewine.com/wines/2021-lytton-springs/";
          console.log('Buy again clicked:', buyLink);
          window.open(buyLink, '_blank');
        }}
        variant="secondary"
        style={{
          margin: "0 0 32px 0",
          width: "100%",
          height: "56px"
        }}
      >
        Buy again
      </Button>
    </div>
  );
};

export default WantMoreSection;