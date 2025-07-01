import React from 'react';
import WineBottleImage from './WineBottleImage';

import WineRating from './WineRating';
import WineTechnicalDetails from './WineTechnicalDetails';
import typography from '@/styles/typography';
import { Wine } from '@/types/wine';

interface WineInfoSectionProps {
  wine: Wine;
  imageLoaded: boolean;
  onImageLoad: () => void;
  imageRef: React.RefObject<HTMLImageElement>;
}

const WineInfoSection: React.FC<WineInfoSectionProps> = ({
  wine,
  imageLoaded,
  onImageLoad,
  imageRef,
}) => {
  // Extract varietal information dynamically from wine name
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
    
    // Extract varietal from wine name as fallback
    const varietalMatch = name.match(/(merlot|shiraz|syrah|sangiovese|tempranillo|grenache)/);
    return {
      primary: varietalMatch ? varietalMatch[1].charAt(0).toUpperCase() + varietalMatch[1].slice(1) : 'Red Blend',
      primaryPercentage: 100
    };
  };

  // Determine aging recommendations based on wine type and vintage
  const getAgingRecommendations = (wineName: string, year?: number) => {
    const name = wineName.toLowerCase();
    const currentYear = new Date().getFullYear();
    const wineAge = year ? currentYear - year : 0;
    
    if (name.includes('zinfandel')) {
      return {
        drinkNow: true,
        ageUpTo: wineAge < 3 ? '10-12 years' : '5-8 years'
      };
    } else if (name.includes('cabernet')) {
      return {
        drinkNow: wineAge >= 2,
        ageUpTo: wineAge < 5 ? '15-20 years' : '8-12 years'
      };
    } else if (name.includes('chardonnay')) {
      return {
        drinkNow: true,
        ageUpTo: '3-5 years'
      };
    }
    
    return {
      drinkNow: true,
      ageUpTo: '8-12 years'
    };
  };
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '24px',
      paddingTop: '24px',
      paddingBottom: '32px',
      paddingLeft: '20px',
      paddingRight: '20px',
    }}>
      {/* Wine Image with Circle Glow */}
      <div style={{ 
        position: 'relative',
        width: '240px',
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Circle Glow Background */}
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 69, 19, 0.3) 0%, rgba(139, 69, 19, 0.1) 40%, transparent 70%)',
          filter: 'blur(20px)',
          zIndex: 1
        }} />
        
        <img
          ref={imageRef}
          src={wine.image}
          alt={wine.name}
          onLoad={onImageLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            position: 'relative',
            zIndex: 2
          }}
        />
      </div>

      {/* Wine Name */}
      <div style={{ textAlign: 'center', maxWidth: '100%' }}>
        <h1 style={{
          ...typography.h1,
          color: 'white',
          textAlign: 'center',
          marginBottom: '8px',
          lineHeight: '1.2'
        }}>
          {wine.year ? `${wine.year} ${wine.name}` : wine.name}
        </h1>
      </div>


      {/* Technical Details Section */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        marginTop: '32px'
      }}>
        <WineTechnicalDetails
          varietal={ extractVarietalInfo(wine.name)}
          appellation={ wine?.location || 'Unknown Appellation'}
          aging={ getAgingRecommendations(wine.name, wine.year)}
          abv={ wine.ratings?.abv}
        />
      </div>

      {/* History Section */}
      <div style={{
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          ...typography.h1,
          color: 'white',
          marginBottom: '12px',
          textAlign: 'left'
        }}>
          History
        </h1>
        <p style={{
          ...typography.body,
          color: '#ccc',
          textAlign: 'left',
          lineHeight: '1.6',
          margin: 0
        }}>
          {wine.description || 'A distinguished wine that represents the finest traditions of winemaking, crafted with passion and expertise to deliver an exceptional tasting experience.'}
        </p>
      </div>

      {/* Wine Ratings */}
      <div style={{ width: '100%', maxWidth: '300px' }}>
        <WineRating 
          ratings={wine.ratings}
          variant="default"
        />
      </div>

    </div>
  );
};

export default WineInfoSection;