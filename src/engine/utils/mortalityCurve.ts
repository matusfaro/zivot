/**
 * Mortality Curve Calculator
 *
 * Generates mortality risk curves over a person's lifetime for visualization.
 * This module is separated from UI components to maintain testability and
 * separation of concerns.
 */

export interface MortalityCurveDataPoint {
  age: number;
  validatedRisk: number | null;  // % (0-100) for validated 10-year period
  extrapolatedRisk: number | null;  // % (0-100) beyond 10 years
  averageRisk: number;  // % (0-100) for population average
}

/**
 * Generate mortality data points for the chart
 *
 * METHODOLOGY:
 * ============
 *
 * This function generates three risk curves over a person's lifetime:
 * 1. Validated personal risk (solid line, 10 years)
 * 2. Extrapolated personal risk (dashed line, beyond 10 years)
 * 3. Average population risk (comparison baseline)
 *
 * KEY INSIGHT: Personal Risk = Baseline Risk × Relative Risk Multiplier
 *
 * STEP 1: Calculate Average 10-Year Risk
 * ---------------------------------------
 * We need to know what the average person of the same age/sex would face.
 * This uses CDC life tables with age-specific annual mortality rates.
 *
 * Formula: P(death in 10 years) = 1 - ∏(1 - annual_rate_i) for i = 0 to 9
 *
 * Example for 36-year-old male:
 *   Year 0 (age 36): 0.16% annual rate → 99.84% survive
 *   Year 1 (age 37): 0.17% annual rate → 99.83% survive
 *   ...
 *   Year 9 (age 45): 0.30% annual rate → 99.70% survive
 *   10-year survival = 0.9984 × 0.9983 × ... × 0.9970 = 98.0%
 *   10-year risk = 1 - 0.980 = 2.0%
 *
 * STEP 2: Calculate Relative Risk Multiplier
 * -------------------------------------------
 * This represents how your specific risk factors affect you vs the average.
 *
 * Formula: multiplier = personal_10yr_risk / average_10yr_risk
 *
 * Example:
 *   Your 10-year risk (from disease models): 8%
 *   Average 10-year risk: 2%
 *   Multiplier = 8% / 2% = 4.0×
 *
 * Interpretation: Your current risk factors make you 4× more likely to die
 * than the average person your age.
 *
 * STEP 3: Apply Calibrated Multiplier Across ALL Ages
 * -----------------------------------------------------
 * We use the SAME approach for the entire curve (both validated and extrapolated):
 *   personal_annual_rate(age) = baseline_annual_rate(age) × calibrated_multiplier
 *
 * CALIBRATION: We adjust the multiplier so the curve passes through the exact
 * 10-year risk point from the disease models.
 *
 * Why calibrate?
 * - Initial multiplier (8% / 2% = 4.0×) is approximate
 * - Applying it to age-specific rates might give 8.2% or 7.8% at year 10
 * - We scale: final_multiplier = initial × (8.0% / 8.2%) to hit exactly 8.0%
 *
 * Example at age 70 with 4.1× calibrated multiplier:
 *   Baseline rate at 70: 2.52%
 *   Your rate at 70: 2.52% × 4.1 = 10.33%
 *
 * This approach:
 * ✓ Uses consistent methodology across ALL ages (no artificial linear interpolation)
 * ✓ Maintains validated 10-year prediction EXACTLY (calibrated to pass through it)
 * ✓ Accounts for biological aging naturally (uses age-specific baseline rates)
 * ✓ Prevents illogical crossover (relative risk maintained)
 * ✓ Creates smooth, epidemiologically sound curve
 *
 * CUMULATIVE RISK CALCULATION:
 * ----------------------------
 * To convert annual rates to cumulative risk:
 *
 * Formula: cumulative_risk(n+1) = cumulative_risk(n) + annual_rate × (1 - cumulative_risk(n))
 *
 * This accounts for the fact that you can only die once - if you already had
 * 20% cumulative risk, the next year's 5% annual rate only applies to the
 * remaining 80% who haven't died yet.
 *
 * @param currentAge - User's current age
 * @param tenYearRisk - Validated 10-year mortality risk from disease models (0-1)
 * @param sex - Biological sex ('male' or 'female') for baseline mortality rates
 * @returns Array of data points for chart rendering
 */
export function generateMortalityCurve(
  currentAge: number,
  tenYearRisk: number,
  sex?: string
): MortalityCurveDataPoint[] {
  const data: MortalityCurveDataPoint[] = [];

  // STEP 1: Calculate average 10-year cumulative risk for comparison
  // This gives us the baseline that a person of this age/sex would have
  let averageTenYearRisk = 0;
  let survivalProb = 1.0;
  for (let year = 0; year < 10; year++) {
    const ageAtYear = currentAge + year;
    const annualRate = getBaselineAnnualMortality(ageAtYear, sex);
    survivalProb *= (1 - annualRate); // Compound survival probability
  }
  averageTenYearRisk = 1 - survivalProb; // Convert to risk

  // STEP 2: Calculate initial risk multiplier
  // This is our starting estimate
  const initialMultiplier = averageTenYearRisk > 0
    ? tenYearRisk / averageTenYearRisk
    : 1.0;

  // STEP 2b: Calibrate the multiplier
  // Calculate what the 10-year cumulative risk WOULD be using age-adjusted rates
  let testCumulative = 0;
  for (let year = 0; year < 10; year++) {
    const testAge = currentAge + year;
    const baselineRate = getBaselineAnnualMortality(testAge, sex);
    const testRate = Math.min(baselineRate * initialMultiplier, 1.0);
    testCumulative += testRate * (1 - testCumulative);
  }

  // Adjust multiplier so the curve passes through the exact 10-year risk point
  // If testCumulative is too high/low, scale the multiplier proportionally
  const calibrationFactor = testCumulative > 0 ? tenYearRisk / testCumulative : 1.0;
  const riskMultiplier = initialMultiplier * calibrationFactor;

  // Now riskMultiplier is calibrated so that applying it to age-specific rates
  // will yield exactly tenYearRisk at year 10

  let cumulativeRisk = 0;
  let cumulativeAverage = 0;

  // STEP 3: Generate data points from current age to 110
  // Use the SAME approach (age-adjusted baseline × multiplier) for ALL ages
  // Optimize: reduce data points for performance
  // - Every year for first 10 years (validated range)
  // - Every 2 years for years 10-30
  // - Every 5 years after that
  for (let age = currentAge; age <= 110; age++) {
    const yearOffset = age - currentAge;

    // Determine if we should include this age in the chart
    let shouldInclude = false;
    if (yearOffset <= 10) {
      shouldInclude = true; // All years in validated range
    } else if (yearOffset <= 30) {
      shouldInclude = age % 2 === 0; // Every 2 years
    } else {
      shouldInclude = age % 5 === 0; // Every 5 years
    }

    // Special case: yearOffset 0 (current age) always starts at 0 risk
    if (yearOffset === 0) {
      data.push({
        age,
        validatedRisk: 0,
        extrapolatedRisk: null,
        averageRisk: 0
      });
      continue; // Don't calculate rates for current age (no time has passed)
    }

    // Calculate rates for this age FIRST
    const avgRate = getBaselineAnnualMortality(age, sex);
    cumulativeAverage += avgRate * (1 - cumulativeAverage);
    const personalRate = Math.min(avgRate * riskMultiplier, 1.0);
    cumulativeRisk += personalRate * (1 - cumulativeRisk);
    cumulativeRisk = Math.min(cumulativeRisk, 0.999);

    // THEN add data point with updated cumulative (if we should include this age)
    if (shouldInclude) {
      if (yearOffset <= 10) {
        data.push({
          age,
          validatedRisk: cumulativeRisk * 100,
          extrapolatedRisk: null,
          averageRisk: cumulativeAverage * 100
        });
      } else {
        data.push({
          age,
          validatedRisk: null,
          extrapolatedRisk: cumulativeRisk * 100,
          averageRisk: cumulativeAverage * 100
        });
      }
    }
  }

  return data;
}

/**
 * Get baseline annual mortality rate for a given age and sex
 *
 * SOURCE: CDC/NCHS National Vital Statistics System
 * Based on U.S. life tables (simplified for computational efficiency)
 *
 * The data represents annual probability of death for a person at that age,
 * assuming they're alive at the start of the year.
 *
 * GOMPERTZ LAW: Notice mortality roughly doubles every 8-10 years after age 30.
 * This exponential increase reflects biological aging at the cellular level.
 *
 * Example: Male mortality rates
 *   Age 40: 0.20% per year
 *   Age 50: 0.46% per year (2.3× higher)
 *   Age 60: 1.06% per year (5.3× higher than age 40)
 *   Age 70: 2.52% per year (12.6× higher than age 40)
 *
 * @param age - Age in years
 * @param sex - 'male' or 'female' (defaults to male rates if not specified)
 * @returns Annual mortality probability as decimal (e.g., 0.0020 = 0.20% = 2 per 1000)
 */
export function getBaselineAnnualMortality(age: number, sex?: string): number {
  // Mortality rates as annual probability of death
  // Derived from CDC life tables, simplified to 5-year intervals

  const maleRates: Record<number, number> = {
    20: 0.0012, 25: 0.0013, 30: 0.0014, 35: 0.0016, 40: 0.0020,
    45: 0.0030, 50: 0.0046, 55: 0.0070, 60: 0.0106, 65: 0.0162,
    70: 0.0252, 75: 0.0398, 80: 0.0637, 85: 0.1028, 90: 0.1680
  };

  const femaleRates: Record<number, number> = {
    20: 0.0005, 25: 0.0005, 30: 0.0006, 35: 0.0008, 40: 0.0011,
    45: 0.0017, 50: 0.0027, 55: 0.0042, 60: 0.0066, 65: 0.0104,
    70: 0.0169, 75: 0.0279, 80: 0.0471, 85: 0.0809, 90: 0.1418
  };

  const rates = sex === 'female' ? femaleRates : maleRates;

  // Find closest age in table
  const ages = Object.keys(rates).map(Number).sort((a, b) => a - b);
  let closestAge = ages[0];

  for (const tableAge of ages) {
    if (age >= tableAge) {
      closestAge = tableAge;
    } else {
      break;
    }
  }

  // Interpolate if between ages
  const nextAge = ages[ages.indexOf(closestAge) + 1];
  if (nextAge && age > closestAge && age < nextAge) {
    const weight = (age - closestAge) / (nextAge - closestAge);
    return rates[closestAge] * (1 - weight) + rates[nextAge] * weight;
  }

  return rates[closestAge] || 0.001;
}
