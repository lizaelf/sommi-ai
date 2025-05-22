import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img src="/assets/somm-logo.png" alt="SOMM" className="h-9" />
    </div>
  );
};

export default Logo;