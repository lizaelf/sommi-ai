import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img src="/logo.png" alt="Logo" className="h-9" />
    </div>
  );
};

export default Logo;