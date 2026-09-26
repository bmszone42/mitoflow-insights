# Scenario comparison, AI usage limits, AI slider suggestions

## 1. Compare two saved scenarios
- New "Compare" panel under Scenarios: pick Scenario A and Scenario B from dropdowns.
- Table of every slider input and key output (ATP, all ROS species, Fe-S intact, aconitase, free Fe2+, 71 THz) side by side, with the change from A to B (value and percent, pink up, green down).
- Grouped bar chart of ROS species for A vs B on the log scale, plus Fe-S and iron bars.
- Outputs are recomputed from each scenario's saved inputs, so older saves compare correctly.
- If both have saved AI notes, show them in two columns below.

## 2. Usage limits on the AI panel
- Server side, on the interpret endpoint:
  - Per visitor limit: 10 requests per 10 minutes and 40 per day, keyed by IP address.
  - Global safety cap: 300 requests per day across all visitors.
  - Over the limit returns a clear "limit reached, try again in N minutes" message.
  - Condition text capped at 2000 characters, request body capped at 16 KB.
- Client side: button cooldown of 10 seconds between runs and a visible "X of 10 left" counter.
- Limitation: with no database, server counters live in memory on each server instance, so they reset on restarts and are per instance. Good enough to stop casual abuse; for strict limits we would enable Lovable Cloud and store counters there. Noted in the security section of progress.md.
- Also recommended before publishing: set a workspace AI spending cap (can be done from chat).

## 3. AI suggests slider settings
- New "Suggest settings" button next to Interpret.
- A second endpoint asks the AI to map the described condition to the 11 sliders, with a one-line reason per slider and a confidence level.
- Suggestions appear as a preview list (current value, suggested value, reason). Nothing changes until you click "Apply" (all) or apply individual rows.
- Values are clamped to slider ranges on the server. Counts toward the same usage limits.

## Technical details
- `src/components/mito/Compare.tsx`; slider ranges moved to a shared list in `src/lib/mito/model.ts` so Simulator, Sensitivity, and suggestions use one source.
- `src/lib/mito/rate-limit.server.ts`: in-memory sliding window used by both AI routes.
- `src/routes/api/suggest.ts`: Responses API, `openai/gpt-6-astra`, structured output (flat object schema, no bounds in schema; clamping in code), streamed server-side with a fallback JSON parse.
- Update AGENTS.md and progress.md (features, API docs for /api/suggest, security section).
