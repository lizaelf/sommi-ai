import React from "react";
import { ArrowLeft, User, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";
import AppHeader from "@/components/pages/shared/AppHeader";
import { IconButton } from "@/components/pages/ui/IconButton";
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
              <button
                onClick={onEditProfile}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  textAlign: "left",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  ...typography.body1R,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#333";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Settings size={16} />
                Edit Profile
              </button>
              <button
                onClick={onLogout}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  textAlign: "left",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#FF6B6B",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  ...typography.body1R,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#333";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      }
    />
  );
};