import React from 'react';
// Import the logo image directly from assets
import logoImage from '@assets/Logo.png';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img src={logoImage} alt="Somm Logo" className="h-9" />
    </div>
  );
};

export default Logo;