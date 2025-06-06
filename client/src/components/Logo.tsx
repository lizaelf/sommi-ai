import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>

    </div>
  );
};

export default Logo;