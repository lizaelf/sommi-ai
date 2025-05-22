import React from 'react';

const LogoSVG: React.FC = () => {
  return (
    <svg width="80" height="30" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* S */}
      <path d="M4 8C4 8 7 3 12 3C17 3 20 6 20 10C20 14 17 17 12 17C7 17 4 20 4 24C4 28 7 32 12 32C17 32 20 27 20 27" 
        stroke="white" strokeWidth="3" strokeLinecap="round" />
      
      {/* O */}
      <circle cx="33" cy="18" r="12" stroke="white" strokeWidth="3" fill="none" />
      
      {/* First M */}
      <path d="M50 5V30M50 5L58 15L66 5M66 5V30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Second M */}
      <path d="M72 5V30M72 5L80 15L88 5M88 5V30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default LogoSVG;