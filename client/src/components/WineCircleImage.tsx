import React from 'react';

interface WineCircleImageProps {
  size?: number;
  isAnimating?: boolean;
}

// Simple wine-colored background component
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
        position: 'relative',
        boxShadow: isAnimating ? '0 0 20px rgba(128, 0, 0, 0.5)' : 'none',
        transition: 'box-shadow 0.8s ease-in-out',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'radial-gradient(circle, #8A0303 0%, #5A0000 70%, #3A0000 100%)'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          opacity: isAnimating ? '1' : '0.95',
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.8s ease-in-out, opacity 0.8s ease-in-out',
        }}
      />
    </div>
  );
};

export default WineCircleImage;