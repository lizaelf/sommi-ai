import React, { useCallback } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "../VoiceBottomSheet";
import VoiceStateManager from "./VoiceStateManager";
import VoiceAudioManager from "./VoiceAudioManager";
import VoiceRecorder from "./VoiceRecorder";

interface VoiceControllerProps {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isProcessing: boolean;
  wineKey?: string;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = '',
}) => {
  const { toast } = useToast();

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        const transcribedText = data.text?.trim();
        
        if (transcribedText) {
          onSendMessage(transcribedText);
        } else {
          toast({
            title: "No speech detected",
            description: "Please try speaking more clearly",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('Speech recognition failed');
      }
    } catch (error) {
      console.error('Speech processing error:', error);
      toast({
        title: "Speech recognition failed",
        description: "Please try again or type your message",
        variant: "destructive",
      });
    }
  }, [onSendMessage, toast]);

  const handleRecordingError = useCallback((error: string) => {
    toast({
      title: "Recording failed",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  return (
    <VoiceStateManager>
      {({ 
        isListening, 
        isResponding, 
        isThinking, 
        isPlayingAudio, 
        isVoiceActive,
        showBottomSheet, 
        showUnmuteButton, 
        showAskButton,
        updateState,
        resetState
      }) => (
        <>
          <VoiceAudioManager 
            onAudioStateChange={({ isPlayingAudio }) => 
              updateState({ isPlayingAudio })
            }
          />
          
          <VoiceRecorder
            onRecordingStateChange={({ isListening, isVoiceActive }) => 
              updateState({ isListening, isVoiceActive })
            }
            onRecordingComplete={handleRecordingComplete}
            onRecordingError={handleRecordingError}
          />

          <VoiceBottomSheet
            isOpen={showBottomSheet}
            onClose={() => {
              updateState({ showBottomSheet: false });
              resetState();
            }}
            isListening={isListening}
            isResponding={isResponding}
            isThinking={isThinking}
            showUnmuteButton={showUnmuteButton}
            showAskButton={showAskButton}
            onSendMessage={onSendMessage}
            wineKey={wineKey}
            onStartListening={() => {
              if ((window as any).voiceRecorder) {
                (window as any).voiceRecorder.startRecording();
              }
            }}
            onStopListening={() => {
              if ((window as any).voiceRecorder) {
                (window as any).voiceRecorder.stopRecording();
              }
            }}
            onPlayWelcome={() => {
              if ((window as any).voiceAudioManager) {
                (window as any).voiceAudioManager.playWelcomeMessage();
              }
            }}
            onStopAudio={() => {
              if ((window as any).voiceAudioManager) {
                (window as any).voiceAudioManager.stopAudio();
              }
            }}
          />
        </>
      )}
    </VoiceStateManager>
  );
};

export default VoiceController;