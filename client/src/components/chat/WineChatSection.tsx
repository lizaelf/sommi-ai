import React from 'react';
import EnhancedChatInterface from './EnhancedChatInterface';

interface WineChatSectionProps {
  wine: any;
  messages: any[];
  isTyping: boolean;
  hideSuggestions: boolean;
  showChatInput: boolean;
  isKeyboardFocused: boolean;
  currentConversationId: number | null;
  onSendMessage: (content: string) => Promise<void>;
  onSuggestionClick: (content: string) => Promise<void>;
  onKeyboardFocus: (focused: boolean) => void;
  onToggleHideSuggestions: () => void;
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