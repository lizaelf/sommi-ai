import React from 'react';

const WineImage: React.FC = () => {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#000000"/>
      <circle cx="100" cy="100" r="95" fill="#6B0000"/>
      <circle cx="100" cy="100" r="85" fill="#8B0000"/>
      <circle cx="100" cy="100" r="75" fill="#A50000"/>
      <circle cx="100" cy="100" r="65" fill="#C00000"/>
      <ellipse cx="130" cy="70" rx="35" ry="30" fill="#FF0000" opacity="0.3"/>
      <ellipse cx="70" cy="130" rx="30" ry="25" fill="#000000" opacity="0.3"/>
      <circle cx="100" cy="100" r="60" fill="#B30000"/>
      <path d="M170 100 A 70 70 0 0 1 100 170" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
      <path d="M30 100 A 70 70 0 0 0 100 30" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
    </svg>
  );
};

export default WineImage;