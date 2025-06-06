import React from "react";
import { ArrowLeft } from "lucide-react";

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
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10 ${className}`}>
      <div className="max-w-6xl mx-auto p-4" style={{ height: "75px" }}>
        <div className="flex items-center justify-between h-full">
          {/* Left side - Back button or spacer */}
          <div className="w-10 h-10 flex items-center justify-center">
            {showBackButton && onBack && (
              <button 
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
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