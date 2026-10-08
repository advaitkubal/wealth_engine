import { Router, Routes, Route } from './router'
import HomePage    from './pages/HomePage'
import TaxPlanning from './pages/TaxPlanning'
import WealthEngine from './pages/WealthEngine'
import Calculators  from './pages/Calculators'
import Security     from './pages/Security'
import Insights     from './pages/Insights'
import TaxRulesStatus from './pages/TaxRulesStatus'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"              element={<HomePage />}    />
        <Route path="/tax-planning"  element={<TaxPlanning />} />
        <Route path="/wealth-engine" element={<WealthEngine />}/>
        <Route path="/calculators"   element={<Calculators />} />
        <Route path="/security"      element={<Security />}    />
        <Route path="/insights"      element={<Insights />}    />
        <Route path="/tax-rules"     element={<TaxRulesStatus />} />
      </Routes>
    </Router>
  )
}
