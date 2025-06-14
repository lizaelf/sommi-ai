import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useToast } from "@/hooks/UseToast";
import Button from "@/components/ui/Button";

interface ButtonIconProps {
  onEditContact?: () => void;
  onManageNotifications?: () => void;
  onDeleteAccount?: () => void;
}

export function ButtonIcon({ 
  onEditContact, 
  onManageNotifications, 
  onDeleteAccount 
}: ButtonIconProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeleteBottomSheet, setShowDeleteBottomSheet] = useState(false);
  const [animationState, setAnimationState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const { toast } = useToast();

  // Typography constants matching the design library
  const typography = {
    h1: {
      fontSize: "32px",
      fontWeight: "700",
      lineHeight: "1.2",
      fontFamily: "Lora, serif",
    },
    h2: {
      fontSize: "20px",
      fontWeight: "600",
      lineHeight: "1.4",
      fontFamily: "Inter, sans-serif",
    },
    body: {
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "1.5",
      fontFamily: "Inter, sans-serif",
    },
    body1R: {
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "1.4",
      fontFamily: "Inter, sans-serif",
    },
    buttonPlus1: {
      fontSize: "14px",
      fontWeight: "600",
      lineHeight: "1.2",
      fontFamily: "Inter, sans-serif",
    },
  };

  // Function to clear all chat history
  const clearChatHistory = async () => {
    try {
      // Clear conversation data from backend
      const response = await fetch('/api/conversations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear only chat-related localStorage items, preserve wine data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('conversation') || 
            key.includes('chat') ||
            key.includes('hasSharedContact') ||
            key.startsWith('wine_assistant_') ||
            // Only remove specific wine-related keys that are chat-related
            (key.includes('wine') && (
              key.includes('conversation') ||
              key.includes('chat') ||
              key.includes('history')
            ))
          )) {
            keysToRemove.push(key);
          }
        }
        
        // Remove all identified keys
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear only chat history from IndexedDB, preserve wine data
        try {
          const { default: indexedDBService } = await import('../lib/indexedDB');
          await indexedDBService.clearChatHistory();
          console.log('Chat history cleared from IndexedDB, wine data preserved');
        } catch (idbError) {
          console.log('IndexedDB chat history clear error:', idbError);
        }
        
        // Don't reload immediately, let the user choose interaction type
        console.log('Account data cleared successfully');
      } else {
        console.error('Failed to clear chat history from backend');
        toast({
          title: "Error",
          description: "Failed to clear chat history. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to handle delete account click
  const handleDeleteAccount = async () => {
    setShowProfileMenu(false);
    
    // Clear chat history first
    await clearChatHistory();
    
    // Show bottom sheet with interaction choice
    setAnimationState("opening");
    setShowDeleteBottomSheet(true);
    
    setTimeout(() => {
      setAnimationState("open");
    }, 50);
  };

  // Function to close bottom sheet
  const closeBottomSheet = () => {
    setAnimationState("closing");
    setTimeout(() => {
      setShowDeleteBottomSheet(false);
      setAnimationState("closed");
    }, 300);
  };

  // Function to handle text interaction choice
  const handleTextChoice = () => {
    console.log("Text interaction selected after account deletion");
    closeBottomSheet();
    toast({
      title: "Account Reset",
      description: "Chat history cleared. You can start a new conversation.",
    });
    
    // Reload page after short delay to ensure fresh state
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Function to handle voice interaction choice
  const handleVoiceChoice = () => {
    console.log("Voice interaction selected after account deletion");
    closeBottomSheet();
    toast({
      title: "Account Reset",
      description: "Chat history cleared. You can start a new conversation with voice.",
    });
    
    // Reload page after short delay to ensure fresh state
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

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
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                textAlign: "left",
                borderBottom: "1px solid #373737",
                ...typography.body1R,
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
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                textAlign: "left",
                borderBottom: onDeleteAccount ? "1px solid #373737" : "none",
                ...typography.body1R,
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

          {onDeleteAccount && (
            <button
              className="profile-menu-item"
              onClick={handleDeleteAccount}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                backgroundColor: "transparent",
                border: "none",
                color: "#FF6B6B",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                textAlign: "left",
                ...typography.body1R,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 107, 107, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                  fill="currentColor"
                />
              </svg>
              Delete Account
            </button>
          )}
        </div>,
        portalElement
      )}

      {/* Delete Account Bottom Sheet */}
      {showDeleteBottomSheet && portalElement && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            opacity: animationState === "open" ? 1 : animationState === "opening" ? 0.8 : 0,
            transition: "opacity 0.3s ease-out",
          }}
          onClick={closeBottomSheet}
        >
          <div
            style={{
              background: "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
              backdropFilter: "blur(20px)",
              width: "100%",
              maxWidth: "500px",
              borderRadius: "24px 24px 0px 0px",
              borderTop: "1px solid rgba(255, 255, 255, 0.20)",
              paddingTop: "32px",
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingBottom: "32px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
              transform: animationState === "open" ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              onClick={closeBottomSheet}
              variant="secondary"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 10,
                width: "40px",
                height: "40px",
                padding: "0",
                minHeight: "40px",
                borderRadius: "20px",
              }}
            >
              <X size={24} color="white" />
            </Button>

            {/* Header */}
            <div style={{ marginBottom: "32px", textAlign: "center" }}>
              <h2
                style={{
                  color: "white",
                  margin: "0 0 16px 0",
                  ...typography.h2,
                }}
              >
                Chat history cleared
              </h2>
              <p
                style={{
                  color: "#CECECE",
                  margin: "0",
                  ...typography.body,
                }}
              >
                How would you like to continue?
              </p>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <Button
                onClick={handleTextChoice}
                variant="primary"
                style={{
                  width: "100%",
                  height: "56px",
                  ...typography.body,
                  fontWeight: "600",
                }}
              >
                💬 Continue with Text
              </Button>
              
              <Button
                onClick={handleVoiceChoice}
                variant="secondary"
                style={{
                  width: "100%",
                  height: "56px",
                  ...typography.body,
                  fontWeight: "600",
                }}
              >
                🎤 Continue with Voice
              </Button>
            </div>
          </div>
        </div>,
        portalElement
      )}
    </>
  );
}