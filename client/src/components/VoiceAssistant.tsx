import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceAssistantProps {
  onSendMessage: (
    message: string, 
    pillId?: string, 
    options?: { 
      textOnly?: boolean; 
      instantResponse?: string;
      conversationId?: string;
    }
  ) => void;
  isProcessing: boolean;
  wineKey?: string;
  onVoiceToggle?: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onVoiceToggle
}) => {
  const handleMicrophoneClick = () => {
    console.log("Voice button clicked - triggering voice bottom sheet");
    if (onVoiceToggle) {
      onVoiceToggle();
    }
  };

  return (
    <button
      onClick={handleMicrophoneClick}
      className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 flex items-center justify-center"
    >
      <Mic size={20} />
    </button>
  );
};

export default VoiceAssistant;