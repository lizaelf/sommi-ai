import React from 'react';
import { BottomSheet } from './ui/BottomSheet';

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
        <button
          onClick={onTextChoice}
          className="flex-1 h-14 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-white font-medium text-base transition-all duration-200 ease-out"
        >
          Text
        </button>
        
        <button
          onClick={onVoiceChoice}
          className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-full text-white font-semibold text-base transition-all duration-200 ease-out shadow-lg"
        >
          Voice
        </button>
      </div>
    </BottomSheet>
  );
}