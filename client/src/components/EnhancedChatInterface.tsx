import React, { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { ContactFormBottomSheet } from './ContactFormBottomSheet';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import VoiceAssistant from './VoiceAssistant';
import WineBottleImage from './WineBottleImage';
import USFlagImage from './USFlagImage';
import { useConversation } from '@/hooks/useConversation';
import { ClientMessage } from '@/lib/types';
import typography from '@/styles/typography';
import { getWineDisplayName, getWineRegion, getWineVintage, WINE_CONFIG } from '@shared/wineConfig';
import { ShiningText } from '@/components/ShiningText';
import { TextGenerateEffect } from './ui/text-generate-effect';
// Import typography styles

// Extend Window interface to include voiceAssistant
declare global {
  interface Window {
    voiceAssistant?: {
      speakResponse: (text: string) => Promise<void>;
      playLastAudio: () => void;
      speakLastAssistantMessage: () => void;
      muteAndSavePosition: () => void;
      resumeFromMute: () => void;
    };
  }
}

interface EnhancedChatInterfaceProps {
  showBuyButton?: boolean;
}

export default function EnhancedChatInterface({ showBuyButton = false }: EnhancedChatInterfaceProps) {
  const { toast } = useToast();
  const [location] = useLocation();
  const { messages, sendMessage, isLoading, conversationId } = useConversation();
  
  // Check if user has shared contact information
  const [hasSharedContact, setHasSharedContact] = useState(() => {
    return localStorage.getItem('hasSharedContact') === 'true';
  });
  
  // State for contact bottom sheet
  const [showContactSheet, setShowContactSheet] = useState(false);

  const handleCloseContactSheet = () => {
    setShowContactSheet(false);
  };

  const handleContactSuccess = () => {
    setHasSharedContact(true);
    setShowContactSheet(false);
  };

  const handleOpenContactSheet = () => {
    setShowContactSheet(true);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string, isVoiceInput = false) => {
    if (!content.trim()) return;

    // Create a temporary user message for immediate display
    const tempUserMessage: ClientMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    try {
      const response = await sendMessage(content);
      
      if (response) {
        // Create assistant message for immediate display
        const assistantMessage: ClientMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header with wine info */}
          <div
            style={{
              padding: '32px 24px 24px 24px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(28, 28, 28, 0.85)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Wine bottle image */}
            <div style={{ marginBottom: '16px' }}>
              <WineBottleImage />
            </div>

            {/* Wine name with animated effect */}
            <h1 style={{ 
              ...typography.h1, 
              marginBottom: '8px',
              fontSize: '24px',
              lineHeight: '32px',
              fontWeight: 500,
              color: 'white'
            }}>
              <ShiningText text={`${getWineDisplayName()}. ${getWineVintage()}`} />
            </h1>

            {/* Wine region */}
            <p style={{ 
              ...typography.body, 
              color: '#CECECE',
              marginBottom: '0'
            }}>
              {getWineRegion()}
            </p>
          </div>

          {/* Chat Messages Area */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '24px',
            paddingBottom: hasSharedContact ? '120px' : '180px' // Extra space for contact button
          }}>
            {messages.map((message, index) => (
              <ChatMessage key={`${message.id}-${index}`} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Want to see wine history button (fixed to bottom when contact not shared) */}
          {!hasSharedContact && (
            <div
              style={{
                position: 'fixed',
                bottom: '0px',
                left: '0px',
                right: '0px',
                padding: '16px 24px 24px 24px',
                background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 40%)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
              }}
            >
              <button
                onClick={handleOpenContactSheet}
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(28, 28, 28, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(28, 28, 28, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                Want to see wine history?
              </button>
            </div>
          )}

          {/* Fixed Chat Input at Bottom (only when contact shared) */}
          {hasSharedContact && (
            <div
              style={{
                position: 'fixed',
                bottom: '0px',
                left: '0px',
                right: '0px',
                padding: '16px 24px 24px 24px',
                background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 40%)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isProcessing={isLoading}
                  voiceButtonComponent={
                    <VoiceAssistant 
                      onSendMessage={handleSendMessage}
                      isProcessing={isLoading}
                    />
                  }
                />
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Contact Bottom Sheet */}
      <ContactFormBottomSheet 
        isOpen={showContactSheet}
        onClose={handleCloseContactSheet}
        onSuccess={handleContactSuccess}
      />
    </div>
  );
}