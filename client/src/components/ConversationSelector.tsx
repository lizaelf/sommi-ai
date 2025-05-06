import React from 'react';
import { ClientConversation } from '@/lib/types';
import { truncateString, formatDate } from '@/lib/utils';

interface ConversationSelectorProps {
  conversations: ClientConversation[];
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
  // If no conversations, show a button to create the first one
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <button 
          onClick={onCreateNewConversation}
          className="px-3 py-2 text-sm bg-[#6A53E7] text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Start New Conversation
        </button>
      </div>
    );
  }

  return (
    <div className="conversation-selector p-3 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-gray-800">Your Conversations</h3>
        <button 
          onClick={onCreateNewConversation}
          className="px-2.5 py-1.5 text-xs font-medium bg-[#6A53E7] text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New
        </button>
      </div>
      
      <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {conversations.map(conversation => (
          <li 
            key={conversation.id}
            className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
              currentConversationId === conversation.id 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : 'hover:bg-gray-100 border border-transparent'
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-center">
              <div className="flex-1">
                <div className="font-medium truncate">
                  {truncateString(conversation.title, 28)}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatDate(conversation.createdAt)}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationSelector;