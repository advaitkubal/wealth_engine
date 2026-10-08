import { useState, useEffect, useRef } from 'react'

export function useVoiceRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setSupported(true)
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = 'en-IN'

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
        onTranscript(transcript)
      }

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!supported || !recognitionRef.current) {
      alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Error starting recognition:', err)
      }
    }
  }

  return { isListening, supported, toggleListening }
}
