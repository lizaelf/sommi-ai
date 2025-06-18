import React from 'react';
import { BottomSheet } from './ui/BottomSheet';
import Button from './ui/Button';

interface TextVoiceChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTextChoice: () => void;
  onVoiceChoice: () => void;
}

export default function TextVoiceChoiceModal({ isOpen, onClose, onTextChoice, onVoiceChoice }: TextVoiceChoiceModalProps) {
  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose}
      title="How would you like to interact?"
    >
      {/* Choice Buttons */}
      <div className="flex gap-3 w-full">
        <Button
          onClick={() => {
            onTextChoice();
            onClose();
          }}
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
            onVoiceChoice();
            onClose();
            // Trigger the voice assistant with welcome message
            setTimeout(() => {
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