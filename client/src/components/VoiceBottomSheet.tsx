import React, { useEffect, useState } from 'react';

interface VoiceBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVoiceMessage: (message: string) => void;
  status: string;
  isListening: boolean;
  toggleListening: () => void;
}

const VoiceBottomSheet: React.FC<VoiceBottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  onSendVoiceMessage,
  status,
  isListening,
  toggleListening
}) => {
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [animation, setAnimation] = useState<string>('slide-in');

  // Handle ESC key to close the sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Listen for recognized text from window event
  useEffect(() => {
    if (!isOpen) return;

    const handleRecognizedText = (e: CustomEvent) => {
      setRecognizedText(e.detail);
    };

    window.addEventListener('voice-recognized' as any, handleRecognizedText as any);

    return () => {
      window.removeEventListener('voice-recognized' as any, handleRecognizedText as any);
    };
  }, [isOpen]);

  const handleClose = () => {
    setAnimation('slide-out');
    setTimeout(() => {
      onClose();
      setRecognizedText('');
      setAnimation('slide-in');
    }, 300);
  };

  const handleSend = () => {
    if (recognizedText.trim()) {
      onSendVoiceMessage(recognizedText);
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center" 
      style={{animation: `${animation} 0.3s ease-in-out`}}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 text-white bg-transparent border-none"
          style={{background: 'none'}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        {/* Microphone button with pulsating effect */}
        <div className="mb-8">
          <div 
            className={`relative rounded-full flex items-center justify-center cursor-pointer ${isListening ? 'mic-pulse' : ''}`}
            style={{
              width: '120px', 
              height: '120px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
            onClick={toggleListening}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 20 20"
              style={{
                color: 'white'
              }}
            >
              <path fill="currentColor" d="M5.5 10a.5.5 0 0 0-1 0a5.5 5.5 0 0 0 5 5.478V17.5a.5.5 0 0 0 1 0v-2.022a5.5 5.5 0 0 0 5-5.478a.5.5 0 0 0-1 0a4.5 4.5 0 1 1-9 0m7.5 0a3 3 0 0 1-6 0V5a3 3 0 0 1 6 0z"/>
            </svg>
          </div>
        </div>
        
        {/* Status */}
        <div className="text-white text-lg mb-8">
          {status || (isListening ? 'Listening...' : 'Tap to speak')}
        </div>
        
        {/* Recognized text */}
        <div 
          className="bg-transparent w-full max-w-xl min-h-[100px] text-white p-4 rounded"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          {recognizedText || 'Say something...'}
        </div>
        
        {/* Send button */}
        {recognizedText && (
          <button 
            className="mt-6 bg-white text-black px-8 py-3 rounded-full font-medium"
            onClick={handleSend}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceBottomSheet;