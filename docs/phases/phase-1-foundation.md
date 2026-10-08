# Phase 1: Foundation (Deterministic Tax & Rules Engine)

## Scope
1. Refactor `compute_indian_tax` into a rules-driven engine loading per-FY rule files (`backend/app/rules/fy_YYYY_YY.json` for FY 2024-25, FY 2025-26, FY 2026-27 scaffold). Support new-regime slabs, standard deduction, 87A rebate WITH marginal relief, surcharge tiers with the new-regime cap, 4% cess, special-rate gains (111A, 112A, 112 with indexation choice for pre-July-2024 property). Rebate must NOT apply to special-rate gains. Return explanation objects.
2. Regime Optimizer: Old vs New using tracked data (HRA, 80C, 80D, 80CCD(1B), 80CCD(2), 24(b), 80E, 80EEB), returning the better regime with the rupee difference.
3. Advance tax and 234A/B/C interest with due-date logic.
4. LangGraph validate-then-execute node per rule 7, with tests simulating bad model outputs.
5. Golden test suite of 100+ profiles across FYs, plus a list of cases to verify on incometax.gov.in.
6. "Tax rules status" API/page showing verified vs unverified values.
