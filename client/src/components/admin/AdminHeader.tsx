import React, { useState } from "react";
import { ArrowLeft, Plus, LogOut, Settings, MoreVertical, Trash2 } from "lucide-react";
import { Link } from "wouter";
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";
import { IconButton } from "@/components/ui/buttons/IconButton";

interface AdminHeaderProps {
  currentTenant: { name: string; slug: string } | null;
  onAddWine: () => void;
  onDeleteTenant?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTenant,
  onAddWine,
  onDeleteTenant,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleDeleteTenant = () => {
    setShowDropdown(false);
    if (onDeleteTenant) {
      onDeleteTenant();
    }
  };

  return (
    <AppHeader
      title={currentTenant?.name || "Admin Panel"}
      showBackButton={true}
      rightContent={
        <div className="relative">
          <IconButton
            icon={MoreVertical}
            onClick={() => setShowDropdown(!showDropdown)}
            variant="headerIcon"
            aria-label="More actions"
          />
          
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-black/90 border border-white/20 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <button
                  onClick={handleDeleteTenant}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                  style={typography.body1R}
                >
                  <Trash2 size={16} />
                  Delete Tenant
                </button>
              </div>
            </div>
          )}
          
          {showDropdown && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
          )}
        </div>
      }
    />
  );
};