# Phase 3: Intelligence (Financial Modeling & Tool Suite)

## Scope
Pure tested modules exposed as validated LangGraph tools:
- **Capital gains and tax:** harvesting advisor (LTCG exemption, loss lots, set-off and 8-year carry-forward), ESOP/RSU (perquisite, capital gains, foreign RSU: Schedule FA, Form 67, LRS/TCS), property (indexation choice, 54/54F/54EC deadlines, let-out interest cap), debt funds/ULIP/SGB/REIT/InvIT/VDA, family clubbing and allocation.
- **Debt:** avalanche vs snowball with monthly surplus, prepay-vs-invest breakeven, floating-rate reset tracker, balance-transfer calculator, credit-card revolve detector, co-borrower tax split.
- **Portfolio:** XIRR/CAGR with benchmark and real returns, Regular-vs-Direct leakage (10 and 20 years), MF overlap, employer-stock concentration, tax-aware rebalancing, goal planning, retirement/FIRE Monte Carlo (seeded, numpy-vectorized, <1s), runway gauge with liquidity tiers.
- **Protection:** insurance adequacy, bad-policy detector (reuse the IRR solver), nominee audit, encrypted Digital Legacy Vault.

*Execution Note: Split into 3-4 sub-sessions in the implementation plan.*
