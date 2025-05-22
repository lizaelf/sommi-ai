import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`font-semibold tracking-wider ${className}`}>
      <span className="text-primary">S</span>
      <span className="text-primary font-light">Ø</span>
      <span className="text-primary">MM</span>
    </div>
  );
}