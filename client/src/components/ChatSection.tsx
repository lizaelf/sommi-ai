import React from 'react';
import { EnhancedChatInterface } from './EnhancedChatInterface';

interface ChatSectionProps {
  wine: {
    id: number;
    name: string;
    image: string;
    bottles: number;
    ratings: {
      vn: number;
      jd: number;
      ws: number;
      abv: number;
    };
  };
  messages?: any[];
  onReady?: () => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ 
  wine, 
  messages, 
  onReady 
}) => {
  if (!wine) return null;

  return (
    <div className="mt-0 pb-10">
      <EnhancedChatInterface 
        showBuyButton={true} 
        selectedWine={{
          id: wine.id,
          name: wine.name,
          image: wine.image,
          bottles: wine.bottles,
          ratings: wine.ratings
        }}
        onReady={onReady}
      />
    </div>
  );
};

export default ChatSection;