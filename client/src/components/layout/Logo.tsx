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
        />
      </div>
    </Link>
  );
};

export default Logo;