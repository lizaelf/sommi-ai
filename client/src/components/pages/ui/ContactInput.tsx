import React from 'react';
import { cn } from '@/lib/utils';

interface ContactInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const ContactInput: React.FC<ContactInputProps> = ({ 
  label, 
  error, 
  className, 
  ...props 
}) => {
  const baseStyles = 'flex h-10 w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <input
        className={cn(baseStyles, error && 'border-destructive', className)}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default ContactInput;