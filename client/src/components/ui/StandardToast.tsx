import React from 'react';
import { useToast } from "@/hooks/UseToast";

export interface ToastOptions {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  position?: 'top' | 'bottom' | 'top-center';
}

// Standardized toast function that handles all common toast patterns
export const showToast = (options: ToastOptions) => {
  const { toast } = useToast();
  
  const { title, description, variant = 'default', duration = 5000, position = 'top-center' } = options;
  
  // Determine styling based on variant and position
  const getToastStyles = () => {
    const baseStyles = {
      fontFamily: "Inter, sans-serif",
      fontSize: "16px",
      fontWeight: 500,
    };
    
    const variantStyles = {
      default: {
        backgroundColor: "white",
        color: "black",
        border: "none",
      },
      destructive: {
        backgroundColor: "#dc2626",
        color: "white",
        border: "none",
      },
      success: {
        backgroundColor: "#16a34a",
        color: "white",
        border: "none",
      }
    };
    
    const positionStyles = {
      'top': {
        position: "fixed" as const,
        top: "20px",
        right: "20px",
      },
      'bottom': {
        position: "fixed" as const,
        bottom: "20px",
        right: "20px",
      },
      'top-center': {
        position: "fixed" as const,
        top: "74px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        maxWidth: "400px",
        textAlign: "center" as const,
      }
    };
    
    return {
      ...baseStyles,
      ...variantStyles[variant],
      ...positionStyles[position],
    };
  };
  
  const className = `${variant === 'destructive' ? 'bg-red-600 text-white' : 
                     variant === 'success' ? 'bg-green-600 text-white' : 
                     'bg-white text-black'} border-none`;
  
  return toast({
    title,
    description: (
      <span style={getToastStyles()}>
        {description}
      </span>
    ),
    duration,
    className,
    style: getToastStyles(),
    variant: variant === 'destructive' ? 'destructive' : undefined,
  });
};

// Common toast patterns as utility functions
export const toastError = (message: string, title = "Error") => {
  return showToast({
    title,
    description: message,
    variant: 'destructive',
    duration: 5000,
  });
};

export const toastSuccess = (message: string, title?: string) => {
  return showToast({
    title,
    description: message,
    variant: 'success',
    duration: 3000,
  });
};

export const toastInfo = (message: string, title?: string) => {
  return showToast({
    title,
    description: message,
    variant: 'default',
    duration: 5000,
    position: 'top-center',
  });
};

// Hook for easy access to standardized toast functions
export const useStandardToast = () => {
  return {
    showToast,
    toastError,
    toastSuccess,
    toastInfo,
  };
};

export default {
  showToast,
  toastError,
  toastSuccess,
  toastInfo,
  useStandardToast,
};