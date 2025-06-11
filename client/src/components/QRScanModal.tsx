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
              fontSize: "24px",
              lineHeight: "32px",
              fontWeight: 500,
              color: "white",
              margin: 0
            }}>
              Would you like to<br />
              learn more about wine by
            </h2>
            
            {/* Choice Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onTextChoice}
                style={{
                  flex: 1,
                  height: "56px",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "28px",
                  color: "white",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                }}
              >
                Text
              </button>
              
              <button
                onClick={onVoiceChoice}
                style={{
                  flex: 1,
                  height: "56px",
                  background: "white",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "28px",
                  color: "black",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                }}
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