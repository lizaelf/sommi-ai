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

  return null; // Temporarily disabled to eliminate overlay issues
}

export default AppHeader;
