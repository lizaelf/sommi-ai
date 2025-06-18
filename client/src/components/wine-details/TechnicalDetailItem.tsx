import React from 'react';
import typography from '@/styles/typography';

interface TechnicalDetailItemProps {
  label: string;
  value: string | React.ReactNode;
  isLast?: boolean;
}

const TechnicalDetailItem: React.FC<TechnicalDetailItemProps> = ({ label, value, isLast = false }) => {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: isLast ? "0px" : "12px",
    }}>
      <div style={{ flex: 1 }}>
        <span style={{
          ...typography.body1R,
          color: "rgba(255, 255, 255, 0.6)",
          display: "block",
          marginBottom: "4px",
        }}>
          {label}
        </span>
        <span style={{
          ...typography.body1M,
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: label === "Alcohol by Volume" ? "18px" : undefined,
          fontWeight: label === "Alcohol by Volume" ? "500" : undefined,
        }}>
          {value}
        </span>
      </div>
      <div
        style={{
          width: "100px",
          height: "2px",
          background: "linear-gradient(90deg, rgba(117, 117, 117, 0.20) 0%, rgba(219, 219, 219, 0.50) 100%)",
        }}
      />
    </div>
  );
};

export default TechnicalDetailItem;