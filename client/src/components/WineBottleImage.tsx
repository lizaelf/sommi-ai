import React from 'react';
// Import the image using a relative path
import wineBottleImage from '../assets/wine-bottle.png';

const WineBottleImage: React.FC = () => {
  return (
    <div style={{ 
      position: 'relative',
      zIndex: 2,
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Blurred circle background */}
      <div style={{
        position: 'absolute',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        backgroundColor: '#8E8E8E', // Gray color as requested
        filter: 'blur(200px)', // Stronger blur effect
        zIndex: 1,
        top: '50%',
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