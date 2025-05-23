import React, { useEffect, useState } from 'react';
import wineGlassImage from '@assets/Preset.png';

interface VoiceBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMute: () => void;
  onAsk: () => void;
}

const VoiceBottomSheet: React.FC<VoiceBottomSheetProps> = ({
  isOpen,
  onClose,
  onMute,
  onAsk
}) => {
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  useEffect(() => {
    if (isOpen && animationState === 'closed') {
      setAnimationState('opening');
      setTimeout(() => setAnimationState('open'), 500); // Animation duration
    } else if (!isOpen && (animationState === 'open' || animationState === 'opening')) {
      setAnimationState('closing');
      setTimeout(() => setAnimationState('closed'), 300); // Animation duration
    }
  }, [isOpen, animationState]);

  if (animationState === 'closed') return null;

  const overlayStyle = {
    opacity: animationState === 'open' ? 1 : animationState === 'opening' ? 0.8 : 0,
    transition: 'opacity 0.3s ease-in-out'
  };

  const sheetStyle = {
    transform: animationState === 'open' 
      ? 'translateY(0)' 
      : animationState === 'opening' 
        ? 'translateY(0)' 
        : 'translateY(100%)',
    transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)' // iOS-like animation curve
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        ...overlayStyle
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1E1E1E',
          width: '100%',
          maxWidth: '500px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          padding: '24px',
          paddingBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          ...sheetStyle
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div 
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            cursor: 'pointer',
            zIndex: 10
          }}
          onClick={onClose}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Wine glass image */}
        <div style={{ marginBottom: '32px' }}>
          <img 
            src={wineGlassImage} 
            alt="Wine Glass" 
            style={{ 
              width: '150px', 
              height: '150px',
              objectFit: 'contain' 
            }} 
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '320px' }}>
          <button
            onClick={onMute}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '32px',
              padding: '12px 0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.889 9H2v6h3.889l4.111 4V5L5.889 9zM15 8.93a4.968 4.968 0 010 6.14M17.5 5.63a7.965 7.965 0 010 12.74" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 1L23 23" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Mute
          </button>
          <button
            onClick={onAsk}
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: '32px',
              padding: '12px 0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              color: 'black',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="black"/>
            </svg>
            Ask
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceBottomSheet;