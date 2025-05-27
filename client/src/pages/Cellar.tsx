import { ArrowLeft, Search, X } from 'lucide-react';
import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import backgroundImage from '@assets/Background.png';
import wineBottleImage from '@assets/Product Image.png';
import usFlagImage from '@assets/US-flag.png';
import logoImage from '@assets/Logo.png';

const Cellar = () => {
  const [showModal, setShowModal] = useState(true); // Show modal immediately when entering cellar
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [selectedCountry, setSelectedCountry] = useState({
    code: '+1',
    flag: usFlagImage,
    name: 'US'
  });

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const countries = [
    { code: '+1', flag: usFlagImage, name: 'United States' },
    { code: '+1', flag: usFlagImage, name: 'Canada' },
    { code: '+44', flag: usFlagImage, name: 'United Kingdom' },
    { code: '+61', flag: usFlagImage, name: 'Australia' },
    { code: '+49', flag: usFlagImage, name: 'Germany' },
    { code: '+33', flag: usFlagImage, name: 'France' },
    { code: '+39', flag: usFlagImage, name: 'Italy' },
    { code: '+34', flag: usFlagImage, name: 'Spain' },
    { code: '+86', flag: usFlagImage, name: 'China' },
    { code: '+81', flag: usFlagImage, name: 'Japan' },
    { code: '+91', flag: usFlagImage, name: 'India' },
    { code: '+55', flag: usFlagImage, name: 'Brazil' },
    { code: '+7', flag: usFlagImage, name: 'Russia' },
    { code: '+27', flag: usFlagImage, name: 'South Africa' },
    { code: '+52', flag: usFlagImage, name: 'Mexico' },
    { code: '+82', flag: usFlagImage, name: 'South Korea' },
    { code: '+54', flag: usFlagImage, name: 'Argentina' },
    { code: '+64', flag: usFlagImage, name: 'New Zealand' },
    { code: '+31', flag: usFlagImage, name: 'Netherlands' },
    { code: '+46', flag: usFlagImage, name: 'Sweden' },
    { code: '+47', flag: usFlagImage, name: 'Norway' },
    { code: '+41', flag: usFlagImage, name: 'Switzerland' },
    { code: '+32', flag: usFlagImage, name: 'Belgium' },
    { code: '+43', flag: usFlagImage, name: 'Austria' },
    { code: '+353', flag: usFlagImage, name: 'Ireland' },
    { code: '+65', flag: usFlagImage, name: 'Singapore' },
    { code: '+60', flag: usFlagImage, name: 'Malaysia' },
    { code: '+66', flag: usFlagImage, name: 'Thailand' },
    { code: '+62', flag: usFlagImage, name: 'Indonesia' },
    { code: '+966', flag: usFlagImage, name: 'Saudi Arabia' },
    { code: '+971', flag: usFlagImage, name: 'United Arab Emirates' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Clear previous errors
    setErrors({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });

    // Validate all fields
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    console.log('Form data:', formData);
    // Handle form submission here
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  // Portal setup effect
  useEffect(() => {
    let element = document.getElementById('contact-bottom-sheet-portal');
    if (!element) {
      element = document.createElement('div');
      element.id = 'contact-bottom-sheet-portal';
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      if (element && element.parentElement && !showModal) {
        element.parentElement.removeChild(element);
      }
    };
  }, []);

  // Body scroll lock effect
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Animation state effect
  useEffect(() => {
    if (showModal && animationState === 'closed') {
      setAnimationState('opening');
      setTimeout(() => setAnimationState('open'), 50);
    } else if (!showModal && (animationState === 'open' || animationState === 'opening')) {
      setAnimationState('closing');
      setTimeout(() => setAnimationState('closed'), 300);
    }
  }, [showModal, animationState]);

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

      {/* Contact Info Bottom Sheet */}
      {animationState !== 'closed' && portalElement && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            opacity: animationState === 'open' ? 1 : animationState === 'opening' ? 0.8 : 0,
            transition: 'opacity 0.3s ease-out'
          }}
          onClick={handleClose}
        >
          <div 
            style={{
              background: 'linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)',
              backdropFilter: 'blur(20px)',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0px 0px',
              borderTop: '1px solid rgba(255, 255, 255, 0.20)',
              paddingTop: '24px',
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingBottom: '28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
              transform: animationState === 'open' ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                cursor: 'pointer',
                zIndex: 10
              }}
              onClick={handleClose}
            >
              <X size={24} color="white" />
            </div>

            {/* Header */}
            <div style={{ marginBottom: '24px', marginTop: '8px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '16px' 
              }}>
                <img 
                  src={logoImage} 
                  alt="SOMM Logo" 
                  style={{ 
                    height: '32px',
                    width: 'auto'
                  }} 
                />
              </div>
              
              <p style={{
                color: '#CECECE',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '1.5',
                textAlign: 'left'
              }}>
                Enter your contact info to see your wine history and chats.
              </p>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#000000',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {errors.firstName && (
                <div style={{ 
                  color: '#ff4444', 
                  fontSize: '14px', 
                  marginTop: '4px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {errors.firstName}
                </div>
              )}
              
              <input
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#000000',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {errors.lastName && (
                <div style={{ 
                  color: '#ff4444', 
                  fontSize: '14px', 
                  marginTop: '4px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {errors.lastName}
                </div>
              )}
              
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#000000',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {errors.email && (
                <div style={{ 
                  color: '#ff4444', 
                  fontSize: '14px', 
                  marginTop: '4px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {errors.email}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    style={{
                      display: 'flex',
                      height: '48px',
                      padding: '12px 16px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '10px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#000000',
                      cursor: 'pointer'
                    }}
                  >
                    <img src={selectedCountry.flag} alt={`${selectedCountry.name} Flag`} style={{ width: '24px', height: '24px' }} />
                    <span style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>{selectedCountry.code}</span>
                  </div>
                  
                  {showCountryDropdown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '72px',
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(20px)',
                      zIndex: 1000,
                      overflow: 'hidden',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {countries.map((country, index) => (
                        <div
                          key={`${country.code}-${index}`}
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '16px 24px',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <img src={country.flag} alt={`${country.name} Flag`} style={{ width: '24px', height: '24px' }} />
                          <span style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>{country.code}</span>
                          <span style={{ color: '#CECECE', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>{country.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{
                    flex: 1,
                    height: '48px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#000000',
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.phone && (
                <div style={{ 
                  color: '#ff4444', 
                  fontSize: '14px', 
                  marginTop: '4px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {errors.phone}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '32px',
                height: '56px',
                padding: '0 16px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              Save
            </button>
          </div>
        </div>,
        portalElement
      )}

    </div>
  );
};



export default Cellar;