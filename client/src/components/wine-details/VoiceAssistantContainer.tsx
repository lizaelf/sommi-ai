import React from 'react';
import VoiceAssistant from '@/components/VoiceAssistant';

interface SelectedWine {
  id: number;
  name: string;
  year?: number;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  location?: string;
  description?: string;
  foodPairing?: string[];
  buyAgainLink?: string;
}

interface VoiceAssistantContainerProps {
  wine: SelectedWine | null;
  isTyping: boolean;
  onSendMessage: (message: string) => void;
}

const VoiceAssistantContainer: React.FC<VoiceAssistantContainerProps> = ({
  wine,
  isTyping,
  onSendMessage,
}) => {
  return (
    <VoiceAssistant
      onSendMessage={onSendMessage}
      isProcessing={isTyping}
      wineKey={wine ? `wine_${wine.id}` : 'default_wine'}
    />
  );
};

export default VoiceAssistantContainer;