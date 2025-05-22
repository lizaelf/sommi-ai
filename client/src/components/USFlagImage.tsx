import React from 'react';
// Import the image directly from assets
import usFlagImage from '@assets/US-flag.png';

const USFlagImage: React.FC = () => {
  return (
    <div style={{ width: '16px', height: '16px', flexShrink: 0 }}>
      <img 
        src={usFlagImage} 
        alt="USA" 
        style={{
          width: '100%', 
          height: '100%', 
          borderRadius: '50%',
          objectFit: 'cover'
        }} 
      />
    </div>
  );
};

export default USFlagImage;