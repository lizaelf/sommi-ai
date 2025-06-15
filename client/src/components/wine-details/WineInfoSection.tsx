import React from 'react';
import WineBottleImage from '@/components/WineBottleImage';
import USFlagImage from '@/components/USFlagImage';
import WineRating from '@/components/WineRating';
import typography from '@/styles/typography';

interface SelectedWine {
  id: number;
  name: string;
  year?: number;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  location?: string;
  description?: string;
  foodPairing?: string[];
  buyAgainLink?: string;
}

interface WineInfoSectionProps {
  wine: SelectedWine;
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
      {/* Wine Image */}
      <div style={{ 
        position: 'relative',
        width: '180px',
        height: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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
          {wine.name}
        </h1>
        {wine.year && (
          <p style={{
            ...typography.body1R,
            color: '#999',
            textAlign: 'center',
            margin: 0
          }}>
            {wine.year}
          </p>
        )}
      </div>

      {/* Location */}
      {wine.location && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img src="/US-flag.png" alt="US Flag" style={{ width: '20px', height: '15px' }} />
          <span style={{
            ...typography.body1R,
            color: '#999'
          }}>
            {wine.location}
          </span>
        </div>
      )}

      {/* Wine Ratings */}
      <div style={{ width: '100%', maxWidth: '300px' }}>
        <WineRating 
          ratings={wine.ratings}
          variant="default"
        />
      </div>

      {/* Heritage Section */}
      <div style={{
        backgroundColor: '#191919',
        borderRadius: '16px',
        padding: '20px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{
          ...typography.h2,
          color: 'white',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          Heritage
        </h2>
        <p style={{
          ...typography.body,
          color: '#ccc',
          textAlign: 'center',
          lineHeight: '1.6',
          margin: 0
        }}>
          {wine.description || 'A distinguished wine that represents the finest traditions of winemaking, crafted with passion and expertise to deliver an exceptional tasting experience.'}
        </p>
      </div>

      {/* Bottles Count */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px 24px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <span style={{
          ...typography.body1R,
          color: '#999'
        }}>
          Collection: {wine.bottles} bottle{wine.bottles !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default WineInfoSection;