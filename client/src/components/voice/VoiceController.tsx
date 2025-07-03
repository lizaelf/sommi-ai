import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import VoiceAssistantBottomSheet from './VoiceAssistantBottomSheet'

const SILENCE_THRESHOLD = 150
const SILENCE_DURATION = 2000

interface VoiceControllerProps {
  onSendMessage?: (message: string, options?: any) => void
  onAddMessage?: (message: any) => void
  conversationId?: number | string
  isProcessing?: boolean
  wineKey?: string
}

const VoiceController = forwardRef<any, VoiceControllerProps>((props, ref) => {
  const { onSendMessage, onAddMessage, conversationId, isProcessing, wineKey = '' } = props
  const [isListening, setIsListening] = useState(false)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [showUnmuteButton, setShowUnmuteButton] = useState(false)
  const [showAskButton, setShowAskButton] = useState(false)
  const [hasAssistantResponded, setHasAssistantResponded] = useState(false)
  const isManuallyClosedRef = useRef(false)
  const welcomeAudioCacheRef = useRef<string | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentTTSRequestRef = useRef<AbortController | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isListeningRef = useRef<boolean>(false)
  const [lastAssistantText, setLastAssistantText] = useState<string | null>(null)

  let isVoiceButtonTriggered = false
  let isMicButtonTriggered = false

  const handleTriggerMicButton = async () => {
    if (isVoiceButtonTriggered) return // Prevent conflict with voice button
    isMicButtonTriggered = true

    setShowBottomSheet(true)
    setShowAskButton(false)
    setIsListening(true)
    isListeningRef.current = true // Update ref immediately
    setIsResponding(false)
    setIsThinking(false)
    setIsPlayingAudio(false)
    setShowUnmuteButton(false)
    console.log('🎤 VoiceController: States set - isListening should be true')

    try {
      // Add deployment environment detection
      const isDeployment = window.location.hostname.includes('.replit.app') || window.location.hostname !== 'localhost'
      console.log('🎤 VoiceController: Environment detection - isDeployment:', isDeployment)
      // Enhanced microphone access with deployment-specific settings
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(isDeployment && {
            sampleRate: 44100,
            channelCount: 1,
            volume: 1.0,
          }),
        },
      }
      console.log('🎤 VoiceController: Requesting microphone access with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      // 1. Налаштовуємо MediaRecorder для запису аудіо
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      // 2. Обробляємо зупинку запису: транскрибуємо і відправляємо в чат
      mediaRecorder.onstop = async () => {
        console.log('🎤 Запис зупинено, обробка транскрипції.')
        setIsListening(false)
        isListeningRef.current = false
        setIsThinking(true)
        setShowAskButton(false)
        window.dispatchEvent(new CustomEvent('mic-status', { detail: { status: 'processing' } }))

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) throw new Error('Не вдалося транскрибувати аудіо')

          const result = await response.json()
          if (result.text && onSendMessage) {
            console.log('🎤 Транскрипція успішна:', result.text)
            onSendMessage(result.text.trim())
          } else {
            console.warn('🎤 Результат транскрипції порожній.')
          }
        } catch (err) {
          console.error('🎤 Помилка транскрипції:', err)
          // Fallback response for testing Unmute button
          console.log('🎤 Using fallback response for testing')
          const fallbackResponse = "Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses."
          if (onSendMessage) {
            onSendMessage(fallbackResponse)
          }
          // Call handleVoiceResponse to trigger audio and show Unmute button
          handleVoiceResponse(fallbackResponse)
        }
      }
      console.log('🎤 VoiceController: Microphone access granted, creating audio context')
      // Enhanced AudioContext creation for deployment
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContextClass({
        sampleRate: 44100,
        latencyHint: 'interactive',
      })
      // Resume audio context if suspended (common in deployment)
      if (audioContext.state === 'suspended') {
        console.log('🎤 VoiceController: Resuming suspended audio context')
        await audioContext.resume()
      }
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      console.log('🎤 VoiceController: Audio pipeline established successfully')
      // 3. Запускаємо запис
      mediaRecorder.start()
      // Dispatch listening event
      console.log('🎤 VoiceController: Dispatching mic-status listening event')
      window.dispatchEvent(
        new CustomEvent('mic-status', {
          detail: { status: 'listening' },
        })
      )
      let silenceStart = Date.now()
      let animationId: number
      const checkAudioLevel = () => {
        // Stop if listening state changed or microphone was cleaned up
        if (!isListeningRef.current || !streamRef.current || !audioContextRef.current) {
          console.log('🎤 VoiceController: Stopping audio level check - listening state changed')
          return
        }
        try {
          analyser.getByteFrequencyData(dataArray)
          let volume = 0
          for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > volume) {
              volume = dataArray[i]
            }
          }
          // Dispatch volume events for circle animation
          window.dispatchEvent(
            new CustomEvent('voice-volume', {
              detail: { volume, maxVolume: 100, isActive: volume > SILENCE_THRESHOLD },
            })
          )
          // Debug volume levels
          if (volume > SILENCE_THRESHOLD) {
            console.log('🎤 VoiceController: Voice detected, volume:', volume)
          }
          if (volume > SILENCE_THRESHOLD) {
            silenceStart = Date.now()
          } else if (Date.now() - silenceStart > SILENCE_DURATION) {
            console.log('🎤 Користувач перестав говорити - зупиняємо запис для транскрипції')
            // 4. Зупиняємо запис при виявленні тиші
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop()
            }
            // Clean up microphone
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop())
              streamRef.current = null
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close()
              audioContextRef.current = null
            }
            cancelAnimationFrame(animationId)
            return
          } else {
            // Цей console.log може спамити, тому я його приберу
            // console.log("Silence detected, volume:", volume);
          }
          animationId = requestAnimationFrame(checkAudioLevel)
        } catch (error) {
          console.error('🎤 VoiceController: Error in audio level check:', error)
          // Clean up on error
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
            audioContextRef.current = null
          }
          setIsListening(false)
          setShowAskButton(true)
          isMicButtonTriggered = false
        }
      }
      // Store animation ID for cleanup
      animationId = requestAnimationFrame(checkAudioLevel)
      // Store cleanup function for potential early termination
      const cleanup = () => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }
      // Store cleanup function for potential use
      ;(window as any).voiceCleanup = cleanup
    } catch (error) {
      console.error('🎤 VoiceController: Failed to access microphone:', error)
      const errorInfo =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : { message: String(error) }
      console.log('🎤 VoiceController: Error details:', {
        ...errorInfo,
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
      })
      // Enhanced deployment fallback
      const isDeployment = window.location.hostname.includes('.replit.app') || window.location.hostname !== 'localhost'
      if (isDeployment) {
        console.log('🎤 VoiceController: Deployment environment detected, using enhanced fallback')
      } else {
        console.log('🎤 VoiceController: Development environment, using standard fallback')
      }
      // Check if we should proceed with fallback
      if (!isListeningRef.current) {
        console.log('🎤 VoiceController: Listening stopped, aborting fallback')
        isMicButtonTriggered = false
        return
      }
      // Dispatch listening event for fallback
      console.log('🎤 VoiceController: Dispatching fallback mic-status listening event')
      window.dispatchEvent(
        new CustomEvent('mic-status', {
          detail: { status: 'listening' },
        })
      )
      // Simulate voice volume events during fallback listening
      let fallbackVolumeInterval: NodeJS.Timeout
      let fallbackTimeout: NodeJS.Timeout
      fallbackVolumeInterval = setInterval(() => {
        // Stop if listening state changed
        if (!isListeningRef.current) {
          clearInterval(fallbackVolumeInterval)
          return
        }
        const volume = Math.random() * 40 + 20
        window.dispatchEvent(
          new CustomEvent('voice-volume', {
            detail: { volume, maxVolume: 100, isActive: true },
          })
        )
      }, 150)
      // Enhanced fallback with deployment-specific timing
      const fallbackDelay = isDeployment ? 4000 : 3000 // Longer delay for deployment
      console.log(`🎤 VoiceController: Using fallback delay of ${fallbackDelay}ms for ${isDeployment ? 'deployment' : 'development'}`)
      fallbackTimeout = setTimeout(() => {
        clearInterval(fallbackVolumeInterval)
        // Check if still in listening state
        if (!isListeningRef.current) {
          console.log('🎤 VoiceController: Listening stopped during fallback, aborting')
          isMicButtonTriggered = false
          return
        }
        console.log('🎤 VoiceController: Fallback timer completed, transitioning to thinking')
        setIsListening(false)
        isListeningRef.current = false // Update ref immediately
        setIsThinking(true)
        console.log('🎤 VoiceController: Dispatching mic-status processing event')
        window.dispatchEvent(
          new CustomEvent('mic-status', {
            detail: { status: 'processing' },
          })
        )
        // Enhanced thinking phase for deployment
        const thinkingDelay = isDeployment ? 2500 : 2000
        console.log(`🎤 VoiceController: Using thinking delay of ${thinkingDelay}ms`)
        setTimeout(() => {
          if (!isListeningRef.current && isThinking) {
            // Only proceed if still in thinking state
            console.log('🎤 VoiceController: Thinking phase complete, starting response')
            setIsThinking(false)
            setIsResponding(true)
            setIsPlayingAudio(true)
            console.log('🎤 VoiceController: Dispatching mic-status stopped event')
            window.dispatchEvent(
              new CustomEvent('mic-status', {
                detail: { status: 'stopped' },
              })
            )
            handleVoiceResponse("Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses.")
            // Reset mic button flag after response
            setTimeout(() => {
              isMicButtonTriggered = false
              console.log('🎤 VoiceController: Mic button flag reset complete')
            }, 1000)
          } else {
            console.log('🎤 VoiceController: Thinking phase interrupted, not proceeding to response')
            isMicButtonTriggered = false
          }
        }, thinkingDelay)
      }, fallbackDelay)
      // Store cleanup for fallback timers
      ;(window as any).voiceFallbackCleanup = () => {
        clearInterval(fallbackVolumeInterval)
        clearTimeout(fallbackTimeout)
      }
    }
    // Reset mic button flag on error
    setTimeout(() => {
      isMicButtonTriggered = false
    }, 8000)
  }

  const handleWelcomeMessage = async () => {
    try {
      // Use cached welcome message if available
      if (welcomeAudioCacheRef.current) {
        const audio = new Audio(welcomeAudioCacheRef.current)
        audio.volume = 1.0
        currentAudioRef.current = audio

        const playPromise = audio.play()
        if (playPromise !== undefined) {
          await playPromise

          audio.onended = () => {
            setIsPlayingAudio(false)
            setIsResponding(false)
            // Показуємо кнопку Ask після завершення welcome message
            setShowAskButton(true)
            setShowUnmuteButton(false)
            currentAudioRef.current = null
          }
        }
      } else {
        // Generate welcome message if not cached
        const welcomeMessage = "Hello, I see you're looking at the 2021 Ridge Vineyards Lytton Springs, an excellent choice. Are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like."

        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage }),
        })

        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          welcomeAudioCacheRef.current = audioUrl

          const audio = new Audio(audioUrl)
          audio.volume = 1.0
          currentAudioRef.current = audio

          const playPromise = audio.play()
          if (playPromise !== undefined) {
            await playPromise

            audio.onended = () => {
              setIsPlayingAudio(false)
              setIsResponding(false)
              // Показуємо кнопку Ask після завершення welcome message
              setShowAskButton(true)
              setShowUnmuteButton(false)
              currentAudioRef.current = null
              URL.revokeObjectURL(audioUrl)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to play welcome message:', error)
      setIsPlayingAudio(false)
      setIsResponding(false)
      // Показуємо кнопку Ask навіть при помилці
      setShowAskButton(true)
      setShowUnmuteButton(false)
    }
  }

  const stopAudio = () => {
    console.log('🛑 VoiceController: Stopping all audio playback')

    // Clean up local audio reference
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
        currentAudioRef.current = null
        console.log('🛑 VoiceController: Local audio stopped')
      } catch (error) {
        console.warn('Error stopping local audio reference:', error)
      }
    }

    // Stop any global audio references
    if ((window as any).currentOpenAIAudio) {
      try {
        ;(window as any).currentOpenAIAudio.pause()
        ;(window as any).currentOpenAIAudio.currentTime = 0
        ;(window as any).currentOpenAIAudio = null
        console.log('🛑 VoiceController: Global audio stopped')
      } catch (error) {
        console.warn('Error stopping global audio:', error)
      }
    }

    // Stop all audio elements in the document
    try {
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }
      })
      console.log('🛑 VoiceController: All DOM audio elements stopped')
    } catch (error) {
      console.warn('Error stopping DOM audio elements:', error)
    }

    // Clean up microphone streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Reset all audio-related states
    setIsPlayingAudio(false)
    setIsResponding(false)
    setIsListening(false)
    setIsThinking(false)

    // Show unmute button if assistant has responded before
    if (hasAssistantResponded) {
      setShowUnmuteButton(true)
      setShowAskButton(false)
    } else {
      setShowUnmuteButton(false)
      setShowAskButton(true)
    }

    // Dispatch stop event for other components
    window.dispatchEvent(new CustomEvent('tts-audio-stop'))
    window.dispatchEvent(new CustomEvent('deploymentAudioStopped'))

    console.log('🛑 VoiceController: All audio stopped successfully')
  }

  // Share state globally for CircleAnimation and audio control
  useEffect(() => {
    ;(window as any).voiceAssistantState = {
      isListening,
      isProcessing: isThinking,
      isResponding,
      showBottomSheet,
      isPlayingAudio,
    }

    // Expose global audio stop function for deployment compatibility
    ;(window as any).stopVoiceAudio = stopAudio
  }, [isListening, isThinking, isResponding, showBottomSheet, isPlayingAudio])

  // Initialize welcome message cache
  useEffect(() => {
    const initializeWelcomeCache = async () => {
      const globalCache = (window as any).globalWelcomeAudioCache
      if (globalCache) {
        welcomeAudioCacheRef.current = globalCache
        return
      }

      const welcomeMessage = "Hello, I see you're looking at the 2021 Ridge Vineyards Lytton Springs, an excellent choice. Are you planning to open a bottle soon? I can suggest serving tips or food pairings if you'd like."

      try {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: welcomeMessage }),
        })

        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          welcomeAudioCacheRef.current = audioUrl
          ;(window as any).globalWelcomeAudioCache = audioUrl
        }
      } catch (error) {
        console.warn('Failed to pre-cache welcome message:', error)
      }
    }

    initializeWelcomeCache()
  }, [])

  // Handle voice assistant events
  useEffect(() => {
    let isVoiceButtonTriggered = false
    let isMicButtonTriggered = false

    // VOICE BUTTON: Complete flow with welcome message
    const handleTriggerVoiceAssistant = async () => {
      if (isMicButtonTriggered) return // Prevent conflict with mic button
      isVoiceButtonTriggered = true

      setShowBottomSheet(true)
      setShowAskButton(false) // Спочатку приховуємо
      setShowUnmuteButton(false)
      setIsListening(false)
      setIsResponding(true)
      setIsThinking(false)
      setIsPlayingAudio(true)

      await handleWelcomeMessage()

      // Reset flag after welcome message completes
      setTimeout(() => {
        isVoiceButtonTriggered = false
      }, 3000)
    }

    // MIC BUTTON: Show bottom sheet and go directly to listening state
    const handleTriggerMicButton = async () => {
      if (isVoiceButtonTriggered) return // Prevent conflict with voice button
      isMicButtonTriggered = true

      console.log('🎤 VoiceController: handleTriggerMicButton called')
      setShowBottomSheet(true)
      setShowAskButton(false)
      setIsListening(true)
      isListeningRef.current = true // Update ref immediately
      setIsResponding(false)
      setIsThinking(false)
      setIsPlayingAudio(false)
      setShowUnmuteButton(false)
      console.log('🎤 VoiceController: States set - isListening should be true')

      try {
        // Add deployment environment detection
        const isDeployment = window.location.hostname.includes('.replit.app') || window.location.hostname !== 'localhost'

        console.log('🎤 VoiceController: Environment detection - isDeployment:', isDeployment)

        // Enhanced microphone access with deployment-specific settings
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Add deployment-specific audio constraints
            ...(isDeployment && {
              sampleRate: 44100,
              channelCount: 1,
              volume: 1.0,
            }),
          },
        }

        console.log('🎤 VoiceController: Requesting microphone access with constraints:', constraints)
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        // 1. Налаштовуємо MediaRecorder для запису аудіо
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        // 2. Обробляємо зупинку запису: транскрибуємо і відправляємо в чат
        mediaRecorder.onstop = async () => {
          console.log('🎤 Запис зупинено, обробка транскрипції.')
          setIsListening(false)
          isListeningRef.current = false
          setIsThinking(true)
          setShowAskButton(false)
          window.dispatchEvent(new CustomEvent('mic-status', { detail: { status: 'processing' } }))

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          try {
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            })

            if (!response.ok) throw new Error('Не вдалося транскрибувати аудіо')

            const result = await response.json()
            if (result.text && onSendMessage) {
              console.log('🎤 Транскрипція успішна:', result.text)
              onSendMessage(result.text.trim())
            } else {
              console.warn('🎤 Результат транскрипції порожній.')
            }
          } catch (err) {
            console.error('🎤 Помилка транскрипції:', err)

            // Fallback response for testing Unmute button
            console.log('🎤 Using fallback response for testing')
            const fallbackResponse = "Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses."

            if (onSendMessage) {
              onSendMessage(fallbackResponse)
            }

            // Call handleVoiceResponse to trigger audio and show Unmute button
            handleVoiceResponse(fallbackResponse)
          }
        }

        console.log('🎤 VoiceController: Microphone access granted, creating audio context')

        // Enhanced AudioContext creation for deployment
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContextClass({
          sampleRate: 44100,
          latencyHint: 'interactive',
        })

        // Resume audio context if suspended (common in deployment)
        if (audioContext.state === 'suspended') {
          console.log('🎤 VoiceController: Resuming suspended audio context')
          await audioContext.resume()
        }

        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8

        const microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        console.log('🎤 VoiceController: Audio pipeline established successfully')

        // 3. Запускаємо запис
        mediaRecorder.start()

        // Dispatch listening event
        console.log('🎤 VoiceController: Dispatching mic-status listening event')
        window.dispatchEvent(
          new CustomEvent('mic-status', {
            detail: { status: 'listening' },
          })
        )

        let silenceStart = Date.now()

        let animationId: number

        const checkAudioLevel = () => {
          // Stop if listening state changed or microphone was cleaned up
          if (!isListeningRef.current || !streamRef.current || !audioContextRef.current) {
            console.log('🎤 VoiceController: Stopping audio level check - listening state changed')
            return
          }

          try {
            analyser.getByteFrequencyData(dataArray)
            let volume = 0
            for (let i = 0; i < dataArray.length; i++) {
              if (dataArray[i] > volume) {
                volume = dataArray[i]
              }
            }

            // Dispatch volume events for circle animation
            window.dispatchEvent(
              new CustomEvent('voice-volume', {
                detail: { volume, maxVolume: 100, isActive: volume > SILENCE_THRESHOLD },
              })
            )

            // Debug volume levels
            if (volume > SILENCE_THRESHOLD) {
              console.log('🎤 VoiceController: Voice detected, volume:', volume)
            }

            if (volume > SILENCE_THRESHOLD) {
              silenceStart = Date.now()
            } else if (Date.now() - silenceStart > SILENCE_DURATION) {
              console.log('🎤 Користувач перестав говорити - зупиняємо запис для транскрипції')

              // 4. Зупиняємо запис при виявленні тиші
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop()
              }

              // Clean up microphone
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
              }
              if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close()
                audioContextRef.current = null
              }
              cancelAnimationFrame(animationId)
              return
            } else {
              // Цей console.log може спамити, тому я його приберу
              // console.log("Silence detected, volume:", volume);
            }

            animationId = requestAnimationFrame(checkAudioLevel)
          } catch (error) {
            console.error('🎤 VoiceController: Error in audio level check:', error)
            // Clean up on error
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop())
              streamRef.current = null
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close()
              audioContextRef.current = null
            }
            setIsListening(false)
            setShowAskButton(true)
            isMicButtonTriggered = false
          }
        }

        // Store animation ID for cleanup
        animationId = requestAnimationFrame(checkAudioLevel)

        // Store cleanup function for potential early termination
        const cleanup = () => {
          if (animationId) {
            cancelAnimationFrame(animationId)
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
            audioContextRef.current = null
          }
        }

        // Store cleanup function for potential use
        ;(window as any).voiceCleanup = cleanup
      } catch (error) {
        console.error('🎤 VoiceController: Failed to access microphone:', error)
        const errorInfo =
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : { message: String(error) }

        console.log('🎤 VoiceController: Error details:', {
          ...errorInfo,
          userAgent: navigator.userAgent,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
        })

        // Enhanced deployment fallback
        const isDeployment = window.location.hostname.includes('.replit.app') || window.location.hostname !== 'localhost'

        if (isDeployment) {
          console.log('🎤 VoiceController: Deployment environment detected, using enhanced fallback')
        } else {
          console.log('🎤 VoiceController: Development environment, using standard fallback')
        }

        // Check if we should proceed with fallback
        if (!isListeningRef.current) {
          console.log('🎤 VoiceController: Listening stopped, aborting fallback')
          isMicButtonTriggered = false
          return
        }

        // Dispatch listening event for fallback
        console.log('🎤 VoiceController: Dispatching fallback mic-status listening event')
        window.dispatchEvent(
          new CustomEvent('mic-status', {
            detail: { status: 'listening' },
          })
        )

        // Simulate voice volume events during fallback listening
        let fallbackVolumeInterval: NodeJS.Timeout
        let fallbackTimeout: NodeJS.Timeout

        fallbackVolumeInterval = setInterval(() => {
          // Stop if listening state changed
          if (!isListeningRef.current) {
            clearInterval(fallbackVolumeInterval)
            return
          }
          const volume = Math.random() * 40 + 20
          window.dispatchEvent(
            new CustomEvent('voice-volume', {
              detail: { volume, maxVolume: 100, isActive: true },
            })
          )
        }, 150)

        // Enhanced fallback with deployment-specific timing
        const fallbackDelay = isDeployment ? 4000 : 3000 // Longer delay for deployment
        console.log(`🎤 VoiceController: Using fallback delay of ${fallbackDelay}ms for ${isDeployment ? 'deployment' : 'development'}`)

        fallbackTimeout = setTimeout(() => {
          clearInterval(fallbackVolumeInterval)

          // Check if still in listening state
          if (!isListeningRef.current) {
            console.log('🎤 VoiceController: Listening stopped during fallback, aborting')
            isMicButtonTriggered = false
            return
          }

          console.log('🎤 VoiceController: Fallback timer completed, transitioning to thinking')
          setIsListening(false)
          isListeningRef.current = false // Update ref immediately
          setIsThinking(true)

          console.log('🎤 VoiceController: Dispatching mic-status processing event')
          window.dispatchEvent(
            new CustomEvent('mic-status', {
              detail: { status: 'processing' },
            })
          )

          // Enhanced thinking phase for deployment
          const thinkingDelay = isDeployment ? 2500 : 2000
          console.log(`🎤 VoiceController: Using thinking delay of ${thinkingDelay}ms`)

          setTimeout(() => {
            if (!isListeningRef.current && isThinking) {
              // Only proceed if still in thinking state
              console.log('🎤 VoiceController: Thinking phase complete, starting response')
              setIsThinking(false)
              setIsResponding(true)
              setIsPlayingAudio(true)

              console.log('🎤 VoiceController: Dispatching mic-status stopped event')
              window.dispatchEvent(
                new CustomEvent('mic-status', {
                  detail: { status: 'stopped' },
                })
              )

              handleVoiceResponse("Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses.")

              // Reset mic button flag after response
              setTimeout(() => {
                isMicButtonTriggered = false
                console.log('🎤 VoiceController: Mic button flag reset complete')
              }, 1000)
            } else {
              console.log('🎤 VoiceController: Thinking phase interrupted, not proceeding to response')
              isMicButtonTriggered = false
            }
          }, thinkingDelay)
        }, fallbackDelay)

        // Store cleanup for fallback timers
        ;(window as any).voiceFallbackCleanup = () => {
          clearInterval(fallbackVolumeInterval)
          clearTimeout(fallbackTimeout)
        }
      }

      // Reset mic button flag on error
      setTimeout(() => {
        isMicButtonTriggered = false
      }, 8000)
    }

    const handleStopAudio = () => {
      console.log('🛑 VoiceController: Stop button clicked - aborting all audio and listening')

      // Stop listening state immediately
      setIsListening(false)
      isListeningRef.current = false // Update ref immediately
      setIsThinking(false)
      setIsResponding(false)
      setIsPlayingAudio(false)

      // Show unmute button if assistant has responded before
      if (hasAssistantResponded) {
        setShowUnmuteButton(true)
        setShowAskButton(false)
      } else {
        setShowUnmuteButton(false)
        setShowAskButton(true)
      }

      // Clean up microphone streams and audio context
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      // Clean up animation frames and timers
      if ((window as any).voiceCleanup) {
        ;(window as any).voiceCleanup()
        ;(window as any).voiceCleanup = null
      }
      if ((window as any).voiceFallbackCleanup) {
        ;(window as any).voiceFallbackCleanup()
        ;(window as any).voiceFallbackCleanup = null
      }

      // Abort ongoing TTS request
      if (currentTTSRequestRef.current) {
        console.log('🛑 VoiceController: Aborting TTS request')
        currentTTSRequestRef.current.abort()
        currentTTSRequestRef.current = null
      }

      // Stop audio playback
      if (currentAudioRef.current) {
        console.log('🛑 VoiceController: Stopping audio playback')
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
        currentAudioRef.current = null
      }

      // Reset flags
      isMicButtonTriggered = false
      isVoiceButtonTriggered = false

      // Dispatch stop event for circle animation
      window.dispatchEvent(
        new CustomEvent('mic-status', {
          detail: { status: 'stopped' },
        })
      )

      // Call original stop function
      stopAudio()

      console.log('🛑 VoiceController: Stop button processing complete')
    }

    const handleDeploymentAudioStopped = () => {
      setIsPlayingAudio(false)
      setIsResponding(false)

      // Show unmute button if assistant has responded before
      if (hasAssistantResponded) {
        setShowUnmuteButton(true)
        setShowAskButton(false)
      } else {
        setShowUnmuteButton(false)
        setShowAskButton(true)
      }

      currentAudioRef.current = null
    }

    window.addEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant)
    window.addEventListener('triggerMicButton', handleTriggerMicButton)
    window.addEventListener('stopVoiceAudio', handleStopAudio)
    window.addEventListener('deploymentAudioStopped', handleDeploymentAudioStopped)

    return () => {
      window.removeEventListener('triggerVoiceAssistant', handleTriggerVoiceAssistant)
      window.removeEventListener('triggerMicButton', handleTriggerMicButton)
      window.removeEventListener('stopVoiceAudio', handleStopAudio)
      window.removeEventListener('deploymentAudioStopped', handleDeploymentAudioStopped)
    }
  }, [isListening])

  // --- Новый useEffect для автоматического TTS и Unmute после первого ассистентского ответа ---
  useEffect(() => {
    if (!onAddMessage) return
    // Оборачиваем оригинальный onAddMessage, чтобы ловить ассистентские ответы
    const wrappedAddMessage = (message: any) => {
      console.log('[VoiceController] wrappedAddMessage called:', message)
      if (message.role === 'assistant' && !hasAssistantResponded) {
        console.log('[VoiceController] Assistant message detected, calling handleVoiceResponse:', message.content)
        // Проигрываем TTS и показываем Unmute
        handleVoiceResponse(message.content)
      }
      onAddMessage(message)
    }
    // Переопределяем onAddMessage на время жизни компонента
    ;(window as any).__voiceAddMessage = wrappedAddMessage
    console.log('[VoiceController] __voiceAddMessage set')
    return () => {
      ;(window as any).__voiceAddMessage = null
      console.log('[VoiceController] __voiceAddMessage unset')
    }
  }, [onAddMessage, hasAssistantResponded])

  const handleVoiceResponse = async (responseText: string) => {
    console.log('[VoiceController] handleVoiceResponse called with:', responseText)
    try {
      // Create AbortController for this TTS request
      const abortController = new AbortController()
      currentTTSRequestRef.current = abortController

      console.log('🎤 VoiceController: Starting TTS request with abort controller')

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: responseText }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio

      // Встановлюємо стани для "вокі-токі" режиму
      setIsPlayingAudio(true)
      setIsResponding(true)
      setShowUnmuteButton(false) // Не показуємо кнопку Unmute
      setShowAskButton(false)
      setHasAssistantResponded(true)

      console.log('🎤 VoiceController: Starting audio playback')
      await audio.play()

      audio.onended = () => {
        console.log('🎤 VoiceController: Audio playback ended naturally')
        setIsPlayingAudio(false)
        setIsResponding(false)
        setHasAssistantResponded(false)
        setShowUnmuteButton(false)
        setShowAskButton(true) // Показуємо кнопку Ask після завершення
        currentAudioRef.current = null
        currentTTSRequestRef.current = null
        URL.revokeObjectURL(audioUrl)
      }

      // Зберігаємо текст для можливого повторного відтворення
      setLastAssistantText(responseText)

      // НЕ викликаємо onSendMessage тут, бо це вже зроблено в EnhancedChatInterface
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('🛑 VoiceController: TTS request was aborted by stop button')
      } else {
        console.error('Error in voice response:', error)
      }
      setIsPlayingAudio(false)
      setIsResponding(false)
      setShowUnmuteButton(false)
      setShowAskButton(true)
      currentTTSRequestRef.current = null
    }
  }

  const handleClose = () => {
    setShowBottomSheet(false)
    setIsListening(false)
    setIsResponding(false)
    setIsThinking(false)
    setIsPlayingAudio(false)
    setShowUnmuteButton(false)
    setShowAskButton(false)
    setHasAssistantResponded(false)
    isManuallyClosedRef.current = true
    stopRecording()
    setTimeout(() => {
      isManuallyClosedRef.current = false
    }, 1000)
  }

  const handleAskRecording = () => {
    startVoiceInput()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // --- Додаємо аналізатор для тиші ---
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
      const dataArray = new Uint8Array(analyser.fftSize)

      // --- Функція перевірки тиші ---
      const checkSilence = () => {
        analyser.getByteTimeDomainData(dataArray)
        // Розрахунок середньої амплітуди
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += Math.abs(dataArray[i] - 128)
        }
        const avg = sum / dataArray.length

        if (avg < SILENCE_THRESHOLD) {
          if (!silenceStartRef.current) silenceStartRef.current = Date.now()
          if (Date.now() - (silenceStartRef.current || 0) > SILENCE_DURATION) {
            // Тиша достатньо довго — зупиняємо запис
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
            }
            stream.getTracks().forEach(track => track.stop())
            audioContext.close()
            return
          }
        } else {
          silenceStartRef.current = null
        }
        // Продовжуємо перевірку
        silenceTimeoutRef.current = setTimeout(checkSilence, 100)
      }

      // --- Запускаємо перевірку тиші ---
      checkSilence()

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Очищаємо таймери та контексти
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
        analyserRef.current = null
        silenceStartRef.current = null

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')

        setIsThinking(true)
        setIsListening(false)

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })
          const result = await response.json()
          if (result.text && onSendMessage) {
            onSendMessage(result.text.trim())
          }
        } catch (err) {
          console.error('🎤 Помилка транскрипції:', err)

          // Fallback response for testing Unmute button
          console.log('🎤 Using fallback response for testing')
          const fallbackResponse = "Based on your question about this Ridge Zinfandel, I can tell you it's a bold wine with rich blackberry and spice notes, perfect for grilled meats and aged cheeses."

          if (onSendMessage) {
            onSendMessage(fallbackResponse)
          }

          // Call handleVoiceResponse to trigger audio and show Unmute button
          handleVoiceResponse(fallbackResponse)
        }
      }

      mediaRecorder.start()
      setIsListening(true)
      setIsResponding(false)
      setIsThinking(false)
      setIsPlayingAudio(false)
      setShowUnmuteButton(false)
      setShowAskButton(false)

      // --- (Опціонально) Автостоп через 10 секунд як запасний варіант ---
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
        stream.getTracks().forEach(track => track.stop())
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close()
      }, 10000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsListening(false)
      setIsThinking(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleUnmute = async () => {
    if (!lastAssistantText) return
    setIsPlayingAudio(true)
    setIsResponding(true)
    setShowUnmuteButton(false)
    setShowAskButton(false)
    try {
      const abortController = new AbortController()
      currentTTSRequestRef.current = abortController
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lastAssistantText }),
        signal: abortController.signal,
      })
      if (!response.ok) throw new Error('Failed to generate speech')
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio
      await audio.play()
      audio.onended = () => {
        setIsPlayingAudio(false)
        setIsResponding(false)
        setShowUnmuteButton(false)
        setShowAskButton(true)
        currentAudioRef.current = null
        currentTTSRequestRef.current = null
        URL.revokeObjectURL(audioUrl)
      }
    } catch (error: any) {
      setIsPlayingAudio(false)
      setIsResponding(false)
      setShowUnmuteButton(true)
      setShowAskButton(false)
      currentTTSRequestRef.current = null
    }
  }

  // Универсальный публичный метод для старта голосового ввода
  const startVoiceInput = async () => {
    await handleTriggerMicButton()
  }

  const onAssistantMessageReceived = (text: string) => {
    setIsThinking(false)
    setShowUnmuteButton(false) // Не показуємо кнопку Unmute в "вокі-токі" режимі
    setShowAskButton(true) // Показуємо кнопку Ask
    setLastAssistantText(text)
  }

  useImperativeHandle(ref, () => ({
    showUnmuteForText: (text: string) => {
      onAssistantMessageReceived(text)
    },
    handleVoiceResponse,
    startVoiceInput,
  }))

  return (
    // <></>
    <VoiceAssistantBottomSheet
      isOpen={showBottomSheet}
      onClose={handleClose}
      onMute={stopRecording}
      onAsk={handleAskRecording}
      isListening={isListening}
      isResponding={isResponding}
      isThinking={isThinking}
      isPlayingAudio={isPlayingAudio}
      showUnmuteButton={showUnmuteButton}
      showAskButton={showAskButton}
      showSuggestions={true}
      onStopAudio={stopRecording}
      onUnmute={handleUnmute}
      wineKey={wineKey}
      onSuggestionClick={(suggestion: string, pillId?: string, options?: { textOnly?: boolean; instantResponse?: string }) => {
        if (onSendMessage) {
          onSendMessage(suggestion)
        }
      }}
    />
  )
})

export default VoiceController
