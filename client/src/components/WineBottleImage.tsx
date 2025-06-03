import React from 'react';

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
      
      {/* Wine Image or No Image placeholder */}
      {image && (image.startsWith('data:') || image.startsWith('/@assets/')) ? (
        <img
          src={image}
          alt={wineName || 'Wine'}
          style={{
            height: '240px',
            width: 'auto',
            maxWidth: '120px',
            borderRadius: '8px',
            objectFit: 'cover',
            position: 'relative',
            zIndex: 3,
            marginTop: '12px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}
          onLoad={() => console.log(`Wine bottle image loaded: ${wineName}`)}
          onError={(e) => {
            console.error(`Wine bottle image failed to load: ${wineName}, path: ${image}`);
            // Hide broken image
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
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
      )}
    </div>
  );
};

export default WineBottleImage;