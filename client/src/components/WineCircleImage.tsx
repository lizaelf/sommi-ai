import React from 'react';

const WineCircleImage: React.FC = () => {
  // Return SVG representation that mimics the provided wine image
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="black"/>
      <circle cx="100" cy="100" r="96" stroke="#4D0000" strokeWidth="1" fill="#330000"/>
      <circle cx="100" cy="100" r="80" fill="#560000"/>
      <circle cx="100" cy="100" r="65" fill="#700000"/>
      <circle cx="100" cy="100" r="50" fill="#8B0000"/>
      
      {/* Light reflections */}
      <path d="M160 100C160 133.137 133.137 160 100 160C66.8629 160 40 133.137 40 100" 
            stroke="#BD0000" strokeWidth="8" strokeLinecap="round"/>
      
      <ellipse cx="140" cy="70" rx="25" ry="25" fill="#FF0000" fillOpacity="0.1"/>
      <ellipse cx="75" cy="50" rx="20" ry="15" fill="#FFFFFF" fillOpacity="0.05"/>
      
      {/* Rim highlight */}
      <circle cx="100" cy="100" r="95" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.2"/>
    </svg>
  );
};

export default WineCircleImage;