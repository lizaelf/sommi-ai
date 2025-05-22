import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/somm-logo-latest.png" 
        alt="SOMM" 
        className="h-7"
      />
    </div>
  );
};

export default Logo;