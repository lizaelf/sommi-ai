import React, { useState, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Logo from "@/components/Logo";
import { ProfileIcon } from "@/components/ProfileIcon";

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
      <div className="max-w-6xl mx-auto" style={{ height: "75px", paddingLeft: "16px", paddingRight: "16px", paddingTop: "16px", paddingBottom: "16px" }}>
        <div className="flex items-center justify-between h-full">
          {/* Left side - Back button or Logo + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBackButton && onBack ? (
              <div
                onClick={onBack}
                className="cursor-pointer text-white/80 hover:text-white transition-all duration-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </div>
            ) : (
              <Logo />
            )}
            {title && (
              <h1 
                className="text-white text-[18px] font-medium truncate whitespace-nowrap flex-1 mr-4 text-center"
              >
                {title}
              </h1>
            )}
          </div>
          
          {/* Right side - Custom content */}
          <div className="flex items-center gap-3">
            {rightContent || (
              <>
                <div className="cursor-pointer text-white/80 hover:text-white transition-all duration-200">
                  <Search className="w-6 h-6" />
                </div>
                <ProfileIcon />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;