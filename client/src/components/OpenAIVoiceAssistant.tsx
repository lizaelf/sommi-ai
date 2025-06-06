import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/UseToast";
import VoiceBottomSheet from "./VoiceBottomSheet";

interface OpenAIVoiceAssistantProps {
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
}

export function OpenAIVoiceAssistant({ onSendMessage, isProcessing = false }: OpenAIVoiceAssistantProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if device supports audio recording
  const isAudioSupported = () => {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder;
  };

  // Request microphone permission
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimal for Whisper
        } 
      });
      
      // Test successful - stop the stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      return false;
    }
  };

  // Start recording audio
  const startListening = async () => {
    console.log("Starting OpenAI Whisper voice recognition");

    // Check audio support
    if (!isAudioSupported()) {
      toast({
        description: "Voice input not supported on this device",
        duration: 3000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
      return;
    }

    // Request microphone permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      toast({
        description: "Microphone access required for voice input",
        duration: 3000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
      return;
    }

    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped, processing audio...");
        setIsListening(false);
        setIsTranscribing(true);

        // Dispatch processing event for animation
        window.dispatchEvent(
          new CustomEvent("mic-status", {
            detail: { status: "processing" },
          }),
        );

        try {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log("Audio blob created, size:", audioBlob.size);

          // Send to OpenAI Whisper API
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            
            // Handle quota exceeded - fallback to browser speech recognition
            if (response.status === 429 && errorData.fallback) {
              console.warn("OpenAI quota exceeded, falling back to browser speech recognition");
              toast({
                description: "Switching to browser voice recognition",
                duration: 2000,
                className: "bg-white text-black border-none",
                style: {
                  position: "fixed",
                  top: "74px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "auto",
                  maxWidth: "none",
                  padding: "8px 24px",
                  borderRadius: "32px",
                  boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
                  zIndex: 9999,
                },
              });
              
              // TODO: Fallback to browser speech recognition
              setIsTranscribing(false);
              setShowBottomSheet(false);
              return;
            }
            
            throw new Error(errorData.error || 'Transcription failed');
          }

          const result = await response.json();
          console.log("Transcription result:", result);

          if (result.transcript && result.transcript.trim()) {
            console.log("Final transcript:", result.transcript);
            onSendMessage(result.transcript.trim());
          } else {
            throw new Error("No speech detected");
          }

        } catch (error) {
          console.error("Transcription error:", error);
          
          let errorMessage = "Voice recognition failed";
          if (error instanceof Error) {
            if (error.message.includes("No speech detected")) {
              errorMessage = "No speech detected - please try again";
            } else if (error.message.includes("network") || error.message.includes("fetch")) {
              errorMessage = "Network error - check your connection";
            }
          }

          toast({
            description: errorMessage,
            duration: 3000,
            className: "bg-white text-black border-none",
            style: {
              position: "fixed",
              top: "74px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "auto",
              maxWidth: "none",
              padding: "8px 24px",
              borderRadius: "32px",
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
              zIndex: 9999,
            },
          });
        } finally {
          setIsTranscribing(false);
          setShowBottomSheet(false);
          
          // Dispatch stopped event for animation
          window.dispatchEvent(
            new CustomEvent("mic-status", {
              detail: { status: "stopped" },
            }),
          );
        }

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      setShowBottomSheet(true);

      // Dispatch listening event for animation
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("mic-status", {
            detail: { status: "listening" },
          }),
        );
      }, 100);

      console.log("Recording started");

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log("Auto-stopping recording after 30 seconds");
          stopListening();
        }
      }, 30000);

    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsListening(false);
      setShowBottomSheet(false);

      toast({
        description: "Failed to start voice recognition",
        duration: 2000,
        className: "bg-white text-black border-none",
        style: {
          position: "fixed",
          top: "74px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          maxWidth: "none",
          padding: "8px 24px",
          borderRadius: "32px",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          zIndex: 9999,
        },
      });
    }
  };

  // Stop recording audio
  const stopListening = () => {
    console.log("Stopping recording");
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsListening(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle page visibility change to stop recording when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        console.log("Page hidden - stopping microphone access");
        stopListening();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening]);

  return (
    <>
      <VoiceBottomSheet
        isVisible={showBottomSheet}
        isListening={isListening}
        isProcessing={isTranscribing || isProcessing}
        onClose={() => {
          setShowBottomSheet(false);
          if (isListening) {
            stopListening();
          }
        }}
      />
      
      {/* Expose methods to window for compatibility */}
      {typeof window !== 'undefined' && (() => {
        (window as any).openaiVoiceAssistant = {
          startListening,
          stopListening,
          isListening,
          isTranscribing
        };
        return null;
      })()}
    </>
  );
}

export default OpenAIVoiceAssistant;