import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./ui/Button";
import { FormInput } from "./ui/FormInput";
import typography from "@/styles/typography";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ContactBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
}

export default function ContactBottomSheet({
  isOpen,
  onClose,
  onSubmit,
}: ContactBottomSheetProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [animationState, setAnimationState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const portalElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    portalElement.current = document.getElementById("portal-root");
    if (!portalElement.current) {
      const portalDiv = document.createElement("div");
      portalDiv.id = "portal-root";
      document.body.appendChild(portalDiv);
      portalElement.current = portalDiv;
    }
  }, []);

  useEffect(() => {
    if (isOpen && animationState === "closed") {
      setAnimationState("opening");
      setTimeout(() => setAnimationState("open"), 50);
    } else if (!isOpen && animationState === "open") {
      setAnimationState("closing");
      setTimeout(() => setAnimationState("closed"), 300);
    }
  }, [isOpen, animationState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (animationState === "closed" || !portalElement.current) {
    return null;
  }

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
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
          backdropFilter: "blur(20px)",
          width: "100%",
          maxWidth: "500px",
          borderRadius: "24px 24px 0px 0px",
          borderTop: "1px solid rgba(255, 255, 255, 0.20)",
          paddingTop: "24px",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingBottom: "28px",
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
          onClick={onClose}
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
        <div style={{ marginBottom: "24px", marginTop: "0px" }}>
          <h2
            style={{
              color: "white",
              ...typography.h2,
              textAlign: "center",
              margin: "0 0 12px 0",
            }}
          >
            Want to see wine history?
          </h2>

          <p
            style={{
              color: "#CECECE",
              ...typography.body,
              textAlign: "center",
              margin: "0 0 8px 0",
            }}
          >
            Enter your contact info
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            {/* First Name & Last Name Row */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <FormInput
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(value) => handleInputChange("firstName", value)}
                  required
                  className=""
                />
              </div>
              <div style={{ flex: 1 }}>
                <FormInput
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange("lastName", value)}
                  required
                  className=""
                />
              </div>
            </div>

            {/* Email */}
            <FormInput
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
              required
            />

            {/* Phone */}
            <FormInput
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={(value) => handleInputChange("phone", value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: "white",
              color: "black",
              fontWeight: 500,
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              fontSize: "16px",
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </form>
      </div>
    </div>,
    portalElement.current
  );
}