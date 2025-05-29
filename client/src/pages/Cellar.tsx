import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ContactFormBottomSheet } from "@/components/ContactFormBottomSheet";
import backgroundImage from "@assets/Background.png";
import wineBottleImage from "@assets/Product Image.png";
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
  const [showContactForm, setShowContactForm] = useState(false);
  const [hasSharedContact, setHasSharedContact] = useState(() => 
    localStorage.getItem('hasSharedContact') === 'true'
  );

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

  // Auto-open contact sheet for non-submitted users on mount
  useEffect(() => {
    if (showModal) {
      setShowContactForm(true);
    }
  }, [showModal]);

  const handleContactFormSubmit = (formData: any) => {
    setHasSharedContact(true);
    localStorage.setItem('hasSharedContact', 'true');
    
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
  };

  const handleClose = () => {
    setShowModal(false);
    setShowContactForm(false);
    
    // Mark that user has closed the contact form (so it won't show automatically again)
    localStorage.setItem('hasClosedContactForm', 'true');
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

  return (
    <div className="min-h-screen bg-black text-white relative">
      <style>
        {`
          /* Contact form inputs - transparent when empty */
          .contact-form-input {
            background: rgba(255, 255, 255, 0.0) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 16px !important;
            transition: all 0.3s ease !important;
          }

          .contact-form-input:focus {
            border-color: white !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
          }

          .contact-form-input:not(:placeholder-shown) {
            background: rgba(255, 255, 255, 0.08) !important;
          }

          /* Save button - Remove all browser styling */
          .save-button {
            all: unset !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: linear-gradient(180deg, 
              rgba(255, 255, 255, 0.12) 0%, 
              rgba(255, 255, 255, 0.08) 50%, 
              rgba(255, 255, 255, 0.04) 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 16px !important;
            transition: all 0.3s ease !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
          }

          .save-button:hover {
            background: linear-gradient(180deg, 
              rgba(255, 255, 255, 0.20) 0%, 
              rgba(255, 255, 255, 0.16) 50%, 
              rgba(255, 255, 255, 0.12) 100%) !important;
            border-color: rgba(255, 255, 255, 0.4) !important;
            transform: translateY(-1px) !important;
          }

          .save-button:active {
            transform: translateY(0) !important;
            background: linear-gradient(180deg, 
              rgba(255, 255, 255, 0.08) 0%, 
              rgba(255, 255, 255, 0.04) 50%, 
              rgba(255, 255, 255, 0.02) 100%) !important;
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          backgroundColor: isScrolled ? "rgba(28, 28, 28, 0.95)" : "transparent",
          backdropFilter: isScrolled ? "blur(20px)" : "none",
          borderBottom: isScrolled ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            height: "56px",
          }}
        >
          <Link href="/">
            <div style={{ cursor: "pointer" }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5M12 19L5 12L12 5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>

          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <img
              src={logoImage}
              alt="SipSmart Logo"
              style={{
                height: "32px",
                width: "auto",
              }}
            />
          </div>

          {/* Test reset button - for development only */}
          {!hasSharedContact && (
            <button
              onClick={() => {
                localStorage.removeItem('hasSharedContact');
                localStorage.removeItem('hasClosedContactForm');
                setHasSharedContact(false);
                setShowContactForm(true);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                color: "white",
                padding: "8px 12px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Content with top padding to account for fixed header */}
      <div style={{ paddingTop: "88px" }}>
        {/* Background hero section */}
        <div
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            height: "340px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "24px",
              right: "24px",
            }}
          >
            <h1
              style={{
                fontFamily: "Lora, serif",
                fontSize: "24px",
                fontWeight: 400,
                color: "white",
                margin: 0,
                textAlign: "left",
              }}
            >
              Cellar
            </h1>
          </div>
        </div>

        {/* Wine rack sections */}
        <div style={{ backgroundColor: "#1C1C1C" }}>
          {/* First wine rack */}
          <div
            style={{
              backgroundImage: `url(${wineBottleImage})`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            {/* Empty divs above the image */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(1)}
              />
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

          {/* Line separator */}
          <div
            style={{
              backgroundImage: `url(${lineImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              height: "10px",
            }}
          />

          {/* Second wine rack */}
          <div
            style={{
              backgroundImage: `url(${wineBottleImage})`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            {/* Empty divs above the image */}
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

          {/* Line separator */}
          <div
            style={{
              backgroundImage: `url(${lineImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              height: "10px",
            }}
          />

          {/* Third wine rack */}
          <div
            style={{
              backgroundImage: `url(${wineBottleImage})`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              height: "228px",
            }}
          >
            {/* Empty divs above the image */}
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

        {/* Fixed bottom button for non-submitted users */}
        {!hasSharedContact && (
          <div style={{
            position: "fixed",
            bottom: "0",
            left: "0",
            right: "0",
            backgroundColor: "#1C1C1C",
            padding: "16px",
            zIndex: 50,
            borderTop: "1px solid rgba(255, 255, 255, 0.2)"
          }}>
            <button
              onClick={() => setShowContactForm(true)}
              style={{
                height: "56px",
                minHeight: "56px",
                maxHeight: "56px",
                padding: "16px 24px",
                alignItems: "center",
                alignSelf: "stretch",
                background: "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.04) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                color: "white",
                textAlign: "center",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                lineHeight: "24px",
                cursor: "pointer",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.16) 50%, rgba(255, 255, 255, 0.12) 100%)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.4)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.04) 100%)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              Want to see wine history?
            </button>
          </div>
        )}

        {/* Empty space to account for fixed bottom button */}
        {!hasSharedContact && (
          <div style={{ height: "88px" }} />
        )}
      </div>

      {/* Contact Form Bottom Sheet */}
      <ContactFormBottomSheet
        isOpen={showContactForm}
        onClose={handleClose}
        onSubmit={handleContactFormSubmit}
        title="Want to see wine history?"
        subtitle="Enter your contact info"
      />
    </div>
  );
};

export default Cellar;