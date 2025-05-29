import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ContactFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface ContactFormBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function ContactFormBottomSheet({
  isOpen,
  onClose,
  onSuccess,
  title = "Want to see wine history?",
  description = "Enter your contact info"
}: ContactFormBottomSheetProps) {
  const { toast } = useToast();
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [animationState, setAnimationState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: "United States",
    dial_code: "+1",
    code: "US",
    flag: "🇺🇸"
  });
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  const countries = [
    { name: "Afghanistan", dial_code: "+93", code: "AF", flag: "🇦🇫" },
    { name: "Albania", dial_code: "+355", code: "AL", flag: "🇦🇱" },
    { name: "Algeria", dial_code: "+213", code: "DZ", flag: "🇩🇿" },
    { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
    { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "🇬🇧" },
    { name: "Canada", dial_code: "+1", code: "CA", flag: "🇨🇦" },
    { name: "Australia", dial_code: "+61", code: "AU", flag: "🇦🇺" },
    { name: "Germany", dial_code: "+49", code: "DE", flag: "🇩🇪" },
    { name: "France", dial_code: "+33", code: "FR", flag: "🇫🇷" },
    { name: "Italy", dial_code: "+39", code: "IT", flag: "🇮🇹" },
    { name: "Spain", dial_code: "+34", code: "ES", flag: "🇪🇸" },
    { name: "Japan", dial_code: "+81", code: "JP", flag: "🇯🇵" },
    { name: "China", dial_code: "+86", code: "CN", flag: "🇨🇳" },
    { name: "India", dial_code: "+91", code: "IN", flag: "🇮🇳" },
    { name: "Brazil", dial_code: "+55", code: "BR", flag: "🇧🇷" },
    { name: "Mexico", dial_code: "+52", code: "MX", flag: "🇲🇽" },
    { name: "Netherlands", dial_code: "+31", code: "NL", flag: "🇳🇱" },
    { name: "Switzerland", dial_code: "+41", code: "CH", flag: "🇨🇭" },
    { name: "Sweden", dial_code: "+46", code: "SE", flag: "🇸🇪" },
    { name: "Norway", dial_code: "+47", code: "NO", flag: "🇳🇴" },
  ];

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
    country.dial_code.includes(countrySearchQuery)
  );

  useEffect(() => {
    setPortalElement(document.body);
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

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: `${selectedCountry.dial_code}${formData.phone}`,
        }),
      });

      if (response.ok) {
        localStorage.setItem('hasSharedContact', 'true');
        toast({
          title: "Success!",
          description: "Contact information saved successfully.",
        });
        
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
        });
        
        onSuccess?.();
        onClose();
      } else {
        throw new Error('Failed to save contact information');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contact information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    localStorage.setItem('hasClosedContactForm', 'true');
    onClose();
  };

  if (animationState === "closed" || !portalElement) {
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
      onClick={handleClose}
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
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            cursor: "pointer",
            zIndex: 10,
          }}
          onClick={handleClose}
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
            {title}
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
            {description}
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
            onChange={(e) => handleInputChange("firstName", e.target.value)}
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
                marginTop: "-12px",
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
            onChange={(e) => handleInputChange("lastName", e.target.value)}
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
                marginTop: "-12px",
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
                marginTop: "-12px",
                fontFamily: "Inter, sans-serif",
              }}
            >
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{selectedCountry.flag}</span>
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
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  outline: "none",
                  paddingLeft: "12px",
                  paddingRight: "24px",
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

            {/* Country Dropdown */}
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
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
                        <X size={20} color="white" />
                      </div>
                    </div>

                    {/* Search Input */}
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="Search countries..."
                        value={countrySearchQuery}
                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          height: "48px",
                          padding: "0 16px 0 48px",
                          borderRadius: "12px",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          background: "transparent",
                          color: "white",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "16px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "white";
                          e.target.style.boxShadow = "0 0 0 2px rgba(255, 255, 255, 0.2)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
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
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "16px 24px",
                        cursor: "pointer",
                        borderBottom:
                          index < filteredCountries.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.08)"
                            : "none",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span style={{ fontSize: "20px" }}>{country.flag}</span>
                      <span
                        style={{
                          color: "white",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "16px",
                          minWidth: "50px",
                        }}
                      >
                        {country.dial_code}
                      </span>
                      <span
                        style={{
                          color: "#CECECE",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "16px",
                        }}
                      >
                        {country.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="save-button"
          style={{
            width: "100%",
            height: "56px",
            borderRadius: "16px",
            color: "white",
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          Join Somm
        </button>
      </div>
    </div>,
    portalElement
  );
}