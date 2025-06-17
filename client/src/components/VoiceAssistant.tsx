import React, { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import useAudioPlayback from '../hooks/useAudioPlayback';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import useWelcomeMessage from '../hooks/useWelcomeMessage';
import useGlobalVoiceStateSync from '../hooks/useGlobalVoiceStateSync';
import useVoiceAssistantEvents from '../hooks/useVoiceAssistantEvents';

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize focused hooks for modular architecture
  const { playAudio, stopAudio, isPlaying } = useAudioPlayback();
  
  const { recordingState, startRecording, stopRecording } = useVoiceRecorder({
    onRecordingStart: () => {
      setVoiceState(prev => ({ ...prev, isListening: true }));
    },
    onRecordingStop: async (audioBlob) => {
      setVoiceState(prev => ({ ...prev, isListening: false, isThinking: true }));
      
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        const response = await fetch('/api/voice-to-text', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          const transcription = data.transcription;
          setTranscribedText(transcription);
          onSendMessage(transcription);
          setVoiceState(prev => ({ ...prev, isThinking: false }));
        }
      } catch (error) {
        console.error('Voice processing failed:', error);
        setVoiceState(prev => ({ ...prev, isThinking: false }));
      }
    },
    onVoiceActivity: (isActive) => {
      setVoiceState(prev => ({ ...prev, isVoiceActive: isActive }));
    }
  });

  const { initializeWelcomeCache, getWelcomeAudio, generateFreshWelcomeAudio } = useWelcomeMessage();
  
  useGlobalVoiceStateSync(voiceState);
  
  useVoiceAssistantEvents({
    onTriggerVoiceAssistant: handleVoiceAssistantTrigger,
    onPlayAudioResponse: (audioBlob) => {
      playAudio(audioBlob);
    },
    onSuggestionPlaybackStarted: () => {
      setVoiceState(prev => ({ ...prev, isPlayingAudio: true }));
    },
    onSuggestionPlaybackEnded: () => {
      setVoiceState(prev => ({ ...prev, isPlayingAudio: false }));
    }
  });

  useEffect(() => {
    if (!isInitialized) {
      initializeWelcomeCache().then(() => {
        setIsInitialized(true);
      });
    }
  }, [initializeWelcomeCache, isInitialized]);

  function handleVoiceAssistantTrigger() {
    const welcomeAudio = getWelcomeAudio();
    if (welcomeAudio) {
      playAudio(welcomeAudio, () => {
        setVoiceState(prev => ({ 
          ...prev, 
          showBottomSheet: true,
          showUnmuteButton: false,
          showAskButton: true 
        }));
      });
    } else {
      generateFreshWelcomeAudio().then(audioUrl => {
        if (audioUrl) {
          playAudio(audioUrl, () => {
            setVoiceState(prev => ({ 
              ...prev, 
              showBottomSheet: true,
              showUnmuteButton: false,
              showAskButton: true 
            }));
          });
        }
      });
    }
  }

  const handleMicrophoneToggle = useCallback(() => {
    if (recordingState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recordingState.isRecording, startRecording, stopRecording]);

  const handlePlayWelcome = useCallback(async () => {
    const welcomeAudio = getWelcomeAudio();
    if (welcomeAudio) {
      playAudio(welcomeAudio);
    } else {
      const freshAudio = await generateFreshWelcomeAudio();
      if (freshAudio) {
        playAudio(freshAudio);
      }
    }
  }, [getWelcomeAudio, generateFreshWelcomeAudio, playAudio]);

  const handleStopAudio = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

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
            ${recordingState.isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${voiceState.isThinking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {recordingState.isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={isPlaying ? handleStopAudio : handlePlayWelcome}
          className={`
            p-3 rounded-full transition-all duration-200 flex items-center justify-center
            ${isPlaying 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
            }
          `}
        >
          {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
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
        {recordingState.isVoiceActive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Voice detected</span>
          </div>
        )}
      </div>

      {transcribedText && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <div className="text-xs text-gray-500 mb-1">Transcribed:</div>
          <div className="text-sm text-gray-800">{transcribedText}</div>
        </div>
      )}

      {recordingState.isRecording && (
        <div className="mt-2 text-xs text-gray-500">
          Recording: {Math.floor(recordingState.recordingDuration / 1000)}s
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;