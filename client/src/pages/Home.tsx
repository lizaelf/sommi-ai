import React from 'react';
import { Link } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Logo from '@/components/Logo';
import Button from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        
        {/* App Header */}
        <div className="bg-background px-4 py-3 flex justify-between items-center border-b border-border">
          <Logo />
          <div className="flex items-center space-x-3">
            <Link to="/wine/1">
              <Button>
                My Cellar
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <EnhancedChatInterface />
    </div>
  );
}
