import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';
import typography from '@/styles/typography';
import { getWineDisplayName } from '../../../shared/wineConfig';
import { DataSyncManager } from '@/utils/dataSync';

interface SelectedWine {
  id: number;
  name: string;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
}

export default function Scanned() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedWine, setSelectedWine] = useState<SelectedWine | null>(null);
  const [location] = useLocation();
  
  // Load selected wine data from URL parameter or localStorage
  const loadSelectedWine = () => {
    try {
      // Check for wine ID in URL parameters
      console.log('Current location:', location);
      console.log('Window location:', window.location.href);
      const urlParams = new URLSearchParams(window.location.search);
      const wineId = urlParams.get('wine');
      console.log('Parsed wine ID from URL:', wineId);
      
      if (wineId) {
        console.log('URL contains wine ID:', wineId);
        console.log('Wine ID requested:', wineId);
        console.log('All wines in DataSyncManager:', DataSyncManager.getUnifiedWineData());
        // Get wine data from DataSyncManager using the ID from URL
        const wine = DataSyncManager.getWineById(parseInt(wineId));
        console.log('DataSyncManager returned wine:', wine);
        if (wine) {
          return wine;
        }
      }
      
      // Fallback to localStorage for backwards compatibility
      const storedWine = localStorage.getItem('selectedWine');
      if (storedWine) {
        const wine = JSON.parse(storedWine);
        // Clear the stored data after use
        localStorage.removeItem('selectedWine');
        return wine;
      }
      return null;
    } catch (error) {
      console.error('Error loading selected wine:', error);
      return null;
    }
  };
  
  // Load wine data when component mounts or location changes
  useEffect(() => {
    console.log('Scanned page location changed:', location);
    const wine = loadSelectedWine();
    console.log('Loaded wine in Scanned page:', wine);
    setSelectedWine(wine);
  }, [location]);
  
  // Add scroll listener
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

        {/* Wine Image - only show if selectedWine exists */}
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
      
      <EnhancedChatInterface selectedWine={selectedWine} />
    </div>
  );
}
