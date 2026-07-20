# Unison Community Dashboard

Live member dashboard for the Unison Community Discord server. Reads member
data from `members.json` — edit that file directly to update the dashboard.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Update members

Edit `public/members.json` directly. The file shape:

```json
{
  "serverName": "Unison Community",
  "exportedAt": "2026-07-18T12:38:34.385Z",
  "members": [
    {
      "id": "1506326627787739257",
      "username": "_victr.",
      "displayName": "_Victr",
      "bot": false,
      "joinedAt": "2026-06-13T10:13:12.927Z",
      "avatar": "https://cdn.discordapp.com/avatars/...",
      "roles": ["Members", "Gamers", "Techies"]
    }
  ]
}
```

After saving, push to deploy (see below). No database or backend required.

## Deploy to GitHub Pages

The included workflow (`.github/workflows/deploy.yml`) builds and publishes
automatically on every push to `main`/`master`.

1. Push the project to a GitHub repository.
2. In **Settings → Pages → Build and deployment → Source**, select
   **GitHub Actions**.
3. Push to `main`. The site goes live at
   `https://<your-username>.github.io/<your-repo>/`.

The Vite `base` is derived from `GITHUB_REPOSITORY` at build time, so it works
for any repo name and for a custom domain (where `base` resolves to `/`).

## Project layout

```
index.html              App shell + SPA redirect shim
src/main.js             App logic, renders from members.json
style.css               Design system + animations
public/members.json     Member data (edit this to update the dashboard)
public/404.html         GitHub Pages SPA fallback
vite.config.js          Base-path-aware Vite config
.github/workflows/      Auto-deploy to Pages
```
