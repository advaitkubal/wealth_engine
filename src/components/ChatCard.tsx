import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Calculator,
  Coins,
  CheckCircle2,
} from 'lucide-react'

export interface ChatMetrics {
  type?: 'side_income_computation' | 'tax_computation' | string
  side_income?: number
  base_salary?: number
  incremental_tax?: number
  take_home?: number
  marginal_rate?: number
  sec_44ada_savings?: number
  sec_44ada_take_home?: number
  income_type?: string
  gross_income?: number
  net_taxable?: number
  total_tax?: number
  effective_rate?: number
  regime?: string
}

export interface ChatCardProps {
  text: string
  wealthAction?: boolean
  suggestions?: string[]
  clauses?: string[]
  onSuggest?: (prompt: string) => void
  onQuickAction?: (actionText: string) => void
  compact?: boolean
}

// Indian Rupee Formatter
export function formatINR(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`
  }
  return `₹${val.toLocaleString('en-IN')}`
}

export function formatINRFull(val: number): string {
  return `₹${val.toLocaleString('en-IN')}`
}

// Parse inline formatting (**bold**, `code`, etc.)
function renderFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

// Parse markdown table rows
function renderMarkdownTable(lines: string[]): React.ReactNode {
  if (lines.length < 2) return null

  const parseRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(c => c.trim())

  const headerCells = parseRow(lines[0])
  const dataRows = lines.slice(2).map(parseRow)

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headerCells.map((h, hi) => (
              <th
                key={hi}
                className="px-3 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dataRows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50/60 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-700 font-medium">
                  {cell.startsWith('₹') ? (
                    <span className="font-semibold text-slate-900">{cell}</span>
                  ) : (
                    renderFormattedText(cell)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const ChatCard: React.FC<ChatCardProps> = ({
  text,
  wealthAction,
  suggestions,
  clauses,
  onSuggest,
  onQuickAction,
}) => {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  // Extract embedded JSON metrics if present: <!-- METRICS: {...} -->
  let metrics: ChatMetrics | null = null
  let cleanedText = text
  const metricMatch = text.match(/<!--\s*METRICS:\s*(\{.*?\})\s*-->/s)
  if (metricMatch) {
    try {
      metrics = JSON.parse(metricMatch[1])
      cleanedText = text.replace(/<!--\s*METRICS:\s*(\{.*?\})\s*-->/s, '').trim()
    } catch {
      // ignore JSON parse error
    }
  }

  // Fallback regex detection for side income if metrics tag wasn't attached
  if (!metrics) {
    const incTaxMatch =
      cleanedText.match(/(?:pay|is)\s+₹?([\d,]+)\s+as\s+incremental\s+tax/i) ||
      cleanedText.match(/(?:incremental\s+tax(?: on [^:]+)?|INCREMENTAL TAX)[^\d₹]*₹?([\d,]+)/i)

    const takeHomeMatch =
      cleanedText.match(/(?:take-home|in-hand)[^\d₹]*₹?([\d,]+)/i) ||
      cleanedText.match(/(?:NET TAKE-HOME|net take-home)[^\d₹]*₹?([\d,]+)/i)

    const savingsMatch = cleanedText.match(
      /(?:save|saving)\s+₹?([\d,]+)\s+(?:via|under|with)\s+Section\s+44ADA/i
    )

    if (incTaxMatch && takeHomeMatch) {
      const incTax = parseInt(incTaxMatch[1].replace(/,/g, ''), 10)
      const takeHome = parseInt(takeHomeMatch[1].replace(/,/g, ''), 10)
      const savings = savingsMatch ? parseInt(savingsMatch[1].replace(/,/g, ''), 10) : 0
      metrics = {
        type: 'side_income_computation',
        incremental_tax: incTax,
        take_home: takeHome,
        side_income: incTax + takeHome,
        marginal_rate: Math.round((incTax / (incTax + takeHome)) * 1000) / 10,
        sec_44ada_savings: savings,
        sec_44ada_take_home: takeHome + savings,
      }
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse lines, grouping table lines together
  const rawLines = cleanedText.split('\n')
  const contentBlocks: React.ReactNode[] = []
  let tableBuffer: string[] = []

  const flushTable = (key: string) => {
    if (tableBuffer.length > 0) {
      contentBlocks.push(<div key={key}>{renderMarkdownTable(tableBuffer)}</div>)
      tableBuffer = []
    }
  }

  rawLines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableBuffer.push(trimmed)
      return
    } else {
      flushTable(`table-${idx}`)
    }

    if (trimmed === '') {
      contentBlocks.push(<div key={idx} className="h-1.5" />)
      return
    }

    // Section header
    if (
      trimmed.startsWith('### ') ||
      trimmed.startsWith('=== ') ||
      (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50)
    ) {
      const title = trimmed
        .replace(/^###\s*/, '')
        .replace(/^===\s*/, '')
        .replace(/\s*===$/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
      contentBlocks.push(
        <div key={idx} className="mt-2.5 mb-1 flex items-center gap-2">
          <span className="w-1.5 h-3 bg-indigo-600 rounded-full" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            {title}
          </h4>
        </div>
      )
      return
    }

    // Bullet points
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletText = trimmed.slice(2)
      contentBlocks.push(
        <div key={idx} className="flex items-start gap-2 pl-1 text-slate-700">
          <span className="text-indigo-500 font-bold text-xs shrink-0 mt-0.5">•</span>
          <p className="text-xs leading-relaxed flex-1">{renderFormattedText(bulletText)}</p>
        </div>
      )
      return
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      contentBlocks.push(
        <div key={idx} className="flex items-start gap-2 pl-1 text-slate-700">
          <span className="text-slate-400 font-semibold text-xs shrink-0 mt-0.5">
            {trimmed.split('.')[0]}.
          </span>
          <p className="text-xs leading-relaxed flex-1">
            {renderFormattedText(trimmed.replace(/^\d+\.\s/, ''))}
          </p>
        </div>
      )
      return
    }

    // Regular line
    contentBlocks.push(
      <p key={idx} className="text-xs text-slate-700 leading-relaxed">
        {renderFormattedText(trimmed)}
      </p>
    )
  })
  flushTable('table-end')

  return (
    <div className="flex-1 min-w-0">
      <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-800 leading-relaxed shadow-sm hover:border-slate-300 transition-all relative group">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>100% On-Device Engine</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">CBDT FY 2024-25</span>
          </div>

          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1 text-[10px]"
            title="Copy response"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden group-hover:inline">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic High-Class Metric Widget for Side Income / Calculations */}
        {metrics && metrics.type === 'side_income_computation' && (
          <div className="mb-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-indigo-900/50">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Dynamic Income &amp; Tax Engine
              </span>
              <span className="text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full">
                {metrics.income_type ? metrics.income_type.toUpperCase() : 'SIDE INCOME'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {/* Net Take-Home */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5">
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wide flex items-center gap-1">
                  <Coins className="w-3 h-3 text-emerald-400" /> Net In-Hand (Take-Home)
                </p>
                <p className="text-lg font-black text-emerald-400 mt-0.5 tracking-tight">
                  {formatINRFull(metrics.take_home || 0)}
                </p>
                <p className="text-[10px] text-emerald-300/80 mt-0.5">
                  You keep ~{Math.round(((metrics.take_home || 0) / (metrics.side_income || 1)) * 100)}% in cash
                </p>
              </div>

              {/* Incremental Tax */}
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-2.5">
                <p className="text-[10px] font-semibold text-rose-300 uppercase tracking-wide flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-rose-400" /> Incremental Tax
                </p>
                <p className="text-lg font-black text-rose-400 mt-0.5 tracking-tight">
                  {formatINRFull(metrics.incremental_tax || 0)}
                </p>
                <p className="text-[10px] text-rose-300/80 mt-0.5">
                  Marginal Rate: {metrics.marginal_rate ? metrics.marginal_rate.toFixed(1) : '31.2'}% (incl. cess)
                </p>
              </div>
            </div>

            {/* Section 44ADA Presumptive Tax Benefit Highlight */}
            {(metrics.sec_44ada_savings || 0) > 0 && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-2.5 mb-3 flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">💡</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-amber-300">
                      Section 44ADA Presumptive Benefit
                    </p>
                    <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full">
                      Save {formatINR(metrics.sec_44ada_savings || 0)}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-200/90 mt-0.5 leading-snug">
                    Under Sec 44ADA, you declare 50% as expenses. Your in-hand jumps to{' '}
                    <strong className="text-white font-bold">{formatINRFull(metrics.sec_44ada_take_home || 0)}</strong>!
                  </p>
                </div>
              </div>
            )}

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                onClick={() => navigate('/what-if')}
                className="text-[10px] font-bold bg-white text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Simulate in What-If Cockpit</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => navigate('/wealth-engine')}
                className="text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>View Wealth Engine</span>
              </button>

              {onQuickAction && (
                <button
                  onClick={() =>
                    onQuickAction(
                      `Add ₹${(metrics?.take_home || metrics?.side_income || 0).toLocaleString('en-IN')} to cash savings`
                    )
                  }
                  className="text-[10px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Coins className="w-3 h-3 text-emerald-300" />
                  <span>Deposit In-Hand to Cash</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dynamic High-Class Metric Widget for General Tax Calculation */}
        {metrics && metrics.type === 'tax_computation' && (
          <div className="mb-4 bg-slate-900 text-white rounded-2xl p-3.5 shadow-md border border-slate-800">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" /> Income Tax Summary
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full uppercase">
                {metrics.regime || 'New'} Regime
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="bg-white/5 rounded-xl p-2">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Gross Income</p>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {formatINR(metrics.gross_income || 0)}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-2">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Net Taxable</p>
                <p className="text-sm font-extrabold text-indigo-300 mt-0.5">
                  {formatINR(metrics.net_taxable || 0)}
                </p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2">
                <p className="text-[10px] text-rose-300 uppercase font-semibold">Total Tax</p>
                <p className="text-sm font-extrabold text-rose-400 mt-0.5">
                  {formatINR(metrics.total_tax || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content text & structured elements */}
        <div className="space-y-1">{contentBlocks}</div>

        {/* Wealth action feedback banner */}
        {wealthAction && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dashboard &amp; Portfolio Synchronized in real-time</span>
            </span>
            <button
              onClick={() => navigate('/wealth-engine')}
              className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
            >
              Open Engine ➔
            </button>
          </div>
        )}

        {/* Legal / Statutory references */}
        {clauses && clauses.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase mr-1">Statute:</span>
            {clauses.map((c, ci) => (
              <span
                key={ci}
                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Follow-up Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
          {suggestions.map((s, si) => (
            <button
              key={si}
              onClick={() => onSuggest && onSuggest(s)}
              className="text-[11px] font-medium bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 px-3 py-1 rounded-full shadow-2xs transition-all flex items-center gap-1"
            >
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
