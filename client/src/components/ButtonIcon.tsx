import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useToast } from "@/hooks/UseToast";

interface ButtonIconProps {
  onEditContact?: () => void;
  onManageNotifications?: () => void;
  onResetQR?: () => void;
}

export function ButtonIcon({ 
  onEditContact, 
  onManageNotifications, 
  onResetQR 
}: ButtonIconProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const { toast } = useToast();

  // Portal setup effect
  useEffect(() => {
    let element = document.getElementById("profile-menu-portal");
    if (!element) {
      element = document.createElement("div");
      element.id = "profile-menu-portal";
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu) {
        const target = event.target as Element;
        if (!target.closest('[data-profile-menu]') && !target.closest('[data-profile-icon]')) {
          setShowProfileMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <>
      <div
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        className="cursor-pointer text-white/80 hover:text-white transition-all duration-200"
        data-profile-icon
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M17.755 14a2.25 2.25 0 0 1 2.248 2.25v.575c0 .894-.32 1.759-.9 2.438c-1.57 1.833-3.957 2.738-7.103 2.738s-5.532-.905-7.098-2.74a3.75 3.75 0 0 1-.898-2.434v-.578A2.25 2.25 0 0 1 6.253 14zm0 1.5H6.252a.75.75 0 0 0-.75.75v.577c0 .535.192 1.053.54 1.46c1.253 1.469 3.22 2.214 5.957 2.214c2.739 0 4.706-.745 5.963-2.213a2.25 2.25 0 0 0 .54-1.463v-.576a.75.75 0 0 0-.748-.749M12 2.005a5 5 0 1 1 0 10a5 5 0 0 1 0-10m0 1.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7"
          />
        </svg>
      </div>

      {/* Profile Menu */}
      {showProfileMenu && portalElement && createPortal(
        <div
          style={{
            position: "fixed",
            top: "75px",
            right: "16px",
            background: "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.20)",
            borderRadius: "12px",
            zIndex: 9999,
            minWidth: "200px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          }}
          data-profile-menu
        >
          {onEditContact && (
            <button
              className="profile-menu-item"
              onClick={() => {
                setShowProfileMenu(false);
                onEditContact();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                textAlign: "left",
                borderBottom: "1px solid #373737",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 5a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 11 16h2a3.987 3.987 0 0 1 3.951 2.512A8.949 8.949 0 0 1 12 20z"
                  fill="currentColor"
                />
              </svg>
              Edit Contact Info
            </button>
          )}
          
          {onManageNotifications && (
            <button
              className="profile-menu-item"
              onClick={() => {
                setShowProfileMenu(false);
                onManageNotifications();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                textAlign: "left",
                borderBottom: "1px solid #373737",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                  fill="currentColor"
                />
              </svg>
              Manage notifications
            </button>
          )}

          {onResetQR && (
            <button
              className="profile-menu-item"
              onClick={() => {
                setShowProfileMenu(false);
                onResetQR();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                textAlign: "left",
                borderBottom: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 4v6h6l-2-2c1.69-1.69 4.31-1.69 6 0s1.69 4.31 0 6c-1.69 1.69-4.31 1.69-6 0l-1.41 1.41c2.52 2.52 6.59 2.52 9.11 0s2.52-6.59 0-9.11-6.59-2.52-9.11 0L5 4H1z"
                  fill="currentColor"
                />
              </svg>
              Reset QR State
            </button>
          )}


        </div>,
        portalElement
      )}
    </>
  );
}