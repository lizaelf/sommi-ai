import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import { IconButton } from "@/components/ui/IconButton";
import { ButtonIcon } from "@/components/ButtonIcon";

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
  showBackButton = false,
}: AppHeaderProps) {

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-transparent ${className}`}>
      <div className="mx-auto max-w-[1200px] h-[75px] px-4 py-4">
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
              <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-[18px] font-medium truncate whitespace-nowrap text-center">
                {title}
              </h1>
            )}
          </div>

          {/* Right side - Custom content */}
          <div className="flex items-center gap-3">
            {rightContent || (
              <>
                <Link to="/cellar">
                  <button className="secondary-button react-button">
                    My cellar
                  </button>
                </Link>
                <ButtonIcon 
                  onEditContact={() => console.log('Edit contact clicked')}
                  onManageNotifications={() => console.log('Manage notifications clicked')}
                  onDeleteAccount={() => console.log('Delete account clicked')}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
