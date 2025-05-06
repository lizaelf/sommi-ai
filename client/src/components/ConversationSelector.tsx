import React from 'react';
import { ClientConversation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare } from 'lucide-react';

interface ConversationSelectorProps {
  conversations: ClientConversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onCreateNewConversation: () => void;
}

export function ConversationSelector({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateNewConversation
}: ConversationSelectorProps) {
  // Sort conversations by date (newest first)
  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <div className="w-full rounded-md border bg-background shadow-sm">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="text-sm font-medium">Your Conversations</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCreateNewConversation}
          className="h-8 px-2 text-muted-foreground hover:text-primary"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          <span className="text-xs">New</span>
        </Button>
      </div>
      <div className="max-h-[240px] overflow-y-auto">
        {sortedConversations.length > 0 ? (
          <ul className="py-1">
            {sortedConversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2
                    ${conversation.id === currentConversationId
                      ? 'bg-muted/50 text-primary'
                      : 'hover:bg-muted/30 text-muted-foreground'
                    }`}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDate(conversation.createdAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-3 px-3 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new one!
          </div>
        )}
      </div>
    </div>
  );
}