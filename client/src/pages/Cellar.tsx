import { ArrowLeft, Search, X } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import backgroundImage from '@assets/Background.png';
import wineBottleImage from '@assets/Product Image.png';
import usFlagImage from '@assets/US-flag.png';

const Cellar = () => {
  const [showModal, setShowModal] = useState(true); // Show modal immediately when entering cellar
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Handle form submission here
    console.log('Form data:', formData);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
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
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors flex items-end justify-center">
            <img src={wineBottleImage} alt="Wine bottle" className="object-contain" style={{ height: '186px' }} />
          </div>
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
          <div className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors" />
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

      {/* Contact Info Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light tracking-wider text-white">SOMM</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <p className="text-gray-300 mb-6 text-sm">
              Enter your contact info to see your wine history and chats.
            </p>

            {/* Form Fields */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white"
              />
              
              <input
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white"
              />
              
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white"
              />
              
              <div className="flex gap-2">
                <div className="flex items-center bg-transparent border border-gray-600 rounded-lg px-3 py-3">
                  <img src={usFlagImage} alt="US Flag" className="w-6 h-4 mr-2" />
                  <span className="text-white text-sm">+1</span>
                </div>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="flex-1 bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full bg-transparent border border-gray-600 rounded-lg py-3 mt-6 text-white hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

    </div>
  );
};



export default Cellar;