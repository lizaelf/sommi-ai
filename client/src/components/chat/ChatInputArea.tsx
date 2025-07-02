import React from 'react'
import ChatInput from './ChatInput'
import SuggestionPills from '@/components/chat/SuggestionPills'
import { Wine } from '@/types/wine'

interface ChatInputAreaProps {
  currentWine: Wine | null
  currentConversationId: string | number
  isTyping: boolean
  onSendMessage: (message: string) => void
  onSuggestionClick: (suggestion: string) => void
  onKeyboardFocus: (focused: boolean) => void
  onMicClick: () => void
  showBuyButton?: boolean
  showChatInput?: boolean
  conversationId?: string
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({ currentWine, currentConversationId, isTyping, onSendMessage, onSuggestionClick, onKeyboardFocus, onMicClick, showBuyButton = false, showChatInput = true, conversationId }) => {
  return (
    <div className='fixed bottom-0 left-0 right-0 p-4 border-t border-white/20 z-50 bg-[#000000]'>
      <div className='max-w-3xl mx-auto'>
        {/* Suggestion Pills from parsed table */}
        <div className='scrollbar-hide overflow-x-auto mb-2 sm:mb-3 pb-1 -mt-1 flex gap-1.5 sm:gap-2 w-full'>
          <SuggestionPills wineKey={currentWine?.id} conversationId={currentConversationId?.toString() || undefined} onSuggestionClick={onSuggestionClick} isDisabled={isTyping} preferredResponseType='text' context='chat' />
        </div>
        <ChatInput onSendMessage={onSendMessage} isProcessing={isTyping} onMicClick={onMicClick} onFocus={() => onKeyboardFocus(true)} onBlur={() => onKeyboardFocus(false)} />
      </div>
    </div>
  )
}

export default ChatInputArea
