# Halo: standing rules (never violate)
1. PRIVACY: 100% on-device. No network requests containing personal data, ever. Only user-initiated downloads of PUBLIC data (AMFI NAV file, RBI rates, tax-rule updates) are allowed, each written to a user-visible network log.
2. DETERMINISTIC-FIRST AI: the local LLM only routes intent, extracts arguments, and narrates. ALL math (tax, loans, XIRR, simulations) lives in pure, tested Python functions. The LLM never computes numbers.
3. SHOW THE MATH: every computed figure returns an explanation object: formula, inputs, steps, section reference, confidence ("exact" | "estimate"), assumptions.
4. VERSIONED TAX RULES: no slab, rate, threshold, or section number hardcoded in logic. Store per-FY data in backend/app/rules/fy_YYYY_YY.json with effective dates, "verified": true/false, "source_url". If unsure of a value, set verified=false and add a TODO. NEVER guess silently. The Income-tax Act, 2025 takes effect 1 April 2026; keep a section-mapping layer. Audit the PRD's tax values before trusting them.
5. INDIAN FORMATTING: lakh/crore grouping (₹1,25,00,000) with compact toggle (1.25 Cr). One shared formatter for frontend and backend. Parse colloquial input ("5 cr", "8.9 lakhs", "35.5k").
6. QUALITY: every backend module has pytest tests including edge cases. Tax logic has golden JSON fixtures. Type hints and Pydantic on Python; TypeScript strict on frontend.
7. TOOL-CALL SAFETY: every LLM tool call passes a LangGraph "validate" node first: Pydantic validation, unit and range checks (rate 0-50%, tenure <= 40 years), retry loop (max 2) with a corrective message. Use Ollama JSON-schema constrained output where available.
8. DATA: SQLite via a SQLCipher-compatible layer, Alembic-style migrations, never destructive-migrate user data, profile_id on all tables.
9. SYNTHETIC DATA ONLY in tests, fixtures, and demos. Never commit real financial documents.
Working style: extend the existing architecture, don't rewrite working modules without reason, small commits, report real output, say what you could not verify.
