# Deployment

## GitHub Pages

This repository is a static frontend. No credentials, backend services, or environment variables are required.

1. Keep the default branch named `main`.
2. Open **Settings → Pages → Build and deployment** and select **GitHub Actions**.
3. Push to `main`, or run **CI and Pages** manually from the Actions tab.
4. Wait for both **Quality and production build** and **Deploy GitHub Pages** to pass.
5. Open https://robertgostmontoliu.github.io/flowboard/ and test the main flow.

The workflow builds once and uploads that verified `dist/` artifact. Only the deployment job receives `pages: write` and `id-token: write`; repository contents are read-only. Pull requests cannot run the deployment job. No personal access token is stored in the repository.

## Paths and navigation

`vite.config.ts` sets `base: '/flowboard/'`, following the [Vite GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages). Assets use the repository prefix. The app's screens are React state, not pathname routes: refresh returns to the initial screen with stored data intact. No 404-copy workaround or SPA rewrite is needed for the published URL.

For a renamed repository, change `base`, README links, and the repository website field together. For a custom domain or host root, build with:

```sh
npm ci
npm run build -- --base=/
```

Publish the contents of `dist/`. The existing `vercel.json` provides a fallback rewrite if you choose that platform; this repository targets GitHub Pages.

## Verify locally

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm audit --audit-level=high
npm run build
npm run preview
```

Open `http://localhost:4173/flowboard/`. Check the browser console, refresh, and repeat the main interaction at desktop and mobile widths. External fonts need network access.

## Release and recovery

Commit changes with a descriptive message and push normally. The workflow deploys the new build only if quality checks pass. To recover from an application regression, revert the responsible commit with `git revert` and push the resulting commit; retain remote history.

If Actions fails, inspect the first failed step before retrying. A missing Pages site usually means the repository's Pages source has not been enabled. A blank page with asset 404s usually means the configured base and repository name differ.

## Demo data

The app stores data in the visitor's browser. GitHub Pages serves static files only. Do not enter secrets or sensitive information into demo fields. Use site-data controls to restore the initial state.
