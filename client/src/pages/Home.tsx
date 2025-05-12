import React from 'react';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative">
        
        {/* App Header */}
        <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-2xl font-semibold" style={{ color: '#6A53E7' }}>Somm.ai</h1>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-[#F5F3FF] text-[#6A53E7] rounded-full hover:bg-[#EDE9FF] transition-colors text-sm">
              My Cellar
            </button>
          </div>
        </div>
      </div>
      
      <EnhancedChatInterface />
    </div>
  );
}
