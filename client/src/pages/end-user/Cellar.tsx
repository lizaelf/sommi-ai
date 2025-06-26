import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { CellarManager, type CellarWine } from "@/utils/cellarManager";

import AppHeader from "@/components/layout/AppHeader";

const Cellar = () => {
  const [showModal, setShowModal] = useState(() => {
    // Only show modal automatically if user hasn't shared contact AND hasn't closed it before
    const hasShared = localStorage.getItem("hasSharedContact") === "true";
    const hasClosed = localStorage.getItem("hasClosedContactForm") === "true";
    return !hasShared && !hasClosed;
  });
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [animationState, setAnimationState] = useState<
    "closed" | "opening" | "open" | "closing"
  >(() => {
    // Show contact sheet automatically if user hasn't shared contact AND hasn't closed it before
    const hasShared = localStorage.getItem("hasSharedContact") === "true";
    const hasClosed = localStorage.getItem("hasClosedContactForm") === "true";
    return !hasShared && !hasClosed ? "opening" : "closed";
  });
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

  // Cellar wines state
  const [cellarWines, setCellarWines] = useState<CellarWine[]>([]);

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [showWineSearch, setShowWineSearch] = useState(false);
  const [wineSearchQuery, setWineSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(() => {
    const saved = localStorage.getItem("notificationPreferences");
    return saved ? JSON.parse(saved) : { email: true, phone: true };
  });
  const [hasSharedContact, setHasSharedContact] = useState(() => {
    // Check localStorage for saved contact sharing status
    return localStorage.getItem("hasSharedContact") === "true";
  });

  const [hasClosedContactForm, setHasClosedContactForm] = useState(() => {
    // Check if user has previously closed the contact form
    return localStorage.getItem("hasClosedContactForm") === "true";
  });

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
        console.log("Contact saved successfully:", data);
        setHasSharedContact(true); // Mark user as having shared contact info
        localStorage.setItem("hasSharedContact", "true"); // Persist the choice
        
        // Store contact data locally for editing
        const contactDataToStore = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          country: selectedCountry,
        };
        localStorage.setItem("contactData", JSON.stringify(contactDataToStore));
        
        setShowModal(false);
        setAnimationState("closing");
        setTimeout(() => setAnimationState("closed"), 300);

        // Show toast notification
      
      } else {
        console.error("Failed to save contact:", data);
        // Handle server validation errors if needed
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle network errors
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setAnimationState("closing");
    setTimeout(() => setAnimationState("closed"), 300);

    // Mark that user has closed the contact form (so it won't show automatically again)
    setHasClosedContactForm(true);
    localStorage.setItem("hasClosedContactForm", "true");

    // Note: Do NOT set hasSharedContact to true here - only when Save is clicked
  };

  const handleWineClick = (wineId: number) => {
    setLocation(`/wine-details/${wineId}`);
  };

  // Scroll detection effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load cellar wines effect
  useEffect(() => {
    const loadCellarWines = async () => {
      try {
        // First try to load from database
        const response = await fetch('/api/wines');
        if (response.ok) {
          const dbWines = await response.json();
          console.log('Database wines loaded:', dbWines.length);
          
          // Convert database wines to cellar format
          const cellarWines = dbWines.map((wine: any) => ({
            id: wine.id,
            name: wine.name,
            year: wine.year || 2021,
            image: wine.image || '',
            addedAt: Date.now(),
            scannedCount: 0
          }));
          
          setCellarWines(cellarWines);
        } else {
          console.error('Failed to load wines from database, falling back to localStorage');
          // Fallback to localStorage
          const wines = CellarManager.getCellarWines();
          setCellarWines(wines);
        }
      } catch (error) {
        console.error('Error loading wines from database:', error);
        // Fallback to localStorage
        const wines = CellarManager.getCellarWines();
        setCellarWines(wines);
      }
    };

    loadCellarWines();

    // Listen for storage changes to update wines when scanned from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userCellarWines') {
        loadCellarWines();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Portal setup effect
  useEffect(() => {
    let element = document.getElementById("contact-bottom-sheet-portal");
    if (!element) {
      element = document.createElement("div");
      element.id = "contact-bottom-sheet-portal";
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      if (element && element.parentElement && !showModal) {
        element.parentElement.removeChild(element);
      }
    };
  }, []);

  // Body scroll lock effect
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // Animation state effect
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

  // Auto-open contact sheet for non-submitted users on mount
  useEffect(() => {
    if (animationState === "opening") {
      setShowModal(true);
      setTimeout(() => setAnimationState("open"), 50);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative mobile-fullscreen">
      <style>
        {`
          /* Blinking cursor animation for search input */
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          
          .search-input-active {
            animation: blink 1s infinite;
          }
          
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
          }
          
          .contact-form-input::placeholder {
            color: #959493 !important;
          }
          
          /* Save button - 4% white background */
          .save-button {
            /* Remove all browser styling */
            background: transparent !important;
            background-color: transparent !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            border: none !important;
            
            /* Exact same gradient border as inputs */
            border-top: 2px solid transparent !important;
            border-right: 1px solid transparent !important;
            border-bottom: 1px solid transparent !important;
            border-left: 1px solid transparent !important;
            border-radius: 32px !important;
            
            /* 4% white background with gradient border */
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04)), 
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
      <AppHeader 
        title="Cellar"
        showBackButton={true}
        onBack={() => setLocation("/")}
        rightContent={
          <>
            {/* Search Icon */}
            <div
              onClick={() => {
                setShowWineSearch(!showWineSearch);
                setIsSearchActive(!showWineSearch);
              }}
              className={`cursor-pointer transition-all duration-200 ${
                showWineSearch ? "text-white scale-110" : "text-white/80 hover:text-white"
              }`}
            >
              <img
                src="/icons/search.svg"
                alt="Search"
                width="24"
                height="24"
                className="transition-all duration-200"
              />
            </div>


          </>
        }
      />

      {/* Wine Search Interface */}
      {showWineSearch && (
        <div
          style={{
            position: "fixed",
            top: "91px",
            left: "16px",
            right: "16px",
            backgroundColor: "#2A2A29",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "16px",
            zIndex: 1000,
            backdropFilter: "blur(20px)",
          }}
        >
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
              <img
                src="/icons/search.svg"
                alt="Search"
                width="18"
                height="18"
                style={{ filter: 'brightness(0) saturate(100%) invert(59%) sepia(0%) saturate(1547%) hue-rotate(146deg) brightness(97%) contrast(91%)' }}
              />
            </div>
            <input
              type="text"
              placeholder="Search wines in cellar..."
              value={wineSearchQuery}
              onChange={(e) => setWineSearchQuery(e.target.value)}
              className=""
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
                e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                e.target.style.background = "transparent";
                e.target.style.boxShadow = "none";
                setIsSearchActive(true);
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
                e.target.style.background = "transparent";
                e.target.style.boxShadow = "none";
                setIsSearchActive(false);
              }}
              autoFocus
            />
          </div>

          {/* Search Results */}
          {wineSearchQuery && (
            <div style={{ marginTop: "12px" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.05)")
                }
                onClick={() => {
                  setShowWineSearch(false);
                  setWineSearchQuery("");
                  handleWineClick(1);
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Sassicaia 2018
                </div>
                <div
                  style={{
                    color: "#CECECE",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  Tuscany, Italy • Cabernet Sauvignon
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Content with top padding to account for fixed header */}
      <div style={{ paddingTop: '91px' }}>


        {/* Cellar Container */}
        <div
          style={{
            margin: "0 16px 0 16px",
          }}
        >
          {/* First Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 61.11%, rgba(255, 255, 255, 0.20) 95.67%, rgba(255, 255, 255, 0.30) 98.56%)",
              height: "236px",
            }}
          >
            {/* Wine bottles display */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              {[0, 1, 2].map((index) => {
                const wine = cellarWines[index];
                return (
                  <div
                    key={index}
                    className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors flex items-end justify-center"
                    onClick={() => wine && handleWineClick(wine.id)}
                  >
                    {wine && wine.image && (
                      <img
                        src={wine.image}
                        alt={wine.name}
                        style={{ 
                          height: "186px", 
                          width: "60px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          marginBottom: "2px"
                        }}
                        onError={(e) => {
                          // Hide image if it fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line separator */}
          <div
            style={{
              height: "1px",
              alignSelf: "stretch",
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.60) 12.26%, rgba(255, 255, 255, 0.40) 33.07%, rgba(255, 255, 255, 0.60) 67.79%, rgba(255, 255, 255, 0.36) 80%)",
            }}
          />

          {/* Second Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 61.11%, rgba(255, 255, 255, 0.20) 95.67%, rgba(255, 255, 255, 0.30) 98.56%)",
              height: "236px",
            }}
          >
            {/* Wine bottles display */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              {[3, 4, 5].map((index) => {
                const wine = cellarWines[index];
                return (
                  <div
                    key={index}
                    className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors flex items-end justify-center"
                    onClick={() => wine && handleWineClick(wine.id)}
                  >
                    {wine && wine.image && (
                      <img
                        src={wine.image}
                        alt={wine.name}
                        style={{ 
                          height: "186px", 
                          width: "60px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          marginBottom: "2px"
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line separator */}
          <div
            style={{
              height: "1px",
              alignSelf: "stretch",
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.60) 12.26%, rgba(255, 255, 255, 0.40) 33.07%, rgba(255, 255, 255, 0.60) 67.79%, rgba(255, 255, 255, 0.36) 80%)",
            }}
          />

          {/* Third Wine Rack Container */}
          <div
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 61.11%, rgba(255, 255, 255, 0.20) 95.67%, rgba(255, 255, 255, 0.30) 98.56%)",
              height: "236px",
            }}
          >
            {/* Wine bottles display */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              {[6, 7, 8].map((index) => {
                const wine = cellarWines[index];
                return (
                  <div
                    key={index}
                    className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors flex items-end justify-center"
                    onClick={() => wine && handleWineClick(wine.id)}
                  >
                    {wine && wine.image && (
                      <img
                        src={wine.image}
                        alt={wine.name}
                        style={{ 
                          height: "186px", 
                          width: "60px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          marginBottom: "2px"
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line separator below last wine rack */}
          <div
            style={{
              height: "1px",
              alignSelf: "stretch",
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.60) 12.26%, rgba(255, 255, 255, 0.40) 33.07%, rgba(255, 255, 255, 0.60) 67.79%, rgba(255, 255, 255, 0.36) 80%)",
            }}
          />
        </div>

       
       
      </div>
    </div>
  );
};

export default Cellar;
