import React from 'react';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        
        {/* App Header */}
        <div className="bg-background px-4 py-3 flex justify-between items-center border-b border-border">
          <h1 className="text-2xl font-semibold text-primary">Somm.ai</h1>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button className="px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-sm">
              My Cellar
            </button>
          </div>
        </div>
      </div>
      
      <EnhancedChatInterface />
    </div>
  );
}
