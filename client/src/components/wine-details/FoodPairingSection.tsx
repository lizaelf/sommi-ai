import React from 'react';
import typography from '@/styles/typography';

interface FoodPairingSectionProps {
  expandedItem: string | null;
  onToggleExpanded: (item: string) => void;
}

const FoodPairingSection: React.FC<FoodPairingSectionProps> = ({
  expandedItem,
  onToggleExpanded,
}) => {
  const pairingData = [
    {
      id: 'red-meat',
      title: 'Red Meat',
      icon: '🥩',
      badge: 'Perfect match',
      badgeColor: '#10b981',
      items: ['Grilled ribeye steak', 'BBQ beef brisket', 'Lamb chops', 'Venison']
    },
    {
      id: 'cheese',
      title: 'Cheese Pairings',
      icon: '🧀',
      items: ['Aged cheddar', 'Gouda', 'Manchego', 'Blue cheese']
    },
    {
      id: 'vegetarian',
      title: 'Vegetarian Options',
      icon: '🌱',
      items: ['Grilled portobello mushrooms', 'Roasted eggplant', 'Hearty lentil stew', 'Dark chocolate']
    },
    {
      id: 'avoid',
      title: 'Avoid pairing with',
      icon: '❌',
      iconColor: 'red',
      items: ['Delicate fish', 'Light salads', 'Citrus dishes', 'Very spicy foods']
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '0 20px',
      marginBottom: '32px'
    }}>
      <h1 style={{
        ...typography.h1,
        color: 'white',
        textAlign: 'left',
        marginBottom: '8px'
      }}>
        Food Pairing
      </h1>

      {pairingData.map((pairing) => (
        <div
          key={pairing.id}
          onClick={() => onToggleExpanded(pairing.id)}
          style={{
            backgroundColor: "#191919",
            borderRadius: "16px",
            padding: "0 20px",
            minHeight: "64px",

            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignSelf: "stretch",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
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
              <span style={{ 
                fontSize: "24px", 
                color: pairing.iconColor || "inherit" 
              }}>
                {pairing.icon}
              </span>
              <span style={{ color: "white", ...typography.body }}>
                {pairing.title}
              </span>
              {pairing.badge && (
                <span
                  style={{
                    backgroundColor: pairing.badgeColor,
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {pairing.badge}
                </span>
              )}
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform:
                  expandedItem === pairing.id
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <path
                d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06"
                fill="white"
              />
            </svg>
          </div>

          {expandedItem === pairing.id && (
            <div
              style={{
                paddingBottom: "20px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "16px",
                marginTop: "8px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {pairing.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <span style={{ ...typography.body1R, color: "#ccc" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FoodPairingSection;