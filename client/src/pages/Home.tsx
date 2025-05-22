import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  
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
  
  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        
        {/* App Header - Transparent by default, filled when scrolled */}
        <div 
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-between items-center transition-all duration-300 ${
            scrolled 
              ? 'bg-background border-b border-border' 
              : 'bg-transparent'
          }`}
        >
          <Logo />
          <div className="flex items-center space-x-3">
            <Link to="/wine/1">
              <Button>
                My Cellar
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Empty space to account for the fixed header */}
        <div className="h-14"></div>
      </div>
      
      <EnhancedChatInterface />
    </div>
  );
}
