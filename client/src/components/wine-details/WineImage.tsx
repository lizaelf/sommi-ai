import React from 'react';
import placeholderImage from '@assets/Placeholder.png';

const ridgeWineImage = '/wines/wine-1-ridge-lytton-springs-dry-creek-zinfandel.png';

interface WineImageProps {
  src?: string;
  alt?: string;
  wineName?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const WineImage: React.FC<WineImageProps> = ({ 
  src, 
  alt, 
  wineName,
  style = {},
  onLoad,
  onError
}) => {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    console.error(`Wine image failed to load: ${wineName || alt}, attempted URL: ${target.src}`);
    
    // Try fallback images in order
    if (target.src !== placeholderImage) {
      console.log(`Falling back to placeholder image: ${placeholderImage}`);
      target.src = placeholderImage;
    } else if (target.src !== ridgeWineImage) {
      console.log(`Falling back to Ridge wine image: ${ridgeWineImage}`);
      target.src = ridgeWineImage;
    } else {
      console.error('All fallback images failed to load');
    }
    
    // Call parent onError handler if provided
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = () => {
    console.log(`Wine image loaded: ${wineName || alt}`);
    if (onLoad) {
      onLoad();
    }
  };

  return (
    <img
      src={src || placeholderImage}
      alt={alt || wineName || "Wine bottle"}
      style={{
        height: "100%",
        width: "auto",
        objectFit: "contain",
        borderRadius: "8px",
        ...style
      }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default WineImage;