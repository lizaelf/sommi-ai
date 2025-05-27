import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';
import backgroundImage from '@assets/Background.png';
import wineImage from '@assets/wine-circle.png';

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
        className="bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          height: '228px',
          margin: '0 16px 0 16px'
        }}
      >
        {/* Empty divs above the image */}
        <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors relative flex items-center justify-center">
            <img src={wineImage} alt="Wine bottle" className="w-8 h-8 object-contain" />
          </div>
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors relative flex items-center justify-center">
            <img src={wineImage} alt="Wine bottle" className="w-8 h-8 object-contain" />
          </div>
        </div>
      </div>

      {/* Second Wine Rack Container - Below the first one */}
      <div 
        className="bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          height: '228px',
          margin: '0 16px 0 16px'
        }}
      >
        {/* Empty divs above the image */}
        <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
        </div>
      </div>

      {/* Third Wine Rack Container - Below the second one */}
      <div 
        className="bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          height: '228px',
          margin: '0 16px 0 16px'
        }}
      >
        {/* Empty divs above the image */}
        <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
        </div>
      </div>

    </div>
  );
};



export default Cellar;