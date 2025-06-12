import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    console.log('🚀 AppHeader mounted - setting up scroll listener');
    
    const handleScroll = () => {
      // Check both window scroll and root element scroll (for mobile fullscreen)
      const windowScrollY = window.scrollY;
      const rootElement = document.getElementById('root');
      const rootScrollY = rootElement ? rootElement.scrollTop : 0;
      const totalScrollY = Math.max(windowScrollY, rootScrollY);
      
      const shouldShowBg = totalScrollY > 10;
      console.log(`📜 Scroll detected - Window: ${windowScrollY}px, Root: ${rootScrollY}px, Total: ${totalScrollY}px - Background: ${shouldShowBg}`);
      setScrolled(shouldShowBg);
    };
    
    // Check initial position
    const rootElement = document.getElementById('root');
    console.log('📍 Initial scroll - Window:', window.scrollY, 'Root:', rootElement?.scrollTop || 0);
    handleScroll();
    
    // Add listeners to both window and root element
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (rootElement) {
      rootElement.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      console.log('🧹 AppHeader unmounted - cleaning up scroll listeners');
      window.removeEventListener('scroll', handleScroll);
      if (rootElement) {
        rootElement.removeEventListener('scroll', handleScroll);
      }
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