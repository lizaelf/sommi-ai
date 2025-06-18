import React from 'react';
import Button from '@/components/ui/Button';
import ChatInput from '@/components/ChatInput';
import SuggestionPills from '@/components/SuggestionPills';

interface ChatInputAreaProps {
  showBuyButton: boolean;
  showChatInput: boolean;
  currentWine?: any;
  currentConversationId?: number;
  isTyping: boolean;
  onBuyClick: () => void;
  onSendMessage: (message: string) => void;
  onSuggestionClick: (prompt: string, apiPrompt: string) => void;
  onKeyboardFocus: () => void;
  onKeyboardBlur: () => void;
  onMicClick: () => void;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  showBuyButton,
  showChatInput,
  currentWine,
  currentConversationId,
  isTyping,
  onBuyClick,
  onSendMessage,
  onSuggestionClick,
  onKeyboardFocus,
  onKeyboardBlur,
  onMicClick
}) => {
  return (
    <div
      style={{
        backgroundColor: "#1C1C1C",
        padding: "16px",
        zIndex: 50,
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {showBuyButton && !showChatInput ? (
          <Button
            onClick={onBuyClick}
            variant="primary"
            style={{
              margin: 0,
              width: "100%",
            }}
          >
            Buy again
          </Button>
        ) : (
          <>
            {/* Suggestion Pills from parsed table */}
            <div className="scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full">
              <SuggestionPills
                wineKey={currentWine ? `wine_${currentWine.id}` : "default"}
                conversationId={currentConversationId?.toString()}
                onSuggestionClick={(prompt, pillId, options) => {
                  console.log("ChatInputArea: SuggestionPills clicked:", prompt);
                  // Use the button text for API call
                  const apiPrompt = prompt;
                  onSuggestionClick(prompt, apiPrompt);
                }}
                isDisabled={isTyping}
                preferredResponseType="text"
                context="chat"
              />
            </div>
            <ChatInput
              onSendMessage={onSendMessage}
              isProcessing={isTyping}
              onFocus={onKeyboardFocus}
              onBlur={onKeyboardBlur}
              onMicClick={onMicClick}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInputArea;