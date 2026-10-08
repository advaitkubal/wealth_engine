# Halo Progress & Memory

Last Updated: 2026-10-08
Active Phase: Step 1 Bootstrap Complete | Phase 1 Foundation Underway

## Phase Checklist

### Step 1: Bootstrap
- [x] Repo audit (`docs/REPO_AUDIT.md`)
- [x] Standing rules file (`AGENTS.md` and `.agent/rules/halo.md`)
- [x] Progress tracking initialized (`docs/PROGRESS.md`)
- [x] Environment Setup:
  - [x] Python 3.13, Node 24+, Git, Ollama verified
  - [x] Backend dependencies (`requirements.txt`, `requirements-dev.txt`) installed in `.venv`
  - [x] SQLCipher evaluation & documented fallback
  - [x] Frontend dependencies (`package.json`, framer-motion, cmdk, recharts, vitest) installed with strict TypeScript
  - [x] Ollama smoke-tested with `llama3.2:latest`
  - [x] Makefile (setup, dev, test, lint, typecheck)
  - [x] `.env.example` & comprehensive `.gitignore`
  - [x] Git commits established with clean state
  - [x] Test scaffolding: `backend/tests/` with loan/tax smoke tests, network egress blocker, frontend vitest test
- [x] Baseline verification: `pytest` (42/42 passing), `ruff check` (0 errors), `mypy` (0 errors), `tsc --noEmit` (0 errors), `npm run test` (passing)

### Phase 1: Foundation (Tax & Rules Engine)
- [x] 1.1 Refactor `compute_indian_tax` into JSON rules-driven engine (`backend/app/tax_engine.py` with FY 24-25, 25-26, 26-27 rules JSON, marginal relief, surcharge tiers, 4% cess, Sec 111A/112A/112, pure Python explanation objects)
- [x] 1.2 Regime Optimizer deep dive (Old vs New: HRA min formula, 80C, 80D senior/parents, 80CCD(1B), 80CCD(2), 24(b), 80E, 80EEB)
- [x] 1.3 Advance tax & Section 234A/B/C monthly interest calculation
- [x] 1.4 LangGraph `validate` node before execution with bad-output simulation tests
- [x] 1.5 100+ golden test profiles JSON fixture suite & incometax.gov.in checklist
- [x] 1.6 "Tax rules status" API & UI page showing verified vs unverified values
- [x] 1.7 Fix `src/pages/Calculators.tsx` hardcoded slabs to consume rules engine

### Phase 2: Ingestion & Cash Flow
- [ ] Plan: `docs/plans/phase-2.md`
- [ ] 2.1 Password-protected CAS parser (CAMS/KFintech) with "Review Extracted Holdings" staging UI
- [ ] 2.2 Form 16 Part A/B parser with staging UI
- [ ] 2.3 Bank statement import (PDF/CSV) with local LLM categorization & auto-derived expenses
- [ ] 2.4 AIS/TIS JSON import & reconciliation
- [ ] 2.5 Lot-level FIFO holdings with 31 Jan 2018 grandfathering & holding period classification
- [ ] 2.6 Monthly net worth snapshots & trend API
- [ ] 2.7 Financial calendar engine
- [ ] 2.8 User-initiated AMFI NAV downloader with visible network log

### Phase 3: Intelligence Modules
- [ ] 3a Plan & implementation: Capital gains advisor, ESOP/RSU, property 54/54EC/54F, debt/ULIP/SGB/REIT/VDA, family clubbing
- [ ] 3b Plan & implementation: Debt avalanche vs snowball, prepay-vs-invest, floating reset, balance transfer, credit card revolve, co-borrower tax split
- [ ] 3c Plan & implementation: Portfolio XIRR/CAGR, Direct vs Regular leakage, overlap, concentration, tax-aware rebalance, FIRE Monte Carlo, runway gauge
- [ ] 3d Plan & implementation: Insurance adequacy, bad policy detector, nominee audit, encrypted digital legacy vault

### Phase 4: Design Overhaul
- [ ] Design brief & Today-screen dark/light mockups (`docs/plans/phase-4.md`)
- [ ] STOP FOR USER APPROVAL on mockups
- [ ] App shell & Command palette (Cmd+K)
- [ ] Today briefing & ask-anywhere AI overlay with clickable numbers
- [ ] Generative UI answers with local sliders
- [ ] Framer motion transitions & design tokens

### Phase 5: Signature Features
- [ ] 5a Plan & implementation: Air-gap indicator, 90s first run, Money-flow Sankey, Future-self time machine, Decision simulator, Tax leak meter
- [ ] 5b Plan & implementation: Weekly money letter, Panic-proof mode, Life-event playbooks, CA handoff pack, Hinglish voice input, Halo Score

### Phase 6: Productize
- [ ] Plan: `docs/plans/phase-6.md`
- [ ] 6.1 Desktop packaging (Tauri/Electron)
- [ ] 6.2 SQLCipher encryption, app lock, encrypted backup/wipe, dependency telemetry audit
- [ ] 6.3 Multi-profile & HUF non-destructive migration & household mode
- [ ] 6.4 CI suite with network-egress failure assertion
- [ ] 6.5 Performance benchmark pass (<100ms non-AI, <15s AI)
- [ ] 6.6 Final docs & verification checklist (`docs/FINAL_REPORT.md`)

---

## Real Test Results Log
- **Backend Tests (pytest):** 42/42 PASSED in 0.24s (formatter, rules loader, zero income, slab monotonicity, marginal relief, capital gains STCG/LTCG, regime comparison, advance tax, currency parser, network isolation check)
- **Backend Linting (ruff):** All checks passed (0 errors)
- **Backend Typechecking (mypy):** Success (0 issues found in 26 source files)
- **Frontend Tests (vitest):** 2/2 PASSED
- **Frontend Typechecking (tsc):** 0 errors
- **Frontend Build (vite):** Succeeded, output to `dist/`

---

## UNVERIFIED TAX VALUES
- **Income-tax Act, 2025 Transition (Effective 1 April 2026):** Section numbering changes from 1961 Act to 2025 Act require a dedicated section-mapping layer. Verified: false. Source: Draft Income-tax Bill, 2025.
- **Section 87A Marginal Relief (New Regime FY 24-25 & FY 25-26):** Exact tax relief for taxable income between ₹7,00,000 and ₹7,27,770 where tax payable exceeds (income - ₹7,00,000). Verified: false. Requires confirmation against incometax.gov.in utility.
- **Budget 2024 LTCG Real Estate Indexation Option:** Grandfathering allows choosing 12.5% without indexation or 20% with indexation for immovable property acquired before 23 July 2024 by resident individuals/HUFs. Verified: false. Source: Finance (No. 2) Act, 2024.
- **Section 112A LTCG Exemption & Rate:** ₹1,25,000 annual exemption limit and flat 12.5% rate took effect 23 July 2024. Verified: false. Source: Budget 2024.
