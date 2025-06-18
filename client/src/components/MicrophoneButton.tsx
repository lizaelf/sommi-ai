import React from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    <Button
      variant="secondary"
      size="icon"
      onClick={onClick}
      disabled={isProcessing || disabled}
      title={title}
      className="w-10 h-10"
      style={{
        opacity: isProcessing ? 0.5 : 1,
      }}
    >
      <Mic size={24} />
    </Button>
  );
};

export default MicrophoneButton;