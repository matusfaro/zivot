# Zivot — Mortality Risk Calculator

A client-only web app that estimates personalized 10-year disease-specific and overall mortality
risk from evidence-based epidemiological models. All data stays in the browser (IndexedDB); there
is no backend.

**Stack:** React 19 + TypeScript + Vite 7 · Dexie (IndexedDB) · Recharts (charts) ·
Cytoscape + dagre (relationship graph) · Vitest (unit tests) · Playwright (E2E).
Deployed to GitHub Pages at base path `/zivot/` via `.github/workflows/deploy.yml` (push to `master`).

---

## CRITICAL: Never Kill Running Servers

**NEVER kill or stop any running processes/servers unless you explicitly started them yourself in
the current session.**

- DO NOT use `pkill`, `kill`, `killall`, or similar commands on processes you did not start
- DO NOT stop dev servers, databases, or any other services that were already running
- If you need to restart something, ask the user first

**This is non-negotiable. Breaking running services disrupts the user's workflow.**

---

## CRITICAL: Evidence-Based References Required

**Every calculation, probability, hazard ratio, baseline risk, and decision MUST be backed by
scientific evidence with proper citations.**

1. **Disease models** must include ≥2 high-quality sources in `metadata.sources`, each with a DOI
   or URL and an `evidenceLevel` (`meta_analysis | rct | cohort | case_control | expert_opinion`).
2. **Risk factors** must each carry `citation` + `doi`/`url` + `evidenceLevel` for the specific
   study establishing the association and the quantitative hazard ratio.
3. **Baseline risk curves** must cite the population study (`source` + `doi`/`url`).
4. **Hazard ratios** should include confidence intervals where available; prefer meta-analyses or
   pooled estimates over single studies.
5. **Formulas/algorithms** must reference the methodology paper and any validation studies.

**Never:** use placeholder values without citations, estimate hazard ratios without evidence, copy
values between diseases without disease-specific evidence, or implement calculations without
methodological references.

> Status (2026-08): 67 legacy risk factors still lack citations — backfilling them is an open
> task. `tests/knowledge/KBValidation.test.ts` enforces structural invariants (registered ids,
> curve sources, known mapping strategies, plausible hazard ratios) and ratchets the uncited
> count downward: the number may only shrink. New factors MUST be cited or the ratchet fails.

---

## Commands

```bash
npm run dev            # Vite dev server (default http://localhost:5173)
npm run build          # tsc -b && vite build
npm run lint           # eslint . — 0 errors expected (legacy `any`s remain as warnings)
npm test               # vitest run (one-shot); npm run test:watch for watch mode
npm run test:e2e       # Playwright (starts its own dev server with VITE_E2E_TEST_MODE=true)
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:debug # Playwright headed/debug
```

CI: `.github/workflows/deploy.yml` runs lint + unit tests + build on push to `master`, then
deploys `dist/` to GitHub Pages; `ci.yml` runs the same checks on PRs and non-master pushes.
Base path: `process.env.NODE_ENV === 'production' ? '/zivot/' : '/'` in `vite.config.ts`;
`App.tsx` pairs it with `<Router basename={import.meta.env.BASE_URL}>`.

---

## Methodology (summary)

Full write-up: `docs/mortality-calculation-methodology.md`.

1. **Per-disease risk** — hazard-ratio multiplication:
   `Adjusted Risk = min(Baseline Risk(age, sex, ethnicity) × ∏ HRᵢ, 0.999)`
   Baseline comes from the best-scoring `ageRiskMapping` curve (linear interpolation between age
   points). Curves whose sex constraint contradicts the profile are **excluded**; if no
   sex-compatible curve exists (e.g., breast cancer for a male profile) the disease is skipped
   (`calculate()` returns null). Each applicable risk factor contributes one HR via a strategy:
   - `linear` / `log_linear`: `HR = exp(β·x)` / `HR = exp(β·ln x)`
   - `categorical`: lookup table by category value (arrays supported)
   - `lookup` / `spline`: interpolation between `{value, hazardRatio}` points
   - `derived`: computed inputs (BMI, pack-years, family history…) special-cased in
     `FactorAdjuster.extractFactorValue()`; strategies `has_condition` and `bmi_lookup`
   Values are clamped to `validRange` before mapping. Unknown strategies are rejected by
   `tests/knowledge/KBValidation.test.ts` (they would silently evaluate to HR 1.0).
2. **Overall mortality** — complement rule + life-table anchoring
   (`OverallMortalityAggregator`): the disease models mix incidence and mortality outcomes, so
   their raw complement-rule sum overstates all-cause death. The models are used to compute the
   RELATIVE hazard vs. the population baseline, which is applied to CDC life-table 10-year
   mortality for the person's age/sex: `H_final = H_lifetable × (H_personal / H_baseline)`,
   `risk = 1 − exp(−H_final)`, capped at 99.9%. A baseline-only profile reproduces life-table
   mortality exactly.
3. **Mortality modifiers** — 6 cross-cutting all-cause modifiers (dog ownership, volunteering,
   religious attendance, social connections, nature exposure, creative hobbies) are applied
   ONCE at the overall level on the hazard scale (`risk = 1 − (1 − risk)^HR`), not per disease.
   Do not also add them as disease risk factors — that double-counts. Caveat (documented in
   provenance): the six are correlated lifestyle measures; multiplying them treats them as
   independent and likely overstates their combined effect.
4. **Factor attribution** — leave-one-out: `contribution = adjusted × (1 − 1/HRᵢ)`, i.e. the
   absolute risk change vs. the same profile without that factor. Drives top levers and
   recommendation impact numbers.
5. **Lifetime projection** — `src/engine/utils/mortalityCurve.ts` scales CDC life-table annual
   rates by the personal/average hazard ratio, iteratively calibrated so the curve passes through
   the validated 10-year point exactly (both windows cover ages a..a+9).
6. **Confidence/uncertainty** — `UncertaintyCalculator` scores data completeness per disease
   (a factor counts as available when the FactorAdjuster produced an HR for it, which includes
   derived factors); the aggregator combines them contribution-weighted and normalized.
7. **Provenance** — `ProvenanceBuilder`/`ReferenceExtractor` attach a step-by-step audit trail
   (baseline selection, each HR, multiplication, life-table calibration, modifier step) plus
   citations to every result.

---

## Architecture

```
src/
├── App.tsx                     # Single route "/" → LiveDashboard (catch-all redirects to /)
├── components/
│   ├── dashboard/              # LiveDashboard (root page, owns the profile + provides context),
│   │                           #   CompactProfileEditor (~2,900 lines, all inputs), ChartsSection
│   ├── survey/SwipeSurvey.tsx  # Swipe-card onboarding survey (~3,400 lines, lazy-loaded)
│   ├── habits/                 # HabitsDashboard (lazy), HabitCalendar, CompactEventLogger
│   ├── registry/               # RelationshipGraphView (cytoscape + dagre, lazy) + controls/legend
│   ├── results/                # MortalityRiskChart, RiskReportCard
│   ├── debug/DebugPanel.tsx    # Hidden panel (double-click header logo, lazy)
│   ├── layout/Header.tsx
│   └── common/                 # Tooltip, CitationPopover, ProvenanceTooltip, …
├── contexts/UserProfileContext.tsx  # Single profile source of truth (provided by LiveDashboard)
├── engine/
│   ├── RiskEngine.ts           # Orchestrator + getSharedRiskEngine() singleton
│   ├── calculators/BaseCalculator.ts    # The ONLY calculator — fully data-driven from JSON
│   ├── adjusters/FactorAdjuster.ts      # HR mapping strategies + profile value extraction
│   ├── modifiers/ModifierAdjuster.ts    # Mortality-modifier applicability + HR
│   ├── aggregators/            # OverallMortalityAggregator (life-table anchoring, modifiers),
│   │                           #   UncertaintyCalculator
│   ├── provenance/             # ProvenanceBuilder, ReferenceExtractor
│   ├── recommendations/RecommendationEngine.ts
│   └── utils/mortalityCurve.ts # Lifetime curve + CDC life-table rates (also used for anchoring)
├── knowledge/
│   ├── diseases/*.json         # 21 disease models — AUTO-DISCOVERED via import.meta.glob,
│   │                           #   registered by metadata.id (duplicates/missing ids throw)
│   ├── modifiers/**/*.json     # 6 mortality modifiers (same auto-discovery)
│   └── index.ts                # loadDiseaseKB() / getDiseaseModel() + validateDiseaseModel()
├── database/
│   ├── db.ts                   # Dexie "ZivotDB" v2: profiles, riskCalculations, habitEvents, habitTracking
│   └── repositories/           # ProfileRepository, HabitEventRepository, RiskResultRepository
├── hooks/                      # useUserProfile, useRiskCalculation, useHabitEvents,
│                               #   useDebounce/useDebounceProp (E2E mode → 0ms)
├── services/events/            # EventExtrapolator (rolling aggregates), ProfileMerger
├── config/eventRegistry.ts     # Habit event types → profile-path mappings
├── registry/                   # fieldRegistry + RelationshipGraphBuilder (graph data)
├── types/
│   ├── user/                   # UserProfile: demographics, biometrics, labTests, lifestyle,
│   │                           #   medicalHistory, social, interventions
│   ├── knowledge/              # DiseaseModel, RiskFactorDescriptor, MortalityModifier, …
│   ├── risk/                   # Calculation results + provenance types
│   └── common/datapoint.ts     # DataPoint<T> and TimeSeries<T>
└── utils/dataExtraction.ts     # getValueAtPath, extractPathValue (shared path resolver),
                                #   BMI, pack-years, hasCondition, …

tests/                          # Vitest unit tests (engine, aggregator, FactorAdjuster,
                                #   mortalityCurve, KB validation, repositories) — NOT under src/
e2e/                            # Playwright specs per profile section + helpers/ + fixtures/
docs/                           # mortality-calculation-methodology.md
```

### Key design decisions

- **Knowledge-driven**: all epidemiology lives in JSON under `src/knowledge/`; the engine is
  generic (`BaseCalculator` + `FactorAdjuster` do everything). There are NO per-disease
  calculator classes.
- **Auto-discovery**: every `*.json` in `knowledge/diseases/` (and `knowledge/modifiers/`) is
  registered automatically under its `metadata.id`. Dropping a new model file in is sufficient;
  a missing or duplicate id throws at load.
- **One engine, one profile**: use `getSharedRiskEngine()` (never `new RiskEngine()` in UI code)
  and `useUserProfileContext()` (never a second `useUserProfile()` — per-instance state means a
  second copy silently diverges).
- **Local-first persistence**: profile edits flow LiveDashboard → debounce → per-section
  `updateXxx()` on `useUserProfile` → `ProfileRepository` (read-merge-write of one profile blob;
  sections are saved sequentially on purpose — parallel saves overwrite each other).
- **Habit events**: logged events are extrapolated to rolling averages (`EventExtrapolator`) and
  merged into the profile (`ProfileMerger`) with `estimated` provenance, mapped via
  `config/eventRegistry.ts`; updates propagate live through the shared profile context.

### Data structures: TimeSeries vs DataPoint

- **TimeSeries** (`{ dataPoints: [], mostRecent: DataPoint }`) — values that change over time
  (weight, BP, exercise minutes). Disease-model path: `…field.mostRecent.value`.
- **DataPoint** (`{ value, provenance }`) — stable values (height, sex, smoking status).
  Disease-model path: `…field.value`.
- **Arrays** — conditions, family history; accessed via helpers (`hasCondition`,
  `hasFamilyHistory`) as `derived` factors.

Path convention matters: `FactorAdjuster.getValueFromPath()` branches on whether the path contains
`mostRecent`. A wrong nesting depth fails **silently** (factor never fires). When adding paths,
verify against the actual type in `src/types/user/`.

---

## How to add a new disease

1. **Create the model** `src/knowledge/diseases/<disease>.json` following the schema in
   `src/types/knowledge/disease.ts` (use `cvd.json` or `type2-diabetes.json` as the reference —
   they are the most conformant). Citations are mandatory (see CRITICAL section). Rules the
   validation tests enforce:
   - `metadata.id` must be unique (registration is automatic from the file).
   - Baseline curves must carry `source`; provide curves for BOTH sexes unless the disease is
     sex-specific (sex-mismatched profiles skip the disease entirely).
   - Do NOT add age or sex as risk factors when the baseline curves already stratify by them
     (that double-counts), and do NOT duplicate a global mortality modifier as a disease factor.
   - Only implemented mapping strategies: `linear`, `log_linear`, `lookup`, `spline`,
     `has_condition`, `bmi_lookup`. Anything else fails KBValidation.
2. **Add the display name** in the disease-name maps used by the dashboard components (grep for
   `cvd_10year:` to find them).
3. **Update tests**: `tests/knowledge/DiseaseModels.test.ts` asserts the exact KB size (21);
   add engine assertions in `tests/engine/` as appropriate. `KBValidation.test.ts` runs
   automatically over the new model.

## How to add a new user input

1. **Type** — add the field to the right interface in `src/types/user/` (TimeSeries vs DataPoint
   per the decision tree above).
2. **UI** — add the input in `src/components/dashboard/CompactProfileEditor.tsx` with a
   `data-testid="profile-<section>-<field>"`. Plain `DataPoint` fields work through the generic
   `updateField()`/`getFieldValue()` handlers; TimeSeries fields need explicit cases in both.
3. **Wire it to risk** — reference the path from a disease model's `requiredFields[].path` +
   `mapping` (with citations), or from a modifier JSON.
4. **Survey (optional)** — add a question in `src/components/survey/SwipeSurvey.tsx`; the `path`
   field auto-maps answers to the profile.
5. **E2E test (required)** — add to the matching spec in `e2e/` (`lifestyle.spec.ts` etc.):
   set the value, assert the IndexedDB shape (`getIndexedDBValue`), assert risk recalculation
   (`waitForRiskCalculation`). Prefer `waitForProfilePersistence` over `page.waitForTimeout`.
6. **Verify manually** — `npm run dev`, check `[PERSISTENCE]` console logs and
   DevTools → Application → IndexedDB → ZivotDB.

---

## Testing

- **Unit (Vitest)**: `tests/**` — run one-shot with `npx vitest run`, or
  `npx vitest run tests/engine/RiskEngine.test.ts` for one file. Environment: happy-dom +
  fake-indexeddb (`tests/setup.ts`). There are **no** tests under `src/`.
- **E2E (Playwright)**: `e2e/*.spec.ts`, one file per profile section. The config starts a dev
  server with `VITE_E2E_TEST_MODE=true`, which zeroes the debounce delays
  (`useDebounce`/`useDebounceProp`). Fixtures clear IndexedDB per test. Helpers live in
  `e2e/helpers/test-helpers.ts` (`setInputValue`, `setSelectValue`, `getIndexedDBValue`,
  `waitForRiskCalculation`, …).

---

## Roadmap

Open ideas and known model caveats live in [`docs/ROADMAP.md`](docs/ROADMAP.md) — check it
before starting model or refactoring work so effort isn't duplicated or double-counted risk
introduced (several ideas there are blocked on specific evidence gaps documented in place).
