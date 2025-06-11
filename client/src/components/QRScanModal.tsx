import React from 'react';
import { BottomSheet } from './ui/BottomSheet';
import Button from './ui/Button';

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTextChoice: () => void;
  onVoiceChoice: () => void;
}

export default function QRScanModal({ isOpen, onClose, onTextChoice, onVoiceChoice }: QRScanModalProps) {
  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose}
      title="Would you like to learn more about wine by"
    >
      {/* Choice Buttons */}
      <div className="flex gap-3 w-full">
        <Button
          onClick={onClose}
          variant="secondary"
          style={{
            flex: 1,
            height: '56px',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          Text
        </Button>
        
        <button
          onClick={() => {
            // Close the QR modal first
            onClose();
            // Trigger the voice assistant
            setTimeout(() => {
              // Dispatch a custom event to trigger voice assistant
              window.dispatchEvent(new CustomEvent('triggerVoiceAssistant'));
            }, 100);
          }}
          style={{
            flex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '24px',
            padding: '8px 12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s ease',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            height: '56px',
            minWidth: 'fit-content'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          Voice
        </button>
      </div>
    </BottomSheet>
  );
}