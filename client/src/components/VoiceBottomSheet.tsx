import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CircleAnimation from './CircleAnimation';
import { ShiningText } from './ShiningText';
import Button from '@/components/ui/Button';
import SuggestionPills from './SuggestionPills';

interface VoiceBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMute: () => void;
  onAsk: () => void;
  isListening?: boolean;
  isResponding?: boolean;
  isThinking?: boolean;
  showSuggestions?: boolean;
  showListenButton?: boolean;
  showAskButton?: boolean;
  showUnmuteButton?: boolean;
  isLoadingAudio?: boolean;
  isVoiceActive?: boolean;
  wineKey?: string;
  onSuggestionClick?: (suggestion: string) => void;
  onListenResponse?: () => void;
  onUnmute?: () => void;
}



const VoiceBottomSheet: React.FC<VoiceBottomSheetProps> = ({
  isOpen,
  onClose,
  onMute,
  onAsk,
  isListening = false,
  isResponding = false,
  isThinking = false,
  showSuggestions = false,
  showListenButton = false,
  showAskButton = false,
  showUnmuteButton = false,
  isLoadingAudio = false,
  isVoiceActive = false,
  wineKey = '',
  onSuggestionClick,
  onListenResponse,
  onUnmute
}) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);





  useEffect(() => {
    let element = document.getElementById('voice-bottom-sheet-portal');
    if (!element) {
      element = document.createElement('div');
      element.id = 'voice-bottom-sheet-portal';
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      const existingElement = document.getElementById('voice-bottom-sheet-portal');
      if (existingElement && existingElement.children.length === 0) {
        document.body.removeChild(existingElement);
      }
    };
  }, []);

  if (!isOpen || !portalElement) return null;

  return createPortal(
    <div>
      <style>
        {`
          .voice-bottom-sheet-button {
            background: rgba(255, 255, 255, 0.08) !important;
            color: white !important;
            border: none !important;
            transition: none !important;
          }
          .voice-bottom-sheet-button:hover {
            background: rgba(255, 255, 255, 0.12) !important;
            color: white !important;
            transform: none !important;
          }
          .voice-bottom-sheet-button:active {
            background: rgba(255, 255, 255, 0.08) !important;
            color: white !important;
          }
          .voice-bottom-sheet-button:focus {
            background: rgba(255, 255, 255, 0.08) !important;
            color: white !important;
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
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
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
          paddingTop: '24px',
          paddingLeft: '0px',
          paddingRight: '0px',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
          boxSizing: 'border-box',
          position: 'relative'
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
              zIndex: 10,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Wine glass animation container */}
          <div style={{ 
            width: '272px', 
            height: '272px', 
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            <CircleAnimation isAnimating={isListening || isResponding} size={156} />
          </div>

          {/* Status Content */}
          {isListening ? (
            <div style={{ 
              width: '100%', 
              maxWidth: '320px', 
              height: '56px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              <div style={{
                color: '#CECECE',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Listening...
              </div>
            </div>
          ) : isThinking ? (
            <div style={{ 
              width: '100%', 
              maxWidth: '320px', 
              height: '56px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center'
            }}>
              <div style={{
                color: '#CECECE',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShiningText text="Thinking..." />
              </div>
            </div>
          ) : isLoadingAudio ? (
            <div style={{ 
              width: '100%', 
              maxWidth: '320px', 
              height: '56px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              <div style={{
                color: '#CECECE',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShiningText text="Loading..." />
              </div>
            </div>
          ) : isResponding ? (
            <div style={{ paddingLeft: '16px', paddingRight: '16px', width: '100%' }}>
              <button
                className="secondary-button react-button"
                onClick={onMute}
                style={{
                  width: '100%',
                  borderRadius: '32px',
                  height: '56px',
                  padding: '0 16px',
                  margin: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  outline: 'none',
                  transition: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                </svg>
                Stop
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              width: '100%'
            }}>
              
              {/* Suggestions Section */}
              {showSuggestions && onSuggestionClick && (showAskButton || !showAskButton) && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  marginBottom: '16px',
                  justifyContent: 'center',
                  width: '100%',
                  paddingLeft: '16px',
                  paddingRight: '16px'
                }}>
                  {/* Wine-specific suggestion pills with text+voice responses */}
                  <div className="scrollbar-hide overflow-x-auto">
                    <SuggestionPills
                      wineKey={wineKey}
                      onSuggestionClick={(prompt, pillId, options) => {
                        // For voice bottom sheet, we want text+voice response (ignore textOnly option)
                        if (onSuggestionClick) {
                          onSuggestionClick(prompt);
                        }
                      }}
                      isDisabled={isListening || isResponding || isThinking}
                    />
                  </div>
                </div>
              )}



              {/* Unmute Button */}
              {showUnmuteButton && onUnmute && !showAskButton && (
                <div style={{
                  width: '100%',
                  paddingLeft: '16px',
                  paddingRight: '16px'
                }}>
                  <Button
                    onClick={onUnmute}
                    variant="secondary"
                    style={{
                      width: '100%',
                      height: '56px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                    Unmute
                  </Button>
                </div>
              )}

              {/* Ask Button */}
              {showAskButton && onAsk && (
                <div style={{
                  width: '100%',
                  paddingLeft: '16px',
                  paddingRight: '16px'
                }}>
                  <button
                    className="primary-button react-button"
                    onClick={onAsk}
                    style={{
                      width: '100%',
                      borderRadius: '32px',
                      height: '56px',
                      padding: '0 16px',
                      margin: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      outline: 'none',
                      transition: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="#000000">
                      <path d="M5.5 10a.5.5 0 0 0-1 0a5.5 5.5 0 0 0 5 5.478V17.5a.5.5 0 0 0 1 0v-2.022a5.5 5.5 0 0 0 5-5.478a.5.5 0 0 0-1 0a4.5 4.5 0 1 1-9 0m7.5 0a3 3 0 0 1-6 0V5a3 3 0 0 1 6 0z"/>
                    </svg>
                    Ask
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>,
    portalElement
  );
};

export default VoiceBottomSheet;