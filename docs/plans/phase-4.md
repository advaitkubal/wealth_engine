# Phase 4: Design Overhaul

## Mockups

We have generated two mockups for the new Today screen:
- **Dark Mode**: Sleek, dark theme with neon accents, optimized for night viewing.
- **Light Mode**: Clean, bright, airy with soft shadows and indigo accents.

These mockups include a Net Worth card, a Tax Meter, quick action buttons, and a persistent AI chat entry at the bottom.

## Implementation Plan

1. **App Shell**: Create a unified `src/AppShell.tsx` which wraps all pages. Add a command palette triggered via `Cmd+K` using the `cmdk` library.
2. **Today Page**: Build `src/pages/Today.tsx` which implements the dashboard seen in the mockups. It will feature:
   - A Net Worth card using `recharts` for the trendline.
   - A Tax Meter showing current tax liability and advance tax due.
   - Quick action buttons (Add Asset, Add Liability, etc.)
   - A sticky AI chat input anchored to the bottom.
3. **Routing**: Set the `/today` route as the default landing page.
4. **Transitions**: Integrate `framer-motion` for smooth page transitions between the dashboard, calculators, and tax planning pages.
