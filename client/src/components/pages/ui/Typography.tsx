import React, { ReactNode } from 'react';
import typography from '@/styles/typography';

interface TypographyProps {
  variant: keyof typeof typography;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Typography: React.FC<TypographyProps> = ({
  variant,
  children,
  className = '',
  style = {},
}) => {
  const styles = {
    ...typography[variant],
    ...style,
  };

  // Determine which HTML element to use based on variant
  let Component: keyof JSX.IntrinsicElements = 'p';
  
  if (variant === 'h1') {
    Component = 'h1';
  } else if (variant.includes('button')) {
    Component = 'span';
  }

  return (
    <Component style={styles} className={className}>
      {children}
    </Component>
  );
};

export default Typography;