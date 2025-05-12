// Voice interaction utilities for the chat interface

// TypeScript declarations for browser speech recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

// Add type definitions to Window interface
declare global {
  interface Window {
    SpeechRecognition?: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
  }
}

// Initialize speech recognition
export function initSpeechRecognition() {
  // Check for browser support
  if (typeof window === 'undefined' || 
      (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window))) {
    console.error('Speech recognition not supported in this browser');
    return null;
  }
  
  // Create speech recognition instance
  const SpeechRecognitionConstructor = 'SpeechRecognition' in window
    ? (window as any).SpeechRecognition
    : (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionConstructor();
  
  // Configure recognition settings
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  return recognition;
}

// Initialize speech synthesis
export function initSpeechSynthesis() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported in this browser');
    return null;
  }
  
  return window.speechSynthesis;
}

// Speak text using browser's speech synthesis
export function speakText(text: string, onEndCallback?: () => void) {
  const synthesis = initSpeechSynthesis();
  if (!synthesis) return;
  
  // Cancel any ongoing speech
  synthesis.cancel();
  
  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set voice preferences
  const voices = synthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    (voice.name.includes('Female') && voice.lang.includes('en-')) || 
    voice.name.includes('Samantha')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  // Set speech properties
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  // Set callback when speech ends
  if (onEndCallback) {
    utterance.onend = onEndCallback;
  }
  
  // Start speaking
  synthesis.speak(utterance);
  
  return utterance;
}

// Speech-to-Text using OpenAI TTS API
export async function getOpenAIVoiceAudio(text: string) {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get voice response from API');
    }
    
    // Create audio from response
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Clean up object URL when done
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    
    return audio;
  } catch (error) {
    console.error('Error getting OpenAI TTS:', error);
    throw error;
  }
}