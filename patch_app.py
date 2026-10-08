with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("import Insights     from './pages/Insights'", "import Insights     from './pages/Insights'\nimport TaxRulesStatus from './pages/TaxRulesStatus'")
content = content.replace('<Route path="/insights"      element={<Insights />}    />', '<Route path="/insights"      element={<Insights />}    />\n        <Route path="/tax-rules"     element={<TaxRulesStatus />} />')

with open("src/App.tsx", "w") as f:
    f.write(content)
