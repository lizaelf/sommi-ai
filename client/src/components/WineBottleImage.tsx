import React from 'react';
// Import the image using a relative path
import wineBottleImage from '../assets/wine-bottle.png';

const WineBottleImage: React.FC = () => {
  return (
    <div style={{ 
      position: 'relative',
      zIndex: 2,
      marginBottom: '16px',
      filter: 'drop-shadow(0px 0px 15px rgba(255, 255, 255, 0.3))'
    }}>
      <img 
        src={wineBottleImage} 
        alt="Ridge Lytton Springs 2021" 
        style={{ 
          height: '280px', 
          width: 'auto',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

export default WineBottleImage;