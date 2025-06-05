import React from 'react';
import placeholderImage from '@assets/Placeholder.png';

interface WineBottleImageProps {
  image?: string;
  wineName?: string;
}

const WineBottleImage: React.FC<WineBottleImageProps> = ({ image, wineName }) => {
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
      
      {/* Wine Image or Placeholder */}
      {image && image.trim() && (image.startsWith('data:') || image.startsWith('/@assets/')) ? (
        <img
          src={image}
          alt={wineName || 'Wine'}
          style={{
            height: '240px',
            width: 'auto',
            maxWidth: '120px',
            borderRadius: '8px',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 3,
            marginTop: '12px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            backgroundColor: 'transparent'
          }}
          onLoad={() => console.log(`Wine bottle image loaded: ${wineName}`)}
          onError={(e) => {
            console.error(`Wine bottle image failed to load: ${wineName}, path: ${image}`);
            // Replace with placeholder on error
            (e.target as HTMLImageElement).src = placeholderImage;
            (e.target as HTMLImageElement).style.opacity = '0.7';
          }}
        />
      ) : (
        <img
          src={placeholderImage}
          alt={`${wineName || 'Wine'} placeholder`}
          style={{
            height: '240px',
            width: 'auto',
            maxWidth: '120px',
            borderRadius: '8px',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 3,
            marginTop: '12px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            opacity: 0.7,
            backgroundColor: 'transparent'
          }}
          onLoad={() => console.log(`Using placeholder image for wine: ${wineName}`)}
        />
      )}
    </div>
  );
};

export default WineBottleImage;