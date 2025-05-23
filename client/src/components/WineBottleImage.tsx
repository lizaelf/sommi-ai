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
      {/* Blurred circle background - positioned at the top */}
      <div style={{
        position: 'absolute',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        backgroundColor: '#8E8E8E', // Gray color
        filter: 'blur(60px)',
        opacity: 0.7,
        zIndex: 1,
        top: '0px', // At the very top
        left: '50%',
        transform: 'translateX(-50%)'
      }} />
      
      {/* Wine bottle image */}
      <img 
        src={wineBottleImage} 
        alt="Ridge Lytton Springs 2021" 
        style={{ 
          height: '240px', 
          width: 'auto',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 3,
          marginTop: '12px',
          marginBottom: '16px'
        }}
      />
    </div>
  );
};

export default WineBottleImage;