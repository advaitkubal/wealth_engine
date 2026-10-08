# Phase 6: Productization, Desktop Packaging & Hardening

## Scope
1. Desktop packaging with Tauri (preferred) or Electron: bundles frontend and backend, auto-starts the backend, manages Ollama detection and install, installers for macOS/Windows/Linux, tray widget with net worth and next due date.
2. Security: SQLCipher encryption, app lock, encrypted backup/restore, secure wipe, dependency audit for telemetry or outbound calls.
3. Multi-profile and HUF: non-destructive migration plan, then implementation, plus household mode with couple-level optimization.
4. CI: golden tax tests, unit tests, type checks, lint, and a network-egress test that fails the build on any unexpected external request.
5. Performance pass against budgets (non-AI <100ms, AI <15s).
6. Docs: architecture, how to add a new FY of tax rules, contributing guide, and a verification checklist of every tax value to confirm manually before release.
