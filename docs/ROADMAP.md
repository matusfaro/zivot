# Roadmap / open ideas

Last updated: 2026-08 (after the full review, remediation, and citation-research passes —
see git history for what was completed).

## Model quality

- **CVD/stroke overlap**: the CVD model's baseline (ASCVD events per the Pooled Cohort
  Equations lineage) includes stroke events, and a separate stroke model also contributes to
  the overall aggregate — partial double-counting. Fix: either subtract stroke from the CVD
  baseline or merge the two into one ASCVD model with a stroke sub-split.
- **Case-fatality provenance**: the stroke, dementia, and CKD `caseFatality10yr` values are
  all-cause mortality among the diagnosed (they include background mortality), and the CVD
  figure is a documented derivation from 1-year mortality plus long-term excess. Better
  cause-specific attributable fractions would sharpen the disease-contribution weights
  (the life-table anchor already keeps the overall total calibrated).
- **COPD dyspnea grades**: the mMRC association is verified (Nishimura 2002, Chest), but the
  grade-specific HRs (1.4/2.0/3.2/4.8) are interpolations pending full-text verification.

## New factors with meta-analysis-grade evidence, awaiting clean wiring

- **ApoB → CVD** (RRR 1.43 per SD, Sniderman 2011, doi:10.1161/CIRCOUTCOMES.110.959247):
  needs a verified per-unit (g/L) scaling before it can be mapped; the profile field
  `labTests.lipidPanel.apolipoproteinB` already exists.
- **Grip strength → all-cause mortality** (HR 1.16 per 5-kg decrease, Wu 2017,
  doi:10.1016/j.jamda.2017.03.011): needs sex-specific reference values (male/female grip
  distributions differ ~16 kg) — either two modifiers gated by `applicability.sex` or engine
  support for sex-dependent mappings; also needs a new profile field + UI + e2e.
- **Vigorous physical activity** (HR 0.78 at 180 min/wk, PeerJ 2025 meta): when matched for
  total volume, vigorous is not superior to moderate (HR 0.95, ns), so it must be modeled as
  an alternative pathway to the existing moderate-activity factor, not an extra multiplier —
  otherwise it double-counts. `lifestyle.exercise.vigorousMinutesPerWeek` is already typed.

## Code quality

- **Typed rewrite of legacy UI**: the split survey/editor modules still carry `@ts-nocheck`
  and account for ~189 `no-explicit-any` lint warnings. A typed rewrite of
  `surveyQuestions.ts` and the profile-section components would let the warnings go to zero
  and `@ts-nocheck` be removed.
- **E2E style**: many specs still pair fixed `waitForTimeout(1000)` sleeps with the
  now-polling `getIndexedDBValue`; harmless but slower than migrating assertions to
  `waitForProfilePersistence`.

## Unused data domains

- **Screening & interventions**: the `screenings` and `interventions` profile domains are
  typed (and the survey writes screening answers) but no model consumes them. Screening
  history could modulate cancer risk (e.g., colonoscopy → colorectal risk reduction,
  doi:10.1056/NEJMoa1100370 territory) — each needs disease-specific evidence.
- Other typed-but-unused fields worth wiring with evidence: sleep quality score, dietary
  pattern (Mediterranean/DASH), waist-to-hip ratio as a BMI alternative, hearing loss →
  dementia (partially present), marital status beyond the living-alone flag.
