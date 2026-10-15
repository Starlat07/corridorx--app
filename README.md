# CorridorX with Aftertrace
CorridorX is a TanStack Start, React, and TypeScript application. Aftertrace adds outcome-based route comparison and Route Memory to its existing authenticated workspace.
## Requirements and local setup
- Node.js 22 or newer (the test script uses Node’s built-in TypeScript stripping and test runner).
- npm 10+ or Bun. `package-lock.json` is included for npm.
- A Supabase project for authentication and the existing server functions.
```sh
npm install
Copy-Item .env.example .env  # PowerShell
# Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env
npm run dev
```
Run `npm test`, `npm run build`, and `npm run preview` for tests, production build, and local preview. App pages require a user signed in through the configured Supabase project.
## Supabase configuration
Set the project URL and publishable key in `.env`. Publishable keys are intended for client use; never put a Supabase secret/service-role key in a `VITE_` variable. Set server-only variables in deployment settings. Do not commit `.env`. Existing SQL migrations are under `supabase/migrations`; inspect before applying with `supabase link --project-ref YOUR_PROJECT_REF` and `supabase db push`.
No new database migration is required for Aftertrace: this MVP stores Route Memory in browser localStorage, namespaced by authenticated user ID. Data does not sync across browsers/devices, is not protected by server-side authorization, and may be cleared by the user/browser. Do not use this persistence for production financial records. A production rollout should move outcome writes and reads to authenticated server endpoints and a user-owned database table with row-level security.
## Aftertrace behavior and limits
- The sender sets currency/country pair, send amount, required recipient amount, maximum quote fee, delivery window, payout method, and ranking priority.
- Fee, delivery, and minimum recipient amount are hard eligibility constraints. Ranking runs only after those constraints; the selected priority controls a transparent rules-based preference score.
- Current provider formulas are estimates/sandbox data, not live multi-provider quotes. Aftertrace does not initiate a payment.
- There is no fabricated history. Cold starts are labelled; history is matched by corridor, payout type, and similar transfer size. Only confirmed outcomes count; unconfirmed records and duplicate IDs do not inflate evidence.
- Outcomes are self-reported in this browser, not externally verified. Actual fee, delivered amount, delivery time, and optional reason are recorded when provided.
- Estimates are not guarantees. Real provider APIs, server-side outcome verification, database persistence, cross-device memory, and payment execution are not implemented.
## Deploy to the connected Vercel project
The production site is hosted on Vercel. `vercel.json` declares the TanStack Start framework, and `vite.config.ts` pins Nitro to the Vercel runtime. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel for both Preview and Production, then push a branch for Preview or merge to `main` for Production. `npm run build` checks the bundle locally. The inherited `netlify.toml` is not used by this Vercel deployment.
## Upload to GitHub
Extract `corridorx-aftertrace.zip` and copy the extracted contents (including hidden files) into the root of your existing checkout. Copy the contents, not the enclosing folder; `package.json` belongs at the repository root. Keep `.git`, review `git status`, then run `git add .`, `git commit -m "Add Aftertrace route memory"`, and `git push`.
