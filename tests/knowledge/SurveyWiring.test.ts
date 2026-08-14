import { describe, it, expect, beforeAll } from 'vitest';
import { RiskEngine } from '../../src/engine/RiskEngine';
import { UserProfile } from '../../src/types/user';
import { createUserDataPoint } from '../../src/types/common/datapoint';
// @ts-expect-error legacy loosely-typed module
import { generateQuestions } from '../../src/components/survey/surveyQuestions';
// @ts-expect-error legacy loosely-typed module
import { isQuestionAnswered } from '../../src/components/survey/surveyHelpers';

/**
 * Guardrail: every swipe-survey question must actually move the overall risk
 * number for at least one realistic profile — a question whose answers all
 * compute to zero misleads the user ("Yes and No both show 0%").
 *
 * A question passes if, on ANY profile in the matrix it applies to, at least
 * one answer changes overall 10-year mortality by >= MIN_IMPACT percentage
 * points. Profiles cover both sexes, older age (falls/meds/flu factors), and
 * age 55+ (the creative-hobbies modifier is age-gated to 50+ per its cohort).
 */

const MIN_IMPACT = 0.02; // percentage points

function profileOf(dob: string, sex: 'male' | 'female', ethnicity?: string): UserProfile {
  const p: UserProfile = {
    profileId: 'survey-test',
    version: '1',
    lastUpdated: Date.now(),
    demographics: {
      dateOfBirth: createUserDataPoint(dob),
      biologicalSex: createUserDataPoint(sex),
    },
  };
  if (ethnicity) {
    p.demographics!.ethnicity = createUserDataPoint(ethnicity as never);
  }
  return p;
}

const PROFILES: Record<string, UserProfile> = {
  male46: profileOf('1980-06-01', 'male'),
  female46: profileOf('1980-06-01', 'female'),
  male72: profileOf('1954-06-01', 'male'),
  male57white: profileOf('1969-06-01', 'male', 'white'),
  female57white: profileOf('1969-06-01', 'female', 'white'),
};

// Questions whose maximum honest effect is below MIN_IMPACT on every matrix
// profile, with the evidence-based reason. Additions here need justification —
// this list should shrink, not grow.
const EXPECTED_TINY: Record<string, string> = {
  sunburns:
    'melanoma is rare and 94.7% survivable (CFR 0.053); severe-sunburn HR on a tiny baseline stays under 0.02pp at all matrix ages',
  milesDriven:
    'crash mortality is ~0.5% over 10 years, so the sqrt-law mileage spread moves ~0.014pp — real but small; displays as +0.01% (2-decimal formatting)',
  drivingSetting:
    'urban 0.84 vs rural 1.3 on the same ~0.5% crash baseline moves ~0.011pp — kept as one of the few modifiable crash factors',
};

interface AuditRow {
  id: string;
  maxImpact: number;
  bestProfile: string;
  errors: string[];
}

describe('Survey question wiring', () => {
  const engine = new RiskEngine();
  const baselines = new Map<string, number>();
  const rows: AuditRow[] = [];

  beforeAll(async () => {
    await engine.initialize();
    for (const [name, profile] of Object.entries(PROFILES)) {
      const result = await engine.calculate(profile);
      baselines.set(name, result.overallMortality.estimatedRisk * 100);
    }

    for (const question of generateQuestions()) {
      const row: AuditRow = { id: question.id, maxImpact: 0, bestProfile: '', errors: [] };
      for (const [name, profile] of Object.entries(PROFILES)) {
        if (question.applicableTo && !question.applicableTo(profile)) continue;
        const clone = () => JSON.parse(JSON.stringify(profile));
        try {
          const left = question.leftOption.profileUpdate(clone());
          const right = question.rightOption.profileUpdate(clone());
          const leftRisk = (await engine.calculate(left)).overallMortality.estimatedRisk * 100;
          const rightRisk = (await engine.calculate(right)).overallMortality.estimatedRisk * 100;
          const base = baselines.get(name)!;
          const impact = Math.max(Math.abs(leftRisk - base), Math.abs(rightRisk - base));
          if (impact > row.maxImpact) {
            row.maxImpact = impact;
            row.bestProfile = name;
          }
        } catch (e) {
          row.errors.push(`${name}: ${String(e).slice(0, 120)}`);
        }
      }
      rows.push(row);
    }
  }, 240_000);

  it('no question throws when applying an answer', () => {
    const throwing = rows.filter(r => r.errors.length > 0);
    expect(
      throwing,
      throwing.map(r => `${r.id}: ${r.errors[0]}`).join('\n')
    ).toHaveLength(0);
  });

  it('every question moves overall risk on some realistic profile', () => {
    const dead = rows.filter(r => r.maxImpact < MIN_IMPACT && !(r.id in EXPECTED_TINY));
    expect(
      dead,
      'Questions whose answers never change the outcome (wire them to an evidence-backed factor or remove them):\n' +
        dead.map(r => `  ${r.id} (max ${r.maxImpact.toFixed(3)}pp)`).join('\n')
    ).toHaveLength(0);
  });

  it('EXPECTED_TINY entries are still tiny (remove stale exemptions)', () => {
    const stale = rows.filter(r => r.id in EXPECTED_TINY && r.maxImpact >= MIN_IMPACT);
    expect(
      stale,
      stale.map(r => `${r.id} now moves ${r.maxImpact.toFixed(3)}pp — drop it from EXPECTED_TINY`).join('\n')
    ).toHaveLength(0);
  });

  it('no two questions write to the same profile fields (duplicate questions)', () => {
    // pets/dog_ownership, religion/religious_attendance, hobbies/creative_hobbies
    // and nature/outdoorTime were all shipped as duplicates at some point —
    // identical writes mean identical impacts and a confusing repeat question.
    const signatures = new Map<string, string>();
    const collisions: string[] = [];
    const base = { profileId: 't', version: '1', lastUpdated: 0 };

    const leafPaths = (obj: unknown, prefix = ''): string[] => {
      if (obj === null || typeof obj !== 'object') {
        // Discriminate array entries by their identity fields so different
        // condition/screening/family-history toggles don't collide
        if (/(conditionId|screeningType)$/.test(prefix)) return [`${prefix}=${String(obj)}`];
        return [prefix];
      }
      if (Array.isArray(obj)) return obj.flatMap(v => leafPaths(v, prefix + '[]'));
      return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
        k === 'provenance' || k === 'timestamp' ? [] : leafPaths(v, prefix ? `${prefix}.${k}` : k)
      );
    };

    for (const question of generateQuestions()) {
      try {
        const updated = question.leftOption.profileUpdate(JSON.parse(JSON.stringify(base)));
        delete updated.profileId; delete updated.version; delete updated.lastUpdated;
        const signature = [...new Set(leafPaths(updated))].sort().join('|');
        if (!signature) continue;
        const existing = signatures.get(signature);
        if (existing) {
          collisions.push(`${existing} <-> ${question.id}`);
        } else {
          signatures.set(signature, question.id);
        }
      } catch {
        // covered by the no-throw test
      }
    }
    expect(collisions, 'Duplicate questions writing identical fields: ' + collisions.join(', ')).toHaveLength(0);
  });

  it('answering a question marks it as answered (no reappearing questions)', () => {
    const broken: string[] = [];
    for (const question of generateQuestions()) {
      const profile = PROFILES.female57white;
      if (question.applicableTo && !question.applicableTo(profile)) continue;
      const clone = () => JSON.parse(JSON.stringify(profile));
      let anyAnswered = false;
      for (const option of [question.leftOption, question.rightOption]) {
        try {
          const updated = option.profileUpdate(clone());
          if (isQuestionAnswered(question, updated)) anyAnswered = true;
        } catch {
          // covered by the no-throw test
        }
      }
      if (!anyAnswered) broken.push(question.id);
    }
    expect(
      broken,
      'isQuestionAnswered never returns true for: ' + broken.join(', ')
    ).toHaveLength(0);
  });
});
