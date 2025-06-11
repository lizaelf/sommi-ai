import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";
import { IconButton } from "@/components/ui/IconButton";

interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
  showBackButton?: boolean;
  onDeleteTenant?: () => void;
}

export function AppHeader({ 
  title, 
  onBack, 
  rightContent, 
  className = "",
  showBackButton = false,
  onDeleteTenant
}: AppHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
                className="absolute left-1/2 transform -translate-x-1/2 text-white text-[18px] font-medium truncate whitespace-nowrap text-center"
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
                
                {showDropdown && onDeleteTenant && (
                  <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg min-w-[160px] z-50">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        if (confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
                          onDeleteTenant();
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors flex items-center gap-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Tenant
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default AppHeader;