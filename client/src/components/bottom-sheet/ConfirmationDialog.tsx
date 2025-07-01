import React from "react";
import { BottomSheet } from "./BottomSheet";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const confirmButtonStyles = {
    flex: 1,
    height: "56px",
    padding: "0 24px",
    borderRadius: "24px",
    background: variant === "danger" ? "#5D1D1E" : "white",
    backgroundColor: variant === "danger" ? "#5D1D1E" : "white",
    border: "none",
    color: variant === "danger" ? "white" : "black",
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const cancelButtonStyles = {
    flex: 1,
    height: "56px",
    padding: "0 24px",
    borderRadius: "24px",
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "white",
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <p
        style={{
          color: "#CECECE",
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: "1.4",
          textAlign: "center",
          margin: "0 0 32px 0",
        }}
      >
        {message}
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={onClose}
          style={cancelButtonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          style={confirmButtonStyles}
          onMouseEnter={(e) => {
            if (variant === "danger") {
              e.currentTarget.style.backgroundColor = "#4A1617";
            } else {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
            }
          }}
          onMouseLeave={(e) => {
            if (variant === "danger") {
              e.currentTarget.style.backgroundColor = "#5D1D1E";
            } else {
              e.currentTarget.style.backgroundColor = "white";
            }
          }}
        >
          {confirmText}
        </button>
      </div>
    </BottomSheet>
  );
}

export default ConfirmationDialog;