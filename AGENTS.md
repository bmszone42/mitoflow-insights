<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- The whole redox model lives in `src/lib/mito/model.ts` as pure functions with a cited parameter
  block, so numbers stay auditable in one place.
- Static domain content lives in `src/lib/mito/reference.ts`, separate from the model, so reference
  text can change without touching the math.
- Workspace UI is one route (`src/routes/index.tsx`) holding the input state, with section
  components under `src/components/mito/`; scenarios persist in browser IndexedDB (`src/lib/mito/scenarios.ts`), no accounts.

- AI interpretation runs through one streaming server route `src/routes/api/interpret.ts` (Responses API, openai/gpt-6-astra) so the gateway key stays server-side.
