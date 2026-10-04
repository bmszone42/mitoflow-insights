# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Run locally (fully offline)

Cristae Lab is a single-user, local-first app. The simulator, all 18 demo
patient profiles, Diagnosis, Dashboard, Timeline, Therapy plan, Therapy
tools, Scenario progress and every CSV export run entirely in your browser.
Scenarios, timeline visits and the run log are stored in your browser's
IndexedDB / localStorage. No account, no cloud keys, no network needed.

You need [bun](https://bun.sh) (or Node.js 20+ with npm):

```sh
# 1. Get the code (Settings > Export/Download in Lovable, or clone the repo)
git clone <this-repository-url>
cd <repository-name>

# 2. Install dependencies
bun install        # or: npm install

# 3. Start the dev server
bun run dev        # or: npm run dev
```

Open the printed URL (usually http://localhost:5173). That is the whole
setup: there is no `.env` to create. `.env.example` documents the two
optional values, neither of which is needed offline.

### What needs the internet

Only the optional AI interpretation buttons (they call a hosted AI service
through `/api/interpret`, which expects a `LOVABLE_API_KEY` on the server).
Without a key those buttons show an error; everything else is unaffected.

### Production build

```sh
bun run build && bun run preview
```

### Notes

- Data never leaves your machine except for the optional AI calls.
- Clearing your browser's site data deletes saved scenarios, visits and the
  run log. Use the CSV downloads to keep copies.
- The app is a research model. Every readout, flag and projection is a model
  estimate, not a measurement, and nothing here is medical advice.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
