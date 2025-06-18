import React from 'react';
import { MapPin } from 'lucide-react';
import USFlagImage from '@/components/USFlagImage';
import WineRating from '@/components/WineRating';
import WineTechnicalDetails from '@/components/WineTechnicalDetails';
import typography from '@/styles/typography';

interface WineDetailsHeroProps {
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

const WineDetailsHero: React.FC<WineDetailsHeroProps> = ({ wine }) => {
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

  if (!wine) return null;

  return (
    <div style={{
      backgroundColor: "#0a0a0a",
      color: "white",
      padding: "32px 16px",
      minHeight: "100vh",
      position: "relative",
    }}>
      {/* Wine Title */}
      <div style={{
        marginBottom: "24px",
        textAlign: "center",
      }}>
        <h1 style={{
          ...typography.h1,
          marginBottom: "8px",
        }}>
          {wine.year} {wine.name}
        </h1>
      </div>

      {/* Location */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "24px",
      }}>
        <USFlagImage />
        <span style={{
          ...typography.body,
          color: "rgba(255, 255, 255, 0.8)",
        }}>
          {wine.location || "Dry Creek Valley, Sonoma County, California"}
        </span>
      </div>

      {/* Wine Ratings */}
      <div style={{ marginBottom: "32px" }}>
        <WineRating 
          ratings={wine.ratings}
          variant="default"
          style={{ justifyContent: "center" }}
        />
      </div>

      {/* Technical Details Section */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px",
      }}>
        <h2 style={{
          ...typography.h2,
          marginBottom: "20px",
          textAlign: "center",
        }}>
          Technical Details
        </h2>
        
        {/* Technical Details Container with Wine Image */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
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
              <img
                src="/attached_assets/line-gradient_1750243006719.png"
                alt="Gradient line"
                style={{
                  width: "100px",
                  height: "2px",
                  objectFit: "contain",
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
          }}>
            <img
              src={wine?.image}
              alt={wine?.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "8px",
              }}
              onLoad={() => console.log(`Wine bottle image loaded: ${wine?.name}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WineDetailsHero;