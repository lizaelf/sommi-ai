import React from 'react';
import { Conversation } from '@shared/schema';
import { formatDate, truncateString } from '@/lib/utils';
import { MessageSquare, Plus } from 'lucide-react';

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
  return (
    <div className="h-full flex flex-col">
      {/* New Chat Button */}
      <button
        onClick={onCreateNewConversation}
        className="flex items-center gap-2 p-3 mb-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Plus size={16} />
        <span>New Conversation</span>
      </button>

      {/* Conversation List */}
      <div className="overflow-y-auto flex-1">
        {conversations.length === 0 ? (
          <div className="text-center p-4 text-gray-500">No conversations yet</div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg flex items-start gap-2 transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-purple-100 text-purple-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare 
                    size={18} 
                    className={currentConversationId === conversation.id 
                      ? 'text-purple-600' 
                      : 'text-gray-400'} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {truncateString(conversation.title || 'New Conversation', 25)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(conversation.createdAt)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationSelector;