# CorridorX with Aftertrace

CorridorX is a TanStack Start, React, and TypeScript application. Aftertrace adds outcome-based route comparison and Route Memory to its existing authenticated workspace.

## Requirements and local setup

- Node.js 22 or newer (the test script uses Node's built-in TypeScript stripping and test runner).
- npm 10+ or Bun. `package-lock.json` is included for npm.
- A Supabase project for authentication and the existing server functions.

```sh
npm install
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env
npm run dev
```

Open the URL printed by Vite. App pages require a user signed in through the configured Supabase project. `npm run build` creates a production build; `npm run preview` serves that build locally. Run `npm test` for Aftertrace routing and outcome-recording tests.

On Windows PowerShell, copy the environment template with `Copy-Item .env.example .env`.

## Supabase configuration

Set the project URL and publishable key in `.env` as shown above. Publishable keys are intended for client use; never put a Supabase secret/service-role key in a `VITE_` variable. Set server-only variables in the deployment platform's server environment. Do not commit `.env`.

The existing SQL migrations are under `supabase/migrations`. For a linked Supabase project with the Supabase CLI installed, inspect the migrations and apply with:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

No new database migration is required for Aftertrace: this MVP stores Route Memory in browser localStorage, namespaced by authenticated user ID. Data does not sync across browsers/devices, is not protected by server-side authorization, and may be cleared by the user/browser. Do not use this persistence for production financial records. A production rollout should move outcome writes and reads to authenticated server endpoints and a user-owned database table with row-level security.

## Aftertrace behavior and limits

- The sender sets currency/country pair, send amount, required recipient amount, maximum quote fee, delivery window, payout method, and ranking priority.
- Fee, delivery, and minimum recipient amount are hard eligibility constraints. Ranking runs only after those constraints; the selected priority controls a transparent rules-based preference score.
- Current CorridorX provider formulas are estimates/sandbox data, not live multi-provider quotes. Aftertrace does not initiate a payment. Provider names and existing provider descriptions do not mean a live production integration is available.
- There is no fabricated history. Cold starts are labelled; route evidence is matched to corridor, payout type, and a similar transfer size. Only user-recorded final outcomes contribute; unconfirmed records are excluded, and duplicate IDs are ignored.
- Outcomes are self-reported in this browser and identified as such. An administrator or provider has not verified them. Current UI captures final status, actual fee, delivered amount, delivery time, and an optional reason, but not an external event/source verification.
- Current estimates use the existing app's static illustrative provider fee/FX/ETA data. They are not guarantees or financial advice. Real provider APIs, server-side outcome verification, database persistence, cross-device memory, and payment execution are not implemented.

## Deploy

The existing Vite configuration builds a Nitro Cloudflare Worker. Configure the Supabase URL and publishable key as deployment environment variables, then:

```sh
npm run build
npx nitro deploy --prebuilt
```

Authenticate/configure Wrangler for your Cloudflare account before deployment. `npm run preview` previews the local build. The inherited `netlify.toml` points to a static `dist` directory and is not wired to this Cloudflare Worker build; choose/configure a matching Netlify adapter before deploying to Netlify. Do not enable live payment claims until provider APIs, server-side validation, authentication/authorization, webhook idempotency, and outcome reconciliation are implemented.

## Upload to an existing GitHub repository

Extract `corridorx-aftertrace.zip` into a temporary folder. Open that extracted project folder and select all of its contents, including hidden files such as `.gitignore`, then copy those contents into the root of your existing repository checkout. Do not copy the enclosing extracted folder into the repository; `package.json` should sit at the repository root. Keep your existing `.git` directory and any repository-specific configuration. Review changes, then run:

```sh
git status
git add .
git commit -m "Add Aftertrace route memory"
git push
```
