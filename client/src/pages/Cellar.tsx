import { X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ContactFormBottomSheet } from '@/components/ContactFormBottomSheet';
import backgroundImage from "@assets/Background.png";
import wineBottleImage from "@assets/Product Image.png";
import usFlagImage from "@assets/US-flag.png";
import logoImage from "@assets/Logo.png";
import lineImage from "@assets/line.png";

const Cellar = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(() => {
    // Only show modal automatically if user hasn't shared contact AND hasn't closed it before
    const hasShared = localStorage.getItem('hasSharedContact') === 'true';
    const hasClosed = localStorage.getItem('hasClosedContactForm') === 'true';
    return !hasShared && !hasClosed;
  });
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

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

  const handleFormSubmit = async (submissionData: any) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        // Mark that user has shared contact info
        localStorage.setItem('hasSharedContact', 'true');
        setHasSharedContact(true);
        
        // Close the modal
        setShowModal(false);
        
        toast({
          title: "Success!",
          description: "Your contact information has been saved.",
        });
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      throw error; // Re-throw to let the shared component handle the error display
    }
  };

  const handleClose = () => {
    localStorage.setItem('hasClosedContactForm', 'true');
    setHasClosedContactForm(true);
    setShowModal(false);
  };

  const handleNavigation = () => {
    setLocation("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const searchResults = [
    "2019 Tenuta San Guido Bolgheri Sassicaia DOC",
    "2019 Tenuta San Guido Le Difese",
    "2019 Tenuta San Guido Guidalberto",
  ];

  const filteredResults = searchResults.filter((result) =>
    result.toLowerCase().includes(wineSearchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "24px",
          background: isScrolled
            ? "rgba(255, 255, 255, 0.05)"
            : "transparent",
          backdropFilter: isScrolled ? "blur(10px)" : "none",
          borderBottom: isScrolled ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            onClick={handleNavigation}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer",
            }}
          >
            <img
              src={logoImage}
              alt="Logo"
              style={{
                height: "30px",
                objectFit: "contain",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div
              onClick={() => setShowWineSearch(!showWineSearch)}
              style={{
                color: "white",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: "500",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              Search
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showWineSearch && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "120px",
          }}
          onClick={() => setShowWineSearch(false)}
        >
          <div
            style={{
              width: "90%",
              maxWidth: "500px",
              backgroundColor: "#1C1C1C",
              borderRadius: "16px",
              padding: "24px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                cursor: "pointer",
                padding: "8px",
              }}
              onClick={() => setShowWineSearch(false)}
            >
              <X size={20} color="white" />
            </div>

            <div
              style={{
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "20px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                Search Wines
              </h2>

              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search for wines..."
                  value={wineSearchQuery}
                  onChange={(e) => {
                    setWineSearchQuery(e.target.value);
                    setIsSearchActive(e.target.value.length > 0);
                  }}
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "0 16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {isSearchActive && (
              <div>
                {filteredResults.length > 0 ? (
                  filteredResults.map((result, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "12px 16px",
                        borderBottom:
                          index < filteredResults.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.1)"
                            : "none",
                        cursor: "pointer",
                        borderRadius: "8px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span
                        style={{
                          color: "white",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "16px",
                        }}
                      >
                        {result}
                      </span>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#888",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                    }}
                  >
                    No wines found matching your search.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          paddingTop: "88px",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingBottom: "140px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {/* Wine Details Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <img
            src={wineBottleImage}
            alt="Wine Bottle"
            style={{
              width: "auto",
              height: "300px",
              objectFit: "contain",
            }}
          />

          <div
            style={{
              textAlign: "center",
              color: "white",
            }}
          >
            <h1
              style={{
                fontFamily: "Lora, serif",
                fontSize: "32px",
                fontWeight: "500",
                lineHeight: "40px",
                marginBottom: "16px",
                margin: "0 0 16px 0",
              }}
            >
              2020 Tenuta San Guido Bolgheri Sassicaia DOC
            </h1>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: "400",
                lineHeight: "24px",
                color: "#CECECE",
                margin: "0 0 24px 0",
              }}
            >
              Bolgheri | Tuscany | Italy
            </p>

            <img
              src={lineImage}
              alt="Decorative Line"
              style={{
                width: "100%",
                maxWidth: "200px",
                height: "auto",
                margin: "0 auto 24px auto",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Content sections based on contact sharing status */}
        {hasSharedContact ? (
          <>
            {/* Summary Section */}
            <div>
              <h2
                style={{
                  fontFamily: "Lora, serif",
                  fontSize: "24px",
                  fontWeight: "500",
                  lineHeight: "32px",
                  color: "white",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                Summary
              </h2>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  fontWeight: "400",
                  lineHeight: "24px",
                  color: "#CECECE",
                  margin: "0",
                }}
              >
                The 2020 Tenuta San Guido Bolgheri Sassicaia DOC offers an exquisite 
                expression of Cabernet Sauvignon and Cabernet Franc from Tuscany's 
                prestigious Bolgheri region. This vintage showcases remarkable balance 
                with notes of dark fruit, cedar, and refined tannins.
              </p>
            </div>

            {/* History Section */}
            <div>
              <h2
                style={{
                  fontFamily: "Lora, serif",
                  fontSize: "24px",
                  fontWeight: "500",
                  lineHeight: "32px",
                  color: "white",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                History
              </h2>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  fontWeight: "400",
                  lineHeight: "24px",
                  color: "#CECECE",
                  margin: "0",
                }}
              >
                Sassicaia was born from the vision of Mario Incisa della Rocchetta in the 1940s, 
                who planted Cabernet Sauvignon in the hills of Bolgheri. Initially produced 
                for family consumption, it became commercially available in 1968 and 
                revolutionized Italian winemaking by proving that world-class Bordeaux-style 
                wines could be made in Tuscany.
              </p>
            </div>

            {/* Temporary Reset Button for Testing */}
            <div style={{ marginTop: "32px", textAlign: "center" }}>
              <button
                onClick={resetAccountStatus}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Reset (Testing Only)
              </button>
            </div>
          </>
        ) : (
          /* Show message for users who haven't shared contact */
          <div
            style={{
              textAlign: "center",
              color: "#CECECE",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "24px",
              padding: "32px 0",
            }}
          >
            Share your contact information to access detailed wine history and analysis.
          </div>
        )}
      </div>

      {/* Fixed bottom button for non-shared users */}
      {!hasSharedContact && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "24px",
            right: "24px",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "100%",
              height: "56px",
              backgroundColor: "rgba(28, 28, 28, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            Want to see wine history?
          </button>
        </div>
      )}

      {/* Contact Form Bottom Sheet */}
      <ContactFormBottomSheet
        isOpen={showModal}
        onClose={handleClose}
        onSubmit={handleFormSubmit}
        title="Want to see wine history?"
        description="Enter your contact info"
      />
    </div>
  );
};

export default Cellar;