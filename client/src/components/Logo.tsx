import React from 'react';
import { Link } from 'wouter';
const logoImage = '/somm-logo.png';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <Link href="/">
      <div className={`flex items-center cursor-pointer ${className}`}>
        <img 
          src={logoImage} 
          alt="Somm Logo" 
          style={{ 
            height: '33px', 
            width: 'auto',
            objectFit: 'contain'
          }}
          onLoad={() => console.log('Somm logo loaded successfully')}
          onError={(e) => {
            console.error('Failed to load somm logo:', logoImage);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    </Link>
  );
};

export default Logo;