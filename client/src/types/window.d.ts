interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  speakDirectly?: (text: string) => void;
  lastInputWasVoice: boolean;
  voiceAssistant?: {
    playResponse: (text: string) => Promise<void>;
    initAudioContext: (force?: boolean) => void;
    sendMessage: (text: string) => void;
  };
}