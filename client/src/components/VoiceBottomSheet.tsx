import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import WineImage from './WineImage';
import { ShiningText } from './ShiningText';
import { apiRequest } from '@/lib/queryClient';

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
  isLoadingAudio?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onListenResponse?: () => void;
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
  isLoadingAudio = false,
  onSuggestionClick,
  onListenResponse
}) => {
  // Debug logging for button state
  console.log("VoiceBottomSheet render - isResponding:", isResponding, "isListening:", isListening, "isThinking:", isThinking, "showSuggestions:", showSuggestions, "showListenButton:", showListenButton);
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [showQuestion, setShowQuestion] = useState<boolean>(false);
  const [userQuestion, setUserQuestion] = useState<string>('');

  // Wine-related suggestions
  const suggestions = [
    "Food pairing",
    "Tasting notes", 
    "Serving"
  ];

  // Loading state is now managed by parent component (VoiceAssistant)

  // Function to speak suggestion using OpenAI TTS
  const speakSuggestion = async (suggestion: string) => {
    try {
      console.log("Speaking suggestion using OpenAI TTS:", suggestion);
      
      // Create a contextual prompt for the suggestion
      const suggestionPrompts = {
        "Food pairing": "Tell me about food pairing with this wine",
        "Tasting notes": "What are the tasting notes for this wine?", 
        "Serving": "How should I serve this wine?"
      };
      
      const promptText = suggestionPrompts[suggestion as keyof typeof suggestionPrompts] || suggestion;
      
      // Use OpenAI TTS to speak the suggestion prompt
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: promptText })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          console.log("Suggestion audio playback completed");
        };
        
        audio.onerror = (error) => {
          console.error("Audio playback error:", error);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        console.log("Playing suggestion audio");
      } else {
        console.error("Failed to get audio from TTS API");
      }
    } catch (error) {
      console.error("Error speaking suggestion:", error);
    }
  };

  // Simple suggestion click handler - no voice reading
  const handleSuggestionClick = async (suggestion: string) => {
    console.log("Suggestion clicked:", suggestion);
    
    // Directly trigger the suggestion click handler without speaking
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

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
      
      // Stop any playing OpenAI TTS audio when closing
      const currentAudio = (window as any).currentOpenAIAudio;
      if (currentAudio) {
        console.log("OpenAI TTS audio stopped when closing bottom sheet");
        currentAudio.pause();
        currentAudio.currentTime = 0;
        (window as any).currentOpenAIAudio = null;
      }
      
      // Also cancel any speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        console.log("Speech synthesis cancelled when closing");
      }
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
          paddingTop: '24px',
          paddingLeft: '0px',
          paddingRight: '0px',
          paddingBottom: '28px',
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
        <div 
          style={{ 
            width: '180px', // Exact size as requested
            height: '180px',
            marginBottom: '40px',
            marginTop: '10px',
            borderRadius: '50%',
            background: 'transparent',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 'none',
            overflow: 'hidden'
          }}
        >
          <WineImage isAnimating={true} size={180} />
        </div>

        {/* Show different states: Listening, Responding (Stop button), Thinking, or Buttons */}
        
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
              <style>
                {`
                  @keyframes pulseDot {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                  }
                `}
              </style>
              Listening...
            </div>
          </div>
        ) : isResponding ? (
          // Show user question or stop button when audio is playing
          <div style={{ paddingLeft: '16px', paddingRight: '16px', width: '100%' }}>
            {/* Show user's question briefly when Listen Response is clicked */}
            {(window as any).showUserQuestion && (window as any).currentUserQuestion ? (
              <div style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '32px',
                minHeight: '56px',
                padding: '16px',
                margin: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 'normal',
                textAlign: 'center',
                lineHeight: '1.4',
                boxSizing: 'border-box'
              }}>
                "{(window as any).currentUserQuestion}"
              </div>
            ) : (
              // Show stop button when speech is playing
              <button
                className="voice-bottom-sheet-button"
                onClick={onMute}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '32px',
                  height: '56px',
                  padding: '0 16px',
                  margin: 0,
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
                  transition: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                </svg>
                Stop
              </button>
            )}
          </div>
        ) : isThinking && !showListenButton ? (
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
        ) : (
          <>
            {/* Listen Response Button - Show when response is ready */}
            {showListenButton && onListenResponse && (
              <div style={{ 
                marginBottom: '16px',
                width: '100%',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}>
                <button
                  className="voice-bottom-sheet-button"
                  onClick={onListenResponse}
                  disabled={isLoadingAudio}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '32px',
                    height: '56px',
                    padding: '0 16px',
                    margin: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'white',
                    border: 'none',
                    cursor: isLoadingAudio ? 'default' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'none',
                    boxSizing: 'border-box',
                    opacity: isLoadingAudio ? 0.7 : 1
                  }}
                >
                  {isLoadingAudio ? (
                    <>
                      <ShiningText text="Loading..." />
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '18px' }}>🎧</span>
                      Listen Response
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* Suggestions Section - Only show when suggestions are available */}
            {showSuggestions && onSuggestionClick && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                marginBottom: '24px',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '320px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '16px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 400,
                        fontFamily: 'Inter, sans-serif',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box',
                        minWidth: 'fit-content'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show Ask button when not listening, responding, or thinking */}
            <div style={{ paddingLeft: '16px', paddingRight: '16px', width: '100%' }}>
              <button
                className="voice-bottom-sheet-button-white"
                onClick={onAsk}
                style={{
                  width: '100%',
                  backgroundColor: 'white',
                  borderRadius: '32px',
                  height: '56px',
                  padding: '0 16px',
                  margin: 0,
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
                  transition: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C10.34 1 9 2.34 9 4v8c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z" fill="black"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-0.49 6-3.39 6-6.92h-2z" fill="black"/>
                </svg>
                Ask
              </button>
            </div>
          </>
          
        )}
        
        {/* iOS Home Indicator removed */}
      </div>
    </div>
    </>
  );
  
  // Use React Portal to render at the root of the document
  return portalElement ? createPortal(bottomSheetContent, portalElement) : null;
};

export { VoiceBottomSheet };
export default VoiceBottomSheet;