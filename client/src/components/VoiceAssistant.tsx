import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "./VoiceBottomSheet";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser,
} from "@/utils/microphonePermissions";
import { WINE_CONFIG } from "../../../shared/wineConfig";

// Centralized dynamic welcome message generator
const getDynamicWelcomeMessage = () => {
  const wineName = `${WINE_CONFIG.vintage} ${WINE_CONFIG.winery} "${WINE_CONFIG.vineyard}"`;
  return `Hello, I see you're looking at the ${wineName}, an excellent choice. The ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard} ${WINE_CONFIG.varietal} expresses a nose of red and black raspberry, sage, and dark chocolate, followed by mid-palate is full bodied and features flavors of blackberry and ripe plum, ending with juicy acidity and a lengthy finish. Out of curiosity, are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.`;
};

interface VoiceAssistantProps {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isProcessing: boolean;
  wineKey?: string;
}

interface MicStatusEvent extends Event {
  detail: {
    status: 'listening' | 'stopped' | 'error';
    volume?: number;
  };
}

interface VoiceVolumeEvent extends Event {
  detail: {
    volume: number;
  };
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = ''
}) => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showAskButton, setShowAskButton] = useState(true);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const welcomeAudioCacheRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Cache welcome message audio on component mount
  useEffect(() => {
    const cacheWelcomeAudio = async () => {
      try {
        const welcomeMessage = getDynamicWelcomeMessage();
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage })
        });
        
        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          welcomeAudioCacheRef.current = audioUrl;
          console.log("Welcome audio cached successfully");
        }
      } catch (error) {
        console.error("Failed to cache welcome audio:", error);
      }
    };

    cacheWelcomeAudio();
  }, []);

  const handleCloseBottomSheet = () => {
    console.log("Voice Assistant closed");
    setShowBottomSheet(false);
    setIsListening(false);
    setIsResponding(false);
    setIsThinking(false);
    setShowAskButton(true);
    setShowUnmuteButton(false);
    setIsVoiceActive(false);
    setIsPlayingAudio(false);
    
    // Stop any ongoing audio
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio = null;
    }
    
    // Clean up media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleMute = () => {
    console.log("Mute button clicked - stopping recording");
    setIsListening(false);
    setShowUnmuteButton(true);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSuggestionClick = (suggestion: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => {
    console.log("Voice Assistant suggestion clicked:", suggestion);
    
    if (options?.instantResponse) {
      setIsResponding(true);
      setShowAskButton(false);
      
      // Play audio for voice context
      const utterance = new SpeechSynthesisUtterance(options.instantResponse);
      const voices = speechSynthesis.getVoices();
      const maleVoice = voices.find(voice => 
        voice.name.includes('Google UK English Male') ||
        voice.name.includes('Google US English Male') ||
        voice.name.includes('Male') ||
        voice.lang.includes('en')
      );
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      }
      
      utterance.rate = 1.0;
      utterance.onend = () => {
        setIsResponding(false);
        setShowAskButton(true);
      };
      
      speechSynthesis.speak(utterance);
    }
    
    onSendMessage(suggestion, pillId, options);
  };

  const handleUnmute = async () => {
    console.log("Unmute button clicked");
    
    // First try cached welcome audio
    if (welcomeAudioCacheRef.current) {
      try {
        const audio = new Audio(welcomeAudioCacheRef.current);
        (window as any).currentOpenAIAudio = audio;
        setIsPlayingAudio(true);
        setShowUnmuteButton(false);
        
        audio.onended = () => {
          setIsPlayingAudio(false);
          setShowAskButton(true);
          (window as any).currentOpenAIAudio = null;
        };
        
        audio.onerror = (error) => {
          console.error("Cached audio playback failed:", error);
          setIsPlayingAudio(false);
          setShowAskButton(true);
          // Fall back to browser TTS
          playWelcomeWithBrowserTTS();
        };
        
        await audio.play();
        console.log("Cached welcome audio playing");
        return;
      } catch (error) {
        console.error("Failed to play cached audio:", error);
      }
    }
    
    // Fallback to browser TTS
    playWelcomeWithBrowserTTS();
  };

  const playWelcomeWithBrowserTTS = () => {
    const welcomeMessage = getDynamicWelcomeMessage();
    const utterance = new SpeechSynthesisUtterance(welcomeMessage);
    
    const voices = speechSynthesis.getVoices();
    const maleVoice = voices.find(voice => 
      voice.name.includes('Google UK English Male') ||
      voice.name.includes('Google US English Male') ||
      voice.name.includes('Male') ||
      voice.lang.includes('en')
    );
    
    if (maleVoice) {
      utterance.voice = maleVoice;
    }
    
    utterance.rate = 1.0;
    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setShowUnmuteButton(false);
    };
    
    utterance.onend = () => {
      setIsPlayingAudio(false);
      setShowAskButton(true);
    };
    
    speechSynthesis.speak(utterance);
  };

  const handleAsk = () => {
    console.log("Ask button clicked");
  };

  const stopAudio = () => {
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio = null;
    }
    setIsResponding(false);
    setIsPlayingAudio(false);
    setShowAskButton(true);
    console.log("All audio stopped");
  };

  const handleMicrophoneClick = async () => {
    console.log("Microphone button clicked");
    
    // Clear session storage for testing
    sessionStorage.removeItem('voice_choice_shown');
    
    const hasShownSheet = sessionStorage.getItem('voice_choice_shown');
    if (hasShownSheet) {
      console.log("Choice already shown this session, showing voice assistant");
      setShowBottomSheet(true);
      return;
    }
    
    sessionStorage.setItem('voice_choice_shown', 'true');
    console.log("Dispatching show-voice-choice event");
    window.dispatchEvent(new CustomEvent('show-voice-choice'));
  };

  useEffect(() => {
    const handleVoiceChoice = () => {
      console.log("User chose Voice option");
      setShowBottomSheet(true);
    };

    window.addEventListener('voice-choice-selected', handleVoiceChoice);
    
    return () => {
      window.removeEventListener('voice-choice-selected', handleVoiceChoice);
    };
  }, []);

  return (
    <div>
      {/* Microphone Button for Chat Input */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4A90E2, #357ABD)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
        onClick={handleMicrophoneClick}
        title="Voice Assistant"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </div>

      <VoiceBottomSheet
        isOpen={showBottomSheet}
        onClose={handleCloseBottomSheet}
        onMute={handleMute}
        onUnmute={handleUnmute}
        onAsk={handleAsk}
        onStopAudio={stopAudio}
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isThinking}
        isVoiceActive={isVoiceActive}
        isPlayingAudio={isPlayingAudio}
        wineKey={wineKey}
        showSuggestions={showAskButton && !isListening && !isResponding && !isThinking}
        showUnmuteButton={
          showUnmuteButton && !isListening && !isResponding && !isThinking
        }
        showAskButton={
          showAskButton && !isListening && !isResponding && !isThinking
        }
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
};

export default VoiceAssistant;