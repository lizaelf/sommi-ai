import { X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CellarManager, type CellarWine } from "@/utils/cellarManager";
import Button from "@/components/ui/buttons/Button";
import { ContactInput } from "@/components/ui/forms/ContactInput";
import { CellarSearch, CellarFilters } from "@/components/cellar";


// Default wine image removed - only authentic uploaded images will be displayed
import usFlagImage from "@assets/US-flag.png";
import logoImage from "@asse../layout/Logo.png";

import AppHeader from "@/components/layout/AppHeader";

const Cellar = () => {
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWineSearch, setShowWineSearch] = useState(false);
  const [wineSearchQuery, setWineSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Cellar wines state
  const [cellarWines, setCellarWines] = useState<CellarWine[]>([]);

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
