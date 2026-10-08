# Halo — Engineering Handoff & Resume Document

**Project:** Halo (Offline-First AI Wealth and Tax Engine for India)  
**Location:** `/Users/advaitkubal/Desktop/pro`  
**Date:** 2026-10-08  
**Status:** Step 1 Bootstrap Complete + Phase 1.1 Tax Engine Foundation Implemented & Verified.

---

## 1. System Architecture & Standing Rules

Halo is built according to 9 strict standing rules defined in `AGENTS.md`:
1. **100% On-Device Privacy:** Zero network calls with personal data. Only public data downloads (e.g. AMFI NAV) allowed, logged to visible network log.
2. **Deterministic-First AI:** LLM only parses intent, routes, and narrates. **ALL math (tax, loans, IRR, XIRR, EMI) is implemented in pure, tested Python functions.** The LLM never computes numbers.
3. **Show the Math:** Every calculation returns an explanation object (formula, inputs, steps, section reference, confidence, assumptions).
4. **Versioned Tax Rules:** No tax slab, rate, or threshold is hardcoded in application logic. All rules reside in `backend/app/rules/fy_YYYY_YY.json` with `verified: true/false`, effective dates, and `source_url`.
5. **Indian Number Formatting:** Grouping as ₹1,25,00,000 / 1.25 Cr. Parse colloquial user inputs (`"5 cr"`, `"8.9 lakhs"`, `"35.5k"`).
6. **Code Quality:** Pytest with golden fixtures, type hints, Pydantic v2, TypeScript strict mode.
7. **Tool-Call Safety:** LangGraph `validate` node with Pydantic validation before tool execution.
8. **Data Layer:** SQLite with `profile_id` on all tables, non-destructive migrations.
9. **Synthetic Data Only:** Never commit real user financial documents.

---

## 2. Work Completed in This Session

### 2.1 Rules & Governance
- `AGENTS.md` and `.agent/rules/halo.md`: Standing rules 1–9.
- `docs/REPO_AUDIT.md`: Complete audit of the codebase, schemas, and tax mismatches.
- `docs/PROGRESS.md`: Full roadmap checklist covering all 6 phases and tracking open unverified tax values.
- `docs/ROADMAP.md` & `docs/phases/phase-[1-6].md`: Complete multi-phase specifications.
- `Makefile`: Unified commands (`make test`, `make lint`, `make typecheck`, `make dev`).
- `pyproject.toml` & `.gitignore`: Standard linting, testing, and ignore rules.

### 2.2 Rules-Driven Tax Engine (`backend/app/tax_engine.py`)
- Created `backend/app/rules/fy_2024_25.json` (Finance (No.2) Act 2024, Budget 2024 slabs, Sec 111A flat 20%, Sec 112A 12.5% above ₹1.25L).
- Created `backend/app/rules/fy_2025_26.json` (Budget 2025-26 slabs, ₹12L 87A threshold).
- Created `backend/app/rules/fy_2026_27.json` (Scaffold for Income-tax Act, 2025).
- Created `backend/app/rules/section_map.json` (1961 Act to 2025 Act mapping layer).
- Implemented `compute_income_tax()`: Progressive slice-by-slice slab calculation, surcharge tiers, Section 87A rebate with marginal relief, 4% health & education cess, sanity check (tax ≤ total income).
- Implemented `compute_capital_gains_tax()`: Section 111A STCG (20%), Section 112A LTCG (12.5% above ₹1.25L), Debt STCG (slab rate), Real estate LTCG (12.5% without indexation / 20% with indexation choice).
- Implemented `compare_regimes()`: Old vs New regime optimization and recommendation.
- Implemented `compute_advance_tax()`: 4 quarterly instalment schedule with Section 234 interest structure.
- Implemented `fmt_inr()`: Indian number grouping (`₹1,25,000`, `₹1,00,00,000`).

### 2.3 RAG Tools & LangGraph Integration
- Rewrote `backend/app/rag/wealth_tools.py`:
  - `parse_indian_currency()`: Robust parser for `"5 cr"`, `"8.9 lakhs"`, `"35.5k"`, `"₹18,00,000"`.
  - Auto-corrected Western/Indian lakh confusion (e.g., 8.9L parsed as 8.9M).
  - `calculate_loan_and_emi()`: Bisection IRR solver for exact interest rate solving (e.g. 25.24% for 8.9L / 36 EMI / 35.5k), amortization, loan preclosure advice, tax deductions (Sec 24b, 80C, 80E, 80EEB).
  - Wired `compute_indian_tax` directly to `tax_engine.py`.

### 2.4 Testing & Verification
- `backend/tests/conftest.py`: Network isolation fixture (`block_network`) ensuring zero external network egress.
- `backend/tests/fixtures/tax_golden.json`: Golden test profiles.
- `backend/tests/test_tax_engine.py`: **42/42 tests passing** covering formatting, rules loader, zero income, slab monotonicity, marginal relief, capital gains, regime comparison, advance tax, currency parsing, and network isolation.
- `src/smoke.test.ts`: Vitest frontend smoke test passing.
- Frontend build: `npm run build` succeeds (`dist/` generated clean).
- TypeScript strict mode: `npx tsc --noEmit` passing with zero errors.
- Python linting: `ruff check` passing with zero errors.

---

## 3. What Needs to Be Done Next (Phase-by-Phase Roadmap)

### Phase 1: Foundation (Tax & Rules Engine Completion)
1. **Regime Optimizer Deep Dive (1.2):** Expand old regime deduction calculators in frontend (`HRA` formula: min of actual HRA, 50%/40% basic, rent - 10% basic; `80D` senior/non-senior split; `80CCD(1B)` ₹50k NPS; `80CCD(2)` 14% employer NPS).
2. **Advance Tax & Section 234 (1.3):** Complete Section 234A/B/C monthly interest calculation for missed/deferred advance tax installments.
3. **LangGraph Validate Node (1.4):** Insert a validation node prior to tool execution in `backend/app/rag/graph.py` with Pydantic range checks (interest rate 0–50%, tenure ≤ 40 years) and a max 2-retry corrective loop.
4. **Golden Fixture Expansion (1.5):** Expand `tax_golden.json` to 100+ profiles.
5. **Tax Rules Status Page (1.6):** Create API `/api/tax/rules-status` and a frontend view showing verified vs unverified tax provisions.
6. **Fix `src/pages/Calculators.tsx`:** Align frontend calculator slabs with the backend versioned rules engine (currently has hardcoded old slabs).

### Phase 2: Ingestion & Cash Flow
- Password-protected CAS parser (CAMS / KFintech PDF) with "Review Extracted Holdings" staging UI.
- Form 16 Part A/B parser with staging UI.
- Bank statement parser (PDF/CSV) with local LLM categorization.
- AIS/TIS JSON import & reconciliation.
- Lot-level FIFO holdings with 31 Jan 2018 grandfathering.
- Monthly net worth snapshots & trend API (`/api/wealth/snapshots`).
- AMFI NAV public downloader with visible network log.

### Phase 3: Intelligence Modules
- **3a Capital Gains Advisor:** Real-time tax loss harvesting, ESOP/RSU perquisite vs capital gains tax, property sale 54/54EC/54F reinvestment planner.
- **3b Debt Strategy:** Debt avalanche vs snowball, prepay vs invest IRR comparison, floating rate reset analyzer, credit card revolve warning.
- **3c Portfolio Analytics:** XIRR, Direct vs Regular mutual fund fee leakage calculator, portfolio overlap analysis, FIRE retirement Monte Carlo simulator.
- **3d Protection:** Term insurance & health insurance adequacy calculator, bad investment-cum-insurance policy detector.

### Phase 4: Design Overhaul
- App shell with command palette (`Cmd+K` via `cmdk`).
- Today briefing dashboard & ask-anywhere AI overlay with clickable figures.
- Generative UI sliders for what-if simulations using `framer-motion` and `recharts`.
- **Note:** Generate dark and light mockups in `docs/plans/phase-4.md` and wait for user visual approval before full UI rollout.

### Phase 5: Signature Features
- Air-gap indicator in UI.
- Money-flow Sankey diagram (`d3-sankey`).
- Future-self time machine & tax leak meter.
- Hinglish voice input & Indian colloquial financial query parser.
- Halo Financial Health Score (0–1000).

### Phase 6: Productize & Package
- SQLite encryption layer / SQLCipher integration.
- `profile_id` added across all DB tables with non-destructive migration.
- Comprehensive CI test suite with network-egress blocker.
- Desktop packaging (Tauri or Electron).

---

## 4. How to Run Locally

```bash
# Run backend
cd /Users/advaitkubal/Desktop/pro
backend/.venv/bin/uvicorn app.main:app --reload --port 8000 --app-dir backend

# Run frontend
cd /Users/advaitkubal/Desktop/pro
npm run dev

# Run backend tests
backend/.venv/bin/pytest backend/tests/ -v

# Run frontend tests
./node_modules/.bin/vitest run

# Run linter and typechecks
backend/.venv/bin/ruff check backend/app/ backend/tests/
npx tsc --noEmit
```
