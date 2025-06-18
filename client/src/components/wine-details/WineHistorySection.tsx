import React from 'react';
import typography from '@/styles/typography';

interface WineHistorySectionProps {
  description?: string;
}

const WineHistorySection: React.FC<WineHistorySectionProps> = ({ description }) => {
  const getWineHistory = () => {
    return (
      description ||
      "The 2021 Lytton Springs Zinfandel expresses a nose of red and black raspberry, sage, and dark chocolate, followed by a mid-palate that is full bodied and features flavors of blackberry and ripe plum, ending with juicy acidity and a lengthy finish."
    );
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "0 20px",
        marginTop: "24px",
        marginBottom: "32px",
      }}
    >
      <h1
        style={{
          ...typography.h1,
          color: "white",
          marginBottom: "16px",
          textAlign: "left",
        }}
      >
        Tasting notes
      </h1>
      <p
        style={{
          color: "rgba(255, 255, 255, 0.8)",
          textAlign: "left",
          marginBottom: "16px",
          ...typography.body,
        }}
      >
        {getWineHistory()}
      </p>
    </div>
  );
};

export default WineHistorySection;