import React from 'react';
import { Mic } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

interface MicrophoneButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  title?: string;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  onClick,
  isProcessing,
  disabled = false,
  title = "Voice input"
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isProcessing || disabled}
      title={title}
      className="react-button inline-flex items-center justify-center rounded-[100px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        opacity: isProcessing ? 0.5 : 1,
        width: '40px',
        height: '40px',
        border: 'none',
        color: 'white'
      }}
    >
      <Mic size={24} />
    </button>
  );
};

export default MicrophoneButton;