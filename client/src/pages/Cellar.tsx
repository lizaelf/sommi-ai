import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';

const Cellar = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-lg font-medium">Cellar</h1>
        <Search className="w-6 h-6 text-white" />
      </div>

      {/* Wine Rack Grid */}
      <div className="p-4 flex-1">
        <div className="grid grid-cols-3 gap-1 max-w-md mx-auto">
          {/* Top Row */}
          <WineRackSlot />
          <WineRackSlot />
          <WineRackSlot />
          
          {/* Middle Row */}
          <WineRackSlot />
          <WineRackSlot />
          <WineRackSlot />
          
          {/* Bottom Row */}
          <WineRackSlot />
          <WineRackSlot />
          <WineRackSlot />
        </div>
      </div>

      {/* Bottom Bar - Safari-style */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 rounded-t-2xl p-4">
        <div className="flex items-center justify-center space-x-8 text-blue-400">
          <ArrowLeft className="w-6 h-6" />
          <ArrowLeft className="w-6 h-6 rotate-180" />
          <div className="w-6 h-6 border border-blue-400 rounded-sm" />
          <div className="w-6 h-6 border border-blue-400 rounded-sm" />
          <div className="w-6 h-6 border border-blue-400 rounded-sm" />
        </div>
        <div className="w-32 h-1 bg-white rounded-full mx-auto mt-4"></div>
      </div>
    </div>
  );
};

const WineRackSlot = () => {
  return (
    <div 
      className="aspect-[3/4] rounded-lg border-2 border-amber-800"
      style={{
        background: `linear-gradient(135deg, 
          #D2691E 0%, 
          #CD853F 15%, 
          #A0522D 30%, 
          #8B4513 45%, 
          #654321 60%, 
          #8B4513 75%, 
          #A0522D 90%, 
          #D2691E 100%)`,
        backgroundImage: `
          linear-gradient(90deg, transparent 30%, rgba(0,0,0,0.1) 50%, transparent 70%),
          linear-gradient(0deg, transparent 30%, rgba(139,69,19,0.3) 50%, transparent 70%)
        `,
        boxShadow: `
          inset 2px 2px 4px rgba(0,0,0,0.3),
          inset -2px -2px 4px rgba(255,255,255,0.1)
        `
      }}
    >
      {/* Wood grain effect */}
      <div 
        className="w-full h-full rounded-lg opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.1) 2px,
              rgba(0,0,0,0.1) 3px
            )
          `
        }}
      />
    </div>
  );
};

export default Cellar;