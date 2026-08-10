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

> Reality check (2026-08 audit): ~80 of 162 existing risk factors are missing citations, mostly in
> the 15 disease files added after the original four (cvd, colorectal, lung, diabetes — plus
> melanoma and suicide are conformant). New work must meet the standard above; backfilling the
> non-conformant files is an open task. There is no runtime/build-time schema validation of the
> JSONs beyond `validateDiseaseModel()` in `src/knowledge/index.ts`.

---

## Commands

```bash
npm run dev            # Vite dev server (default http://localhost:5173)
npm run build          # tsc -b && vite build   (only gate that CI runs)
npm run lint           # eslint .               (currently reports ~257 errors — see Known Issues)
npm test               # vitest in WATCH mode — use `npx vitest run` for one-shot
npm run test:e2e       # Playwright (starts its own dev server with VITE_E2E_TEST_MODE=true)
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:debug # Playwright headed/debug
```

CI (`.github/workflows/deploy.yml`) runs **build only** — no lint, no tests — then deploys `dist/`
to GitHub Pages. Base path: `process.env.NODE_ENV === 'production' ? '/zivot/' : '/'` in
`vite.config.ts`; `App.tsx` pairs it with `<Router basename={import.meta.env.BASE_URL}>`.

---

## Methodology (summary)

Full write-up: `docs/mortality-calculation-methodology.md`.

1. **Per-disease risk** — hazard-ratio multiplication:
   `Adjusted Risk = Baseline Risk(age, sex, ethnicity) × ∏ HRᵢ`
   Baseline comes from the best-scoring `ageRiskMapping` curve (linear interpolation between age
   points). Each applicable risk factor contributes one HR via a mapping strategy:
   - `linear` / `log_linear`: `HR = exp(β·x)` / `HR = exp(β·ln x)`
   - `categorical`: lookup table by category value
   - `lookup` / `spline`: interpolation between `{value, hazardRatio}` points
   - `derived`: computed inputs (BMI, pack-years, family history…) special-cased in
     `FactorAdjuster.extractFactorValue()`
   Values are clamped to `validRange` before mapping.
2. **Mortality modifiers** — 6 cross-cutting lifestyle modifiers (dog ownership, volunteering,
   religious attendance, social connections, nature exposure, creative hobbies) are applied to
   every disease's baseline in `BaseCalculator.calculate()` before risk factors.
3. **Overall mortality** — complement rule across diseases:
   `P(death) = 1 − ∏(1 − riskᵢ)`, capped at 99.9% (`OverallMortalityAggregator`).
4. **Lifetime projection** — `src/engine/utils/mortalityCurve.ts` scales CDC life-table annual
   rates by the personal/baseline risk ratio, calibrates through the 10-year point, and
   accumulates year-by-year for the chart.
5. **Confidence/uncertainty** — `UncertaintyCalculator` scores data completeness per disease;
   `OverallMortalityAggregator` combines them into an overall confidence level.
6. **Provenance** — `ProvenanceBuilder`/`ReferenceExtractor` attach a step-by-step audit trail
   (baseline selection, each HR, final multiplication) plus citations to every result.

---

## Architecture

```
src/
├── App.tsx                     # Single route "/" → LiveDashboard (catch-all redirects to /)
├── components/
│   ├── dashboard/              # LiveDashboard (root page), CompactProfileEditor (~2,900 lines,
│   │                           #   all profile inputs), ChartsSection, DetailsSection, Header via layout/
│   ├── survey/SwipeSurvey.tsx  # Swipe-card onboarding survey (~3,400 lines)
│   ├── habits/                 # HabitsDashboard, HabitCalendar, CompactEventLogger
│   ├── registry/               # RelationshipGraphView (cytoscape + dagre) + controls/legend
│   ├── results/                # MortalityRiskChart, RiskReportCard, RecommendationsPanel deps
│   ├── debug/DebugPanel.tsx    # Hidden panel (double-click header logo)
│   └── common/                 # Tooltip, CitationPopover, ProvenanceTooltip, …
├── engine/
│   ├── RiskEngine.ts           # Orchestrator: init calculators, run all diseases, aggregate
│   ├── calculators/            # BaseCalculator (ALL real logic) + 21 per-disease subclasses
│   │                           #   (empty shells — none override anything)
│   ├── adjusters/FactorAdjuster.ts      # HR mapping strategies + profile value extraction
│   ├── modifiers/ModifierAdjuster.ts    # Mortality-modifier applicability + HR
│   ├── aggregators/            # OverallMortalityAggregator, UncertaintyCalculator
│   ├── provenance/             # ProvenanceBuilder, ReferenceExtractor
│   ├── recommendations/RecommendationEngine.ts
│   └── utils/mortalityCurve.ts # Lifetime curve generation (CDC life-table data inside)
├── knowledge/
│   ├── diseases/*.json         # 21 disease models (19 registered — see Known Issues)
│   ├── modifiers/**/*.json     # 6 mortality modifiers
│   └── index.ts                # loadDiseaseKB() — EXPLICIT registration list + validation
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
└── utils/dataExtraction.ts     # getValueAtPath, BMI, pack-years, hasCondition, …

tests/                          # Vitest unit tests (RiskEngine, ProvenanceBuilder,
                                #   DiseaseModels, ProfileRepository) — NOT under src/
e2e/                            # Playwright specs per profile section + helpers/ + fixtures/
docs/                           # mortality-calculation-methodology.md (+ legacy AI summaries)
```

### Key design decisions

- **Knowledge-driven**: all epidemiology lives in JSON under `src/knowledge/`; the engine is
  generic. The per-disease calculator classes exist but contain no logic — `BaseCalculator` +
  `FactorAdjuster` do everything.
- **Explicit registration**: a disease JSON does nothing until it is imported and registered in
  `src/knowledge/index.ts` (`loadDiseaseKB`, `getDiseaseModel`, `getAvailableDiseaseIds`) and
  instantiated in `RiskEngine.initialize()`. There is no auto-discovery.
- **Local-first persistence**: profile edits flow LiveDashboard → debounce → per-section
  `updateXxx()` on `useUserProfile` → `ProfileRepository` (read-merge-write of one profile blob).
- **Habit events**: logged events are extrapolated to rolling averages (`EventExtrapolator`) and
  merged into the profile (`ProfileMerger`) with `estimated` provenance, mapped via
  `config/eventRegistry.ts`.

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
   they are the most conformant). Citations are mandatory (see CRITICAL section).
2. **Register it** in `src/knowledge/index.ts`: import the JSON and add it to `loadDiseaseKB()`,
   `getDiseaseModel()`, and `getAvailableDiseaseIds()`. Skipping this step silently disables the
   disease (this is exactly what happened to `suicide.json` and `melanoma.json`).
3. **Create a calculator** `src/engine/calculators/<Disease>Calculator.ts` extending
   `BaseCalculator` (a 3-line shell is the norm), and register it in `RiskEngine.initialize()`.
4. **Add the display name** in the disease-name maps used by the dashboard components (grep for
   `cvd_10year:` to find them).
5. **Add tests** in `tests/engine/` (unit) and update `tests/knowledge/DiseaseModels.test.ts`
   (it asserts the exact KB size).

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

## Known issues / gotchas (2026-08 audit — verify before relying on these)

- `npm test` currently fails: vitest's default include also collects `e2e/*.spec.ts` (Playwright)
  because `vite.config.ts` sets no `test.include`/e2e exclude; plus one real failure in
  `tests/engine/RiskEngine.test.ts` (confidence scoring: `UncertaintyCalculator.hasFactorData`
  doesn't understand derived factors, so complete profiles still score `very_low`).
- `suicide_10year` and `melanoma_10year` have complete JSONs and calculators but are **not
  registered** in `src/knowledge/index.ts` — silently excluded from overall mortality.
- Baseline-curve selection does not reject sex-mismatched curves (`BaseCalculator`
  `findApplicableCurveWithScoring`) — males currently receive breast-cancer risk and females
  prostate-cancer risk.
- `adjustedRisk` is not capped at 1.0; extreme profiles can produce risks > 100% and negative
  survival products in `OverallMortalityAggregator`.
- Disease models mix **incidence** (diabetes, CVD events, prostate) and **mortality** outcomes but
  are aggregated as if all were mortality — overall numbers run ~3–5× above life-table values.
- Several modifiers (dog ownership, volunteering, religious attendance…) also exist as CVD risk
  factors → double-counted protection.
- Two `RiskEngine` instances exist (LiveDashboard + useRiskCalculation, re-created per profile
  change) and `useHabitEvents` holds an independent `useUserProfile()` copy, so habit-driven
  profile updates don't propagate live.
- ~17 component files are orphaned (ProfileWizard + its 5 forms, RiskDashboard,
  MortalityRiskChart_Stacked, ProfileSectionComponents, registry/nodes/* …); `reactflow` is a
  dead dependency (live graph is cytoscape + dagre). `SwipeSurvey.tsx.bak1–4` are committed.
- Lint is far from clean (~257 errors incl. real `rules-of-hooks` violations); CI gates nothing
  but the build.
- Root-level `*_SUMMARY.md` / `PHASE_*.md` files are untracked AI-session artifacts, not
  documentation of record.
