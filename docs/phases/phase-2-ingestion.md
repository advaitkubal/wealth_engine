# Phase 2: Ingestion & Lot Engine

## Scope
1. CAS ingestion (CAMS/KFintech, password-protected) with a "Review Extracted Holdings" staging UI (per-row edit/accept/reject, low-confidence flags).
2. Form 16 Part A/B parser with the same staging flow.
3. Bank statement import (PDF/CSV) with local-LLM categorization (classify only, user-correctable, corrections remembered as rules), subscription detection, auto-derived monthly expenses feeding the runway gauge.
4. AIS/TIS JSON import and reconciliation against tracked data.
5. Lot-level FIFO holdings with grandfathering (31 Jan 2018 FMV) and holding-period classification.
6. Monthly net worth snapshots plus trend API.
7. Financial calendar engine (advance tax, ELSS lock-in, FD maturity, insurance renewal, March 31 harvesting).
8. User-initiated AMFI NAV download with a visible network log.

*Note: Use generated fake PDFs for tests.*
