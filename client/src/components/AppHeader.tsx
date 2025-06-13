import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
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
  onDeleteTenant?: () => void;
}

export function AppHeader({
  title,
  onBack,
  rightContent,
  className = "",
  showBackButton = false,
  onDeleteTenant,
}: AppHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
                {onDeleteTenant && (
                  <div className="relative" ref={dropdownRef}>
                    <IconButton
                      icon={MoreHorizontal}
                      onClick={() => setShowDropdown(!showDropdown)}
                      variant="headerIcon"
                      size="md"
                      title="More options"
                    />

                    {showDropdown && (
                      <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg min-w-[160px] z-50">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            if (
                              confirm(
                                "Are you sure you want to delete this tenant? This action cannot be undone.",
                              )
                            ) {
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
