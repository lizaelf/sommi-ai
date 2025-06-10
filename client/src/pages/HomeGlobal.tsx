import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import wineryLogoPath from "@assets/winary-logo.png";
// Default images removed - only authentic uploaded images will be displayed
import typography from "@/styles/typography";
import Logo from "@/components/Logo";
import { getWineDisplayName } from '../../../shared/wineConfig';
import AppHeader from "@/components/AppHeader";
import { ProfileIcon } from "@/components/ProfileIcon";

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

  const handleWineClick = (wineId: number) => {
    if (wineId === 1) {
      setLocation('/');
    } else {
      // Store wine data in localStorage for the Scanned page to use
      const selectedWine = wines.find(w => w.id === wineId);
      if (selectedWine) {
        localStorage.setItem('selectedWine', JSON.stringify(selectedWine));
      }
      setLocation('/');
    }
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
      <AppHeader 
        rightContent={
          <>
            <Link to="/cellar">
              <div
                style={{
                  width: "auto",
                  height: "40px",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.04)",
                  borderRadius: "24px",
                  border: "1px solid transparent",
                  backgroundImage:
                    "linear-gradient(#0A0A0A, #0A0A0A), linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.2))",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                  padding: "0 16px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    color: "white",
                    fontSize: "14px",
                    lineHeight: "normal",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: "400",
                    display: "inline-block",
                    padding: "0",
                    margin: "0",
                  }}
                >
                  My cellar
                </span>
              </div>
            </Link>
            <ProfileIcon 
              onEditContact={() => console.log('Edit contact clicked')}
              onManageNotifications={() => console.log('Manage notifications clicked')}
              onDeleteAccount={() => console.log('Delete account clicked')}
            />
          </>
        }
      />

      {/* Content */}
      <div className="px-4" style={{ paddingTop: "91px" }}>
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

                    {/* Ratings */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          padding: 8,
                          alignItems: "baseline",
                          gap: 4,
                          background: "rgba(255, 255, 255, 0.10)",
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "white",
                            wordWrap: "break-word",
                            height: "16px",
                            ...typography.num,
                          }}
                        >
                          {wine.ratings.vn}
                        </div>
                        <div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "rgba(255, 255, 255, 0.60)",
                            wordWrap: "break-word",
                            height: "16px",
                            ...typography.body1R,
                          }}
                        >
                          VN
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          padding: 8,
                          alignItems: "baseline",
                          gap: 4,
                          background: "rgba(255, 255, 255, 0.10)",
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "white",
                            wordWrap: "break-word",
                            height: "16px",
                            ...typography.num,
                          }}
                        >
                          {wine.ratings.jd}
                        </div>
                        <div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "rgba(255, 255, 255, 0.60)",
                            wordWrap: "break-word",
                            height: "16px",
                            ...typography.body1R,
                          }}
                        >
                          JD
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          padding: 8,
                          alignItems: "baseline",
                          gap: 4,
                          background: "rgba(255, 255, 255, 0.10)",
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "white",
                            wordWrap: "break-word",
                            height: "16px",
                            ...typography.num,
                          }}
                        >
                          {wine.ratings.ws}
                        </div>
                        <div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "rgba(255, 255, 255, 0.60)",
                            wordWrap: "break-word",
                            height: "16px",
                            ...typography.body1R,
                          }}
                        >
                          WS
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          padding: 8,
                          alignItems: "baseline",
                          gap: 4,
                          background: "rgba(255, 255, 255, 0.10)",
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "white",
                            wordWrap: "break-word",
                            height: "16px",
                            ...typography.num,
                          }}
                        >
                          {wine.ratings.abv}%
                        </div>
                        <div
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "rgba(255, 255, 255, 0.60)",
                            wordWrap: "break-word",
                            height: "16px",
                            ...typography.body1R,
                          }}
                        >
                          ABV
                        </div>
                      </div>
                    </div>
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
