# Unison Community Dashboard

Live member dashboard for the Unison Community Discord server. Members are
stored in Supabase and can be added, edited, or removed anytime from the
in-app **Manage** panel — no need to touch `members.json` after the initial
import.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

`members.json` is kept only as the original import source. The live source of
truth is the Supabase database; the app reads and writes through the anon key
(protected by row-level security policies).

## Deploy to GitHub Pages

The included workflow (`.github/workflows/deploy.yml`) builds and publishes
automatically on every push to `main`/`master`.

One-time repo setup:

1. Push the project to a GitHub repository.
2. In **Settings → Pages → Build and deployment → Source**, select
   **GitHub Actions**.
3. Push to `main` (or `master`). The workflow builds with the correct
   subpath base and deploys to:
   `https://<your-username>.github.io/<your-repo>/`

The Vite `base` is derived from `GITHUB_REPOSITORY` at build time, so it works
for any repo name and also for a custom domain (where `base` resolves to `/`).

## Project layout

```
index.html              App shell + SPA redirect shim
src/main.js             App logic, Supabase reads/writes, admin UI
src/supabaseClient.js   Supabase client singleton
style.css               Design system + animations
public/404.html         GitHub Pages SPA fallback
vite.config.js          Base-path-aware Vite config
.github/workflows/      Auto-deploy to Pages
.env.production         Public Supabase URL + anon key (RLS-protected, safe to commit)
```
