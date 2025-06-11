import React from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { X } from 'lucide-react';

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTextChoice: () => void;
  onVoiceChoice: () => void;
}

export default function QRScanModal({ isOpen, onClose, onTextChoice, onVoiceChoice }: QRScanModalProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {/* Close Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="text-center space-y-8 pt-4">
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
    </BottomSheet>
  );
}