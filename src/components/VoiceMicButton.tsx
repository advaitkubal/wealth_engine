import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { Mic, MicOff } from 'lucide-react'

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void
  onAutoSend?: (text: string) => void
  className?: string
}

export default function VoiceMicButton({ onTranscript, onAutoSend, className = '' }: VoiceMicButtonProps) {
  const { isListening, toggleListening, countdown } = useVoiceRecognition(onTranscript, onAutoSend)

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={
        countdown !== null
          ? `Auto-sending in ${countdown}s... Click to cancel`
          : isListening
          ? 'Listening... Speak in Hindi/English/Hinglish (Auto-sends 3s after you stop)'
          : 'Speak in Hinglish (Auto-sends 3s after silence)'
      }
      className={`p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center relative gap-1 shrink-0 ${
        isListening || countdown !== null ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-400/50' : ''
      } ${className}`}
    >
      {isListening || countdown !== null ? (
        <>
          <MicOff className="w-4 h-4 text-rose-600 animate-pulse" />
          {countdown !== null ? (
            <span className="text-[10px] font-extrabold bg-rose-600 text-white rounded-full px-1.5 py-0.2 animate-bounce">
              {countdown}s
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  )
}
