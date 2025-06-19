import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = "" 
}: BottomSheetProps) {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [animationState, setAnimationState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [allowBackdropClose, setAllowBackdropClose] = useState(false);

  useEffect(() => {
    let element = document.getElementById("bottom-sheet-portal");
    if (!element) {
      element = document.createElement("div");
      element.id = "bottom-sheet-portal";
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAnimationState("opening");
      setAllowBackdropClose(false);
      const timer1 = setTimeout(() => {
        setAnimationState("open");
        // Allow backdrop close after animation completes
        const timer2 = setTimeout(() => setAllowBackdropClose(true), 100);
        return () => clearTimeout(timer2);
      }, 50);
      return () => clearTimeout(timer1);
    } else {
      setAnimationState("closing");
      setAllowBackdropClose(false);
      const timer = setTimeout(() => setAnimationState("closed"), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setAnimationState("closing");
    
    // Dispatch event to abort any ongoing conversations
    window.dispatchEvent(new CustomEvent('abortConversation'));
    
    setTimeout(() => {
      setAnimationState("closed");
      onClose();
    }, 300);
  };

  if (animationState === "closed" || !portalElement) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        opacity: animationState === "open" ? 1 : animationState === "opening" ? 0.8 : 0,
        transition: "opacity 0.3s ease-out",
      }}
      onClick={(e) => {
        if (allowBackdropClose && e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className={className}
        style={{
          background: "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
          backdropFilter: "blur(20px)",
          width: "100%",
          maxWidth: "500px",
          borderRadius: "24px 24px 0px 0px",
          borderTop: "1px solid rgba(255, 255, 255, 0.20)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
          transform: animationState === "open" ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              position: "relative",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "20px",
                fontWeight: 500,
                textAlign: "center",
                margin: "0 auto",
                width: "250px",
              }}
            >
              {title}
            </h2>
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                zIndex: 10,
              }}
            >
              <IconButton
                icon={X}
                onClick={handleClose}
                variant="secondaryIcon"
                size="md"
                title="Close"
              />
            </div>
          </div>
        )}
        {children}
      </div>
    </div>,
    portalElement
  );
}