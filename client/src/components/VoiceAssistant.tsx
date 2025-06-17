import React from "react";
import { VoiceController } from "./voice/VoiceController";

interface VoiceAssistantProps {
  onSendMessage: (
    message: string,
    pillId?: string,
    options?: { textOnly?: boolean; instantResponse?: string },
  ) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = '',
}) => {
  return (
    <VoiceController
      onSendMessage={onSendMessage}
      isProcessing={isProcessing}
      wineKey={wineKey}
    />
  );
};

export default VoiceAssistant;