import React, { useState } from 'react';
import { Link } from 'wouter';
import Logo from '@/components/Logo';

export default function Home() {
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScannedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
      color: '#000',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid #E5E5E5'
      }}>
        <div style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#000'
        }}>
          Somm
        </div>
        <Link to="/cellar">
          <div style={{
            fontSize: '18px',
            fontWeight: '500',
            color: '#000',
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            My Cellar
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        {/* Headlines */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#000',
          marginBottom: '16px',
          lineHeight: '1.2'
        }}>
          Great Headline
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '40px',
          lineHeight: '1.4'
        }}>
          Supporting Message
        </p>

        {/* Wine Scanning Interface */}
        <div style={{
          backgroundColor: '#FFF',
          borderRadius: '16px',
          border: '1px solid #E5E5E5',
          padding: '32px',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          {scannedImage ? (
            <div style={{ marginBottom: '20px' }}>
              <img 
                src={scannedImage} 
                alt="Scanned wine" 
                style={{
                  width: '200px',
                  height: '300px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}
              />
              <p style={{
                fontSize: '14px',
                color: '#999',
                marginBottom: '20px'
              }}>
                Take a picture of wine bottle
              </p>
            </div>
          ) : (
            <div style={{
              width: '200px',
              height: '300px',
              backgroundColor: '#F5F5F5',
              borderRadius: '12px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #DDD'
            }}>
              <div style={{
                fontSize: '48px',
                color: '#CCC'
              }}>
                📷
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#F5F5F5',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px'
            }}>
              ✕
            </button>
            
            <label style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#DC3545',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '24px'
            }}>
              📷
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
            
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#F5F5F5',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px'
            }}>
              🔄
            </button>
          </div>
        </div>

        {/* Call to Action */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#000',
          marginBottom: '16px',
          lineHeight: '1.3'
        }}>
          Just Scan a<br />QR code or Wine Label
        </h2>

        {/* Marketing Content */}
        <div style={{
          textAlign: 'left',
          marginTop: '40px',
          paddingTop: '40px',
          borderTop: '1px solid #E5E5E5'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#666',
            lineHeight: '1.6'
          }}>
            Scroll through product marketing that covers what Somm.ai does and why you should download the app
          </p>
        </div>
      </div>
    </div>
  );
}
