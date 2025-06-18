import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "@/components/pages/ui/Button";
import typography from "@/styles/typography";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  showIcon?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  retryText = "Try Again",
  showIcon = true,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      {showIcon && (
        <div style={{ marginBottom: "24px" }}>
          <AlertTriangle size={48} color="#FF6B6B" />
        </div>
      )}
      
      <h2
        style={{
          ...typography.h1,
          marginBottom: "16px",
          color: "#FF6B6B",
        }}
      >
        {title}
      </h2>
      
      <p
        style={{
          ...typography.body,
          color: "#CECECE",
          marginBottom: onRetry ? "24px" : "0",
          maxWidth: "400px",
        }}
      >
        {message}
      </p>
      
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          <RefreshCw size={16} />
          {retryText}
        </Button>
      )}
    </div>
  );
};

export default ErrorDisplay;