import React from 'react';

interface WineCircleImageProps {
  size?: number;
  isAnimating?: boolean;
}

// Base64 encoded wine circle image (converted from the PNG)
const wineCircleBase64 = `data:image/png;base64,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`;

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
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <img
        src={wineCircleBase64}
        alt="Wine glass view from above"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.8s ease-in-out',
          opacity: isAnimating ? '1' : '0.95',
        }}
      />
    </div>
  );
};

export default WineCircleImage;