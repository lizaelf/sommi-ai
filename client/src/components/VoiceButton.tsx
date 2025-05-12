import { useState, useRef, useEffect } from "react";
import { LucideMic, LucideMicOff, LucideLock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initSpeechRecognition } from "@/lib/voiceUtils";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  className?: string;
}

export function VoiceButton({ onTranscript, isProcessing, className }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [statusText, setStatusText] = useState("");
  const recognitionRef = useRef<any>(null);

  // Initialize recognition on mount
  useEffect(() => {
    const recognition = initSpeechRecognition();
    
    if (!recognition) {
      setIsSupported(false);
      setStatusText("Voice input not supported in this browser");
      return;
    }
    
    recognitionRef.current = recognition;
    
    // Set up event handlers
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        onTranscript(transcript);
      }
      stopListening();
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setStatusText(`Error: ${event.error}`);
      stopListening();
      
      // Clear status after delay
      setTimeout(() => setStatusText(""), 3000);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [onTranscript]);
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const startListening = () => {
    if (!recognitionRef.current || isProcessing) return;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setStatusText("Listening...");
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setStatusText("Failed to start listening");
      setTimeout(() => setStatusText(""), 3000);
    }
  };
  
  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatusText("");
    } catch (error) {
      console.error("Failed to stop speech recognition:", error);
    }
  };
  
  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("text-muted-foreground opacity-50", className)}
        disabled={true}
        title="Voice input not supported in this browser"
      >
        <LucideLock className="h-5 w-5" />
      </Button>
    );
  }
  
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "text-muted-foreground transition-all duration-200", 
          isListening && "text-destructive animate-pulse", 
          className
        )}
        disabled={isProcessing}
        onClick={toggleListening}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          <LucideMicOff className="h-5 w-5" />
        ) : (
          <LucideMic className="h-5 w-5" />
        )}
      </Button>
      
      {statusText && (
        <div className="absolute bottom-16 left-0 right-0 text-center text-sm text-muted-foreground bg-background/80 py-1">
          {statusText}
        </div>
      )}
    </>
  );
}