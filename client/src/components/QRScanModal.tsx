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
        
        <Button
          onClick={() => {
            // Close the QR modal first
            onClose();
            // Trigger the voice assistant
            setTimeout(() => {
              // Dispatch a custom event to trigger voice assistant
              window.dispatchEvent(new CustomEvent('triggerVoiceAssistant'));
            }, 100);
          }}
          variant="primary"
          style={{
            flex: 1,
            height: '56px',
            fontSize: '16px',
            fontWeight: 600,
            backgroundColor: '#2563eb', // blue-600
          }}
        >
          Voice
        </Button>
      </div>
    </BottomSheet>
  );
}