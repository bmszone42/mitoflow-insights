# AI explanation of sensitivity results

## What to build

A panel in the Sensitivity tab that sends the current sensitivity analysis to the AI and streams back an explanation of the key parameter interactions and what they mean for ROS and Fe-S outputs.

## How

1. New server route `src/routes/api/explain-sensitivity.ts`
   - POST with zod body: baseline inputs, perturbation step, and the sensitivity table (per driver, per output, up/down percent changes).
   - Same rate limiting, run-id pass-through and streaming shape as `/api/interpret`.
   - System prompt: mitochondrial redox biologist explaining a local sensitivity analysis; sections for dominant drivers, notable interactions (iron x Fenton, light x peroxynitrite, flux x superoxide), implications for ROS and Fe-S, and caveats. Grounded in the numbers, em dashes banned, under ~400 words.

2. `src/components/mito/Sensitivity.tsx`
   - New panel below the sweep chart: "Explain these results" button, streaming Markdown output (react-markdown), 10 second cooldown and remaining-requests counter matching the Interpreter panel.
   - Sends the already-computed `sens` table, baseline inputs and delta; no extra computation.

3. Verify: typecheck, then browser test (run the explanation, confirm streamed text appears and mentions the numbers).

## Notes

- Counts toward the same per-visitor AI usage limits as the other AI features.
- No changes to the model math.
