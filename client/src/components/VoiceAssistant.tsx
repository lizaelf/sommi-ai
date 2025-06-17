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

// ✅ Centralized dynamic welcome message generator
const getDynamicWelcomeMessage = () => {
  const wineName = `${WINE_CONFIG.vintage} ${WINE_CONFIG.winery} "${WINE_CONFIG.vineyard}"`;
  return `Hello, I see you're looking at the ${wineName}, an excellent choice. The ${WINE_CONFIG.vintage} ${WINE_CONFIG.vineyard} ${WINE_CONFIG.varietal} expresses a nose of red and black raspberry, sage, and dark chocolate, followed by mid-palate is full bodied and features flavors of blackberry and ripe plum, ending with juicy acidity and a lengthy finish. Out of curiosity, are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like.`;
};

interface VoiceAssistantProps {
  onSendMessage: (message: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void;
  isProcessing: boolean;
  wineKey?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isProcessing,
  wineKey = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(true);

  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const welcomeAudioCacheRef = useRef<string | null>(null);
  const welcomeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Cache welcome message immediately on component mount for instant playback
  const cacheWelcomeMessage = async () => {
    if (welcomeAudioCacheRef.current) return;
    
    const globalCache = (window as any).globalWelcomeAudioCache;
    if (globalCache && globalCache.url && globalCache.element) {
      console.log("Using global welcome audio cache for instant playback");
      welcomeAudioCacheRef.current = globalCache.url;
      welcomeAudioElementRef.current = globalCache.element;
      return;
    }
    
    console.log("Caching dynamic welcome message for instant playback");
    
    try {
      const welcomeMessage = getDynamicWelcomeMessage();
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomeMessage })
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audioElement = new Audio(audioUrl);
        audioElement.preload = 'auto';
        
        await new Promise((resolve, reject) => {
          audioElement.oncanplaythrough = resolve;
          audioElement.onerror = reject;
          audioElement.load();
        });
        
        welcomeAudioCacheRef.current = audioUrl;
        welcomeAudioElementRef.current = audioElement;
        console.log("Welcome message audio cached and preloaded for instant playback");
        
        (window as any).globalWelcomeAudioCache = {
          url: audioUrl,
          element: audioElement
        };
      }
    } catch (error) {
      console.error("Failed to cache welcome message:", error);
    }
  };

  useEffect(() => {
    cacheWelcomeMessage();
  }, []);

  const handleSuggestionClick = (prompt: string, pillId?: string, options?: any) => {
    console.log("🚀 VoiceAssistant: SuggestionPills handles all suggestion logic - voice assistant does nothing");
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
  };

  const handleMute = () => {
    setShowBottomSheet(false);
  };

  const handleUnmute = async () => {
    console.log("🎤 VoiceAssistant: Manual unmute requested");
    
    try {
      if (welcomeAudioElementRef.current && welcomeAudioCacheRef.current) {
        console.log("Playing cached welcome audio for instant response");
        
        const audio = welcomeAudioElementRef.current.cloneNode() as HTMLAudioElement;
        audio.src = welcomeAudioCacheRef.current;
        
        audio.onplay = () => {
          setIsResponding(true);
          setShowUnmuteButton(false);
          setShowAskButton(false);
          console.log("🎤 VoiceAssistant: TTS audio started from welcome");
        };
        
        audio.onended = () => {
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
          console.log("🎤 VoiceAssistant: TTS audio ended from welcome");
        };
        
        audio.onerror = (error) => {
          console.error("🎤 VoiceAssistant: Welcome audio error:", error);
          console.error("🎤 Audio URL:", audio.src);
          console.error("🎤 Audio readyState:", audio.readyState);
          console.error("🎤 Audio networkState:", audio.networkState);
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
        };
        
        (window as any).currentOpenAIAudio = audio;
        await audio.play();
        return;
      }
      
      const welcomeMessage = getDynamicWelcomeMessage();
      
      setIsResponding(true);
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomeMessage })
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.onplay = () => {
          setIsResponding(true);
          setShowUnmuteButton(false);
          setShowAskButton(false);
        };
        
        audio.onended = () => {
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = (error) => {
          console.error("🎤 VoiceAssistant: Audio error:", error);
          console.error("🎤 Audio URL:", audioUrl);
          console.error("🎤 Audio readyState:", audio.readyState);
          console.error("🎤 Audio networkState:", audio.networkState);
          setIsResponding(false);
          setShowUnmuteButton(false);
          setShowAskButton(true);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error("🎤 VoiceAssistant: Unmute error:", error);
      setIsResponding(false);
      setShowUnmuteButton(false);
      setShowAskButton(true);
    }
  };

  const handleAsk = () => {
    console.log("🎤 VoiceAssistant: Ask button clicked");
  };

  const stopAudio = () => {
    if ((window as any).currentOpenAIAudio) {
      (window as any).currentOpenAIAudio.pause();
      (window as any).currentOpenAIAudio = null;
    }
    setIsResponding(false);
    setIsPlayingAudio(false);
    setShowAskButton(true);
    console.log("🛑 VoiceAssistant: All audio stopped");
  };

  const handleMicrophoneClick = async () => {
    console.log("🎤 VoiceAssistant: Microphone button clicked");
    
    const hasShownSheet = sessionStorage.getItem('voice_choice_shown');
    if (hasShownSheet) {
      console.log("🎤 VoiceAssistant: Choice already shown this session, showing voice assistant");
      setShowBottomSheet(true);
      return;
    }
    
    sessionStorage.setItem('voice_choice_shown', 'true');
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

  useEffect(() => {
    return () => {
      if (welcomeAudioCacheRef.current) {
        URL.revokeObjectURL(welcomeAudioCacheRef.current);
      }
      if ((window as any).currentOpenAIAudio) {
        (window as any).currentOpenAIAudio.pause();
        (window as any).currentOpenAIAudio = null;
      }
    };
  }, []);

  return (
    <div>
      {!showBottomSheet && (
        <div
          onClick={handleMicrophoneClick}
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: isProcessing
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isProcessing ? "default" : "pointer",
            border: "none",
            outline: "none",
            transition: "background-color 0.2s ease",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 20 20"
            style={{
              color: isProcessing
                ? "rgba(255, 255, 255, 0.5)"
                : "rgba(255, 255, 255, 1)",
            }}
          >
            <path
              fill="currentColor"
              d="M5.5 10a.5.5 0 0 0-1 0a5.5 5.5 0 0 0 5 5.478V17.5a.5.5 0 0 0 1 0v-2.022a5.5 5.5 0 0 0 5-5.478a.5.5 0 0 0-1 0a4.5 4.5 0 1 1-9 0m7.5 0a3 3 0 0 1-6 0V5a3 3 0 0 1 6 0z"
            />
          </svg>
        </div>
      )}

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