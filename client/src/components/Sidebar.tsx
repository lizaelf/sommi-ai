import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Conversation } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';
import ConversationSelector from './ConversationSelector';

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  currentConversationId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onToggle: () => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onToggle,
  onClose
}) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}
    
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-gray-200 shadow-lg ${
          isMobile 
            ? `fixed top-0 bottom-0 left-0 z-50 w-72 transition-transform duration-300 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `relative transition-width duration-300 ${
                isOpen ? 'w-72' : 'w-0'
              }`
        }`}
      >
        <div className={`h-full flex flex-col overflow-hidden ${!isOpen && !isMobile ? 'invisible' : ''}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Conversations</h2>
            {isMobile && (
              <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Conversation List */}
          <div className="flex-1 overflow-hidden p-3">
            <ConversationSelector
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onCreateNewConversation={onNewChat}
            />
          </div>
        </div>
      </aside>
      
      {/* Toggle button for desktop */}
      {!isMobile && (
        <button 
          onClick={onToggle}
          className="absolute top-5 left-0 transform translate-x-full bg-white border border-gray-200 rounded-r-md p-2 shadow-md hover:bg-gray-50 z-10"
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      )}
    </>
  );
};

export default Sidebar;