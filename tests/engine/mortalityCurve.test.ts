import { describe, it, expect } from 'vitest';
import {
  generateMortalityCurve,
  getBaselineAnnualMortality,
} from '../../src/engine/utils/mortalityCurve';

describe('generateMortalityCurve', () => {
  it('passes exactly through the validated 10-year risk point', () => {
    for (const [age, risk, sex] of [
      [40, 0.05, 'male'],
      [50, 0.1, 'female'],
      [65, 0.25, 'male'],
    ] as const) {
      const data = generateMortalityCurve(age, risk, sex);
      const tenYearPoint = data.find(d => d.age === age + 10);
      expect(tenYearPoint, `age ${age}`).toBeDefined();
      expect(tenYearPoint!.validatedRisk!, `age ${age}`).toBeCloseTo(risk * 100, 3);
    }
  });

  it('starts at zero risk at the current age', () => {
    const data = generateMortalityCurve(45, 0.08, 'male');
    expect(data[0].age).toBe(45);
    expect(data[0].validatedRisk).toBe(0);
    expect(data[0].averageRisk).toBe(0);
  });

  it('is monotonically non-decreasing', () => {
    const data = generateMortalityCurve(40, 0.06, 'female');
    let prevPersonal = -1;
    let prevAverage = -1;
    for (const point of data) {
      const personal = point.validatedRisk ?? point.extrapolatedRisk ?? 0;
      expect(personal).toBeGreaterThanOrEqual(prevPersonal);
      expect(point.averageRisk).toBeGreaterThanOrEqual(prevAverage);
      prevPersonal = personal;
      prevAverage = point.averageRisk;
    }
  });

  it('personal curve stays above average when risk multiplier > 1', () => {
    const age = 50;
    // Average 10-year risk for a 50-year-old male is well under 10%
    const data = generateMortalityCurve(age, 0.3, 'male');
    for (const point of data.slice(1)) {
      const personal = point.validatedRisk ?? point.extrapolatedRisk ?? 0;
      expect(personal).toBeGreaterThan(point.averageRisk);
    }
  });
});

describe('getBaselineAnnualMortality', () => {
  it('increases with age (Gompertz)', () => {
    expect(getBaselineAnnualMortality(50, 'male')).toBeGreaterThan(
      getBaselineAnnualMortality(40, 'male')
    );
    expect(getBaselineAnnualMortality(80, 'male')).toBeGreaterThan(
      getBaselineAnnualMortality(60, 'male')
    );
  });

  it('is lower for females than males at the same age', () => {
    for (const age of [40, 55, 70]) {
      expect(getBaselineAnnualMortality(age, 'female')).toBeLessThan(
        getBaselineAnnualMortality(age, 'male')
      );
    }
  });

  it('interpolates between table ages', () => {
    const at45 = getBaselineAnnualMortality(45, 'male');
    const at50 = getBaselineAnnualMortality(50, 'male');
    const at47 = getBaselineAnnualMortality(47, 'male');
    expect(at47).toBeGreaterThan(at45);
    expect(at47).toBeLessThan(at50);
  });
});
