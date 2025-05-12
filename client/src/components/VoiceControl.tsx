import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

// Define the SpeechRecognition types that are missing in TypeScript
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
    item(index: number): SpeechRecognitionResultList;
    length: number;
  };
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: any) => void) | null;
}

// Add the missing properties to the Window interface
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface VoiceControlProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

/**
 * A voice control component that allows users to speak and receive transcriptions
 */
const VoiceControl: React.FC<VoiceControlProps> = ({ onTranscript, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState('Click to speak');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition on component mount
  useEffect(() => {
    // Check if the browser supports SpeechRecognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setStatusText('Speech recognition not supported');
      return;
    }

    // Create a new recognition instance
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Set up event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setStatusText('Listening...');
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatusText('Click to speak');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setStatusText(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Clean up
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        if (isListening) {
          recognitionRef.current.stop();
        }
      }
    };
  }, [onTranscript, isListening]);

  // Function to toggle listening state
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setStatusText('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        type="button"
        onClick={toggleListening}
        disabled={disabled || !window.SpeechRecognition && !window.webkitSpeechRecognition}
        variant="outline"
        className={`rounded-full p-3 aspect-square ${isListening ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-purple-50 hover:bg-purple-100 text-[#6A53E7]'}`}
        title={statusText}
      >
        {isListening ? <Square size={18} /> : <Mic size={18} />}
      </Button>
      <span className="text-xs mt-1 text-gray-500">{statusText}</span>
    </div>
  );
};

export default VoiceControl;