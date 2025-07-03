import React, { useRef } from 'react'
import { createPortal } from 'react-dom'
import CircleAnimation from '../animations/CircleAnimation'
import { ShiningText } from '../animations/ShiningText'
import Button from '@/components/ui/buttons/Button'
import SuggestionPills from '../chat/SuggestionPills'
import { Wine } from '@/types/wine'
import { X } from 'lucide-react'

interface VoiceAssistantBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onMute: () => void
  onAsk: () => void
  isListening?: boolean
  isResponding?: boolean
  isThinking?: boolean
  showSuggestions?: boolean
  showListenButton?: boolean
  showAskButton?: boolean
  showUnmuteButton: boolean
  isLoadingAudio?: boolean
  isVoiceActive?: boolean
  isPlayingAudio?: boolean
  wineKey?: string
  onSuggestionClick?: (suggestion: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => void
  onListenResponse?: () => void
  onUnmute?: () => void
  onStopAudio?: () => void
  onSendMessage?: (message: string) => void
  addMessage?: (message: any) => void
  conversationId?: string
  wine?: Wine
}

const VoiceAssistantBottomSheet: React.FC<VoiceAssistantBottomSheetProps> = ({ isOpen, onClose, onMute, onAsk, isListening = false, isResponding = false, isThinking = false, showSuggestions = true, showListenButton = false, showAskButton = false, showUnmuteButton = false, isLoadingAudio = false, isVoiceActive = false, isPlayingAudio = false, wineKey = '', onSuggestionClick, onListenResponse, onUnmute, onStopAudio, onSendMessage, addMessage, conversationId, wine }) => {
  if (!isOpen) return null

  const content = (
    <>
      {/* Background overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Bottom sheet container */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1a1a1a',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          zIndex: 9999,
          padding: '32px 0 48px 0',
          minHeight: '380px',
          maxHeight: '80vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
          boxSizing: 'border-box',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            cursor: 'pointer',
            zIndex: 10,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
          onClick={onClose}
        >
          <img src='/icons/x.svg' alt='Close' width='20' height='20' style={{ filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* Wine glass animation container */}
        <div
          style={{
            width: '272px',
            height: '272px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <CircleAnimation isAnimating={isListening || isResponding} size={156} />
        </div>

        {/* Status Content */}
        {isListening ? (
          <>
            <div
              style={{
                width: '100%',
                maxWidth: '320px',
                height: '56px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingLeft: '16px',
                paddingRight: '16px',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShiningText text='Listening...' />
              </div>
            </div>
          </>
        ) : isThinking ? (
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '56px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: '16px',
              paddingRight: '16px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShiningText text='Thinking...' />
            </div>
          </div>
        ) : isLoadingAudio ? (
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '56px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: '16px',
              paddingRight: '16px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShiningText text='Loading...' />
            </div>
          </div>
        ) : isResponding || isPlayingAudio ? (
          <div style={{ paddingLeft: '16px', paddingRight: '16px', width: '100%' }}>
            <Button
              onClick={() => {
                if (onMute) {
                  console.log('🛑 Calling onMute prop')
                  onMute()
                }
                if ((window as any).stopVoiceAudio) {
                  console.log('🛑 Calling global stopVoiceAudio')
                  ;(window as any).stopVoiceAudio()
                }
                try {
                  const audioElements = document.querySelectorAll('audio')
                  audioElements.forEach(audio => {
                    if (!audio.paused) {
                      audio.pause()
                      audio.currentTime = 0
                      console.log('🛑 Stopped audio element directly')
                    }
                  })
                } catch (error) {
                  console.warn('Error stopping audio elements:', error)
                }
                window.dispatchEvent(new CustomEvent('stopVoiceAudio'))
                window.dispatchEvent(new CustomEvent('tts-audio-stop'))
                window.dispatchEvent(new CustomEvent('deploymentAudioStopped'))
                console.log('🛑 Stop button processing complete')
              }}
              variant='brand'
              className='w-full rounded-[32px] h-14 flex justify-center items-center gap-2 font-medium text-[16px]'
              style={{
                border: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <img src='/icons/stop.svg' alt='Stop' width='20' height='20' style={{ filter: 'brightness(0) invert(1)' }} />
              Stop
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            {/* Unmute Button - показуємо першим */}
            {showUnmuteButton && onUnmute && !isThinking && (
              <div
                style={{
                  width: '100%',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  marginBottom: '12px',
                }}
              >
                <Button
                  onClick={onUnmute}
                  variant='primary'
                  style={{
                    width: '100%',
                    borderRadius: '32px',
                    height: '56px',
                    padding: '0 16px',
                    margin: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    outline: 'none',
                    transition: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <img src='/icons/volume-2.svg' alt='Unmute' width='20' height='20' />
                  Unmute
                </Button>
              </div>
            )}

            {/* Ask Button - показуємо другим */}
            {showAskButton && !isThinking && (
              <div
                style={{
                  width: '100%',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                }}
              >
                <Button
                  onClick={onAsk}
                  variant='primary'
                  style={{
                    width: '100%',
                    borderRadius: '32px',
                    height: '56px',
                    padding: '0 16px',
                    margin: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    outline: 'none',
                    transition: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <img src='/icons/mic.svg' alt='Ask' width='20' height='20' />
                  Ask
                </Button>
              </div>
            )}

            {/* Listen Response Button - показуємо останнім */}
            {showListenButton && onListenResponse && !showUnmuteButton && !showAskButton && !isThinking && (
              <div
                style={{
                  width: '100%',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                }}
              >
                <Button
                  onClick={onListenResponse}
                  variant='secondary'
                  style={{
                    width: '100%',
                    borderRadius: '32px',
                    height: '56px',
                    padding: '0 16px',
                    margin: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    outline: 'none',
                    transition: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <img src='/icons/volume-2.svg' alt='Listen' width='20' height='20' />
                  Listen to response
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )

  return createPortal(content, document.body)
}

export default VoiceAssistantBottomSheet
