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
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20">
      <IconButton
        icon={Mic}
        onClick={onClick}
        variant="secondaryIcon"
        size="iconSm"
        disabled={isProcessing || disabled}
        title={title}
      />
    </div>
  );
};

export default MicrophoneButton;