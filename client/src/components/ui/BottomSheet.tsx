import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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
      setTimeout(() => setAnimationState("open"), 50);
    } else {
      setAnimationState("closing");
      setTimeout(() => setAnimationState("closed"), 300);
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        opacity: animationState === "open" ? 1 : animationState === "opening" ? 0.8 : 0,
        transition: "opacity 0.3s ease-out",
      }}
      onClick={handleClose}
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
                margin: "0",
              }}
            >
              {title}
            </h2>
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                cursor: "pointer",
                zIndex: 10,
              }}
              onClick={handleClose}
            >
              <X size={24} color="white" />
            </div>
          </div>
        )}
        {children}
      </div>
    </div>,
    portalElement
  );
}