import React from 'react';
import { useLocation } from 'wouter';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import { getWineDisplayName } from '@shared/wineConfig';

/**
 * Internal Wine Page - A dedicated page for wine exploration and conversation
 * This page contains the full wine interface with chat functionality
 */
const InternalWinePage: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black">
      {/* Header with navigation and wine name */}
      <div style={{
        backgroundColor: '#1C1C1C',
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100
      }}>
        <button
          onClick={() => setLocation('/')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ←
        </button>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: 0,
          color: 'white'
        }}>
          {getWineDisplayName()}
        </h1>
      </div>
      
      {/* Main content with top padding to account for fixed header */}
      <div style={{ paddingTop: '72px' }}>
        <EnhancedChatInterface showBuyButton={false} />
      </div>
    </div>
  );
};

export default InternalWinePage;