import React from "react";
import { ArrowLeft, User, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";
import AppHeader from "@/components/layout/AppHeader";
import { IconButton } from "@/components/ui/buttons/IconButton";
import Button from "@/components/ui/buttons/Button";
import typography from "@/styles/typography";

interface AdminHeaderProps {
  currentTenant: { name: string; slug: string } | null;
  showUserDropdown: boolean;
  onToggleDropdown: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTenant,
  showUserDropdown,
  onToggleDropdown,
  onEditProfile,
  onLogout,
  dropdownRef,
}) => {
  return (
    <AppHeader
      title={currentTenant?.name || "Admin Panel"}
      showBackButton={true}
      rightContent={
        <div className="relative" ref={dropdownRef}>
          <IconButton
            icon={User}
            onClick={onToggleDropdown}
            variant="headerIcon"
          />
          
          {showUserDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: "0",
                marginTop: "8px",
                width: "200px",
                backgroundColor: "#1A1A1A",
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "8px 0",
                zIndex: 1000,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
              }}
            >
              <Button
                onClick={onEditProfile}
                variant="secondary"
                size="default"
                className="justify-start gap-3 px-4 py-3 text-left"
              >
                <Settings size={16} />
                Edit Profile
              </Button>
              <Button
                onClick={onLogout}
                variant="secondary"
                size="default"
                className="justify-start gap-3 px-4 py-3 text-left text-red-400 hover:text-red-300"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          )}
        </div>
      }
    />
  );
};