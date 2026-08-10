# Zivot — Personal Mortality Risk Calculator

A client-only web app that estimates personalized 10-year disease-specific and overall
mortality risk from evidence-based epidemiological models. All data stays in your
browser (IndexedDB) — there is no backend and nothing leaves your machine.

**Live:** https://matusfaro.github.io/zivot/

## What it does

- Models 21 diseases (CVD, stroke, 9 cancers, diabetes, COPD, CKD, liver disease,
  dementia, falls, crashes, overdose, flu/pneumonia, suicide) as JSON knowledge files
  with cited baseline risk curves and hazard ratios.
- Multiplies age/sex/ethnicity baseline risk by hazard ratios for your risk factors,
  aggregates across diseases with the complement rule, and anchors the overall number
  to CDC life-table mortality via relative-hazard scaling.
- Applies all-cause mortality modifiers (social connections, volunteering, nature
  exposure, …) once at the overall level.
- Shows a lifetime risk projection, per-factor attribution, personalized
  recommendations, a habit tracker that feeds back into the profile, and a full
  provenance trail (every number links to its source study).

Methodology details: [`docs/mortality-calculation-methodology.md`](docs/mortality-calculation-methodology.md).
Contributor guide (architecture, how to add diseases/inputs): [`CLAUDE.md`](CLAUDE.md).

> **Not medical advice.** This is an educational tool built on population-level
> epidemiology; it cannot diagnose or predict individual outcomes.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (vitest)
npm run test:e2e   # end-to-end tests (Playwright)
npm run lint       # eslint
npm run build      # type-check + production build
```

Stack: React 19, TypeScript, Vite, Dexie (IndexedDB), Recharts, Cytoscape + dagre.
Deployed to GitHub Pages by `.github/workflows/deploy.yml` on push to `master`.
