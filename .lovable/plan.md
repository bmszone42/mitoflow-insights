# Saved scenarios + AI mechanistic interpretation

## 1. Scenarios stored in this browser (IndexedDB)
- New "Scenarios" panel in the Simulator tab: name a scenario, save current slider inputs, list saved ones (name, date, key readouts), load, rename, delete.
- Saved record: id, name, notes, inputs, snapshot of key outputs (ATP, O2•-, H2O2, Fe-S intact, free Fe2+, 71 THz), created/updated time, optional last AI interpretation.
- Stays on this device only, no account. Export/import as JSON file for backup.

## 2. AI interpretation
- New "Interpret" panel: free-text box for the experimental condition (cell type, treatment, light protocol, iron chelator, hypoxia, etc.).
- Sends the description plus current inputs and model outputs to a server function that calls Lovable AI (default model), streaming back a structured interpretation:
  - Predicted ROS changes and which complex/site drives them
  - Fe-S cluster and aconitase consequences
  - Iron handling (labile pool, Fenton risk, IRP/ferritin response)
  - Photon response (CCO/NO photodissociation, biphasic dose position, 71 THz relative reporter)
  - Caveats, assumptions, and suggested measurements
- Text streams in live; clear error messages for rate limit or out-of-credits. Result can be saved into the current scenario.
- Prompt instructs the model to stay grounded in the given numbers and label speculation.

## Technical details
- `src/lib/mito/scenarios.ts`: small IndexedDB wrapper (`idb` package), loaded only in the browser.
- `src/components/mito/Scenarios.tsx`, `src/components/mito/Interpreter.tsx`.
- Streaming server route `src/routes/api/interpret.ts` using AI SDK Responses via the gateway, model `openai/gpt-6-astra`, key kept server-side (provision LOVABLE_API_KEY if missing).
- Update AGENTS.md rule (state no longer session only: IndexedDB for scenarios, one server route for AI) and progress.md.
