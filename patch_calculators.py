import re

with open("src/pages/Calculators.tsx", "r") as f:
    content = f.read()

# We need to replace OLD_SLABS and NEW_SLABS with dynamic state fetched from /api/tax/rules-status
# Let's replace the top part until `function Slider`

new_top = '''import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

/* ── Helpers ── */
function fmt(n: number) { return `₹${Math.round(n).toLocaleString('en-IN')}` }

function taxSlab(income: number, slabs: { upto: number; rate: number }[]) {
  if (!slabs || slabs.length === 0) return 0;
  let tax = 0, prev = 0
  for (const s of slabs) {
    if (income <= prev) break
    const upper = s.upto === null ? Infinity : s.upto
    tax += (Math.min(income, upper) - prev) * s.rate
    prev = upper
  }
  return tax * 1.04 // 4% cess
}

function Slider({ label, min, max, step=1, value, onChange, display }:
'''

content = re.sub(r"import \{ useState \} from 'react'.*?function Slider\(\{ label, min, max, step=1, value, onChange, display \}:", new_top, content, flags=re.DOTALL)

new_calc = '''function TaxRegimeCalc() {
  const [income, setIncome] = useState(1500000)
  const [c80,  setC80]  = useState(150000)
  const [c80d, setC80d] = useState(25000)
  const [hra,  setHra]  = useState(120000)
  const [oldSlabs, setOldSlabs] = useState<{upto:number|null, rate:number}[]>([])
  const [newSlabs, setNewSlabs] = useState<{upto:number|null, rate:number}[]>([])
  
  useEffect(() => {
    fetch('http://localhost:8000/api/tax/rules-status')
      .then(r => r.json())
      .then(data => {
        const fy24 = data.find((d: any) => d.fy === '2024-25')
        if (fy24) {
          const rules = fy24.raw_rules
          setOldSlabs(rules.old_regime.slabs_individual_below_60.map((s:any) => ({ upto: s.to, rate: s.rate })))
          setNewSlabs(rules.new_regime.slabs.map((s:any) => ({ upto: s.to, rate: s.rate })))
        }
      }).catch(console.error)
  }, [])

  const oldTaxable = Math.max(0, income - 50000 - c80 - c80d - hra)
  const oldTax  = taxSlab(oldTaxable, oldSlabs)
  const newTaxable = Math.max(0, income - 75000)
  const newTax  = taxSlab(newTaxable, newSlabs)
  const better  = oldTax <= newTax ? 'Old Regime' : 'New Regime'
  const saving  = Math.abs(oldTax - newTax)

  return ('''

content = re.sub(r"function TaxRegimeCalc\(\) \{.*?return \(", new_calc, content, flags=re.DOTALL)

with open("src/pages/Calculators.tsx", "w") as f:
    f.write(content)
