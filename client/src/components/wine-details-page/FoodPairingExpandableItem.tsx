import React from 'react';
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <path
              d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Expanded content - only visible when expanded */}
      {isExpanded && (
        <div
          style={{
            padding: "0 0 20px 0",
            color: "white",
            ...typography.body,
          }}
        >
          <div style={{ paddingLeft: "20px", margin: "10px 0" }}>
            {content.map((item: string, index: number) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ ...typography.body }}>{emoji}</span>
                <span style={{ ...typography.body }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodPairingExpandableItem;