import React from 'react';

/**
 * Wine glass visualization
 */
const WineImage = () => {
  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.2)', // White circle with 20% opacity
        boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.1)', // Subtle inner shadow
      }}
    />
  );
};

export default WineImage;