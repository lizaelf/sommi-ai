import React from 'react';

interface SimpleQRCodeProps {
  value: string;
  size?: number;
}

export function SimpleQRCode({ value, size = 80 }: SimpleQRCodeProps) {
  // Create a simple QR code placeholder that displays the wine ID
  const wineId = value.split('/').pop() || 'Unknown';
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      background: 'white',
      border: '2px solid #000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      textAlign: 'center',
      color: '#000',
      borderRadius: '4px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>QR CODE</div>
      <div>Wine #{wineId}</div>
      <div style={{ fontSize: '8px', marginTop: '2px', opacity: 0.6 }}>
        Scan to add
      </div>
    </div>
  );
}