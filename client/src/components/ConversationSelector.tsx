import React from 'react';
import { Conversation } from '@shared/schema';
import { truncateString, formatDate } from '@/lib/utils';

// ConversationSelector props interface
interface ConversationSelectorProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onCreateNewConversation: () => void;
}

// ConversationSelector component
const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateNewConversation
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#6A53E7]">Conversations</h2>
        <button
          onClick={onCreateNewConversation}
          className="text-white bg-[#6A53E7] hover:bg-[#5846c5] px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        >
          New Chat
        </button>
      </div>
      
      {conversations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No conversations yet
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 -mx-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`p-3 my-1 rounded-lg cursor-pointer transition-colors ${
                conversation.id === currentConversationId
                  ? 'bg-purple-100 border-l-4 border-[#6A53E7]'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className={`font-medium ${
                  conversation.id === currentConversationId ? 'text-[#6A53E7]' : 'text-gray-800'
                }`}>
                  {truncateString(conversation.title, 20)}
                </h3>
                <span className="text-xs text-gray-500">
                  {formatDate(conversation.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationSelector;