import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";
import { IconButton } from "@/components/ui/IconButton";
import { useLocation } from "wouter";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log('🚀 AppHeader mounted - setting up scroll listener');
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const shouldShowBg = scrollY > 10;
      console.log(`📜 Scroll detected: ${scrollY}px - Background: ${shouldShowBg}`);
      setScrolled(shouldShowBg);
    };
    
    // Check initial position
    console.log('📍 Initial scroll position:', window.scrollY);
    handleScroll();
    
    // Add listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      console.log('🧹 AppHeader unmounted - cleaning up scroll listener');
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Dynamic styles based on scroll state
  const headerStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    background: scrolled ? 'rgba(10, 10, 10, 0.60)' : 'transparent',
    backdropFilter: scrolled ? 'blur(2px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(2px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
    transition: 'all 0.3s ease'
  };
  
  console.log('🎨 Header render - scrolled:', scrolled);

  return (
    <div style={headerStyle}>
      <div className="mx-auto" style={{ maxWidth: "1200px", height: "75px", paddingLeft: "16px", paddingRight: "16px", paddingTop: "16px", paddingBottom: "16px" }}>
        <div className="relative flex items-center justify-between h-full">
          {/* Left side - Back button or Logo + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBackButton && onBack ? (
              <IconButton
                icon={ArrowLeft}
                onClick={onBack}
                variant="ghost"
                size="md"
                title="Go back"
              />
            ) : (
              <Logo />
            )}
            {title && (
              <h1 
                className="text-white text-[18px] font-medium truncate whitespace-nowrap text-center flex-1"
              >
                {title}
              </h1>
            )}
          </div>
          
          {/* Right side - Custom content */}
          <div className="flex items-center gap-3">
            {rightContent || (
              <div className="relative" ref={dropdownRef}>
                <IconButton
                  icon={MoreHorizontal}
                  onClick={() => setShowDropdown(!showDropdown)}
                  variant="headerIcon"
                  size="md"
                  title="More options"
                />
                

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default AppHeader;