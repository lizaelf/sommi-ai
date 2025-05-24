import React from 'react';

interface WineCircleProps {
  size: number;
  isAnimating?: boolean;
}

const WineCircle: React.FC<WineCircleProps> = ({ size, isAnimating = false }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <img
        src="/wine-circle.png"
        alt="Wine in glass viewed from above"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.3s ease-in-out'
        }}
      />
    </div>
  );
};

export default WineCircle;