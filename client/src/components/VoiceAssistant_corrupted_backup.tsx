import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from './ui/Button';
import { CircleAnimation } from './CircleAnimation';
import { SuggestionPills } from './SuggestionPills';

export interface VoiceAssistantProps {
  onClose?: () => void;
  conversationId?: number;
  wineKey?: string;
  isVoiceContext?: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  onClose, 
  conversationId, 
  wineKey,
  isVoiceContext = true 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const state = isListening ? 'LISTENING' : isProcessing ? 'PROCESSING' : isPlaying ? 'PLAYING' : 'IDLE';

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleVoiceInput = async (transcript: string) => {
    setIsProcessing(true);
    
    try {
      const response = await apiRequest({
        url: '/api/chat',
        method: 'POST',
        data: {
          message: transcript,
          conversationId,
          wineKey
        }
      });
      
      setResponse(response.response);
      
      // Text-to-speech
      if (!isMuted) {
        await playTTS(response.response);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      setIsPlaying(true);
      
      const response = await apiRequest({
        url: '/api/tts',
        method: 'POST',
        data: { text }
      });
      
      if (response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlaying(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current && !isMuted) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleVoiceInput(suggestion);
  };

  return (
    <div className="voice-assistant-container">
      {/* Main voice interface */}
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
        {/* Close button */}
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        )}

        {/* Circle animation */}
        <div className="mb-8">
          <CircleAnimation state={state} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            variant="outline"
            size="lg"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <Button
            onClick={toggleMute}
            variant="outline"
            size="lg"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </Button>
        </div>

        {/* Response display */}
        {response && (
          <div className="max-w-md text-center mb-8">
            <p className="text-white/80">{response}</p>
          </div>
        )}

        {/* Suggestion pills */}
        <div className="w-full max-w-md">
          <SuggestionPills
            wineKey={wineKey || 'wine_1'}
            conversationId={conversationId}
            isVoiceContext={isVoiceContext}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;