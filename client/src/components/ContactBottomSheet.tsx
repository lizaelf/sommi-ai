import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./ui/Button";
import { FormInput } from "./ui/FormInput";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  { name: "Germany", dial_code: "+49", code: "DE", flag: "🇩🇪" },
  { name: "France", dial_code: "+33", code: "FR", flag: "🇫🇷" },
  { name: "Italy", dial_code: "+39", code: "IT", flag: "🇮🇹" },
  { name: "Spain", dial_code: "+34", code: "ES", flag: "🇪🇸" },
  { name: "Japan", dial_code: "+81", code: "JP", flag: "🇯🇵" },
  { name: "South Korea", dial_code: "+82", code: "KR", flag: "🇰🇷" },
];

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
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Basic validation
    const newErrors: Partial<ContactFormData> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
              fontFamily: "Inter, sans-serif",
              fontSize: "20px",
              fontWeight: 500,
              textAlign: "center",
              margin: "0 0 12px 0",
            }}
          >
            Want to see wine history?
          </h2>

          <p
            style={{
              color: "#CECECE",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: "1.3",
              textAlign: "center",
              margin: "0 0 8px 0",
            }}
          >
            Enter your contact info
          </p>
        </div>

        {/* Form Fields */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <FormInput
            type="text"
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={(value) => handleInputChange("firstName", value)}
            error={errors.firstName}
          />

          <FormInput
            type="text"
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(value) => handleInputChange("lastName", value)}
            error={errors.lastName}
          />

          <FormInput
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={(value) => handleInputChange("email", value)}
            error={errors.email}
          />

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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>
                    {selectedCountry.flag}
                  </span>
                  <span
                    style={{
                      color: "white",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                    }}
                  >
                    {selectedCountry.dial_code}
                  </span>
                </div>
              </div>
              <FormInput
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                error={errors.phone}
                className="flex-1"
              />
            </div>
          </div>

          {/* Country Dropdown */}
          {showCountryDropdown && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 10000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => setShowCountryDropdown(false)}
            >
              <div
                style={{
                  backgroundColor: "#1C1C1C",
                  borderRadius: "16px",
                  padding: "24px",
                  maxWidth: "320px",
                  width: "90%",
                  maxHeight: "400px",
                  overflow: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  style={{
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "18px",
                    fontWeight: 500,
                    marginBottom: "16px",
                  }}
                >
                  Select Country
                </h3>
                {countries.map((country) => (
                  <div
                    key={country.code}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      cursor: "pointer",
                      borderRadius: "8px",
                      marginBottom: "4px",
                      backgroundColor:
                        selectedCountry.code === country.code
                          ? "rgba(255, 255, 255, 0.1)"
                          : "transparent",
                    }}
                    onClick={() => {
                      setSelectedCountry(country);
                      setShowCountryDropdown(false);
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{country.flag}</span>
                    <span
                      style={{
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                      }}
                    >
                      {country.name} ({country.dial_code})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div
            style={{
              width: "100%",
            }}
          >
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
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalElement.current
  );
}