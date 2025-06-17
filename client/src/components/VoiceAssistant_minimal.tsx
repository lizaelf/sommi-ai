import React from "react";

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
  return (
    <div className="voice-assistant-container">
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
        <div className="text-center">
          <h2 className="text-xl mb-4">Voice Assistant</h2>
          <p className="text-white/60">Voice functionality temporarily disabled for debugging</p>
          {onClose && (
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;