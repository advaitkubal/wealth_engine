import { useState, useRef } from 'react'
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface DocumentScanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function DocumentScanModal({ isOpen, onClose, onSuccess }: DocumentScanModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setMessage(null)
    setIsError(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to upload document')
      }

      const data = await res.json()
      const successMsg = data.message || `Successfully processed "${file.name}". Portfolio updated!`
      setMessage(successMsg)
      setFile(null)
      window.dispatchEvent(new CustomEvent('halo:wealth_updated'))
      if (onSuccess) onSuccess()
    } catch (e: any) {
      setIsError(true)
      setMessage(e.message || 'Error uploading document')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Scan &amp; Import Financial Documents</h2>
        <p className="text-sm text-slate-500 mb-4">
          Drop your CAS PDF, Form 16, CIBIL/Experian Credit Report, or Bank Statement. Processing is 100% on-device and private.
        </p>

        {/* Quick Debt Bureau Sync Action */}
        <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-900">Sample HDFC Consolidated Statement Ready</p>
            <p className="text-[11px] text-indigo-700">Test 1-click full portfolio mutation with sample generated PDF.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              setUploading(true)
              try {
                const res = await fetch('http://localhost:8000/api/documents/load-sample', { method: 'POST' })
                const data = await res.json()
                setMessage(data.message)
                window.dispatchEvent(new CustomEvent('halo:wealth_updated'))
                if (onSuccess) onSuccess()
              } catch (e: any) {
                setIsError(true)
                setMessage('Error loading sample statement.')
              } finally {
                setUploading(false)
              }
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-colors"
          >
            Apply Sample PDF
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.csv,.json,.png,.jpg,.jpeg,.txt"
            className="hidden"
          />

          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7" />
          </div>

          {file ? (
            <div className="flex items-center justify-center gap-2 text-indigo-600 font-medium">
              <FileText className="w-5 h-5" />
              <span>{file.name}</span>
            </div>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-800">
                Click to browse or drop your document here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports CAS PDF, Form 16, Bank Statements, AIS JSON & Image receipts
              </p>
            </>
          )}
        </div>

        {message && (
          <div
            className={`mt-4 p-4 rounded-xl text-xs flex items-center gap-2 ${
              isError
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={!file || uploading}
            onClick={handleUpload}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Ingesting...
              </>
            ) : (
              'Start Scanning'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
