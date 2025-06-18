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
    <IconButton
      icon={Mic}
      onClick={onClick}
      variant="ghost"
      size="md"
      disabled={isProcessing || disabled}
      title={title}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        opacity: isProcessing ? 0.5 : 1
      }}
    />
  );
};

export default MicrophoneButton;