import React from 'react';
import { Link } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Logo from '@/components/Logo';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        
        {/* App Header */}
        <div className="bg-background px-4 py-3 flex justify-between items-center border-b border-border">
          <Logo />
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Link to="/wine/1">
              <button className="px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm">
                My Cellar
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      <EnhancedChatInterface />
    </div>
  );
}
