import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';
import backgroundImage from '@assets/Background.png';

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

      {/* Wine Rack Container */}
      <div 
        className="flex-1 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          minHeight: 'calc(100vh - 75px)',
          padding: '16px'
        }}
      >
        {/* Transparent overlay to make slots clickable */}
        <div 
          className="grid grid-cols-3 gap-1 max-w-md mx-auto h-full"
          style={{ padding: '16px' }}
        >
          {/* Top Row */}
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
          
          {/* Middle Row */}
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
          
          {/* Bottom Row */}
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
          <div className="aspect-[3/4] cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors rounded-lg" />
        </div>
      </div>


    </div>
  );
};



export default Cellar;