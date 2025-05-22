import React from 'react';

const WineBottleImage: React.FC = () => {
  return (
    <img 
      src="/wine-bottle.png"
      alt="Ridge Lytton Springs 2021" 
      style={{ 
        width: 'auto', 
        height: '280px', 
        objectFit: 'contain',
        position: 'relative',
        zIndex: 2,
        marginBottom: '16px',
        filter: 'drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.2))'
      }}
    />
  );
};

export default WineBottleImage;