import React, { useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "../VoiceBottomSheet";
import { useVoiceCore } from "./VoiceCore";
import { useVoiceRecording } from "./VoiceRecording";
import { useVoicePermissions } from "./VoicePermissions";

interface VoiceAssistantRefactoredProps {
  onSendMessage: (
    message: string,
    pillId?: string,
    options?: { textOnly?: boolean; instantResponse?: string },
  ) => void;
  isProcessing: boolean;
  wineKey?: string;
}

export const VoiceAssistantRefactored = React.forwardRef<
  { forceActivate: () => Promise<void> },
  VoiceAssistantRefactoredProps
>(({ onSendMessage, isProcessing, wineKey = "" }, ref) => {
  const { toast } = useToast();
  
  // Use modular voice hooks
  const voiceCore = useVoiceCore({
    onSendMessage,
    wineKey,
    isProcessing
  });

  const voiceRecording = useVoiceRecording();
  const voicePermissions = useVoicePermissions();

  // Remove auto-activation to prevent conflicts with manual close system
  // Voice assistant should only activate when user explicitly clicks voice button

  const handleVoiceInput = async () => {
    if (!voiceRecording.isSupported) {
      toast({
        title: "Voice Recording Not Supported",
        description: "Your browser doesn't support voice recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      voiceCore.updateState({ isThinking: true, showUnmuteButton: false, showAskButton: false });
      
      const success = await voiceRecording.startRecording();
      if (!success) {
        voiceCore.updateState({ isThinking: false });
        toast({
          title: "Recording Failed",
          description: "Could not start voice recording. Please check microphone permissions.",
          variant: "destructive",
        });
        return;
      }

      voiceCore.updateState({ isListening: true, isThinking: false });

      // Auto-stop recording after 30 seconds
      setTimeout(async () => {
        if (voiceRecording.state.isRecording) {
          await handleStopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error('Voice input failed:', error);
      voiceCore.updateState({ isThinking: false });
      toast({
        title: "Voice Error",
        description: "An error occurred while processing voice input.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioBlob = await voiceRecording.stopRecording();
      
      if (!audioBlob) {
        voiceCore.updateState({ isListening: false, isThinking: false });
        return;
      }

      voiceCore.updateState({ isListening: false, isThinking: true });

      // Send audio to speech-to-text API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-input.webm');

      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { text } = await response.json();
        
        if (text && text.trim()) {
          // Send the transcribed text as a message
          onSendMessage(text.trim(), undefined, { textOnly: false });
          voiceCore.updateState({ 
            isThinking: false, 
            isResponding: true,
            showUnmuteButton: true,
            showAskButton: true 
          });
        } else {
          voiceCore.updateState({ isThinking: false });
          toast({
            title: "No Speech Detected",
            description: "Please try speaking more clearly.",
            variant: "default",
          });
        }
      } else {
        throw new Error('Speech-to-text failed');
      }

    } catch (error) {
      console.error('Voice processing failed:', error);
      voiceCore.updateState({ isListening: false, isThinking: false });
      toast({
        title: "Processing Failed",
        description: "Could not process your voice input. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRecording = () => {
    voiceRecording.cancelRecording();
    voiceCore.updateState({ 
      isListening: false, 
      isThinking: false,
      showUnmuteButton: true,
      showAskButton: true 
    });
  };

  const handleSuggestionClick = async (pillId: string) => {
    try {
      // Use the suggestion pill system with voice context
      onSendMessage("", pillId, { textOnly: false });
      
      voiceCore.updateState({ 
        isResponding: true,
        showUnmuteButton: true,
        showAskButton: true 
      });
    } catch (error) {
      console.error('Suggestion click failed:', error);
      toast({
        title: "Suggestion Error",
        description: "Could not process suggestion. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Expose the force activation method for external use
  React.useImperativeHandle(ref, () => ({
    forceActivate: voiceCore.forceVoiceActivation
  }), [voiceCore.forceVoiceActivation]);

  return (
    <>
      <VoiceBottomSheet
        isOpen={voiceCore.state.showBottomSheet}
        onClose={voiceCore.handleClose}
        onMute={handleStopRecording}
        onAsk={handleVoiceInput}
        isListening={voiceCore.state.isListening}
        isResponding={voiceCore.state.isResponding}
        isThinking={voiceCore.state.isThinking}
        isPlayingAudio={voiceCore.state.isPlayingAudio}
        showUnmuteButton={voiceCore.state.showUnmuteButton}
        showAskButton={voiceCore.state.showAskButton}
        onStopAudio={voiceCore.stopAudio}
        onSuggestionClick={handleSuggestionClick}
        wineKey={wineKey}
      />
    </>
  );
});

// Export with backward compatibility
export default VoiceAssistantRefactored;