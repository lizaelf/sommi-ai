import React from 'react';
import SimpleChatInterface from '@/components/SimpleChatInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative">
        
        {/* App Header */}
        <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Somm.ai</h1>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
              Cellar
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
              Me
            </button>
          </div>
        </div>
      </div>
      
      <SimpleChatInterface />
    </div>
  );
}
