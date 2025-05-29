import { useState, useEffect } from "react";
import { Link } from "wouter";

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
        abv: 14.3
      }
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
        abv: 14.3
      }
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fixed Header */}
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
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-white hover:text-gray-300 transition-colors cursor-pointer"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 
          className="text-lg font-medium"
          style={{
            fontFamily: "Lora, serif",
            fontSize: "24px",
            lineHeight: "32px",
            fontWeight: 500
          }}
        >
          SOMM
        </h1>
        <Link href="/cellar">
          <div className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-full cursor-pointer">
            <span className="text-white text-sm font-medium">My cellar</span>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="pt-20 px-4">
        {/* Ridge Vineyards Logo */}
        <div className="text-center mb-8">
          <h2 
            className="text-4xl font-light tracking-widest mb-6"
            style={{
              fontFamily: "Lora, serif",
              fontSize: "48px",
              lineHeight: "56px",
              fontWeight: 300,
              letterSpacing: "0.1em"
            }}
          >
            RIDGE
          </h2>
          <p 
            className="text-lg tracking-wider"
            style={{
              fontFamily: "Lora, serif",
              fontSize: "18px",
              lineHeight: "24px",
              fontWeight: 300,
              letterSpacing: "0.05em"
            }}
          >
            VINEYARDS
          </p>
        </div>

        {/* Welcome Text */}
        <div className="mb-8">
          <p 
            className="text-white/80 leading-relaxed"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
              lineHeight: "24px",
              fontWeight: 400
            }}
          >
            Welcome to Ridge Vineyards where each bottle is a story of place, time, and the people who bring it to life.
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
              fontWeight: 500
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
                  <div className="w-16 h-20 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg
                      width="32"
                      height="48"
                      viewBox="0 0 32 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white/60"
                    >
                      <rect x="11" y="8" width="10" height="4" fill="currentColor" rx="1"/>
                      <rect x="10" y="12" width="12" height="32" fill="currentColor" rx="2"/>
                      <rect x="12" y="16" width="8" height="24" fill="currentColor" opacity="0.3" rx="1"/>
                    </svg>
                  </div>

                  {/* Wine Info */}
                  <div className="flex-1">
                    <h4 
                      className="font-medium mb-1"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "18px",
                        lineHeight: "24px",
                        fontWeight: 500
                      }}
                    >
                      {wine.name}
                    </h4>
                    <p 
                      className="text-white/60 text-sm mb-3"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        lineHeight: "20px",
                        fontWeight: 400
                      }}
                    >
                      {wine.bottles} Bottles
                    </p>

                    {/* Ratings */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">{wine.ratings.vn}</span>
                        <span className="text-white/40 text-xs">VN</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">{wine.ratings.jd}</span>
                        <span className="text-white/40 text-xs">JD</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">{wine.ratings.ws}</span>
                        <span className="text-white/40 text-xs">WS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">{wine.ratings.abv}%</span>
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

export default CellarWinePage;