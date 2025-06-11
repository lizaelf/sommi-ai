import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";

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
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      console.log('Scroll event triggered - Position:', window.scrollY, 'Should show bg:', isScrolled, 'Current scrolled state:', scrolled);
      setScrolled(isScrolled);
    };
    
    // Check initial scroll position
    handleScroll();
    
    // Add scroll listener to window and document
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const headerStyles = {
    background: scrolled ? 'rgba(10, 10, 10, 0.60)' : 'transparent',
    backdropFilter: scrolled ? 'blur(2px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(2px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
    transition: 'all 0.3s ease'
  };
  
  console.log('Header render - scrolled:', scrolled, 'styles:', headerStyles);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50"
      style={headerStyles}
    >
      <div className="mx-auto" style={{ maxWidth: "1200px", height: "75px", paddingLeft: "16px", paddingRight: "16px", paddingTop: "16px", paddingBottom: "16px" }}>
        <div className="relative flex items-center justify-between h-full">
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
                <Button
                  onClick={() => setShowDropdown(!showDropdown)}
                  variant="secondary"
                  style={{
                    width: "40px",
                    height: "40px",
                    padding: "0",
                    minHeight: "40px",
                    borderRadius: "20px",
                  }}
                >
                  <MoreHorizontal className="w-6 h-6" />
                </Button>
                
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