import React from 'react';
import { Conversation } from '@shared/schema';

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  currentConversationId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <aside 
      className={`${
        isOpen ? 'block' : 'hidden'
      } md:block w-64 bg-white border-r border-gray-200 overflow-y-auto transition-all ${
        isOpen ? 'md:static fixed top-14 left-0 bottom-0 z-10' : ''
      }`}
    >
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md flex items-center justify-center transition-colors"
        >
          <i className="fas fa-plus mr-2"></i> New Chat
        </button>
      </div>
      
      {/* Conversation History */}
      <div className="px-3 py-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Conversation History</h2>
        <div className="space-y-1">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div 
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`flex items-center px-2 py-2 text-sm rounded-md text-gray-700 cursor-pointer ${
                  currentConversationId === conversation.id 
                    ? 'bg-blue-50 font-medium' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <i className={`fas fa-comment${currentConversationId === conversation.id ? '-dots' : ''} mr-2 ${
                  currentConversationId === conversation.id ? 'text-blue-500' : 'text-gray-400'
                }`}></i>
                <span className="truncate">{conversation.title}</span>
              </div>
            ))
          ) : (
            <div className="px-2 py-3 text-sm text-gray-500">
              No conversations yet
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
