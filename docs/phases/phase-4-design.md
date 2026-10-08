# Phase 4: Design Transformation & Generative UI

## Scope
Read the frontend-design guidance first. Deliver a design brief artifact and mockups of the Today screen for approval BEFORE code.
- **Identity:** dark-first, calm, luminous; one hero number glows. Avoid default Tailwind card grids. Distinctive display face for big numbers, tabular numerals for tables, CSS-variable design tokens, polished light theme.
- **Indian formatting everywhere:** One question per screen. Progressive disclosure into a "Show the math" panel with Exact/Estimate labels.
- **Framer Motion:** count-up numbers, charts that draw in, shared-element transitions, prefers-reduced-motion respected. Confetti only for real milestones.
- **Build:** app shell and command palette (Cmd/Ctrl+K with natural language), "Today" briefing (net worth change, ONE recommended action, next 30 days), ask-anywhere AI overlay with clickable numbers, generative UI answers (LLM picks from a component registry; sliders recompute locally without another LLM call), demo mode with a synthetic persona, accessibility and responsive layout. Non-AI interactions under 100ms.
