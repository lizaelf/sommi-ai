import React from 'react';
import { Conversation } from '@shared/schema';
import { PlusCircle } from 'lucide-react';

interface ConversationSelectorProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onCreateNewConversation: () => void;
}

const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateNewConversation
}) => {
  if (!conversations || conversations.length === 0) {
    return null;
  }

  return (
    <div className="conversation-selector bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-800">Your Conversations</h3>
        <button 
          onClick={onCreateNewConversation}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#6A53E7] text-white rounded-full hover:bg-purple-700 transition-colors"
        >
          <PlusCircle size={16} />
          <span>New</span>
        </button>
      </div>
      
      <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {conversations.map(conversation => (
          <li 
            key={conversation.id}
            className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
              currentConversationId === conversation.id 
                ? 'bg-purple-100 text-purple-800 border-l-2 border-[#6A53E7]' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="font-medium truncate">{conversation.title || 'Untitled Conversation'}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(conversation.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationSelector;