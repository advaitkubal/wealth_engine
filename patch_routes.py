with open("src/App.tsx", "r") as f:
    content = f.read()

new_imports = """
import { Router, Routes, Route } from './router'
import { AnimatePresence, motion } from 'framer-motion'
import AppShell from './AppShell'
import Today from './pages/Today'
import HomePage from './pages/HomePage'
import TaxPlanning from './pages/TaxPlanning'
import WealthEngine from './pages/WealthEngine'
import Calculators from './pages/Calculators'
import Security from './pages/Security'
import Insights from './pages/Insights'
import TaxRulesStatus from './pages/TaxRulesStatus'

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
"""

content = content.replace("import { Router, Routes, Route } from './router'", new_imports)
# Remove duplicate imports
lines = content.split('\n')
seen = set()
clean_lines = []
for line in lines:
    if line.startswith("import "):
        if line in seen:
            continue
        seen.add(line)
    clean_lines.append(line)
content = '\n'.join(clean_lines)

# Now wrap Routes in AppShell
app_comp = """
export default function App() {
  return (
    <Router>
      <AppShell>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/"              element={<PageWrapper><Today /></PageWrapper>}    />
            <Route path="/tax-planning"  element={<PageWrapper><TaxPlanning /></PageWrapper>} />
            <Route path="/wealth-engine" element={<PageWrapper><WealthEngine /></PageWrapper>}/>
            <Route path="/calculators"   element={<PageWrapper><Calculators /></PageWrapper>} />
            <Route path="/security"      element={<PageWrapper><Security /></PageWrapper>}    />
            <Route path="/insights"      element={<PageWrapper><Insights /></PageWrapper>}    />
            <Route path="/tax-rules"     element={<PageWrapper><TaxRulesStatus /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </AppShell>
    </Router>
  )
}
"""

import re
content = re.sub(r"export default function App\(\) \{.*", app_comp, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)
