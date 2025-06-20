import React from "react";
import typography from "@/styles/typography";
import colors from "@/styles/colors";

interface WineTechnicalDetailsProps {
  varietal?: {
    primary: string;
    primaryPercentage: number;
    secondary?: string;
    secondaryPercentage?: number;
  };
  appellation?: string;
  aging?: {
    ageUpTo?: string;
  };
  abv?: number;
  className?: string;
}

const WineTechnicalDetails: React.FC<WineTechnicalDetailsProps> = ({
  varietal,
  appellation,
  aging,
  abv,
  className = ""
}) => {
  if (!varietal && !appellation && !aging && !abv) {
    return null;
  }

  const formatAgingText = () => {
    if (!aging) return null;
    
    if (aging.ageUpTo) {
      return `Drink now or age up to ${aging.ageUpTo} years`;
    }
    return null;
  };

  return (
    <div className={`wine-technical-details ${className}`}>
      <style>
        {`
          .wine-technical-details {
            background: ${colors.background.primary};
            padding: 24px;
            border-radius: 12px;
            border: 1px solid ${colors.background};
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .wine-tech-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
          }

          .wine-tech-section::after {
            content: '';
            position: absolute;
            bottom: -12px;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(
              90deg, 
              white 0%, 
              white 60%, 
              transparent 100%
            );
          }

          .wine-tech-section:last-child::after {
            display: none;
          }

          .wine-tech-title {
            color: ${colors.text.primary};
            font-family: 'Lora', serif;
            font-size: 20px;
            font-weight: 600;
            line-height: 1.2;
            margin: 0;
          }

          .wine-tech-content {
            color: ${colors.text.secondary};
            font-family: 'Inter', sans-serif;
            font-size: 16px;
            font-weight: 400;
            line-height: 1.4;
            margin: 0;
          }

          .varietal-breakdown {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .varietal-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .varietal-percentage {
            font-weight: 500;
            color: ${colors.text.primary};
            min-width: 40px;
          }

          .varietal-name {
            color: ${colors.text.secondary};
          }

          .abv-value {
            font-size: 18px;
            font-weight: 500;
            color: ${colors.text.primary};
          }

          @media (max-width: 768px) {
            .wine-technical-details {
              padding: 20px;
              gap: 20px;
            }

            .wine-tech-title {
              font-size: 18px;
            }

            .wine-tech-content {
              font-size: 15px;
            }
          }
        `}
      </style>

      {/* Varietal Section */}
      {varietal && (
        <div className="wine-tech-section">
          <h3 className="wine-tech-title">Varietal</h3>
          <div className="varietal-breakdown">
            <div className="varietal-item">
              <span className="varietal-percentage">{varietal.primaryPercentage}%</span>
              <span className="varietal-name">{varietal.primary}</span>
            </div>
            {varietal.secondary && varietal.secondaryPercentage && (
              <div className="varietal-item">
                <span className="varietal-percentage">{varietal.secondaryPercentage}%</span>
                <span className="varietal-name">{varietal.secondary}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appellation Section */}
      {appellation && (
        <div className="wine-tech-section">
          <h3 className="wine-tech-title">Appellation</h3>
          <p className="wine-tech-content">{appellation}</p>
        </div>
      )}

      {/* Aging Section */}
      {aging && formatAgingText() && (
        <div className="wine-tech-section">
          <h3 className="wine-tech-title">Aging</h3>
          <p className="wine-tech-content">{formatAgingText()}</p>
        </div>
      )}

      {/* ABV Section */}
      {abv && (
        <div className="wine-tech-section">
          <h3 className="wine-tech-title">ABV</h3>
          <div className="abv-value">{abv}%</div>
        </div>
      )}
    </div>
  );
};

export default WineTechnicalDetails;