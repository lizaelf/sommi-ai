import React from 'react';
import { createPortal } from 'react-dom';
import CircleAnimation from '../animations/CircleAnimation';
import { ShiningText } from '../animations/ShiningText';
import Button from '@/components/ui/buttons/Button';
import SuggestionPills from '../chat/SuggestionPills';

interface VoiceAssistantBottomSheetProps {
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

const VoiceAssistantBottomSheet: React.FC<VoiceAssistantBottomSheetProps> = ({
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
  onStopAudio,
}) => {
  if (!isOpen) return null;

  const content = (
    <>
      {/* Background overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Bottom sheet container */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1a1a1a',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          zIndex: 9999,
          padding: '32px 0 48px 0',
          minHeight: '380px',
          maxHeight: '80vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
          boxSizing: 'border-box'
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
          <img 
            src="/icons/x.svg" 
            alt="Close"
            width="20" 
            height="20"
            style={{ filter: 'brightness(0) invert(1)' }}
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
          <>
            <div style={{ 
              width: '100%', 
              maxWidth: '320px', 
              height: '56px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              paddingLeft: '16px',
              paddingRight: '16px',
              boxSizing: 'border-box'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShiningText text="Listening..." />
              </div>
            </div>
            {onSuggestionClick && (
              <div style={{ marginTop: 24, width: "100%", padding: "0 16px" }}>
                <SuggestionPills
                  wineKey={wineKey}
                  onSuggestionClick={onSuggestionClick}
                  isDisabled={false}
                  preferredResponseType="voice"
                  context="voice-assistant"
                />
              </div>
            )}
          </>
        ) : isThinking ? (
          <div style={{ 
            width: '100%', 
            maxWidth: '320px', 
            height: '56px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
            boxSizing: 'border-box'
          }}>
            <div style={{
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
            alignItems: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
            boxSizing: 'border-box'
          }}>
            <div style={{
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
                      console.log("VoiceAssistantBottomSheet: Suggestion clicked:", prompt, "options:", options);
                      
                      // Pass through to parent handler
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
                    outline: 'none',
                    transition: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <img 
                    src="/icons/volume-2.svg" 
                    alt="Unmute"
                    width="20" 
                    height="20"
                  />
                  Unmute
                </Button>
              </div>
            )}

            {/* Listen Response Button */}
            {showListenButton && onListenResponse && !showUnmuteButton && !showAskButton && (
              <div style={{
                width: '100%',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}>
                <Button
                  onClick={onListenResponse}
                  variant="secondary"
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
                    outline: 'none',
                    transition: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <img 
                    src="/icons/volume-2.svg" 
                    alt="Listen"
                    width="20" 
                    height="20"
                  />
                  Listen to response
                </Button>
              </div>
            )}

            {/* Ask Button */}
            {showAskButton && (
              <div style={{
                width: '100%',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}>
                <Button
                  onClick={onAsk}
                  variant="secondary"
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
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
};

export default VoiceAssistantBottomSheet;