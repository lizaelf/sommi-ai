import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation } from 'wouter';

interface SimpleQRCodeProps {
  value: string;
  size?: number;
  wineId?: number;
}

function SimpleQRCode({ value, size = 80, wineId }: SimpleQRCodeProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (wineId) {
      // Navigate to the Scanned wine page with the specific wine ID
      setLocation(`/scanned?wine=${wineId}`);
    } else {
      // Fallback to external URL
      window.open(value, '_blank');
    }
  };

  return (
    <div 
      onClick={handleClick}
      style={{
        background: 'black',
        padding: '8px',
        borderRadius: '8px',
        display: 'inline-block',
        cursor: 'pointer'
      }}
    >
      <QRCodeSVG 
        value={value}
        size={size}
        level="M"
        includeMargin={false}
        fgColor="#FFFFFF"
        bgColor="#000000"
      />
    </div>
  );
}