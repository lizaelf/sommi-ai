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
    <div className={`absolute top-4 left-4 right-4 z-50 pointer-events-none ${className}`}>
      <div className="mx-auto max-w-[1200px] pointer-events-auto">
        <div className="flex items-center justify-between">
          {/* Left side - Back button or Logo + Title */}
          <div className="flex items-center gap-3">
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
              <h1 className="text-white text-[18px] font-medium ml-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
