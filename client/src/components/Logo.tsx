import React from 'react';
import LogoSVG from './LogoSVG';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <LogoSVG />
    </div>
  );
};

export default Logo;