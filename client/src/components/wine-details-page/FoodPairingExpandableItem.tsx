import React from 'react';
import { ChevronDown } from 'lucide-react';
import typography from '@/styles/typography';

interface FoodPairingExpandableItemProps {
  id: string;
  emoji: string;
  title: string;
  badge?: {
    text: string;
    color: string;
    backgroundColor: string;
  };
  content: string[];
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

const FoodPairingExpandableItem: React.FC<FoodPairingExpandableItemProps> = ({
  id,
  emoji,
  title,
  badge,
  content,
  isExpanded,
  onToggle,
}) => {
  return (
    <div
      onClick={() => onToggle(id)}
      style={{
        backgroundColor: "#191919",
        borderRadius: "16px",
        padding: "0 20px",
        minHeight: "64px",
        marginBottom: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignSelf: "stretch",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header row - always visible */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "64px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>{emoji}</span>
          <span
            style={{
              color: "white",
              ...typography.body,
            }}
          >
            {title}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {badge && (
            <span
              style={{
                color: badge.color,
                backgroundColor: badge.backgroundColor,
                padding: "6px 14px",
                borderRadius: "999px",
                ...typography.buttonPlus1,
              }}
            >
              {badge.text}
            </span>
          )}
          {/* Rotating chevron icon for expanded state */}
          <ChevronDown
            size={16}
            color="white"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            paddingBottom: "20px",
          }}
        >
          {content.map((item, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#333333",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "white",
                ...typography.body,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodPairingExpandableItem;