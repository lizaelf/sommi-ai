import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ContactFormBottomSheet } from "@/components/ContactFormBottomSheet";
import { useToast } from "@/hooks/use-toast";
import backgroundImage from "@assets/Background.png";
import wineBottleImage from "@assets/Product Image.png";
import usFlagImage from "@assets/US-flag.png";
import logoImage from "@assets/Logo.png";
import lineImage from "@assets/line.png";
import savedImage from "@assets/saved.png";
import wineCircleImage from "@assets/wine-circle.png";

export default function Cellar() {
  const { toast } = useToast();
  const [location] = useLocation();
  
  const [animationState, setAnimationState] = useState<"closed" | "opening" | "open" | "closing">(() => {
    // Don't show modal if user has already shared contact or closed it before
    const hasShared = localStorage.getItem('hasSharedContact') === 'true';
    const hasClosed = localStorage.getItem('hasClosedContactForm') === 'true';
    return !hasShared && !hasClosed ? "opening" : "closed";
  });
  
  const [showWineSearch, setShowWineSearch] = useState(false);
  const [wineSearchQuery, setWineSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [hasSharedContact, setHasSharedContact] = useState(() => {
    // Check localStorage for saved contact sharing status
    return localStorage.getItem('hasSharedContact') === 'true';
  });
  
  const [hasClosedContactForm, setHasClosedContactForm] = useState(() => {
    // Check if user has previously closed the contact form
    return localStorage.getItem('hasClosedContactForm') === 'true';
  });

  // Function to reset account status (clear all user data)
  const resetAccountStatus = () => {
    // Clear all localStorage items
    localStorage.removeItem('hasSharedContact');
    localStorage.removeItem('hasClosedContactForm');
    localStorage.removeItem('currentConversationId');
    localStorage.removeItem('conversations');
    localStorage.removeItem('messages');
    
    // Force immediate state updates
    setHasSharedContact(false);
    setHasClosedContactForm(false);
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Auto-show contact form only if user hasn't shared contact and hasn't closed it before
  useEffect(() => {
    if (animationState === "opening") {
      const timer = setTimeout(() => {
        setAnimationState("open");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animationState]);

  const openContactForm = () => {
    setAnimationState("opening");
    setTimeout(() => setAnimationState("open"), 50);
  };

  const handleClose = () => {
    // Mark that user has closed the contact form
    localStorage.setItem('hasClosedContactForm', 'true');
    setHasClosedContactForm(true);
    setAnimationState("closing");
    setTimeout(() => setAnimationState("closed"), 300);
  };

  const handleContactSuccess = () => {
    setHasSharedContact(true);
    setHasClosedContactForm(false);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: "0px",
          left: "0px",
          right: "0px",
          height: "72px",
          background: "rgba(28, 28, 28, 0.90)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <Link to="/">
          <img
            src={logoImage}
            alt="Logo"
            style={{
              height: "32px",
              cursor: "pointer",
            }}
          />
        </Link>

        {/* Reset Button for Testing */}
        <button
          onClick={resetAccountStatus}
          style={{
            padding: "8px 16px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "white",
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Reset Account
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          position: "absolute",
          top: "72px",
          left: "0px",
          right: "0px",
          bottom: "0px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "48px 24px 24px 24px",
          overflowY: "auto",
        }}
      >
        {/* My cellar title */}
        <h1
          style={{
            color: "white",
            fontFamily: "Lora, serif",
            fontSize: "24px",
            fontWeight: 500,
            lineHeight: "32px",
            textAlign: "left",
            width: "100%",
            maxWidth: "500px",
            margin: "0 0 32px 0",
          }}
        >
          My cellar
        </h1>

        {/* Wine Circle with Wine Name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: hasSharedContact ? "32px" : "48px",
          }}
        >
          <img
            src={wineCircleImage}
            alt="Wine"
            style={{
              width: "120px",
              height: "120px",
              marginBottom: "16px",
            }}
          />
          <h2
            style={{
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontSize: "20px",
              fontWeight: 500,
              textAlign: "center",
              margin: "0",
            }}
          >
            Sassicaia. 2020
          </h2>
        </div>

        {/* Wine Details Section */}
        {hasSharedContact && (
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Summary */}
            <div
              style={{
                background: "rgba(28, 28, 28, 0.85)",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  fontWeight: 500,
                  margin: "0 0 16px 0",
                }}
              >
                Summary
              </h3>
              <p
                style={{
                  color: "#CECECE",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  lineHeight: "1.5",
                  margin: "0 0 16px 0",
                }}
              >
                The Tenuta San Guido Bolgheri Sassicaia DOC offers an elegant
                and sophisticated tasting experience with complex aromas and a
                refined palate structure.
              </p>
              <Link to="/conversation-dialog">
                <button
                  style={{
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "0",
                  }}
                >
                  Show whole dialog
                </button>
              </Link>
            </div>

            {/* History */}
            <div
              style={{
                background: "rgba(28, 28, 28, 0.85)",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  fontWeight: 500,
                  margin: "0 0 16px 0",
                }}
              >
                History
              </h3>
              <p
                style={{
                  color: "#CECECE",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  lineHeight: "1.5",
                  margin: "0 0 16px 0",
                }}
              >
                Created by Marchese Mario Incisa della Rocchetta in the 1940s,
                Sassicaia was revolutionary as one of Italy's first Bordeaux-style
                blends, featuring Cabernet Sauvignon and Cabernet Franc.
              </p>
              <Link to="/wine-details">
                <button
                  style={{
                    color: "white",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "0",
                  }}
                >
                  Show details
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Want to see wine history button (when contact not shared) */}
        {!hasSharedContact && (
          <div
            style={{
              position: "fixed",
              bottom: "0px",
              left: "0px",
              right: "0px",
              padding: "16px 24px 24px 24px",
              background: "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 40%)",
              backdropFilter: "blur(10px)",
              zIndex: 5,
            }}
          >
            <button
              onClick={openContactForm}
              style={{
                width: "100%",
                height: "56px",
                borderRadius: "16px",
                background: "rgba(28, 28, 28, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              Want to see wine history?
            </button>
          </div>
        )}

        {/* Contact Info Bottom Sheet */}
        <ContactFormBottomSheet 
          isOpen={animationState !== "closed"}
          onClose={handleClose}
          onSuccess={handleContactSuccess}
        />
      </div>
    </div>
  );
}