import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
  showBackButton?: boolean;
}

export function AppHeader({ 
  title, 
  onBack, 
  rightContent, 
  className = "",
  showBackButton = false 
}: AppHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}
      style={{
        backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
      }}
    >
      <div className="max-w-6xl mx-auto p-4" style={{ height: "75px" }}>
        <div className="flex items-center justify-between h-full">
          {/* Left side - Back button or Logo */}
          <div className="flex items-center justify-start" style={{ minWidth: "80px" }}>
            {showBackButton && onBack ? (
              <button 
                onClick={onBack}
                className="tertiary-button flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
                style={{
                  background: 'transparent !important',
                  border: 'none !important',
                  outline: 'none !important',
                  boxShadow: 'none !important',
                  padding: '0 !important',
                  margin: '0 !important'
                }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            ) : (
              <Logo />
            )}
          </div>
          
          {/* Center - Title */}
          {title && (
            <h1 
              className="text-white text-[18px] font-medium absolute left-1/2 transform -translate-x-1/2"
            >
              {title}
            </h1>
          )}
          
          {/* Right side - Custom content */}
          <div className="flex items-center gap-3">
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;