import React from 'react';

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTextChoice: () => void;
  onVoiceChoice: () => void;
}

export default function QRScanModal({ isOpen, onClose, onTextChoice, onVoiceChoice }: QRScanModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div 
          style={{
            background: "#2C2C2C",
            borderRadius: "24px 24px 0 0",
            padding: "32px 24px 40px 24px",
            maxWidth: "500px",
            margin: "0 auto"
          }}
        >
          {/* Modal Content */}
          <div className="text-center space-y-8">
            {/* Title */}
            <h2 style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "20px",
              lineHeight: "28px",
              fontWeight: 500,
              color: "white",
              margin: 0
            }}>
              Would you like to<br />
              learn more about wine by
            </h2>
            
            {/* Choice Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={onTextChoice}
                className="flex-1 h-14 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-white font-medium text-base transition-all duration-200 ease-out"
              >
                Text
              </button>
              
              <button
                onClick={onVoiceChoice}
                className="flex-1 h-14 bg-white hover:bg-white/90 border border-white/20 rounded-full text-black font-semibold text-base transition-all duration-200 ease-out shadow-sm"
              >
                Voice
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}