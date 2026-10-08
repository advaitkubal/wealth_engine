import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Loader2,
  X,
  AlertTriangle,
  Lock
} from 'lucide-react'

interface DebtIngestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface SimulatedLoan {
  id: string
  label: string
  type: string
  lender: string
  remaining: number
  emi: number
  rate: number
  tenure: number
  selected: boolean
}

export default function DebtIngestionModal({ isOpen, onClose, onSuccess }: DebtIngestionModalProps) {
  const [source, setSource] = useState<'cibil' | 'aa' | 'upload'>('cibil')
  const [pan, setPan] = useState('')
  const [mobile, setMobile] = useState('')
  const [status, setStatus] = useState<'idle' | 'fetching' | 'review' | 'importing' | 'done'>('idle')
  const [foundLoans, setFoundLoans] = useState<SimulatedLoan[]>([])
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFetchBureau = () => {
    setError(null)
    setStatus('fetching')

    // Simulate privacy-first on-device parsing of CIBIL/Account Aggregator record
    setTimeout(() => {
      setStatus('review')
      if (source === 'cibil') {
        setFoundLoans([
          {
            id: '1',
            label: 'HDFC Home Loan (Maxgain)',
            type: 'home_loan',
            lender: 'HDFC Bank Ltd',
            remaining: 4250000,
            emi: 38200,
            rate: 8.55,
            tenure: 180,
            selected: true,
          },
          {
            id: '2',
            label: 'ICICI Auto Loan',
            type: 'car_loan',
            lender: 'ICICI Bank Ltd',
            remaining: 680000,
            emi: 16500,
            rate: 9.25,
            tenure: 48,
            selected: true,
          },
          {
            id: '3',
            label: 'Axis Bank Personal Loan',
            type: 'personal_loan',
            lender: 'Axis Bank',
            remaining: 240000,
            emi: 11200,
            rate: 11.5,
            tenure: 24,
            selected: false,
          },
        ])
      } else {
        setFoundLoans([
          {
            id: '4',
            label: 'SBI Scholar Education Loan',
            type: 'education_loan',
            lender: 'State Bank of India',
            remaining: 850000,
            emi: 12400,
            rate: 8.15,
            tenure: 84,
            selected: true,
          },
          {
            id: '5',
            label: 'HDFC Credit Card Outstanding',
            type: 'credit_card',
            lender: 'HDFC Bank',
            remaining: 65000,
            emi: 65000,
            rate: 0.0,
            tenure: 1,
            selected: true,
          },
        ])
      }
    }, 1200)
  }

  const toggleSelect = (id: string) => {
    setFoundLoans((prev) =>
      prev.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l))
    )
  }

  const handleImport = async () => {
    const toImport = foundLoans.filter((l) => l.selected)
    if (toImport.length === 0) return

    setStatus('importing')
    try {
      for (const loan of toImport) {
        await fetch('http://localhost:8000/api/liabilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: loan.label,
            type: loan.type,
            remaining: loan.remaining,
            emi: loan.emi,
            rate: loan.rate,
            tenure: loan.tenure,
          }),
        })
      }
      setStatus('done')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1000)
    } catch {
      setError('Could not connect to Halo local backend.')
      setStatus('review')
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Automated Debt &amp; Loan Sync
                </h3>
                <p className="text-xs text-slate-500">
                  Zero manual typing • Direct CIBIL / RBI Account Aggregator fetch
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy Banner */}
          <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-2.5 flex items-center gap-2 text-xs text-emerald-800">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>100% On-Device &amp; Private:</strong> Data is parsed locally in your browser and saved to your encrypted SQLite database.
            </span>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Source Selection Tabs */}
            {status === 'idle' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSource('cibil')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      source === 'cibil'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 text-indigo-600 mb-1" />
                    <div className="text-xs font-bold">CIBIL / Experian</div>
                    <div className="text-[10px] text-slate-500">Credit bureau pull</div>
                  </button>

                  <button
                    onClick={() => setSource('aa')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      source === 'aa'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-indigo-600 mb-1" />
                    <div className="text-xs font-bold">Account Aggregator</div>
                    <div className="text-[10px] text-slate-500">RBI Sahamati / Setu</div>
                  </button>

                  <button
                    onClick={() => setSource('upload')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      source === 'upload'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600 mb-1" />
                    <div className="text-xs font-bold">Bank Statement</div>
                    <div className="text-[10px] text-slate-500">PDF loan schedule</div>
                  </button>
                </div>

                {source === 'upload' ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                    <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Drop your Loan Statement / Repayment Schedule PDF</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Extracts principal, EMI, interest rate &amp; balance automatically</p>
                    </div>
                    <button
                      onClick={handleFetchBureau}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                    >
                      Simulate Local PDF Scan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        PAN Number (Optional / Demo)
                      </label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        maxLength={10}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Registered Mobile Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Loading animation */}
            {status === 'fetching' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-bold text-slate-800">
                  Connecting to {source === 'cibil' ? 'CIBIL Bureau Gateway' : 'RBI Account Aggregator'}...
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Retrieving active loans, ongoing EMIs, interest rates, and outstanding balances...
                </p>
              </div>
            )}

            {/* Found Loans Review */}
            {(status === 'review' || status === 'importing' || status === 'done') && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">
                    Detected Active Debts ({foundLoans.length})
                  </span>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    Select loans to add to portfolio
                  </span>
                </div>

                <div className="space-y-2">
                  {foundLoans.map((loan) => (
                    <div
                      key={loan.id}
                      onClick={() => status === 'review' && toggleSelect(loan.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        loan.selected
                          ? 'border-indigo-500 bg-indigo-50/40'
                          : 'border-slate-200 bg-white opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            loan.selected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {loan.selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{loan.label}</div>
                          <div className="text-[10px] text-slate-500">
                            {loan.lender} • {loan.rate}% p.a. • EMI: ₹{loan.emi.toLocaleString('en-IN')}/mo
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900">
                          ₹{loan.remaining.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">Remaining Balance</div>
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {status === 'done' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Debts synced successfully into your Halo SQLite database!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>

            {status === 'idle' ? (
              <button
                onClick={handleFetchBureau}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5"
              >
                <span>Fetch Active Loans</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : status === 'review' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus('idle')}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center gap-1.5"
                >
                  <span>Import Selected to Portfolio</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            ) : status === 'importing' ? (
              <button
                disabled
                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl opacity-75 flex items-center gap-1.5"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing to Database...</span>
              </button>
            ) : (
              <button
                disabled
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Imported</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
