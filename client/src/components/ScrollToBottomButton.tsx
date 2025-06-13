import React from "react";
import Button from "./ui/Button";

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

export default function ScrollToBottomButton({ visible, onClick }: ScrollToBottomButtonProps) {
  if (!visible) return null;

  return (
    <Button
      onClick={onClick}
      variant="secondary"
      style={{
        position: "fixed",
        bottom: "100px",
        right: "20px",
        width: "48px",
        height: "48px",
        borderRadius: "24px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        zIndex: 1000,
        backdropFilter: "blur(8px)",
        padding: "0",
        minHeight: "48px",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 16l-4-4h8l-4 4z" fill="white" />
        <path d="M12 20l-4-4h8l-4 4z" fill="white" opacity="0.6" />
      </svg>
    </Button>
  );
}