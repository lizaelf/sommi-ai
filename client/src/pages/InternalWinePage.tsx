import React from 'react';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';

/**
 * Internal Wine Page - A dedicated page for wine exploration and conversation
 * This page contains the full wine interface with chat functionality
 */
const InternalWinePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <EnhancedChatInterface showBuyButton={false} />
    </div>
  );
};

export default InternalWinePage;