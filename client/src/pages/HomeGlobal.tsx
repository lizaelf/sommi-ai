import { useState, useEffect } from "react";
import { Link } from "wouter";
import wineryLogoPath from "@assets/winary-logo.png";
import wineBottlePath from "@assets/image-1.png";

const HomeGlobal = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const wines = [
    {
      id: 1,
      name: "2022 Estate Chardonnay",
      bottles: 4,
      image: "/wine-bottle-white.svg",
      ratings: {
        vn: 95,
        jd: 93,
        ws: 93,
        abv: 14.3,
      },
    },
    {
      id: 2,
      name: "2021 Monte Bello Cabernet Sauvignon",
      bottles: 2,
      image: "/wine-bottle-red.svg",
      ratings: {
        vn: 95,
        jd: 93,
        ws: 93,
        abv: 14.3,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* App Header - Same as Scanned page */}
      <div
        style={{
          backgroundColor: isScrolled
            ? "rgba(23, 23, 23, 0.5)"
            : "rgba(10, 10, 10, 0)",
          backdropFilter: isScrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(20px)" : "none",
          borderBottom: "none",
          height: "75px",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
        className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center transition-all duration-300`}
      >
        <Link to="/home-global">
          <div
            style={{
              fontFamily: "Lora, serif",
              fontSize: "24px",
              lineHeight: "32px",
              fontWeight: 500,
              color: "white",
            }}
          >
            SOMM
          </div>
        </Link>
        <div className="flex items-center space-x-3">
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
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 px-4">
        {/* Ridge Vineyards Logo */}
        <div className="text-center mb-8">
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
        <div className="mb-8">
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
            Welcome to Ridge Vineyards where each bottle is a story of place,
            time, and the people who bring it to life.
          </p>
        </div>

        {/* Your wines section */}
        <div className="mb-6">
          <h3
            className="text-xl font-medium mb-6"
            style={{
              fontFamily: "Lora, serif",
              fontSize: "24px",
              lineHeight: "32px",
              fontWeight: 500,
            }}
          >
            Your wines
          </h3>

          {/* Wine Cards */}
          <div className="space-y-4">
            {wines.map((wine) => (
              <div
                key={wine.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Wine Bottle Image */}
                  <div className="flex items-center justify-center">
                    <img
                      src={wineBottlePath}
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
                      {wine.name}
                    </h4>
                    <p
                      className="text-white/60 text-sm mb-3"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        lineHeight: "16px",
                        fontWeight: 500,
                      }}
                    >
                      {wine.bottles} Bottles
                    </p>

                    {/* Ratings */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">
                          {wine.ratings.vn}
                        </span>
                        <span className="text-white/40 text-xs">VN</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">
                          {wine.ratings.jd}
                        </span>
                        <span className="text-white/40 text-xs">JD</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">
                          {wine.ratings.ws}
                        </span>
                        <span className="text-white/40 text-xs">WS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">
                          {wine.ratings.abv}%
                        </span>
                        <span className="text-white/40 text-xs">ABV</span>
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
    </div>
  );
};

export default HomeGlobal;
