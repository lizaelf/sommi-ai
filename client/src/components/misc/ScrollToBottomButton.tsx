import React from "react";
import Button from "./ui/buttons/Button";

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
      <img
        src="/icons/scroll-down.svg"
        alt="Scroll down"
        width="20"
        height="20"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </Button>
  );
}