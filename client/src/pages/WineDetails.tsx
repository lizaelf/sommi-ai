import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { getWineDisplayName } from '../../../shared/wineConfig';
import wineBottlePath1 from "@assets/Product Image.png";
import wineBottlePath2 from "@assets/image-2.png";

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

export default function WineDetails() {
  const [scrolled, setScrolled] = useState(false);
  const [wine, setWine] = useState<Wine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const wineId = parseInt(params.id || "1");
  
  useEffect(() => {
    // Load wine data from CRM master data source
    const crmWines = JSON.parse(localStorage.getItem('admin-wines') || '[]');
    const foundWine = crmWines.find((w: Wine) => w.id === wineId);
    if (foundWine) {
      setWine(foundWine);
    }
    setIsLoading(false);
  }, [wineId]);
  
  // Add scroll listener to detect when page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Clean up the listener when component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Don't render anything until wine data is loaded to prevent header glitch
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        
        {/* Fixed Header with back button navigation */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300 ${
            scrolled
              ? "bg-black/90 backdrop-blur-sm border-b border-white/10"
              : "bg-transparent"
          }`}
        >
          <Link to="/cellar">
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
          <h1 className="text-lg font-medium text-white text-left flex-1 truncate overflow-hidden whitespace-nowrap">
            {wine ? `${wine.year} ${wine.name}` : getWineDisplayName()}
          </h1>
          <div></div>
        </div>

        {/* Wine Image Section */}
        <div className="pt-[75px] pb-4">
          <div className="flex justify-center items-center px-4">
            {wine ? (
              <img
                src={wine.image}
                alt={wine.name}
                style={{
                  height: "170px",
                  width: "auto",
                }}
              />
            ) : (
              <div style={{ height: "170px", width: "auto" }}>Loading...</div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div>
          <EnhancedChatInterface showBuyButton={true} />
        </div>
      </div>
    </div>
  );
}