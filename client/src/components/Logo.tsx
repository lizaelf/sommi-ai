import React from 'react';
import LogoImage from './LogoImage';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <LogoImage className="h-7" />
    </div>
  );
};

export default Logo;