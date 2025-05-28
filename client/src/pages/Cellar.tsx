import { ArrowLeft, Search, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import backgroundImage from '@assets/Background.png';
import wineBottleImage from '@assets/Product Image.png';
import usFlagImage from '@assets/US-flag.png';
import logoImage from '@assets/Logo.png';
import lineImage from '@assets/line.png';

const Cellar = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(true); // Show modal immediately when entering cellar
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
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

  const handleSave = async () => {
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

    // Submit to backend
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          countryCode: selectedCountry.code
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Contact saved successfully:', data);
        setShowModal(false);
        
        // Show toast notification
        toast({
          description: (
            <span style={{ 
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}>
              Select wine to see past info and chats
            </span>
          ),
          duration: 5000,
          className: "bg-white text-black border-none",
          style: {
            position: 'fixed',
            top: '74px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            maxWidth: 'none',
            padding: '8px 24px',
            borderRadius: '32px',
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
            zIndex: 9999
          }
        });
      } else {
        console.error('Failed to save contact:', data);
        // Handle server validation errors if needed
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle network errors
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleWineClick = (wineId: number) => {
    setLocation(`/wine-details/${wineId}`);
  };

  // Scroll detection effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Fixed Header with scroll background */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300 ${
          isScrolled ? 'bg-black/90 backdrop-blur-sm border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <Link href="/">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-lg font-medium">Cellar</h1>
        <Search className="w-6 h-6 text-white" />
      </div>

      {/* Content with top padding to account for fixed header */}
      <div className="pt-16">
        {/* Cellar Container with rounded corners */}
        <div style={{
          borderRadius: '8px',
          overflow: 'hidden',
          margin: '0 16px 0 16px'
        }}>
          {/* First Wine Rack Container */}
          <div 
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              height: '228px'
            }}
          >
            {/* Empty divs above the image */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors flex items-end justify-center"
                onClick={() => handleWineClick(1)}
              >
                <img src={wineBottleImage} alt="Wine bottle" className="object-contain" style={{ height: '186px' }} />
              </div>
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(2)}
              />
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(3)}
              />
            </div>
          </div>

          {/* Second Wine Rack Container */}
          <div 
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              height: '228px'
            }}
          >
            {/* Empty divs above the image */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(4)}
              />
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(5)}
              />
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(6)}
              />
            </div>
          </div>

          {/* Third Wine Rack Container */}
          <div 
            className="bg-cover bg-center bg-no-repeat relative"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              height: '228px'
            }}
          >
            {/* Empty divs above the image */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1 h-full">
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(7)}
              />
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(8)}
              />
              <div 
                className="cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => handleWineClick(9)}
              />
            </div>
          </div>

          {/* Line separator below last wine rack */}
          <div 
            style={{
              backgroundImage: `url(${lineImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              height: '10px'
            }}
          />
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
              <h2 style={{
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>
                Want to see wine history?
              </h2>
              
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
                  display: 'flex',
                  height: '64px',
                  padding: '16px 24px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  alignSelf: 'stretch',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: '#2A2A29 !important',
                  backgroundColor: '#2A2A29 !important',
                  WebkitBoxShadow: '0 0 0 30px #2A2A29 inset',
                  WebkitTextFillColor: '#959493',
                  color: '#959493',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'white'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
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
                  display: 'flex',
                  height: '64px',
                  padding: '16px 24px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  alignSelf: 'stretch',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: '#2A2A29 !important',
                  backgroundColor: '#2A2A29 !important',
                  WebkitBoxShadow: '0 0 0 30px #2A2A29 inset',
                  WebkitTextFillColor: '#959493',
                  color: '#959493',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'white'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
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
                  display: 'flex',
                  height: '64px',
                  padding: '16px 24px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  alignSelf: 'stretch',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: '#2A2A29 !important',
                  backgroundColor: '#2A2A29 !important',
                  WebkitBoxShadow: '0 0 0 30px #2A2A29 inset',
                  WebkitTextFillColor: '#959493',
                  color: '#959493',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'white'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
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
              
              {/* Country Code Selector - Full Width */}
              <div style={{ position: 'relative', width: '100%' }}>
                <div
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  style={{
                    display: 'flex',
                    height: '64px',
                    padding: '16px 24px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: '#2A2A29 !important',
                    backgroundColor: '#2A2A29 !important',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={selectedCountry.flag} alt={`${selectedCountry.name} Flag`} style={{ width: '24px', height: '24px' }} />
                    <span style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>{selectedCountry.code}</span>
                    <span style={{ color: '#CECECE', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>{selectedCountry.name}</span>
                  </div>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <path d="M4.22 8.47a.75.75 0 0 1 1.06 0L12 15.19l6.72-6.72a.75.75 0 1 1 1.06 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L4.22 9.53a.75.75 0 0 1 0-1.06" fill="white"/>
                  </svg>
                </div>
                
                {showCountryDropdown && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{
                      width: '100%',
                      backgroundColor: '#2A2A29',
                      borderTopLeftRadius: '16px',
                      borderTopRightRadius: '16px',
                      maxHeight: '60vh',
                      overflowY: 'auto'
                    }}>
                      <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: '#2A2A29',
                        zIndex: 1001
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: '600' }}>Select Country</span>
                          <div 
                            onClick={() => setShowCountryDropdown(false)}
                            style={{ cursor: 'pointer', padding: '8px' }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
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
                            gap: '12px',
                            padding: '16px 24px',
                            cursor: 'pointer',
                            borderBottom: index < countries.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <img src={country.flag} alt={`${country.name} Flag`} style={{ width: '24px', height: '24px' }} />
                          <span style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '16px', minWidth: '50px' }}>{country.code}</span>
                          <span style={{ color: '#CECECE', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>{country.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Phone Input - Separate and Full Width */}
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={{
                  display: 'flex',
                  height: '64px',
                  padding: '16px 24px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: '#2A2A29 !important',
                  backgroundColor: '#2A2A29 !important',
                  WebkitBoxShadow: '0 0 0 30px #2A2A29 inset',
                  WebkitTextFillColor: '#959493',
                  color: '#959493',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'white'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
              />
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

    </div>
  );
};



export default Cellar;