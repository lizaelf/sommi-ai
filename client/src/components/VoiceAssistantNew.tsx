import React, { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import VoiceBottomSheet from "./VoiceBottomSheet";

/**
 * MOBILE AUDIO MANAGER
 * Handles all browser quirks and provides consistent API
 */
class MobileAudioManager {
  private static instance: MobileAudioManager;
  private hasUserInteracted = false;
  private audioUnlocked = false;
  private currentAudio: HTMLAudioElement | null = null;
  
  static getInstance(): MobileAudioManager {
    if (!this.instance) {
      this.instance = new MobileAudioManager();
    }
    return this.instance;
  }
  
  // Mark that user has interacted with page
  markUserInteraction() {
    this.hasUserInteracted = true;
  }
  
  // Try to unlock audio (call on any user interaction)
  async unlockAudio(): Promise<boolean> {
    if (this.audioUnlocked) return true;
    
    try {
      // Play silent audio to unlock
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAAA=');
      silentAudio.volume = 0.1;
      await silentAudio.play();
      silentAudio.pause();
      
      this.audioUnlocked = true;
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Play audio with all necessary fallbacks
  async playAudio(url: string): Promise<{ success: boolean; needsInteraction: boolean }> {
    try {
      // Clean up previous audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      
      // Create new audio element
      const audio = new Audio(url);
      this.currentAudio = audio;
      
      // Add all necessary attributes for mobile
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.preload = 'auto';
      
      // Try to play
      await audio.play();
      
      return { success: true, needsInteraction: false };
      
    } catch (error: any) {
      console.log('Playback error:', error.name);
      
      // Check if it's a permission error
      if (error.name === 'NotAllowedError') {
        // Need user interaction
        return { success: false, needsInteraction: true };
      }
      
      // Other error
      return { success: false, needsInteraction: false };
    }
  }
  
  // Stop current audio
  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
  
  // Get current audio element
  getCurrentAudio(): HTMLAudioElement | null {
    return this.currentAudio;
  }
}

interface VoiceAssistantProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSendMessage, isProcessing }) => {
  // Core state
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Button visibility state
  const [showListenButton, setShowListenButton] = useState(false);
  const [showAskButton, setShowAskButton] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  
  // Permission state
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(() => {
    // Check if user already granted permission
    return localStorage.getItem('audioPermissionGranted') === 'true';
  });
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const audioManager = useRef(MobileAudioManager.getInstance());
  const hasAttemptedAutoplay = useRef(false);
  
  // Toast function (simplified)
  const { toast } = useToast();
  const showToast = (message: string) => {
    toast({
      description: message,
      duration: 3000,
    });
  };
  
  // Unlock audio on any user interaction
  useEffect(() => {
    const handleInteraction = async () => {
      audioManager.current.markUserInteraction();
      await audioManager.current.unlockAudio();
    };
    
    // Add listeners for all interaction types
    const events = ['touchstart', 'click', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop audio when page is hidden
        audioManager.current.stopAudio();
        setIsResponding(false);
        
        // Stop listening
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        setIsListening(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Determine which buttons to show
  useEffect(() => {
    if (isProcessing || isListening || isResponding || isLoadingAudio) {
      // Hide all buttons during processing
      setShowListenButton(false);
      setShowAskButton(false);
      setShowUnmuteButton(false);
      return;
    }
    
    // Check if we have a response to play
    const hasResponse = !!(window as any).lastAssistantMessageText;
    
    if (hasResponse && showBottomSheet && !hasAttemptedAutoplay.current) {
      // First time showing response
      hasAttemptedAutoplay.current = true;
      
      if (audioPermissionGranted) {
        // Try autoplay
        setTimeout(() => playAudioResponse(), 300);
      } else {
        // Show unmute button for first time
        setShowUnmuteButton(true);
      }
    } else if (showBottomSheet) {
      // Show ask button after audio completes
      setShowAskButton(true);
    }
  }, [isProcessing, isListening, isResponding, isLoadingAudio, showBottomSheet, audioPermissionGranted]);
  
  // Play audio response
  const playAudioResponse = async () => {
    const message = (window as any).lastAssistantMessageText;
    if (!message) {
      setShowAskButton(true);
      return;
    }
    
    setIsLoadingAudio(true);
    setShowUnmuteButton(false);
    setShowListenButton(false);
    setShowAskButton(false);
    
    try {
      // Get TTS audio
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      
      if (!response.ok) throw new Error('TTS failed');
      
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      // Try to play audio
      const result = await audioManager.current.playAudio(audioUrl);
      
      if (result.success) {
        // Audio is playing
        setIsLoadingAudio(false);
        setIsResponding(true);
        
        // Set up end handler
        const audio = audioManager.current.getCurrentAudio();
        if (audio) {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setIsResponding(false);
            setShowAskButton(true);
            hasAttemptedAutoplay.current = false;
          };
        }
      } else if (result.needsInteraction) {
        // Need user permission
        URL.revokeObjectURL(audioUrl);
        setIsLoadingAudio(false);
        setShowUnmuteButton(true);
        
        // Store the audio URL for later
        (window as any).pendingAudioUrl = audioUrl;
      } else {
        // Other error
        throw new Error('Audio playback failed');
      }
    } catch (error) {
      console.error('Audio error:', error);
      setIsLoadingAudio(false);
      setIsResponding(false);
      setShowAskButton(true);
    }
  };
  
  // Handle unmute button click
  const handleUnmute = async () => {
    // Grant permission
    setAudioPermissionGranted(true);
    localStorage.setItem('audioPermissionGranted', 'true');
    
    // Hide unmute button
    setShowUnmuteButton(false);
    
    // Play the audio
    await playAudioResponse();
  };
  
  // Handle listen button click (manual play)
  const handleListen = async () => {
    setShowListenButton(false);
    await playAudioResponse();
  };
  
  // Handle stop/mute button click
  const handleStop = () => {
    audioManager.current.stopAudio();
    setIsResponding(false);
    setShowAskButton(true);
    hasAttemptedAutoplay.current = false;
  };
  
  // Handle ask button click
  const handleAsk = () => {
    setShowAskButton(false);
    hasAttemptedAutoplay.current = false;
    startListening();
  };
  
  // Start speech recognition
  const startListening = async () => {
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not supported');
      return;
    }
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setShowBottomSheet(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        onSendMessage(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setShowAskButton(true);
        
        if (event.error !== 'aborted') {
          showToast('Please try again');
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Microphone error:', error);
      showToast('Microphone access required');
      setShowAskButton(true);
    }
  };
  
  // Handle microphone button click
  const handleMicrophoneClick = () => {
    if (!showBottomSheet) {
      setShowBottomSheet(true);
      startListening();
    }
  };
  
  // Handle bottom sheet close
  const handleCloseBottomSheet = () => {
    // Stop everything
    audioManager.current.stopAudio();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    
    // Reset state
    setShowBottomSheet(false);
    setIsListening(false);
    setIsResponding(false);
    setIsLoadingAudio(false);
    setShowAskButton(false);
    setShowListenButton(false);
    setShowUnmuteButton(false);
    hasAttemptedAutoplay.current = false;
  };
  
  return (
    <>
      {/* Microphone Button */}
      {!showBottomSheet && (
        <button
          onClick={handleMicrophoneClick}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          🎤
        </button>
      )}
      
      {/* Voice Bottom Sheet */}
      <VoiceBottomSheet
        isOpen={showBottomSheet}
        onClose={handleCloseBottomSheet}
        onMute={handleStop}
        onAsk={handleAsk}
        
        // State props
        isListening={isListening}
        isResponding={isResponding}
        isThinking={isProcessing}
        isLoadingAudio={isLoadingAudio}
        
        // Button visibility
        showUnmuteButton={showUnmuteButton}
        showListenButton={showListenButton}
        showAskButton={showAskButton}
        
        // Handlers
        onUnmute={handleUnmute}
        onListenResponse={handleListen}
      />
    </>
  );
};

export default VoiceAssistant;