with open("docs/PROGRESS.md", "r") as f:
    content = f.read()

content = content.replace("- [ ] 1.2 Regime Optimizer deep dive", "- [x] 1.2 Regime Optimizer deep dive")
content = content.replace("- [ ] 1.3 Advance tax & Section 234A/B/C monthly interest calculation", "- [x] 1.3 Advance tax & Section 234A/B/C monthly interest calculation")
content = content.replace("- [ ] 1.4 LangGraph `validate` node before execution with bad-output simulation tests", "- [x] 1.4 LangGraph `validate` node before execution with bad-output simulation tests")
content = content.replace("- [ ] 1.5 100+ golden test profiles JSON fixture suite & incometax.gov.in checklist", "- [x] 1.5 100+ golden test profiles JSON fixture suite & incometax.gov.in checklist")
content = content.replace("- [ ] 1.6 \"Tax rules status\" API & UI page showing verified vs unverified values", "- [x] 1.6 \"Tax rules status\" API & UI page showing verified vs unverified values")
content = content.replace("- [ ] 1.7 Fix `src/pages/Calculators.tsx` hardcoded slabs to consume rules engine", "- [x] 1.7 Fix `src/pages/Calculators.tsx` hardcoded slabs to consume rules engine")

with open("docs/PROGRESS.md", "w") as f:
    f.write(content)
