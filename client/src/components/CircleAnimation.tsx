import React, { useRef, useState, useEffect } from 'react';
import wineCircleImage from '@assets/wine-circle.png';

interface CircleAnimationProps {
  isAnimating?: boolean;
  size?: number;
}

export default function CircleAnimation({ isAnimating = false, size = 300 }: CircleAnimationProps) {
  const [currentSize, setSize] = useState(size);
  const [opacity, setOpacity] = useState(0.6);
  const animationRef = useRef<number>(0);

  // Simple animation loop
  useEffect(() => {
    const animate = () => {
      if (isAnimating) {
        const time = Date.now() * 0.003;
        const scale = 1.0 + Math.sin(time) * 0.15;
        const newSize = size * scale;
        setSize(newSize);
        setOpacity(0.8);
      } else {
        setSize(size);
        setOpacity(0.6);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isAnimating, size]);

  return (
    <div className="relative flex items-center justify-center">
      <img
        src={wineCircleImage}
        alt="Wine Circle"
        className="transition-all duration-200 ease-in-out"
        style={{
          width: `${currentSize}px`,
          height: `${currentSize}px`,
          opacity: opacity,
          filter: `blur(${isAnimating ? '3px' : '0px'})`,
        }}
      />
    </div>
  );
}