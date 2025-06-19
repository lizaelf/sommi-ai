import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import CircleAnimation from '../animations/CircleAnimation';
import { ShiningText } from '../ShiningText';
import Button from '@/components/ui/buttons/Button';
import { IconButton } from '@/components/ui/buttons/IconButton';
import SuggestionPills from '../SuggestionPills';
import { suggestionCache } from '@/utils/suggestionCache';

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
  isPlayingAudio?: boolean;
  wineKey?: string;
  onSuggestionClick?: (suggestion: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  onListenResponse?: () => void;
  onUnmute?: () => void;
  onStopAudio?: () => void;
}



const VoiceBottomSheet: React.FC<VoiceBottomSheetProps> = ({
  isOpen,
  onClose,
  onMute,
  onAsk,
  isListening = false,
  isResponding = false,
  isThinking = false,
  showSuggestions = true,
  showListenButton = false,
  showAskButton = false,
  showUnmuteButton = false,
  isLoadingAudio = false,
  isVoiceActive = false,
  isPlayingAudio = false,
  wineKey = '',
  onSuggestionClick,
  onListenResponse,
  onUnmute,
  onStopAudio
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
              position: "absolute",
              top: "16px",
              right: "16px",
              zIndex: 10,
            }}
          >
            <IconButton
              icon={X}
              onClick={onClose}
              variant="headerIcon"
              size="md"
              title="Close"
            />
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
          ) : (isResponding || isPlayingAudio) ? (
            <div style={{ paddingLeft: '16px', paddingRight: '16px', width: '100%' }}>
              <button
                className="secondary-button react-button"
                onClick={() => {
                  console.log("🛑 Stop button clicked - attempting to stop audio");
                  
                  // Primary stop method
                  if (onStopAudio) {
                    console.log("🛑 Calling onStopAudio prop");
                    onStopAudio();
                  }
                  
                  // Secondary stop method
                  if (onMute) {
                    console.log("🛑 Calling onMute prop");
                    onMute();
                  }
                  
                  // Global stop function fallback
                  if ((window as any).stopVoiceAudio) {
                    console.log("🛑 Calling global stopVoiceAudio");
                    (window as any).stopVoiceAudio();
                  }
                  
                  // Stop all audio elements directly
                  try {
                    const audioElements = document.querySelectorAll('audio');
                    audioElements.forEach((audio) => {
                      if (!audio.paused) {
                        audio.pause();
                        audio.currentTime = 0;
                        console.log("🛑 Stopped audio element directly");
                      }
                    });
                  } catch (error) {
                    console.warn("Error stopping audio elements:", error);
                  }
                  
                  // Dispatch multiple stop events
                  window.dispatchEvent(new CustomEvent('stopVoiceAudio'));
                  window.dispatchEvent(new CustomEvent('tts-audio-stop'));
                  window.dispatchEvent(new CustomEvent('deploymentAudioStopped'));
                  
                  console.log("🛑 Stop button processing complete");
                }}
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
                <img 
                  src="/icons/stop.svg" 
                  alt="Stop"
                  width="20" 
                  height="20"
                />
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
                        console.log("VoiceBottomSheet: Suggestion clicked:", prompt, "options:", options);
                        
                        // Just pass everything through to VoiceAssistant - let SuggestionPills handle cached responses
                        if (onSuggestionClick) {
                          onSuggestionClick(prompt, pillId, options);
                        }
                      }}
                      isDisabled={isListening || isResponding || isThinking}
                      preferredResponseType="voice"
                      context="voice-assistant"
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
                    className="react-button !bg-white/8 !text-white hover:!bg-white/16 !border-none"
                    style={{
                      width: '100%',
                      height: '56px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <img 
                      src="/icons/volume-x.svg" 
                      alt="Unmute"
                      width="20" 
                      height="20"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
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
                    <img 
                      src="/icons/mic.svg" 
                      alt="Ask"
                      width="20" 
                      height="20"
                    />
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