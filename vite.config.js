import { defineConfig } from 'vite';

// GitHub Pages serves the site at https://<user>.github.io/<repo>/
// We detect the repo subpath from the CI env at build time so the same
// config works for a custom domain (base = '/') and a project page.
const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1] || '';
const base = process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : '/';

export default defineConfig({
  root: '.',
  base,
  server: { port: 5173, open: false },
  build: { outDir: 'dist', sourcemap: false },
});
