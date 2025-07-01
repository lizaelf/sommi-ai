import React from 'react';
import EnhancedChatInterface from './EnhancedChatInterface';
import { Wine } from '@/types/wine';

interface ChatSectionProps {
  wine: Wine
  messages?: any[];
  onReady?: () => void;
  isScannedPage?: boolean;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ 
  wine, 
  messages, 
  onReady,
  isScannedPage = false
}) => {
  if (!wine) return null;

  return (
    <div className="mt-0 pb-10">
      <EnhancedChatInterface 
        showBuyButton={true} 
        selectedWine={wine}
        onReady={onReady}
        isScannedPage={isScannedPage}
      />
    </div>
  );
};

export default ChatSection;