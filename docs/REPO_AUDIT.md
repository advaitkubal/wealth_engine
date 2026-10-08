# Repo Audit: Halo AI Wealth & Tax Engine

**Date:** 2026-10-08  
**Auditor:** Lead Engineer and Orchestrator  
**Repository:** `/Users/advaitkubal/Desktop/pro`  
**Git Branch / Commit:** `main` (commit `8c6e18e feat: initial Halo wealth management platform`) with uncommitted prototype modifications.

---

## 1. Folder Structure Overview

```
/Users/advaitkubal/Desktop/pro/
├── .env / .env.example       # Local environment configuration (Ollama, DB path, model names)
├── .git/                     # Git repository (initialized, single baseline commit 8c6e18e)
├── .gitignore                # Currently minimal; needs expansion for security and hygiene
├── README.md                 # Brief setup docs
├── backend/
│   ├── .venv/                # Existing Python 3.13 virtual environment
│   ├── requirements.txt      # Backend dependency manifest (currently unpinned/minimal)
│   └── app/
│       ├── __init__.py
│       ├── config.py         # Pydantic Settings singleton (reads ../../.env)
│       ├── main.py           # FastAPI entrypoint, lifespan db init, CORS, router mounting
│       ├── api/              # REST Endpoints (/health, /settings, /documents, /chat, /wealth)
│       ├── database/         # SQLite connector, DDL schema, vector_store stubs
│       ├── models/           # Pydantic schemas (ChatRequest, ChatResponse, HealthResponse, etc.)
│       ├── rag/              # LangGraph workflow, wealth_tools, embeddings, prompts, retriever
│       └── utils/            # file_utils (PDF validation, filename sanitation)
├── data/
│   ├── halo.db               # SQLite database file (currently populated with assets & liabilities)
│   ├── documents/            # Document upload store
│   └── processed/            # Intermediate chunk files
├── index.html                # Vite HTML entrypoint
├── node_modules/             # Node dependency directory
├── package.json              # Frontend manifest (React 19, TS, Vite, TailwindCSS)
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json             # Root TypeScript config
├── tsconfig.app.json         # Client TS config (strict mode currently disabled)
├── tsconfig.node.json        # Vite Node TS config
├── vite.config.ts            # Vite configuration
├── scripts/
│   ├── check_environment.py # Python environment validation
│   ├── initialize_db.py     # Database table creator & seeder
│   ├── setup.sh             # Initial setup script
│   └── start.sh             # Dual-service runner (FastAPI on :8000, Vite on :5173)
└── src/
    ├── App.tsx               # Root app layout
    ├── main.tsx              # React DOM render entry
    ├── router.tsx            # React Router 6 config (/, /wealth, /tax-planning, /calculators, /insights, /security)
    ├── index.css             # Tailwind base styles
    ├── components/           # Navbar, DonutChart, BarChart, Hero, etc.
    └── pages/                # HomePage, WealthEngine, TaxPlanning, Calculators, Insights, Security
```

---

## 2. How to Run Frontend and Backend Today

- **Dual-process Runner:** `bash scripts/start.sh` (or `npm run dev` in frontend and `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` in `backend/`).
- **Network Ports:**
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:8000` (API docs at `/docs`)
  - Local LLM: `http://127.0.0.1:11434/v1` (Ollama running `llama3.2`)
- **Offline Directives:** `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1` are exported in `scripts/start.sh` and set in `.env` to prevent HuggingFace network timeouts.

---

## 3. Database Schema (`data/halo.db`)

Current tables managed via raw SQL DDL in `backend/app/database/schema.py`:
1. `documents`: `(id INTEGER PK AUTOINCREMENT, filename, source, upload_date, page_count, chunk_count, status, file_path)`
2. `document_chunks`: `(id INTEGER PK AUTOINCREMENT, document_id FK, page, section, text, chunk_index, char_count)`
3. `conversations`: `(id TEXT PK, created_at, updated_at, title)`
4. `messages`: `(id INTEGER PK AUTOINCREMENT, conversation_id FK, role, content, created_at, sources_json)`
5. `assets`: `(id INTEGER PK AUTOINCREMENT, type TEXT, label TEXT, value REAL, yield_pct REAL, created_at, updated_at)`
6. `liabilities`: `(id INTEGER PK AUTOINCREMENT, type TEXT, label TEXT, remaining REAL, rate REAL, emi REAL, tenure INTEGER, created_at, updated_at)`
7. *Virtual Vector Table:* `vec_chunks` (`sqlite-vec` extension). **Degraded status:** `sqlite-vec` fails to load under Python 3.13 on this macOS host (`'sqlite3.Connection' object has no attribute 'load_extension'`), so vector search is currently bypassed gracefully with a warning.

---

## 4. Existing LangGraph Flow (`backend/app/rag/graph.py`)

Current graph execution state:
```
[User Question]
       │
       ▼
[process_query] ──────────► [retrieve_documents] ──────────► [check_relevance]
                                                                   │
                                                                   ▼
                                                            [generate_with_tools]
                                                                   │
                            ┌──────────────────────────────────────┴──────────────────────────────────────┐
                            ▼                                                                             ▼
               [route_after_generate: tool_calls?]                                          [route_after_generate: text only]
                            │                                                                             │
                            ▼                                                                             ▼
                   [execute_tools_node]                                                   [format_citations]
                            │                                                                             │
                            ▼                                                                             ▼
                   [generate_with_tools] (loop back, max 5 rounds)                                      [END]
```

**Tools Defined in `wealth_tools.py`:**
- `get_portfolio_summary`: Reads SQLite `assets` and `liabilities`, returns totals and breakdown.
- `add_asset`: Parses colloquial Indian currency and inserts an asset into `assets`.
- `add_liability`: Parses loan information and inserts into `liabilities`.
- `delete_asset` / `delete_liability`: Deletion by ID.
- `compute_indian_tax`: Computes New Tax Regime slabs, deductions, 4% cess, and special rate capital gains.
- `calculate_loan_and_emi`: Amortization calculator with reverse IRR solver for effective annual interest rate.

---

## 5. Existing Tests & Verification Status

- **Automated Tests:** **NONE.** No `pytest` test suite exists in `backend/tests/`; no `vitest` or `jest` suite exists in `src/`.
- **Manual Smoke Testing:** Ad-hoc curl commands and interactive web page testing only.
- **Dependency Tracking:** No test frameworks (`pytest`, `vitest`, `playwright`, `hypothesis`) are installed in the existing virtual environment or `package.json`.

---

## 6. Dependency Manifests

### Backend (`backend/requirements.txt`)
- Unpinned dependencies: `fastapi`, `uvicorn[standard]`, `python-multipart`, `pydantic`, `pydantic-settings`, `langchain`, `langchain-community`, `langchain-openai`, `langchain-text-splitters`, `langgraph`, `sentence-transformers`, `pypdf`, `sqlite-vec`, `httpx`, `python-dotenv`, `typing-extensions`.
- Missing roadmap tooling: `pytest`, `pytest-cov`, `hypothesis`, `ruff`, `mypy`, `alembic`, `pdfplumber`, `scipy` (present in venv site-packages but unlisted in manifest), `numpy` (present in site-packages but unlisted in manifest).

### Frontend (`package.json`)
- Installed runtime dependencies: `react` (19.0.0), `react-dom` (19.0.0), `react-router-dom` (6.28.0), `lucide-react` (0.475.0).
- Installed dev dependencies: `vite` (6.1.0), `tailwindcss` (3.4.17), `eslint` (9.19.0), `typescript` (5.7.2).
- Missing roadmap tooling: `framer-motion`, `cmdk`, `recharts` / `visx`, `d3-sankey`, `vitest`, `@testing-library/react`, `playwright`.

---

## 7. Audit Findings & Critical Issues Identified

### A. Mixed Tax-Year Assumptions & Discrepancies
- **New Tax Regime Slabs:**
  - `backend/app/rag/wealth_tools.py` and `prompts.py` assume Budget 2024 revised slabs:
    - ₹0 - ₹4,00,000: 0%
    - ₹4,00,001 - ₹8,00,000: 5%
    - ₹8,00,001 - ₹12,00,000: 10%
    - ₹12,00,001 - ₹16,00,000: 15%
    - ₹16,00,001 - ₹20,00,000: 20%
    - ₹20,00,001 - ₹24,00,000: 25%
    - Above ₹24,00,000: 30%
  - **Conflict in `src/pages/Calculators.tsx` (lines 23-30):** Uses an older/different slab structure:
    - ₹0 - ₹3,00,000: 0%
    - ₹3,00,001 - ₹7,00,000: 5%
    - ₹7,00,001 - ₹10,00,000: 10%
    - ₹10,00,001 - ₹12,00,000: 15%
    - ₹12,00,001 - ₹15,00,000: 20%
    - Above ₹15,00,000: 30%
- **Rebate 87A Marginal Relief:** Not implemented. A flat cliff is assumed at ₹7,00,000, leaving incomes between ₹7,00,001 and ₹7,27,770 penalized without marginal relief.
- **Section 24(b) Loan Deductions:** Hardcoded in Python without versioning or effective dates.
- **Direct Violation of Rule 4:** All tax rates and slabs are hardcoded directly in Python code and React components rather than being stored in versioned JSON rule files.

### B. Lack of Profile ID / Multi-HUF Support
- Database tables (`assets`, `liabilities`, `conversations`, `messages`) have no `profile_id`. Multi-profile or HUF data segregation is currently impossible without schema modification.

### C. TypeScript Strict Mode Disabled
- `tsconfig.app.json` has `"strict": false` or loose flags. Enabling strict mode is required by Standing Rule 6.

### D. SQLite & SQLite-Vec Limitations
- Python 3.13 default build on macOS disables `enable_load_extension` on `sqlite3.Connection`, causing `sqlite-vec` initialization to fail and vector search to deactivate.
- `sqlcipher3` is not installed; database file `data/halo.db` is unencrypted plaintext SQLite.

### E. Security & Network Hygiene
- No socket/network isolation in tests.
- `.gitignore` was missing standard test artifacts, virtual environments, and private financial fixtures.
