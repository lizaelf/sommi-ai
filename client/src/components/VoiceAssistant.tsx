import React, { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceAssistantProps {
  onSendMessage: (
    message: string, 
    pillId?: string, 
    options?: { 
      textOnly?: boolean; 
      instantResponse?: string;
      conversationId?: string;
    }
  ) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = ''
}) => {
  const [voiceState, setVoiceState] = useState({
    isListening: false,
    isResponding: false,
    isThinking: false,
    isPlayingAudio: false,
    isVoiceActive: false,
    showBottomSheet: false,
    showUnmuteButton: false,
    showAskButton: true
  });

  const [transcribedText, setTranscribedText] = useState('');

  const handleMicrophoneToggle = useCallback(() => {
    if (voiceState.isListening) {
      setVoiceState(prev => ({ ...prev, isListening: false }));
    } else {
      setVoiceState(prev => ({ ...prev, isListening: true }));
    }
  }, [voiceState.isListening]);

  const handlePlayWelcome = useCallback(async () => {
    setVoiceState(prev => ({ ...prev, isPlayingAudio: true }));
    setTimeout(() => {
      setVoiceState(prev => ({ ...prev, isPlayingAudio: false }));
    }, 2000);
  }, []);

  const handleStopAudio = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isPlayingAudio: false }));
  }, []);

  useEffect(() => {
    setVoiceState(prev => ({ ...prev, isThinking: isProcessing }));
  }, [isProcessing]);

  return (
    <div className="voice-assistant-container">
      <div className="flex items-center gap-3">
        <button
          onClick={handleMicrophoneToggle}
          disabled={voiceState.isThinking}
          className={`
            p-3 rounded-full transition-all duration-200 flex items-center justify-center
            ${voiceState.isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${voiceState.isThinking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {voiceState.isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={voiceState.isPlayingAudio ? handleStopAudio : handlePlayWelcome}
          className={`
            p-3 rounded-full transition-all duration-200 flex items-center justify-center
            ${voiceState.isPlayingAudio 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
            }
          `}
        >
          {voiceState.isPlayingAudio ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        {voiceState.isListening && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Listening...</span>
          </div>
        )}
        {voiceState.isThinking && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span>Processing...</span>
          </div>
        )}
        {voiceState.isPlayingAudio && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Playing audio...</span>
          </div>
        )}
      </div>

      {transcribedText && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <div className="text-xs text-gray-500 mb-1">Transcribed:</div>
          <div className="text-sm text-gray-800">{transcribedText}</div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
