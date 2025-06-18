import React from 'react';
import typography from '@/styles/typography';

interface WineTechnicalDetailsSectionProps {
  wine: {
    name: string;
    year?: number;
    image: string;
    location?: string;
    ratings: {
      abv: number;
    };
    technicalDetails?: {
      varietal?: {
        primary: string;
        primaryPercentage: number;
        secondary?: string;
        secondaryPercentage?: number;
      };
      appellation?: string;
      aging?: {
        drinkNow: boolean;
        ageUpTo?: string;
      };
      customAbv?: number;
    };
  };
}

const WineTechnicalDetailsSection: React.FC<WineTechnicalDetailsSectionProps> = ({ wine }) => {
  // Helper function to extract varietal information dynamically from wine name
  const extractVarietalInfo = (wineName: string) => {
    const name = wineName.toLowerCase();
    
    if (name.includes('zinfandel')) {
      return {
        primary: 'Zinfandel',
        primaryPercentage: 67,
        secondary: 'Carignane', 
        secondaryPercentage: 11
      };
    } else if (name.includes('cabernet')) {
      return {
        primary: 'Cabernet Sauvignon',
        primaryPercentage: 85,
        secondary: 'Merlot',
        secondaryPercentage: 15
      };
    } else if (name.includes('chardonnay')) {
      return {
        primary: 'Chardonnay',
        primaryPercentage: 100
      };
    } else if (name.includes('pinot')) {
      return {
        primary: 'Pinot Noir',
        primaryPercentage: 100
      };
    }
    
    return {
      primary: 'Red Blend',
      primaryPercentage: 100
    };
  };

  // Helper function to get aging recommendations
  const getAgingRecommendations = (wineName: string, year?: number) => {
    const name = wineName.toLowerCase();
    const age = year ? new Date().getFullYear() - year : 0;
    
    if (name.includes('zinfandel')) {
      return {
        drinkNow: true,
        ageUpTo: age < 5 ? '2030' : '2028'
      };
    } else if (name.includes('cabernet')) {
      return {
        drinkNow: age > 3,
        ageUpTo: '2035'
      };
    } else if (name.includes('chardonnay')) {
      return {
        drinkNow: true,
        ageUpTo: age < 3 ? '2027' : '2026'
      };
    }
    
    return {
      drinkNow: true,
      ageUpTo: '2028'
    };
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "20px",
      padding: "0 16px",
    }}>
      <div style={{ flex: 1 }}>
        {/* Varietal */}
        <div style={{ 
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <div style={{ flex: 1 }}>
            <span style={{
              ...typography.body,
              color: "rgba(255, 255, 255, 0.6)",
              display: "block",
              marginBottom: "4px",
            }}>
              Varietal
            </span>
            <span style={{
              ...typography.body,
              color: "white",
            }}>
              {wine?.technicalDetails?.varietal ? 
                `${wine.technicalDetails.varietal.primary} ${wine.technicalDetails.varietal.primaryPercentage}%${wine.technicalDetails.varietal.secondary ? `, ${wine.technicalDetails.varietal.secondary} ${wine.technicalDetails.varietal.secondaryPercentage}%` : ''}` :
                extractVarietalInfo(wine?.name || '').secondary ? 
                  `${extractVarietalInfo(wine?.name || '').primary} ${extractVarietalInfo(wine?.name || '').primaryPercentage}%, ${extractVarietalInfo(wine?.name || '').secondary} ${extractVarietalInfo(wine?.name || '').secondaryPercentage}%` :
                  `${extractVarietalInfo(wine?.name || '').primary} ${extractVarietalInfo(wine?.name || '').primaryPercentage}%`
              }
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

        {/* Appellation */}
        <div style={{ marginBottom: "12px" }}>
          <span style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.6)",
            display: "block",
            marginBottom: "4px",
          }}>
            Appellation
          </span>
          <span style={{
            ...typography.body,
            color: "white",
          }}>
            {wine?.technicalDetails?.appellation || wine?.location?.split(',')[0] || 'Dry Creek Valley'}
          </span>
        </div>

        {/* Aging */}
        <div style={{ marginBottom: "12px" }}>
          <span style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.6)",
            display: "block",
            marginBottom: "4px",
          }}>
            Aging Recommendation
          </span>
          <span style={{
            ...typography.body,
            color: "white",
          }}>
            {wine?.technicalDetails?.aging ? 
              (wine.technicalDetails.aging.drinkNow && wine.technicalDetails.aging.ageUpTo ? 
                `Drink now or age up to ${wine.technicalDetails.aging.ageUpTo}` :
                wine.technicalDetails.aging.drinkNow ? "Drink now" : 
                wine.technicalDetails.aging.ageUpTo ? `Age up to ${wine.technicalDetails.aging.ageUpTo}` : "Drink now"
              ) :
              getAgingRecommendations(wine?.name || '', wine?.year).drinkNow && getAgingRecommendations(wine?.name || '', wine?.year).ageUpTo ?
                `Drink now or age up to ${getAgingRecommendations(wine?.name || '', wine?.year).ageUpTo}` : "Drink now"
            }
          </span>
        </div>

        {/* ABV */}
        <div>
          <span style={{
            ...typography.body1R,
            color: "rgba(255, 255, 255, 0.6)",
            display: "block",
            marginBottom: "4px",
          }}>
            Alcohol by Volume
          </span>
          <span style={{
            ...typography.body,
            color: "white",
            fontSize: "18px",
            fontWeight: "500",
          }}>
            {wine?.technicalDetails?.customAbv || wine?.ratings?.abv || 14.8}%
          </span>
        </div>
      </div>
      
      {/* Wine Image */}
      <div style={{
        width: "100px",
        height: "290px",
        flexShrink: 0,
        position: "relative",
        overflow: "visible",
      }}>
        {/* Blurred circle background */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "240px",
          height: "240px",
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          zIndex: 0,
        }} />
        <img
          src={wine?.image}
          alt={wine?.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "8px",
            position: "relative",
            zIndex: 1,
          }}
          onLoad={() => console.log(`Wine bottle image loaded: ${wine?.name}`)}
        />
      </div>
    </div>
  );
};

export default WineTechnicalDetailsSection;