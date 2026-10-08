import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { Mic, MicOff } from 'lucide-react'

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void
  className?: string
}

export default function VoiceMicButton({ onTranscript, className = '' }: VoiceMicButtonProps) {
  const { isListening, toggleListening } = useVoiceRecognition(onTranscript)

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? 'Stop listening' : 'Click to speak (Voice Recognition)'}
      className={`p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center relative ${
        isListening ? 'bg-rose-50 text-rose-600 animate-pulse ring-2 ring-rose-400/50' : ''
      } ${className}`}
    >
      {isListening ? (
        <>
          <MicOff className="w-5 h-5 text-rose-600" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  )
}
