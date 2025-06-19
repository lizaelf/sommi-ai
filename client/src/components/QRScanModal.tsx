import React from 'react';
import { BottomSheet } from './ui/layout/BottomSheet';
import Button from './ui/buttons/Button';

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
          className="react-button !bg-white/8 !text-white hover:!bg-white/16 !border-none"
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
            onVoiceChoice();
            // Trigger the voice assistant with welcome message
            setTimeout(() => {
              // Dispatch a custom event to trigger voice assistant
              window.dispatchEvent(new CustomEvent('triggerVoiceAssistant'));
            }, 300);
          }}
          variant="primary"
          style={{
            flex: 1,
            height: '56px',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Voice
        </Button>
      </div>
    </BottomSheet>
  );
}