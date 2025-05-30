import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface SimpleQRCodeProps {
  value: string;
  size?: number;
}

export function SimpleQRCode({ value, size = 80 }: SimpleQRCodeProps) {
  return (
    <div style={{
      background: 'white',
      padding: '8px',
      borderRadius: '8px',
      display: 'inline-block'
    }}>
      <QRCodeSVG 
        value={value}
        size={size}
        level="M"
        includeMargin={false}
      />
    </div>
  );
}