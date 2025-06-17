import React, { useState, useRef, useEffect } from "react";
import { VoiceController } from "./voice/VoiceController";

export interface VoiceAssistantProps {
  onClose?: () => void;
  conversationId?: number;
  wineKey?: string;
  isVoiceContext?: boolean;
  onSendMessage?: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  onClose, 
  conversationId, 
  wineKey,
  isVoiceContext = true,
  onSendMessage
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => {
    if (onSendMessage) {
      onSendMessage(message, pillId, options);
    }
  };

  return (
    <VoiceController
      onSendMessage={handleSendMessage}
      isProcessing={isProcessing}
      wineKey={wineKey}
    />
  );
};

export default VoiceAssistant;