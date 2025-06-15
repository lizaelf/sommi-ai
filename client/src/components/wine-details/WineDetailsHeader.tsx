import React from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Link } from 'wouter';
import Button from '@/components/ui/Button';
import { AppHeader } from '@/components/AppHeader';

interface WineDetailsHeaderProps {
  showActions: boolean;
  onToggleActions: () => void;
  onDeleteAccount: () => void;
}

const WineDetailsHeader: React.FC<WineDetailsHeaderProps> = ({
  showActions,
  onToggleActions,
  onDeleteAccount,
}) => {
  return (
    <AppHeader
      rightContent={
        <div style={{ position: 'relative' }}>
          <Button
            variant="headerIcon"
            onClick={onToggleActions}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              backgroundColor: showActions ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
          >
            <MoreHorizontal size={24} />
          </Button>
          {showActions && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                minWidth: '200px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={onDeleteAccount}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      }
    />
  );
};

export default WineDetailsHeader;