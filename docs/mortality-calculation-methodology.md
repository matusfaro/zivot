# Mortality Risk Calculation Methodology

## Overview

This document explains how the application calculates and projects mortality risk over a person's lifetime.

## Problem Statement

Clinical risk models (like Framingham CVD risk score) predict **10-year disease-specific risks**. However, users want to see:

1. **Overall mortality risk** (not just individual diseases)
2. **Lifetime projections** (not just 10 years)
3. **How they compare to average** (relative risk)

## Three-Step Calculation Process

### Step 1: Calculate Average 10-Year Risk

**Purpose:** Determine what the average person of the same age and sex would face.

**Data Source:** CDC/NCHS National Vital Statistics System life tables

**Formula:**
```
P(death in 10 years) = 1 - ∏[i=0 to 9] (1 - annual_mortality_rate[age + i])
```

**Example:** 36-year-old male
```
Year 0 (age 36): 0.0016 annual rate → 0.9984 survival probability
Year 1 (age 37): 0.0017 annual rate → 0.9983 survival probability
...
Year 9 (age 45): 0.0030 annual rate → 0.9970 survival probability

10-year survival = 0.9984 × 0.9983 × ... × 0.9970 = 0.9800
10-year mortality risk = 1 - 0.9800 = 0.0200 (2.0%)
```

### Step 2: Calculate Relative Risk Multiplier

**Purpose:** Quantify how your specific risk factors affect you compared to the average.

**Formula:**
```
Relative Risk Multiplier = Personal 10-Year Risk / Average 10-Year Risk
```

**Example:**
```
Personal 10-year risk (from disease models): 8.0%
Average 10-year risk (from life tables):     2.0%
Relative risk multiplier = 8.0% / 2.0% = 4.0×
```

**Interpretation:** Your current risk factors (high cholesterol, smoking, family history, etc.) make you **4 times more likely** to die in the next 10 years than the average person your age.

### Step 3: Apply Calibrated Multiplier Across Lifetime

**Key Innovation:** Use the same age-adjusted approach for ALL ages (not just extrapolation).

**Calibration Process:**

1. **Calculate initial multiplier:** 8% / 2% = 4.0×

2. **Test the multiplier:** Apply it to age-specific rates for years 1-10 and accumulate
   ```
   Test cumulative at year 10 = 8.2% (might not exactly match validated 8.0%)
   ```

3. **Calibrate:** Scale the multiplier to hit the exact validated risk
   ```
   Calibration factor = 8.0% / 8.2% = 0.976
   Final multiplier = 4.0 × 0.976 = 3.90×
   ```

4. **Apply to all ages:** Use calibrated multiplier with age-specific baseline rates

**Why This Is Better:**

**Old approach:**
- Years 0-10: Linear interpolation (year 5 = 50% of risk, ignoring age effects)
- Years 10+: Age-adjusted multiplier

**New approach:**
- **All years:** Age-adjusted multiplier (consistent methodology)
- **Calibrated:** Passes through exact 10-year validated risk point

**Example:** Age 70 with 3.90× calibrated multiplier
```
Baseline rate at age 70: 2.52%
Your rate at age 70: 2.52% × 3.90 = 9.83%
```

**Benefits:**
- ✓ Consistent methodology across all ages
- ✓ Natural age-related increase in validated window
- ✓ Exactly matches validated 10-year risk (calibrated)
- ✓ Smooth, epidemiologically sound curve

## Cumulative Risk Calculation

To convert annual rates to cumulative risk over time, we use the **complement rule**:

```
cumulative_risk(year N+1) = cumulative_risk(year N) + annual_rate × (1 - cumulative_risk(year N))
```

**Why Not Just Add Annual Rates?**

You can only die once. If you already have 20% cumulative risk of death, the next year's 5% annual rate only applies to the 80% of people who haven't died yet:

```
Cumulative at year N:     20%
Annual rate in year N+1:   5%
Applies to remaining:     80% (1 - 0.20)
Additional risk:           5% × 80% = 4%
New cumulative:           20% + 4% = 24%
```

## Visual Representation: Three Lines on the Chart

### 1. Validated Personal Risk (Solid Red Line, 0-10 years)

- Uses disease model predictions exactly
- Most accurate because it's based on validated clinical research
- Covers current age to current age + 10 years

### 2. Extrapolated Personal Risk (Dashed Red Line, 10+ years)

- Uses relative risk multiplier approach
- Less certain because it assumes:
  - Risk factors stay constant
  - Relative risk relationship holds
  - No major medical breakthroughs
- Dashed line indicates lower confidence

### 3. Average Population Risk (Gray Line, all ages)

- Baseline from CDC life tables
- Shows what happens to average person as they age
- Increases exponentially (Gompertz law of mortality)

## Why Personal Risk Isn't Constant

**Original flawed approach:**
- Convert 10-year risk to constant annual rate
- Apply same rate at all ages
- **Problem:** 40-year-old and 80-year-old had same annual mortality rate

**Current correct approach:**
- Calculate relative risk multiplier
- Apply to age-specific baseline rates
- **Benefit:** Risk increases with age, maintains relative relationship

**Comparison:**

| Age | Baseline Rate | Old Approach (Constant) | New Approach (4× Multiplier) |
|-----|---------------|-------------------------|------------------------------|
| 40  | 0.20%         | 0.83%                   | 0.80% (4× baseline)          |
| 50  | 0.46%         | 0.83%                   | 1.84% (4× baseline)          |
| 60  | 1.06%         | 0.83%                   | 4.24% (4× baseline)          |
| 70  | 2.52%         | 0.83%                   | 10.08% (4× baseline)         |

Notice the old approach had a **decreasing relative risk** (4× at 40 → 0.33× at 70), which is illogical.

## Epidemiological Basis

This methodology follows standard epidemiological practice:

1. **Relative Risk Models:** Most risk factors are modeled as **hazard ratios** or **relative risks** rather than absolute increases
   - Example: Smoking increases CVD risk by 2× (not by +5%)

2. **Proportional Hazards:** Cox proportional hazards models assume that risk factors multiply baseline hazard by a constant factor across age

3. **Life Table Methods:** Standard actuarial approach for projecting mortality

## Limitations and Assumptions

### Assumptions Made:
1. ✓ **Relative risk stays constant** - Your 4× multiplier doesn't change
2. ✓ **Risk factors stay constant** - You don't quit smoking or develop new conditions
3. ✓ **No medical breakthroughs** - Treatment efficacy doesn't improve
4. ✓ **Proportional hazards** - Risk factors affect all ages proportionally

### Known Limitations:
1. ⚠️ **Risk factors change:** In reality, people quit smoking, lose weight, develop diabetes, etc.
2. ⚠️ **Competing risks:** Model doesn't account for one disease preventing death from another
3. ⚠️ **Medical advances:** Doesn't predict future improvements in treatment
4. ⚠️ **Long-term uncertainty:** 50-year projections are highly speculative

### Why We Do It Anyway:
- Provides useful visualization of long-term trajectory
- Helps users understand impact of current risk factors
- Clearly labeled as "extrapolated" with lower confidence
- Better than providing no long-term perspective

## Validation

To verify calculations are correct:

### Test Case 1: Average Risk Person
```
Input:  Age 40, male, all risk factors at population average
Result: Personal 10-year risk ≈ Average 10-year risk (multiplier ≈ 1.0)
Check:  Personal and average lines should overlap
```

### Test Case 2: High Risk Person
```
Input:  Age 40, male, high cholesterol, smoker, family history
Result: Personal 10-year risk = 8%, Average = 2%, multiplier = 4.0
Check:  Personal line should stay 4× above average at all ages
```

### Test Case 3: Low Risk Person
```
Input:  Age 40, male, excellent health, optimal biomarkers
Result: Personal 10-year risk = 1%, Average = 2%, multiplier = 0.5
Check:  Personal line should stay below average at all ages
```

## References

1. **Life Tables:** CDC/NCHS National Vital Statistics System
2. **Disease Models:**
   - Framingham Heart Study (CVD)
   - American Diabetes Association Risk Score
   - SEER Cancer Statistics (NCI)
3. **Statistical Methods:**
   - Kaplan-Meier survival analysis
   - Cox proportional hazards models
   - Actuarial life table methods

## Code Implementation

See: `src/components/results/MortalityRiskChart.tsx`

Function: `generateMortalityData(currentAge, tenYearRisk, sex)`

Key calculations:
- Lines 117-124: Average 10-year risk
- Lines 129-131: Relative risk multiplier
- Lines 136-177: Data point generation with age-adjusted rates
