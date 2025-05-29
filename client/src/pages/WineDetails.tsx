import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { getWineDisplayName } from '../../../shared/wineConfig';

interface WineData {
  id: number;
  name: string;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
}

export default function WineDetails() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedWine, setSelectedWine] = useState<WineData | null>(null);
  
  // Check for selected wine data and scroll listener
  useEffect(() => {
    // Check localStorage for selected wine data
    const storedWine = localStorage.getItem('selectedWine');
    console.log('WineDetails - Stored wine data:', storedWine);
    if (storedWine) {
      const wineData = JSON.parse(storedWine);
      console.log('WineDetails - Parsed wine data:', wineData);
      setSelectedWine(wineData);
      console.log('WineDetails - Set selectedWine state to:', wineData);
      // Clear after use
      localStorage.removeItem('selectedWine');
    }

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
  
  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {/* App Header - Same as Scanned page */}
        <div
          style={{
            backgroundColor: scrolled
              ? "rgba(23, 23, 23, 0.5)"
              : "rgba(10, 10, 10, 0)",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
            borderBottom: "none",
            height: "75px",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
          className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center transition-all duration-300`}
        >
          {/* Back Button */}
          <Link href="/home-global">
            <Button
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                padding: "0",
                height: "auto",
                fontSize: "16px",
                fontWeight: 400,
              }}
            >
              ← Back
            </Button>
          </Link>

          {/* Logo */}
          <Logo />

          {/* Empty space for layout balance */}
          <div style={{ width: "60px" }}></div>
        </div>
        
        {/* Empty space to account for the fixed header */}
        <div className="h-14"></div>
        
        {/* Wine Title */}
        <div className="px-4 pt-4 pb-2">
          <h1
            style={{
              fontFamily: "Lora, serif",
              fontSize: "24px",
              lineHeight: "32px",
              fontWeight: 500,
              color: "white",
              textAlign: "center"
            }}
          >
            {(() => {
              console.log('WineDetails - Rendering title, selectedWine:', selectedWine);
              return selectedWine ? selectedWine.name : getWineDisplayName();
            })()}
          </h1>
        </div>

        {/* Wine Image - show selected wine image if available */}
        {selectedWine && (
          <div className="flex justify-center items-center px-4 pb-4">
            <img
              src={selectedWine.image}
              alt={selectedWine.name}
              style={{
                height: "170px",
                width: "auto",
              }}
            />
          </div>
        )}
      </div>
      
      <EnhancedChatInterface />
    </div>
  );
}