import { Router, Routes, Route } from './router'
import { AnimatePresence, motion } from 'framer-motion'
import AppShell from './AppShell'
import Today from './pages/Today'
import TaxPlanning from './pages/TaxPlanning'
import WealthEngine from './pages/WealthEngine'
import Calculators from './pages/Calculators'
import Security from './pages/Security'
import Insights from './pages/Insights'
import TaxRulesStatus from './pages/TaxRulesStatus'
import WhatIfScenarios from './pages/WhatIfScenarios'

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
)

export default function App() {
  return (
    <Router>
      <AppShell>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/"              element={<PageWrapper><Today /></PageWrapper>}          />
            <Route path="/what-if"       element={<PageWrapper><WhatIfScenarios /></PageWrapper>} />
            <Route path="/tax-planning"  element={<PageWrapper><TaxPlanning /></PageWrapper>}   />
            <Route path="/wealth-engine" element={<PageWrapper><WealthEngine /></PageWrapper>}  />
            <Route path="/calculators"   element={<PageWrapper><Calculators /></PageWrapper>}   />
            <Route path="/security"      element={<PageWrapper><Security /></PageWrapper>}       />
            <Route path="/insights"      element={<PageWrapper><Insights /></PageWrapper>}       />
            <Route path="/tax-rules"     element={<PageWrapper><TaxRulesStatus /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </AppShell>
    </Router>
  )
}
