import React from 'react';

const USFlagImage: React.FC = () => {
  return (
    <div style={{ width: '16px', height: '16px', flexShrink: 0 }}>
      <img 
        src="/us-flag.png" 
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