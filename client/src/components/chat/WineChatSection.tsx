import React from 'react';
import EnhancedChatInterface from './EnhancedChatInterface';

interface WineChatSectionProps {
  wineId: string;
  isScannedPage: boolean;
}

const WineChatSection: React.FC<WineChatSectionProps> = ({ 
  wine, 
  isScannedPage,
  ...otherProps 
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
        selectedWine={wine}
        isScannedPage={isScannedPage}
      />
    </div>
  );
};

export default WineChatSection;