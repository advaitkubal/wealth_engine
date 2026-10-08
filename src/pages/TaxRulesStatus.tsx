import { useEffect, useState } from 'react'

interface TaxRuleItem {
  path: string;
  status: 'verified' | 'unverified';
  value: any;
}

interface TaxRuleStatus {
  fy: string;
  filename: string;
  source_url: string;
  items: TaxRuleItem[];
  raw_rules: any;
}

export default function TaxRulesStatus() {
  const [data, setData] = useState<TaxRuleStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/api/tax/rules-status')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Tax Rules Engine Status
        </h1>
        {loading ? (
          <p>Loading rules...</p>
        ) : (
          <div className="space-y-8">
            {data.map(fy => (
              <div key={fy.fy} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">FY {fy.fy}</h2>
                  <a href={fy.source_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    Source Document ↗
                  </a>
                </div>
                <p className="text-sm text-slate-500 mb-6 font-mono bg-slate-50 inline-block px-2 py-1 rounded">
                  {fy.filename}
                </p>

                <h3 className="text-sm font-semibold text-slate-700 mb-3">Verification Checklist</h3>
                {fy.items.length > 0 ? (
                  <ul className="space-y-2">
                    {fy.items.map((item, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="mr-3 mt-0.5">
                          {item.status === 'verified' ? '✅' : '⚠️'}
                        </span>
                        <div>
                          <span className="font-mono font-medium text-slate-700 bg-slate-50 px-1 py-0.5 rounded mr-2">
                            {item.path}
                          </span>
                          <span className={item.status === 'verified' ? 'text-slate-600' : 'text-amber-700 font-medium'}>
                            {item.status === 'verified' ? 'Verified' : 'Needs Verification'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No verifiable flags found in this ruleset.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
