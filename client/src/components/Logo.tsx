import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg width="80" height="24" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* S */}
        <path d="M4.5 5.5C4.5 5.5 7 3 10 3C13 3 15.5 5 15.5 8C15.5 11 13.5 13 10 13C6.5 13 4.5 15 4.5 18C4.5 21 7 23 10 23C13 23 15.5 20.5 15.5 20.5" stroke="white" strokeWidth="2.5" fill="none"/>
        
        {/* First O */}
        <circle cx="25" cy="13" r="9" stroke="white" strokeWidth="2.5" fill="none"/>
        
        {/* First M */}
        <path d="M40 4V22M40 4L46 12L52 4M52 4V22" stroke="white" strokeWidth="2.5" fill="none"/>
        
        {/* Second M */}
        <path d="M58 4V22M58 4L64 12L70 4M70 4V22" stroke="white" strokeWidth="2.5" fill="none"/>
      </svg>
    </div>
  );
};

export default Logo;