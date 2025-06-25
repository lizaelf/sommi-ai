import React from 'react';
import EnhancedChatInterface from './EnhancedChatInterface';
import { Wine } from '@/types/wine';

interface WineChatSectionProps {
  wine: Wine;
  isScannedPage: boolean;
}

const WineChatSection: React.FC<WineChatSectionProps> = ({ 
  wine, 
  isScannedPage
}) => {
  return (
    <div
      style={{
        width: "100%",
        background: "black",
        paddingTop: "40px",
        marginTop: "-20px",
      }}
    >
      <EnhancedChatInterface
      wine={wine}
        isScannedPage={isScannedPage}
      />
    </div>
  );
};

export default WineChatSection;