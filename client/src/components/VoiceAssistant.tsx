import React from "react";
import { VoiceAssistantRefactored } from "./voice/VoiceAssistantRefactored";

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
  return <VoiceAssistantRefactored {...props} />;
};

export default VoiceAssistant;