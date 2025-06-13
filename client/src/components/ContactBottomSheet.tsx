import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./ui/Button";
import typography from "@/styles/typography";

interface ContactBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => void;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface Country {
  name: string;
  dial_code: string;
  code: string;
  flag: string;
}

const countries: Country[] = [
  { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
  { name: "Canada", dial_code: "+1", code: "CA", flag: "🇨🇦" },
  { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "🇬🇧" },
  { name: "Australia", dial_code: "+61", code: "AU", flag: "🇦🇺" },
];

export default function ContactBottomSheet({ isOpen, onClose, onSubmit }: ContactBottomSheetProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [animationState, setAnimationState] = useState<"closed" | "opening" | "open" | "closing">("closed");

  React.useEffect(() => {
    if (isOpen && animationState === "closed") {
      setAnimationState("opening");
      setTimeout(() => setAnimationState("open"), 50);
    } else if (!isOpen && animationState === "open") {
      setAnimationState("closing");
      setTimeout(() => setAnimationState("closed"), 300);
    }
  }, [isOpen, animationState]);

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      onClose();
      setFormData({ firstName: "", lastName: "", email: "", phone: "" });
    }
  };

  const portalElement = document.getElementById("portal-root") || document.body;

  if (animationState === "closed") return null;

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
          <h2 style={{ 
            color: "white", 
            textAlign: "center", 
            margin: "0 0 12px 0",
            ...typography.h2 
          }}>
            Want to see wine history?
          </h2>
          <p style={{ 
            color: "#CECECE", 
            textAlign: "center", 
            margin: "0 0 8px 0",
            ...typography.body 
          }}>
            Enter your contact info
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          <input
            type="text"
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className="contact-form-input"
            style={{
              display: "flex",
              height: "64px",
              padding: "16px 24px",
              alignItems: "center",
              width: "100%",
              background: "transparent !important",
              backgroundColor: "transparent !important",
              color: "white !important",
              outline: "none",
              boxSizing: "border-box",
              ...typography.body,
            }}
          />
          {errors.firstName && (
            <div style={{ 
              color: "#ff4444", 
              marginTop: "-12px",
              ...typography.body1R 
            }}>
              {errors.firstName}
            </div>
          )}

          <input
            type="text"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className="contact-form-input"
            style={{
              display: "flex",
              height: "64px",
              padding: "16px 24px",
              alignItems: "center",
              width: "100%",
              color: "white !important",
              outline: "none",
              boxSizing: "border-box",
              ...typography.body,
            }}
          />
          {errors.lastName && (
            <div style={{ 
              color: "#ff4444", 
              marginTop: "-12px",
              ...typography.body1R 
            }}>
              {errors.lastName}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="contact-form-input"
            style={{
              display: "flex",
              height: "64px",
              padding: "16px 24px",
              alignItems: "center",
              width: "100%",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
              ...typography.body,
            }}
          />
          {errors.email && (
            <div style={{ 
              color: "#ff4444", 
              marginTop: "-12px",
              ...typography.body1R 
            }}>
              {errors.email}
            </div>
          )}

          {/* Phone number with country selector */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                height: "64px",
                width: "100%",
                boxSizing: "border-box",
              }}
              className="contact-form-input"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "24px",
                  paddingRight: "12px",
                  cursor: "pointer",
                  borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                onClick={() => setShowCountryDropdown(true)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{selectedCountry.flag}</span>
                  <span style={{ 
                    color: "white",
                    ...typography.body1R 
                  }}>
                    {selectedCountry.dial_code}
                  </span>
                </div>
              </div>
              <input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="contact-form-input"
                style={{
                  display: "flex",
                  height: "56px",
                  padding: "16px 24px",
                  alignItems: "center",
                  flex: 1,
                  color: "white",
                  outline: "none",
                  boxSizing: "border-box",
                  ...typography.body,
                }}
              />
            </div>
            {errors.phone && (
              <div style={{ 
                color: "#ff4444", 
                marginTop: "4px",
                ...typography.body1R 
              }}>
                {errors.phone}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div style={{ width: "100%" }}>
            <button
              onClick={handleSubmit}
              className="save-button"
              style={{
                width: "100%",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "black",
                cursor: "pointer",
                outline: "none",
                boxSizing: "border-box",
                ...typography.buttonPlus1,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalElement
  );
}

export type { ContactFormData };