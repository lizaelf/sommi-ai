import React from 'react';
import typography from '@/styles/typography';

interface WineHistorySectionProps {
  description?: string;
}

const WineHistorySection: React.FC<WineHistorySectionProps> = ({ description }) => {
  const getWineHistory = () => {
    return (
      description ||
      "Lytton Springs is a renowned single-vineyard red wine produced by Ridge Vineyards, located in the Dry Creek Valley of Sonoma County, California. Celebrated for its rich heritage and distinctive field-blend style, Lytton Springs has become a benchmark for Zinfandel-based wines in the United States."
    );
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "0 20px",
        marginBottom: "32px",
      }}
    >
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