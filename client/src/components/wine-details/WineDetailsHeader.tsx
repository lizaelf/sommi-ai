import React from 'react';
import WineBottleImage from '@/components/WineBottleImage';
import USFlagImage from '@/components/USFlagImage';
import WineRating from '@/components/WineRating';
import WineTechnicalDetails from '@/components/WineTechnicalDetails';
import typography from '@/styles/typography';

interface WineDetailsHeaderProps {
  wine: {
    id: number;
    name: string;
    year?: number;
    image: string;
    location?: string;
    ratings: {
      vn: number;
      jd: number;
      ws: number;
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
  } | null;
}

const WineDetailsHeader: React.FC<WineDetailsHeaderProps> = ({ wine }) => {
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
    const currentYear = new Date().getFullYear();
    const wineAge = year ? currentYear - year : 0;
    
    if (name.includes('zinfandel')) {
      return {
        drinkNow: true,
        ageUpTo: wineAge < 5 ? '2030' : undefined
      };
    } else if (name.includes('cabernet')) {
      return {
        drinkNow: wineAge > 3,
        ageUpTo: '2035'
      };
    }
    
    return {
      drinkNow: true,
      ageUpTo: undefined
    };
  };

  return (
    <div
      className="w-full flex flex-col items-center justify-center py-8 relative pt-[0px] pb-[0px]"
      style={{
        minHeight: "100vh",
      }}
    >
      {/* Wine bottle image with blurred circle/glow effect */}
      <WineBottleImage image={wine?.image} wineName={wine?.name} />

      {/* Wine name with typography styling */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          color: "white",
          wordWrap: "break-word",
          position: "relative",
          zIndex: 2,
          padding: "0 20px",
          marginBottom: "20px",
          ...typography.h1,
        }}
      >
        {wine
          ? `${wine.year ? wine.year + " " : "2021 "}${wine.name}`
          : `2021 Wine Name`}
      </div>

      {/* Wine region with typography styling and flag */}
      <div
        style={{
          textAlign: "left",
          justifyContent: "flex-start",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          color: "rgba(255, 255, 255, 0.60)",
          wordWrap: "break-word",
          position: "relative",
          zIndex: 2,
          padding: "0 20px",
          gap: "6px",
          marginBottom: "20px",
          ...typography.body1R,
        }}
      >
        <USFlagImage />
        <span>
          {wine?.location ||
            "Santa Cruz Mountains | California | United States"}
        </span>
      </div>

      {/* Wine ratings section */}
      <WineRating
        ratings={wine ? wine.ratings : { vn: 95, jd: 93, ws: 93, abv: 14.3 }}
        align="left"
        hideAbv={true}
        style={{
          position: "relative",
          zIndex: 2,
          padding: "0 20px",
          marginBottom: "32px",
        }}
      />

      {/* Technical Details Section - Temporarily disabled due to crypto.subtle error */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        marginBottom: '32px',
        position: "relative",
        zIndex: 2,
        padding: "0 20px",
      }}>
        <div>
          {/* Varietal */}
          <div style={{ marginBottom: "12px" }}>
            <span style={{
              ...typography.body1R,
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
      </div>
    </div>
  );
};

export default WineDetailsHeader;