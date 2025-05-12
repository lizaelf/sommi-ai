interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  voiceAssistant?: {
    speakResponse: (text: string) => Promise<void>;
    playLastAudio: () => void;
    speakLastAssistantMessage: () => void;
  };
}