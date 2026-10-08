import { useState, useEffect, useRef } from 'react'

export function useVoiceRecognition(
  onTranscript: (text: string) => void,
  onAutoSend?: (text: string) => void
) {
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<any>(null)
  const countIntervalRef = useRef<any>(null)
  const lastTranscriptRef = useRef<string>('')

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countIntervalRef.current) clearInterval(countIntervalRef.current)
    timerRef.current = null
    countIntervalRef.current = null
    setCountdown(null)
  }

  const startAutoSendCountdown = (text: string) => {
    clearTimers()
    if (!onAutoSend || !text.trim()) return

    let remaining = 3
    setCountdown(remaining)

    countIntervalRef.current = setInterval(() => {
      remaining -= 1
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        clearInterval(countIntervalRef.current)
      }
    }, 1000)

    timerRef.current = setTimeout(() => {
      clearTimers()
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setIsListening(false)
      const finalText = lastTranscriptRef.current.trim()
      if (finalText) {
        onAutoSend(finalText)
        lastTranscriptRef.current = ''
      }
    }, 3000)
  }

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setSupported(true)
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-IN'

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
        lastTranscriptRef.current = transcript
        onTranscript(transcript)
        // Whenever speech updates, reset 3-second silence timer
        startAutoSendCountdown(transcript)
      }

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        clearTimers()
        setIsListening(false)
      }

      rec.onend = () => {
        // If countdown is active, let it finish and autosend; otherwise set isListening false
        if (!timerRef.current) {
          setIsListening(false)
          clearTimers()
        }
      }

      recognitionRef.current = rec
    }

    return () => {
      clearTimers()
    }
  }, [onTranscript, onAutoSend])

  const toggleListening = () => {
    if (!supported || !recognitionRef.current) {
      alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isListening || countdown !== null) {
      clearTimers()
      try { recognitionRef.current.stop() } catch {}
      setIsListening(false)
    } else {
      try {
        lastTranscriptRef.current = ''
        clearTimers()
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Error starting recognition:', err)
      }
    }
  }

  return { isListening, supported, toggleListening, countdown }
}

