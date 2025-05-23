import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import WineImage from './WineImage';

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
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // When component mounts, create portal element if needed
    let element = document.getElementById('ios-bottom-sheet-portal');
    if (!element) {
      element = document.createElement('div');
      element.id = 'ios-bottom-sheet-portal';
      document.body.appendChild(element);
    }
    setPortalElement(element);

    // Cleanup on unmount
    return () => {
      if (element && element.parentElement && !isOpen) {
        element.parentElement.removeChild(element);
      }
    };
  }, []);

  useEffect(() => {
    // Lock body scroll when sheet is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log("Opening bottom sheet...");
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && animationState === 'closed') {
      setAnimationState('opening');
      setTimeout(() => setAnimationState('open'), 50); // Small delay to trigger animation
    } else if (!isOpen && (animationState === 'open' || animationState === 'opening')) {
      setAnimationState('closing');
      setTimeout(() => setAnimationState('closed'), 300); // Match animation duration
    }
  }, [isOpen, animationState]);

  if (animationState === 'closed' || !portalElement) return null;

  const overlayStyle = {
    opacity: animationState === 'open' ? 1 : animationState === 'opening' ? 0.8 : 0,
    transition: 'opacity 0.3s ease-out'
  };

  const sheetStyle = {
    transform: animationState === 'open' 
      ? 'translateY(0)' 
      : 'translateY(100%)',
    transition: 'transform 0.3s ease-out'
  };

  const bottomSheetContent = (
    <>
      <style>
        {`
          .voice-bottom-sheet-button {
            background: rgba(255, 255, 255, 0.08) !important;
            transition: none !important;
          }
          .voice-bottom-sheet-button:hover {
            background: rgba(255, 255, 255, 0.08) !important;
            transform: none !important;
          }
          .voice-bottom-sheet-button:active {
            background: rgba(255, 255, 255, 0.08) !important;
          }
          .voice-bottom-sheet-button:focus {
            background: rgba(255, 255, 255, 0.08) !important;
          }
          .voice-bottom-sheet-button-white {
            background: white !important;
            color: black !important;
            transition: none !important;
          }
          .voice-bottom-sheet-button-white:hover {
            background: white !important;
            color: black !important;
            transform: none !important;
          }
          .voice-bottom-sheet-button-white:active {
            background: white !important;
            color: black !important;
          }
          .voice-bottom-sheet-button-white:focus {
            background: white !important;
            color: black !important;
          }
        `}
      </style>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999, // Higher z-index to ensure it's on top of everything
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          ...overlayStyle
        }}
        onClick={onClose}
      >
        <div 
        style={{
          backgroundColor: '#111111',
          width: '100%',
          maxWidth: '500px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          borderTop: '2px solid rgba(255, 255, 255, 0.2)',
          padding: '24px',
          paddingBottom: '80px', // Extra bottom padding for home indicator
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)', // iOS-like shadow
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

        {/* Wine glass visualization */}
        <div style={{ marginBottom: '32px' }}>
          <div 
            style={{ 
              width: '200px', 
              height: '200px',
              borderRadius: '50%',
              background: 'transparent',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 0 15px rgba(120, 0, 0, 0.3)',
              overflow: 'hidden'
            }}
          >
            <WineImage />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '320px' }}>
          <button
            className="voice-bottom-sheet-button"
            onClick={onMute}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '32px',
              height: '48px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              outline: 'none',
              transition: 'none'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12.92 3.316c.774-.69 1.983-.187 2.074.812L15 4.25v15.496c0 1.037-1.178 1.606-1.986 1.01l-.095-.076l-4.491-3.994a.75.75 0 0 0-.39-.182l-.108-.008H4.25a2.25 2.25 0 0 1-2.245-2.095L2 14.246V9.75a2.25 2.25 0 0 1 2.096-2.245l.154-.005h3.68a.75.75 0 0 0 .411-.123l.087-.067l4.491-3.993zm4.36 5.904L19 10.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L20.06 12l1.72 1.72a.75.75 0 1 1-1.06 1.06L19 13.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L17.94 12l-1.72-1.72a.75.75 0 1 1 1.06-1.06z"/>
            </svg>
            Mute
          </button>
          <button
            className="voice-bottom-sheet-button-white"
            onClick={onAsk}
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: '32px',
              height: '48px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              color: 'black',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              outline: 'none',
              transition: 'none'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1C10.34 1 9 2.34 9 4v8c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z" fill="black"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-0.49 6-3.39 6-6.92h-2z" fill="black"/>
            </svg>
            Ask
          </button>
        </div>
        
        {/* iOS Home Indicator */}
        <div style={{ 
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '134px',
          height: '5px',
          backgroundColor: 'white',
          borderRadius: '3px'
        }}></div>
      </div>
    </div>
    </>
  );
  
  // Use React Portal to render at the root of the document
  return portalElement ? createPortal(bottomSheetContent, portalElement) : null;
};

export { VoiceBottomSheet };
export default VoiceBottomSheet;