import { useState, useRef, useEffect } from "react";

export interface VoiceState {
  isListening: boolean;
  showBottomSheet: boolean;
  isResponding: boolean;
  isThinking: boolean;
  isPlayingAudio: boolean;
  showUnmuteButton: boolean;
  showAskButton: boolean;
  isVoiceActive: boolean;
}

export interface VoiceRefs {
  isManuallyClosedRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  welcomeAudioCacheRef: React.MutableRefObject<string | null>;
  welcomeAudioElementRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  silenceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  voiceDetectionIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  silenceStartTimeRef: React.MutableRefObject<number | null>;
  lastVoiceDetectedRef: React.MutableRefObject<number>;
  consecutiveSilenceCountRef: React.MutableRefObject<number>;
  recordingStartTimeRef: React.MutableRefObject<number>;
  audioCache: React.MutableRefObject<Map<string, Blob>>;
}

export const useVoiceState = () => {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    showBottomSheet: false,
    isResponding: false,
    isThinking: false,
    isPlayingAudio: false,
    showUnmuteButton: false,
    showAskButton: false,
    isVoiceActive: false,
  });

  const refs: VoiceRefs = {
    isManuallyClosedRef: useRef(false),
    mediaRecorderRef: useRef<MediaRecorder | null>(null),
    audioChunksRef: useRef<Blob[]>([]),
    streamRef: useRef<MediaStream | null>(null),
    welcomeAudioCacheRef: useRef<string | null>(null),
    welcomeAudioElementRef: useRef<HTMLAudioElement | null>(null),
    currentAudioRef: useRef<HTMLAudioElement | null>(null),
    audioContextRef: useRef<AudioContext | null>(null),
    analyserRef: useRef<AnalyserNode | null>(null),
    silenceTimerRef: useRef<NodeJS.Timeout | null>(null),
    voiceDetectionIntervalRef: useRef<NodeJS.Timeout | null>(null),
    silenceStartTimeRef: useRef<number | null>(null),
    lastVoiceDetectedRef: useRef<number>(0),
    consecutiveSilenceCountRef: useRef<number>(0),
    recordingStartTimeRef: useRef<number>(0),
    audioCache: useRef<Map<string, Blob>>(new Map()),
  };

  const updateState = (updates: Partial<VoiceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Share state globally for CircleAnimation
  useEffect(() => {
    (window as any).voiceAssistantState = {
      isListening: state.isListening,
      isProcessing: state.isThinking,
      isResponding: state.isResponding,
      showBottomSheet: state.showBottomSheet,
      isPlayingAudio: state.isPlayingAudio
    };
  }, [state.isListening, state.isThinking, state.isResponding, state.showBottomSheet, state.isPlayingAudio]);

  return {
    state,
    refs,
    updateState,
  };
};