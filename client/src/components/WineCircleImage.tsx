import React from 'react';
import wineCircleImage from '@assets/wine-circle.png';

interface WineCircleImageProps {
  size?: number;
  isAnimating?: boolean;
}

const WineCircleImage: React.FC<WineCircleImageProps> = ({ 
  size = 280, 
  isAnimating = false 
}) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      <img
        src={wineCircleImage}
        alt="Wine glass view from above"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.8s ease-in-out'
        }}
      />
    </div>
  );
};

export default WineCircleImage;