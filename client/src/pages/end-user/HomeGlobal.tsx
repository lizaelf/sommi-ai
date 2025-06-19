import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
const wineryLogoPath = "/wineries/winary-logo.png";
// Default images removed - only authentic uploaded images will be displayed
import typography from "@/styles/typography";
import Logo from "@/components/layo../layout/Logo";
import WineRating from "@/components/wine-details/WineRating";
import { getWineDisplayName } from '../../../../shared/wineConfig';
import AppHeader, { HeaderSpacer } from "@/components/layout/AppHeader";
import { ButtonIcon } from "@/components/navigation/ButtonIcon";
import HomeGlobalSkeleton from "@/components/misc/HomeGlobalSkeleton";

interface Wine {
  id: number;
  name: string;
  year: number;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  buyAgainLink?: string;
  qrCode?: string;
  qrLink?: string;
}

const HomeGlobal = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const [wines, setWines] = useState<Wine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleWineClick = (wineId: number) => {
    // Navigate to wine details page for any wine
    setLocation(`/wine-details/${wineId}`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Load wines from CRM storage - show only wines with ID1 and ID2
    const crmWines = JSON.parse(localStorage.getItem('admin-wines') || '[]');
    const filteredWines = crmWines.filter((wine: Wine) => wine.id === 1 || wine.id === 2);
    setWines(filteredWines);
  }, []);



  return (
    <div className="min-h-screen bg-black text-white mx-auto" style={{ maxWidth: "1200px" }}>
      <AppHeader />
      <HeaderSpacer />

      {/* Content */}
      <div className="px-4">
        {/* Ridge Vineyards Logo */}
        <div className="text-center" style={{ marginBottom: "32px" }}>
          <img
            src={wineryLogoPath}
            alt="Ridge Vineyards"
            className="mx-auto"
            style={{
              height: "54px",
              width: "auto",
            }}
          />
        </div>

        {/* Welcome Text */}
        <div style={{ marginBottom: "40px" }}>
          <p
            className="leading-relaxed"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              lineHeight: "24px",
              fontWeight: 400,
              color: "#CECECE",
            }}
          >
            Welcome to Ridge Vineyards where each bottle is a story of place,
            time, and the people who bring it to life.
          </p>
        </div>

        {/* Your wines section */}
        <div className="mb-6">
          <h3
            className="text-xl font-medium"
            style={{
              fontFamily: "Lora, serif",
              fontSize: "24px",
              lineHeight: "32px",
              fontWeight: 500,
              marginBottom: "24px",
            }}
          >
            Your wines
          </h3>

          {/* Wine Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {wines.map((wine) => (
              <div
                key={wine.id}
                className="rounded-xl p-4 transition-colors cursor-pointer hover:bg-white/5"
                style={{
                  border: "1px solid #494949",
                }}
                onClick={() => handleWineClick(wine.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Wine Bottle Image */}
                  <div className="flex items-center justify-center">
                    <img
                      src={wine.image}
                      alt="Wine Bottle"
                      style={{
                        height: "170px",
                        width: "auto",
                      }}
                    />
                  </div>

                  {/* Wine Info */}
                  <div className="flex-1">
                    <h4
                      className="font-medium mb-1"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "20px",
                        lineHeight: "28px",
                        fontWeight: 500,
                      }}
                    >
                      {wine.year} {wine.name}
                    </h4>
                    <p
                      className="text-white/60 text-sm mb-3"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        lineHeight: "16px",
                        fontWeight: 400,
                      }}
                    >
                      {wine.bottles} Bottles
                    </p>

                    {/* Ratings - Using WineRating component */}
                    <WineRating ratings={wine.ratings} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom padding for safe area */}
        <div className="h-20"></div>
      </div>

      {/* Circle glow effect at top */}
      <div
        style={{
          position: "fixed",
          top: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "272px",
          height: "272px",
          borderRadius: "50%",
          backgroundColor: "#8E8E8E",
          filter: "blur(60px)",
          opacity: 0.3,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default HomeGlobal;
