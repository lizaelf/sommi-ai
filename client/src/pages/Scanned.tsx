import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import WineBottleImage from '@/components/WineBottleImage';
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

export default function Scanned() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedWine, setSelectedWine] = useState<WineData | null>(null);
  
  // Wine data array - same as HomeGlobal
  const wines = [
    {
      id: 1,
      name: "Ridge Vineyards \"Lytton Springs\" Dry Creek Zinfandel",
      bottles: 4,
      image: "/@fs/home/runner/workspace/attached_assets/Product%20Image.png",
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
      image: "/@fs/home/runner/workspace/attached_assets/image-2.png",
      ratings: {
        vn: 95,
        jd: 93,
        ws: 93,
        abv: 14.3,
      },
    },
  ];
  
  // Check for wine ID in URL parameters and scroll listener
  useEffect(() => {
    // Check for wine ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const wineId = urlParams.get('wine');
    
    if (wineId) {
      const wineIdNum = parseInt(wineId, 10);
      const wine = wines.find(w => w.id === wineIdNum);
      console.log('Found wine from URL parameter:', wine);
      if (wine) {
        setSelectedWine(wine);
        console.log('Set selectedWine state to:', wine);
      }
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
        
        {/* App Header - Fully transparent by default, filled with blur when scrolled */}
        <div 
          style={{
            backgroundColor: scrolled ? 'rgba(23, 23, 23, 0.5)' : 'rgba(10, 10, 10, 0)',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom: 'none',
            height: '75px',
            paddingLeft: '24px',
            paddingRight: '24px'
          }}
          className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center transition-all duration-300`}
        >
          <Link to="/home-global">
            <Logo />
          </Link>
          <div className="flex items-center space-x-3">
            <Link to="/cellar">
              <div style={{
                width: 'auto',
                height: '40px',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '24px',
                border: '1px solid transparent',
                backgroundImage: 'linear-gradient(#0A0A0A, #0A0A0A), linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.2))',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                padding: '0 16px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <span style={{
                  color: 'white',
                  fontSize: '14px',
                  lineHeight: 'normal',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '400',
                  display: 'inline-block',
                  padding: '0',
                  margin: '0'
                }}>
                  My cellar
                </span>
              </div>
            </Link>
          </div>
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
{selectedWine ? selectedWine.name : getWineDisplayName()}
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
