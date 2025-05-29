import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactFormProps {
  animationState: "closed" | "opening" | "open" | "closing";
  portalElement: HTMLElement | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const COUNTRIES = [
  { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "🇬🇧" },
  { name: "Canada", dial_code: "+1", code: "CA", flag: "🇨🇦" },
  { name: "Germany", dial_code: "+49", code: "DE", flag: "🇩🇪" },
  { name: "France", dial_code: "+33", code: "FR", flag: "🇫🇷" },
  { name: "Italy", dial_code: "+39", code: "IT", flag: "🇮🇹" },
  { name: "Spain", dial_code: "+34", code: "ES", flag: "🇪🇸" },
  { name: "Australia", dial_code: "+61", code: "AU", flag: "🇦🇺" },
  { name: "Japan", dial_code: "+81", code: "JP", flag: "🇯🇵" },
  { name: "South Korea", dial_code: "+82", code: "KR", flag: "🇰🇷" },
];

export default function ImprovedContactForm({ animationState, portalElement, onClose, onSubmit }: ContactFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [selectedCountry, setSelectedCountry] = useState({
    dial_code: "+1",
    flag: "🇺🇸",
    name: "United States",
    code: "US",
  });

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
      country.dial_code.includes(countrySearchQuery),
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });

    // Validate all fields
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // Submit to backend
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          countryCode: selectedCountry.code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('hasSharedContact', 'true');
        onSubmit(data);
        onClose();
        
        // Show success toast notification
        toast({
          description: (
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Contact saved successfully!
            </span>
          ),
          duration: 3000,
          className: "bg-white text-black border-none",
          style: {
            position: "fixed",
            top: "74px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "auto",
            maxWidth: "none",
            padding: "8px 24px",
            borderRadius: "32px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
          },
        });
      } else {
        console.error("Failed to save contact:", data);
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  if (!portalElement || animationState === "closed") {
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
        opacity:
          animationState === "open"
            ? 1
            : animationState === "opening"
              ? 0.8
              : 0,
        transition: "opacity 0.3s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:
            "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
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
          transform:
            animationState === "open"
              ? "translateY(0)"
              : "translateY(100%)",
          transition: "transform 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            cursor: "pointer",
            zIndex: 10,
          }}
          onClick={onClose}
        >
          <X size={24} color="white" />
        </div>

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
          <input
            type="text"
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) =>
              handleInputChange("firstName", e.target.value)
            }
            className="contact-form-input"
            style={{
              display: "flex",
              height: "64px",
              padding: "16px 24px",
              alignItems: "center",
              width: "100%",
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.firstName && (
            <div
              style={{
                color: "#ff4444",
                fontSize: "14px",
                marginTop: "4px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {errors.firstName}
            </div>
          )}

          <input
            type="text"
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) =>
              handleInputChange("lastName", e.target.value)
            }
            className="contact-form-input"
            style={{
              display: "flex",
              height: "64px",
              padding: "16px 24px",
              alignItems: "center",
              width: "100%",
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.lastName && (
            <div
              style={{
                color: "#ff4444",
                fontSize: "14px",
                marginTop: "4px",
                fontFamily: "Inter, sans-serif",
              }}
            >
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
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.email && (
            <div
              style={{
                color: "#ff4444",
                fontSize: "14px",
                marginTop: "4px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {errors.email}
            </div>
          )}

          {/* Phone Input Row - Country Selector + Phone Input */}
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            {/* Country Code Selector - 100px Width */}
            <div style={{ position: "relative", width: "100px" }}>
              <div
                onClick={() =>
                  setShowCountryDropdown(!showCountryDropdown)
                }
                className="contact-form-input"
                style={{
                  display: "flex",
                  height: "64px",
                  padding: "16px 12px",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
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

              {showCountryDropdown && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "#2A2A29",
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                      maxHeight: "60vh",
                      overflowY: "auto",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 24px",
                        borderBottom:
                          "1px solid rgba(255, 255, 255, 0.08)",
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#2A2A29",
                        zIndex: 1001,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <span
                          style={{
                            color: "white",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "18px",
                            fontWeight: "600",
                          }}
                        >
                          Select Country
                        </span>
                        <div
                          onClick={() => {
                            setShowCountryDropdown(false);
                            setCountrySearchQuery("");
                          }}
                          style={{ cursor: "pointer", padding: "8px" }}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M18 6L6 18M6 6L18 18"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Search Input */}
                      <div style={{ position: "relative" }}>
                        <div
                          style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 1,
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M10 2.5a7.5 7.5 0 0 1 5.964 12.048l4.743 4.744a1 1 0 0 1-1.32 1.497l-.094-.083l-4.744-4.743A7.5 7.5 0 1 1 10 2.5Zm0 2a5.5 5.5 0 1 0 0 11a5.5 5.5 0 0 0 0-11Z"
                              fill="#959493"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={countrySearchQuery}
                          onChange={(e) =>
                            setCountrySearchQuery(e.target.value)
                          }
                          style={{
                            width: "100%",
                            height: "48px",
                            padding: "0 16px 0 48px",
                            borderRadius: "12px",
                            border:
                              "1px solid rgba(255, 255, 255, 0.12)",
                            background: "transparent",
                            color: "white",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "16px",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "white";
                            e.target.style.boxShadow =
                              "0 0 0 2px rgba(255, 255, 255, 0.2)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor =
                              "rgba(255, 255, 255, 0.12)";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>
                    {filteredCountries.map((country, index) => (
                      <div
                        key={`${country.code}-${index}`}
                        onClick={() => {
                          setSelectedCountry(country);
                          setShowCountryDropdown(false);
                          setCountrySearchQuery("");
                        }}
                        style={{
                          padding: "16px 24px",
                          borderBottom:
                            index < filteredCountries.length - 1
                              ? "1px solid rgba(255, 255, 255, 0.08)"
                              : "none",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 255, 255, 0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "transparent";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span style={{ fontSize: "20px" }}>
                            {country.flag}
                          </span>
                          <span
                            style={{
                              color: "white",
                              fontFamily: "Inter, sans-serif",
                              fontSize: "16px",
                            }}
                          >
                            {country.name}
                          </span>
                        </div>
                        <span
                          style={{
                            color: "#959493",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "14px",
                          }}
                        >
                          {country.dial_code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Phone Input - Flexible Width */}
            <input
              type="tel"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="contact-form-input"
              style={{
                display: "flex",
                height: "64px",
                padding: "16px 24px",
                alignItems: "center",
                flex: 1,
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {errors.phone && (
            <div
              style={{
                color: "#ff4444",
                fontSize: "14px",
                marginTop: "4px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {errors.phone}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div
          style={{
            width: "100%",
          }}
        >
          <div
            onClick={handleSave}
            style={{
              width: "100%",
              height: "56px",
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              cursor: "pointer",
              boxSizing: "border-box",
              userSelect: "none",

              /* Simple styling without backgroundImage */
              borderRadius: "24px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            Share contacts
          </div>
        </div>
      </div>
    </div>,
    portalElement,
  );
}