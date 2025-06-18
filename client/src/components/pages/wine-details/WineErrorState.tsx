import React from "react";
import { Link } from "wouter";
import Button from "@/components/pages/ui/Button";
import typography from "@/styles/typography";

interface WineErrorStateProps {
  error?: string;
}

export const WineErrorState: React.FC<WineErrorStateProps> = ({ error }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          ...typography.h1,
          marginBottom: "16px",
          color: "#FF6B6B",
        }}
      >
        Wine Not Found
      </h1>
      <p
        style={{
          ...typography.body1R,
          color: "#CECECE",
          marginBottom: "24px",
          maxWidth: "400px",
        }}
      >
        {error || "The wine you're looking for doesn't exist or has been removed from the collection."}
      </p>
      <Link href="/">
        <Button variant="primary">
          Return to Collection
        </Button>
      </Link>
    </div>
  );
};