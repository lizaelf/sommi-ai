import { X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import backgroundImage from "@assets/Background.png";
import wineBottleImage from "@assets/Product Image.png";
import usFlagImage from "@assets/US-flag.png";
import logoImage from "@assets/Logo.png";
import lineImage from "@assets/line.png";

const Cellar = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(true);
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [animationState, setAnimationState] = useState<
    "closed" | "opening" | "open" | "closing"
  >("closed");
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
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
  const [showWineSearch, setShowWineSearch] = useState(false);
  const [wineSearchQuery, setWineSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [hasSharedContact, setHasSharedContact] = useState(false);
  const [showViewChatButton, setShowViewChatButton] = useState(false);

  const countries = [
    { name: "Afghanistan", dial_code: "+93", code: "AF", flag: "🇦🇫" },
    { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
    // Add other countries as needed
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmitForm = async () => {
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

    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

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
        console.log("Contact saved successfully:", data);
        
        // Mark that user has shared their contact info
        setHasSharedContact(true);
        setShowViewChatButton(false);
        setShowModal(false);

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
              Select wine to see past info and chats
            </span>
          ),
          duration: 5000,
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

  const handleClose = () => {
    // If user closes without saving, don't mark as shared contact
    // Show "View chat history" button instead of Summary/History
    setShowViewChatButton(true);
    setHasSharedContact(false);
    setShowModal(false);
  };

  const handleWineClick = (wineId: number) => {
    setLocation(`/wine-details/${wineId}`);
  };

  const handleViewChatHistory = () => {
    // Open the contact form again when "View chat history" is clicked
    setShowModal(true);
    setShowViewChatButton(false);
  };

  // Scroll detection effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Portal setup
  useEffect(() => {
    let element = document.getElementById("contact-modal-portal");
    if (!element) {
      element = document.createElement("div");
      element.id = "contact-modal-portal";
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      if (element && element.parentElement && !showModal) {
        element.parentElement.removeChild(element);
      }
    };
  }, []);

  // Modal animation
  useEffect(() => {
    if (showModal && animationState === "closed") {
      setAnimationState("opening");
      setTimeout(() => setAnimationState("open"), 50);
    } else if (
      !showModal &&
      (animationState === "open" || animationState === "opening")
    ) {
      setAnimationState("closing");
      setTimeout(() => setAnimationState("closed"), 300);
    }
  }, [showModal, animationState]);

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Fixed Header with scroll background */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300 ${
          isScrolled
            ? "bg-black/90 backdrop-blur-sm border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <Link href="/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="text-white"
          >
            <path
              fill="currentColor"
              d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">Cellar</h1>
        <div
          onClick={() => {
            setShowWineSearch(!showWineSearch);
            setIsSearchActive(!showWineSearch);
          }}
          className={`cursor-pointer transition-all duration-200 ${
            showWineSearch
              ? "text-white scale-110"
              : "text-white/80 hover:text-white"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
      </div>

      {/* Content with top padding to account for fixed header */}
      <div className="pt-16">
        {/* Cellar Container with rounded corners */}
        <div
          style={{
            borderRadius: "8px",
            overflow: "hidden",
            margin: "0 16px 0 16px",
          }}
        >
          {/* First Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors flex items-end justify-center"
                onClick={() => handleWineClick(1)}
              >
                <img
                  src={wineBottleImage}
                  alt="Wine bottle"
                  className="object-contain"
                  style={{ height: "186px" }}
                />
              </div>
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(2)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(3)}
              />
            </div>
          </div>

          {/* Second Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(4)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(5)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(6)}
              />
            </div>
          </div>

          {/* Third Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(7)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(8)}
              />
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(9)}
              />
            </div>
          </div>

          {/* Line separator below last wine rack */}
          <div
            style={{
              backgroundImage: `url(${lineImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              height: "10px",
            }}
          />
        </div>

        {/* Conditional UI based on contact sharing status */}
        {showViewChatButton && !hasSharedContact ? (
          // Show "View chat history" button when user hasn't shared contact
          <div style={{ 
            padding: "24px 16px",
            display: "flex",
            justifyContent: "center"
          }}>
            <button
              onClick={handleViewChatHistory}
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "32px",
                padding: "16px 32px",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                backdropFilter: "blur(10px)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              View chat history
            </button>
          </div>
        ) : hasSharedContact ? (
          // Show Summary and History components when user has shared contact
          <div style={{ padding: "24px 16px" }}>
            {/* Summary Section */}
            <div style={{
              marginBottom: "32px",
              padding: "20px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              <h1 style={{
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "24px",
                fontWeight: 600,
                marginBottom: "16px",
                margin: 0
              }}>
                Summary
              </h1>
              <div style={{
                color: "#CECECE",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                lineHeight: "1.5"
              }}>
                Your wine exploration journey and preferences will appear here.
              </div>
            </div>

            {/* History Section */}
            <div style={{
              padding: "20px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              <h1 style={{
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "24px",
                fontWeight: 600,
                marginBottom: "16px",
                margin: 0
              }}>
                History
              </h1>
              <div style={{
                color: "#CECECE",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                lineHeight: "1.5"
              }}>
                Your conversation history and wine discoveries will be displayed here.
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Contact Info Bottom Sheet */}
      {animationState !== "closed" &&
        portalElement &&
        createPortal(
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
            onClick={handleClose}
          >
            <div
              style={{
                background: "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
                backdropFilter: "blur(20px)",
                width: "100%",
                maxWidth: "500px",
                borderRadius: "20px 20px 0 0",
                padding: "32px 24px 24px",
                transform:
                  animationState === "open"
                    ? "translateY(0)"
                    : "translateY(100%)",
                transition: "transform 0.3s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <style>
                {`
                  /* Contact form inputs - transparent when empty */
                  .contact-form-input {
                    background: transparent !important;
                    background-color: transparent !important;
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    appearance: none !important;
                    
                    /* Gradient border */
                    border-top: 2px solid transparent !important;
                    border-right: 1px solid transparent !important;
                    border-bottom: 1px solid transparent !important;
                    border-left: 1px solid transparent !important;
                    border-radius: 16px !important;
                    
                    /* Empty state - dark background */
                    background-image: 
                      linear-gradient(#1C1C1C, #1C1C1C), 
                      radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
                    background-origin: border-box !important;
                    background-clip: padding-box, border-box !important;
                    overflow: hidden !important;
                  }
                  
                  /* Filled inputs - 8% white background */
                  .contact-form-input:not(:placeholder-shown) {
                    background-image: 
                      linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)), 
                      radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
                  }
                  
                  /* Focus state - keep current background */
                  .contact-form-input:focus {
                    background-image: 
                      linear-gradient(#1C1C1C, #1C1C1C), 
                      radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
                    outline: none !important;
                  }
                  
                  /* Focus state when filled - 8% white background */
                  .contact-form-input:focus:not(:placeholder-shown) {
                    background-image: 
                      linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)), 
                      radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%) !important;
                    background-origin: border-box !important;
                    background-clip: padding-box, border-box !important;
                    overflow: hidden !important;
                  }
                  
                  /* Override autofill - 8% white background */
                  input:-webkit-autofill,
                  input:-webkit-autofill:hover,
                  input:-webkit-autofill:focus,
                  input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.08) inset !important;
                    -webkit-text-fill-color: white !important;
                  }
                `}
              </style>
              {/* Contact Form Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "32px",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "white",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "20px",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    Contact Info
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* First Name */}
                <div>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="contact-form-input"
                    style={{
                      display: "flex",
                      height: "56px",
                      padding: "16px 24px",
                      alignItems: "center",
                      flex: "1 0 0",
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
                </div>

                {/* Last Name */}
                <div>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="contact-form-input"
                    style={{
                      display: "flex",
                      height: "56px",
                      padding: "16px 24px",
                      alignItems: "center",
                      flex: "1 0 0",
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
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="contact-form-input"
                    style={{
                      display: "flex",
                      height: "56px",
                      padding: "16px 24px",
                      alignItems: "center",
                      flex: "1 0 0",
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
                </div>

                {/* Phone Number */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "16px",
                      overflow: "hidden",
                      height: "56px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "16px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <span style={{ marginRight: "8px" }}>{selectedCountry.flag}</span>
                      <span style={{ color: "white", fontSize: "16px" }}>
                        {selectedCountry.dial_code}
                      </span>
                    </div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
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
                    onClick={handleSubmitForm}
                    style={{
                      width: "100%",
                      height: "56px",
                      background: "white",
                      borderRadius: "32px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                      border: "none",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        color: "black",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "16px",
                        fontWeight: 500,
                      }}
                    >
                      Save
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          portalElement,
        )}
    </div>
  );
};

export default Cellar;