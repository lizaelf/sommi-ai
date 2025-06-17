import React, { useRef } from "react";
import VoiceAssistantRefactored from "./voice/VoiceAssistantRefactored";

interface VoiceAssistantProps {
  onSendMessage: (
    message: string,
    pillId?: string,
    options?: { textOnly?: boolean; instantResponse?: string },
  ) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = (props) => {
  const voiceRef = useRef<{ forceActivate: () => Promise<void> }>(null);

  const handleForceActivate = async () => {
    if (voiceRef.current) {
      await voiceRef.current.forceActivate();
    }
  };

  return (
    <VoiceAssistantRefactored 
      ref={voiceRef}
      {...props} 
    />
  );
};

export default VoiceAssistant;