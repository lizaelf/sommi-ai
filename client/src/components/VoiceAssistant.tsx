import React from 'react';
import VoiceController from './voice/VoiceController';
import VoiceAudioManager from './voice/VoiceAudioManager';
import VoiceRecorder from './voice/VoiceRecorder';
import VoiceStateManager from './voice/VoiceStateManager';

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
  return (
    <VoiceStateManager>
      {(voiceState) => (
        <>
          <VoiceAudioManager
            onAudioStateChange={(audioState) => {
              voiceState.updateState(audioState);
            }}
          />
          
          <VoiceRecorder
            onRecordingStateChange={(recordingState) => {
              voiceState.updateState(recordingState);
            }}
            onRecordingComplete={(audioBlob) => {
              // Handle recording completion
              console.log('Recording completed', audioBlob);
            }}
            onRecordingError={(error) => {
              console.error('Recording error:', error);
            }}
          />
          
          <VoiceController
            onSendMessage={onSendMessage}
            isProcessing={isProcessing}
            wineKey={wineKey}
          />
        </>
      )}
    </VoiceStateManager>
  );
};

export default VoiceAssistant;