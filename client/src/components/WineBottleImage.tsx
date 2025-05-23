import React from 'react';
// Import the image using a relative path
import wineBottleImage from '../assets/wine-bottle.png';

const WineBottleImage: React.FC = () => {
  return (
    <div style={{ 
      position: 'relative',
      zIndex: 2,
      marginBottom: '16px',
      marginTop: '20px', // Added top margin to push content down
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Blurred circle background - enlarged and positioned higher */}
      <div style={{
        position: 'absolute',
        width: '300px', // Increased size
        height: '300px', // Increased size
        borderRadius: '50%',
        backgroundColor: '#8E8E8E', // Gray color as requested
        filter: 'blur(60px)',
        opacity: 0.7,
        zIndex: 1,
        top: '30%', // Positioned higher to be visible under header
        transform: 'translateY(-50%)'
      }} />
      
      {/* Wine bottle image */}
      <img 
        src={wineBottleImage} 
        alt="Ridge Lytton Springs 2021" 
        style={{ 
          height: '280px', 
          width: 'auto',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 3
        }}
      />
    </div>
  );
};

export default WineBottleImage;