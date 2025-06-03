import React from 'react';

const WineBottleImage: React.FC = () => {
  return (
    <div style={{ 
      position: 'relative',
      zIndex: 2,
      marginBottom: '16px',
      marginTop: '20px',
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
        backgroundColor: '#8E8E8E',
        filter: 'blur(60px)',
        opacity: 0.7,
        zIndex: 1,
        top: '0px',
        left: '50%',
        transform: 'translateX(-50%)'
      }} />
      
      {/* No Image placeholder */}
      <div 
        style={{ 
          height: '240px', 
          width: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          position: 'relative',
          zIndex: 3,
          marginTop: '12px',
          marginBottom: '16px',
          border: '2px dashed rgba(255, 255, 255, 0.3)'
        }}
      >
        No Image
      </div>
    </div>
  );
};

export default WineBottleImage;