import React from 'react';
import type { Conversation } from '@shared/schema';

interface ConversationSelectorProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onCreateNewConversation: () => void;
}

export const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateNewConversation
}) => {
  if (!conversations || conversations.length === 0) {
    return null;
  }

  return (
    <div className="conversation-selector">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Conversations</h3>
        <button 
          onClick={onCreateNewConversation}
          className="px-2 py-1 text-sm bg-[#6A53E7] text-white rounded hover:bg-[#5A43D7] transition-colors"
        >
          New
        </button>
      </div>
      
      <ul className="space-y-1 max-h-60 overflow-y-auto">
        {conversations.map(conversation => (
          <li 
            key={conversation.id}
            className={`px-3 py-2 rounded cursor-pointer ${
              currentConversationId === conversation.id 
                ? 'bg-purple-100 text-purple-800' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="truncate">{conversation.title}</div>
            <div className="text-xs text-gray-500">
              {new Date(conversation.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationSelector;