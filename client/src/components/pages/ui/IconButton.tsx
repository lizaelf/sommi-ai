import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'default' | 'ghost' | 'outline' | 'headerIcon' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon: Icon, 
  variant = 'default', 
  size = 'md', 
  className, 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    headerIcon: 'text-white/80 hover:text-white transition-colors',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90'
  };
  
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      className={cn(baseStyles, variants[variant as keyof typeof variants], sizes[size], className)}
      {...props}
    >
      <Icon size={iconSizes[size]} />
    </button>
  );
};

export default IconButton;