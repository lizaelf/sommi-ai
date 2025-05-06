import React from 'react';
import SimplifiedChatInterface from '@/components/SimplifiedChatInterface';
import { GlassWater } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative">
        {/* App Header */}
        <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
            <GlassWater className="h-6 w-6 mr-2 text-purple-600" />
            Cabernet AI
          </h1>
        </div>
      </div>
      
      <SimplifiedChatInterface />
    </div>
  );
}
