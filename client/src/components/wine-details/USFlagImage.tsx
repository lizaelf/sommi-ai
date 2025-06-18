import React from 'react';

interface USFlagImageProps {
  className?: string;
  style?: React.CSSProperties;
}

const USFlagImage: React.FC<USFlagImageProps> = ({ className = "", style = {} }) => {
  return (
    <img 
      src="/us-flag.png" 
      alt="US Flag" 
      className={className}
      style={{ 
        width: '20px', 
        height: '15px',
        ...style 
      }} 
    />
  );
};

export default USFlagImage;