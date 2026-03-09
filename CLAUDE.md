# Mortality Risk Calculator - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Methodology & Calculations](#methodology--calculations)
3. [Architecture](#architecture)
4. [How to Add New Diseases](#how-to-add-new-diseases)
5. [How to Add New User Inputs](#how-to-add-new-user-inputs)
6. [Data Flow](#data-flow)
7. [Testing](#testing)

---

## CRITICAL: Never Kill Running Servers

**NEVER kill or stop any running processes/servers unless you explicitly started them yourself in the current session.**

- DO NOT use `pkill`, `kill`, `killall`, or similar commands on processes you did not start
- DO NOT stop dev servers, databases, or any other services that were already running
- If you need to restart something, ask the user first
- Only kill processes that you spawned during the current conversation

**This is non-negotiable. Breaking running services disrupts the user's workflow.**

---

## CRITICAL: Evidence-Based References Required

**Every calculation, probability, hazard ratio, baseline risk, and decision in this system MUST be backed by scientific evidence with proper citations.**

### Reference Requirements

1. **Disease Models**: Every disease model JSON file MUST include:
   - Source citations in the `metadata.sources` array
   - DOI or URL for each source
   - Evidence level classification (meta_analysis, rct, cohort, case_control, expert_opinion)

2. **Risk Factors**: Each risk factor MUST include:
   - `citation` field with the specific study/source
   - `doi` or `url` for the evidence
   - `evidenceLevel` indicating the strength of evidence
   - Studies justifying the specific hazard ratios

3. **Baseline Risk Curves**: Each baseline risk curve MUST include:
   - `source` field citing the population study
   - `doi` or `url` for the epidemiological data
   - Studies justifying age/sex/ethnicity-specific risk values

4. **Hazard Ratios**: Every hazard ratio value MUST include:
   - Confidence intervals where available
   - Citation to the specific study establishing that value
   - Meta-analysis or pooled estimates preferred over single studies

5. **Calculations and Formulas**: Any mathematical formula, coefficient, or algorithm MUST:
   - Reference the methodology paper
   - Cite validation studies
   - Document any adaptations from the original source

### Forbidden Practices

**NEVER:**
- Use placeholder values without citations
- Estimate hazard ratios without evidence
- Copy values from other diseases without disease-specific evidence
- Use "expert opinion" without documenting the expert and their credentials
- Implement calculations without methodological references

### Adding New Content

When adding ANY new:
- Disease model → Must include ≥2 high-quality sources (meta-analysis or large cohort studies)
- Risk factor → Must cite the specific study establishing the association
- Hazard ratio → Must cite the study providing that quantitative estimate
- Baseline risk → Must cite population-level epidemiological data

### Reference Format

All citations must be traceable and verifiable:

```json
{
  "citation": "Full citation in standard format",
  "doi": "10.xxxx/xxxxx",
  "url": "https://...",
  "evidenceLevel": "meta_analysis|rct|cohort|case_control|expert_opinion",
  "notes": "Optional: Why this source was chosen, limitations, etc."
}
```

### Verification

Before deploying any changes:
1. ✅ Every number has a source
2. ✅ Every source is accessible (DOI/URL works)
3. ✅ Evidence quality matches the claim strength
4. ✅ Confidence intervals are included where available
5. ✅ Methodology is properly cited

**This is non-negotiable. Unsupported claims cannot be included in the system.**

---

## Overview

This is a personalized mortality risk calculator that estimates 10-year disease-specific and overall mortality risk based on evidence-based medical research. It uses a modular, knowledge-driven architecture that separates disease models from the calculation engine.

**Key Features:**
- Real-time risk calculation as users enter data
- Disease-specific risk models (CVD, colorectal cancer, lung cancer, type 2 diabetes)
- Overall mortality aggregation using complement rule
- Lifetime risk projection chart
- Modifiable risk factor identification
- Persistent local storage with IndexedDB

---

## Methodology & Calculations

### 1. Disease-Specific Risk Calculation

Each disease uses a **hazard ratio (HR) multiplication model**:

```
Adjusted Risk = Baseline Risk × ∏(HR₁ × HR₂ × ... × HRₙ)
```

Where:
- **Baseline Risk**: Population average risk for person's age/sex/race
- **HR₁, HR₂, ... HRₙ**: Hazard ratios for each applicable risk factor

#### Example: CVD Risk Calculation

For a 45-year-old male:
1. **Baseline 10-year CVD risk**: 4.2% (from population data)
2. **Risk Factors**:
   - Current smoker (20 pack-years): HR = 2.0
   - BMI = 32: HR = 1.3
   - No exercise: HR = 1.45
   - Normal blood pressure: HR = 1.0

3. **Calculation**:
   ```
   Adjusted Risk = 4.2% × (2.0 × 1.3 × 1.45 × 1.0)
                 = 4.2% × 3.77
                 = 15.8%
   ```

### 2. Hazard Ratio Mapping Strategies

Different risk factors use different mapping strategies:

#### A. Linear Mapping
For continuous variables with linear dose-response:
```
HR = exp(β × value)
```

**Example: Alcohol consumption for colorectal cancer**
- Coefficient (β): 0.02 per drink/week
- 14 drinks/week → HR = exp(0.02 × 14) = 1.32

#### B. Categorical Mapping
For discrete categories:
```
HR = lookup_table[category]
```

**Example: Smoking status for CVD**
- Never smoker: HR = 1.0
- Former smoker: HR = 1.2
- Current smoker: HR = 2.0

#### C. Lookup/Spline Mapping
For non-linear relationships with interpolation:
```
HR = interpolate_between_points(value, points)
```

**Example: BMI for colorectal cancer**
- BMI 22: HR = 1.0
- BMI 27: HR = 1.1
- BMI 32: HR = 1.25 (interpolated)

### 3. Overall Mortality Aggregation

Uses the **complement rule** (competing risks):

```
P(survive all) = P(no CVD) × P(no cancer) × P(no diabetes) × ...
P(die from any) = 1 - P(survive all)
```

#### Example:
- 10-year CVD risk: 15%
- 10-year colorectal cancer risk: 2%
- 10-year lung cancer risk: 1%
- 10-year diabetes risk: 10%

```
Survival probability = (1 - 0.15) × (1 - 0.02) × (1 - 0.01) × (1 - 0.10)
                     = 0.85 × 0.98 × 0.99 × 0.90
                     = 0.743

Overall mortality risk = 1 - 0.743 = 25.7%
```

**Note**: Capped at 99.9% maximum.

### 4. Lifetime Risk Projection

The chart extrapolates beyond the validated 10-year period using:

1. **Calculate relative risk multiplier**:
   ```
   multiplier = personal_10yr_risk / baseline_10yr_risk
   ```

2. **Apply to age-specific baseline rates**:
   ```
   personal_annual_rate(age) = baseline_annual_rate(age) × multiplier
   ```

3. **Calibrate** to ensure curve passes exactly through 10-year validated point

4. **Calculate cumulative risk** year by year:
   ```
   cumulative(n+1) = cumulative(n) + annual_rate × (1 - cumulative(n))
   ```

This accounts for biological aging while maintaining validated predictions.

---

## Architecture

### Directory Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── CompactProfileEditor.tsx    # User input form
│   │   ├── CompactRiskDisplay.tsx      # Results display
│   │   └── LiveDashboard.tsx           # Main dashboard with auto-save
│   └── results/
│       └── MortalityRiskChart.tsx      # Lifetime risk chart
├── engine/
│   ├── RiskEngine.ts                   # Main calculation orchestrator
│   ├── calculators/
│   │   ├── BaseCalculator.ts           # Abstract base class
│   │   ├── CVDCalculator.ts            # CVD-specific logic
│   │   ├── ColorectalCancerCalculator.ts
│   │   ├── LungCancerCalculator.ts
│   │   └── DiabetesCalculator.ts
│   ├── adjusters/
│   │   └── FactorAdjuster.ts           # Hazard ratio calculation
│   └── aggregators/
│       └── OverallMortalityAggregator.ts  # Overall risk aggregation
├── knowledge/
│   └── diseases/
│       ├── cvd.json                    # CVD disease model
│       ├── colorectal-cancer.json
│       ├── lung-cancer.json
│       └── diabetes.json
├── types/
│   ├── user/                           # User profile types
│   └── knowledge/                      # Disease model types
├── utils/
│   └── dataExtraction.ts               # Profile data extraction utilities
└── db/
    └── schema.ts                       # Dexie IndexedDB schema
```

### Key Design Patterns

1. **Knowledge-Driven**: Disease models stored as JSON, not hardcoded
2. **Calculator Pattern**: Each disease has its own calculator extending BaseCalculator
3. **Strategy Pattern**: Different HR mapping strategies (linear, categorical, spline)
4. **Repository Pattern**: Dexie DB abstracts data persistence
5. **React Hooks**: Custom hooks for profile management and risk calculation

---

## How to Add New Diseases

### Step 1: Create Disease Model JSON

Create `/src/knowledge/diseases/YOUR_DISEASE.json`:

```json
{
  "metadata": {
    "id": "your_disease_10year",
    "name": "Your Disease Name",
    "category": "other",
    "timeframe": 10,
    "version": "1.0.0",
    "lastUpdated": "2025-01-03",
    "sources": [
      {
        "citation": "Primary Epidemiological Study Name",
        "doi": "10.xxxx/xxxxx",
        "evidenceLevel": "cohort"
      },
      {
        "citation": "Supporting Meta-Analysis",
        "doi": "10.xxxx/xxxxx",
        "evidenceLevel": "meta_analysis"
      }
    ],
    "description": "Brief description of the disease and what this model predicts"
  },
  "baselineRisk": {
    "defaultCurve": "male_us",
    "curves": [
      {
        "id": "male_us",
        "applicability": {
          "sex": "male",
          "region": ["US"],
          "ageRange": [40, 79]
        },
        "source": "Name of Population Study",
        "doi": "10.xxxx/xxxxx",
        "url": "https://...",
        "notes": "Optional: data source details, limitations, etc.",
        "ageRiskMapping": [
          { "age": 40, "risk": 0.015, "confidence": [0.012, 0.018] },
          { "age": 50, "risk": 0.032, "confidence": [0.028, 0.036] }
        ]
      }
    ]
  },
  "riskFactors": [
    {
      "factorId": "bmi",
      "name": "Body Mass Index",
      "type": "continuous",
      "evidenceStrength": "strong",
      "category": "Biometrics",
      "modifiable": true,
      "citation": "Specific study establishing BMI as risk factor for this disease",
      "doi": "10.xxxx/xxxxx",
      "evidenceLevel": "meta_analysis",
      "notes": "Effect size, dose-response details, etc.",
      "requiredFields": [
        {
          "path": "biometrics.weight.mostRecent.value",
          "required": false,
          "alternatives": []
        }
      ],
      "mapping": {
        "type": "continuous",
        "strategy": "lookup",
        "points": [
          { "value": 20, "hazardRatio": 0.90, "confidence": [0.82, 0.98] },
          { "value": 25, "hazardRatio": 1.0, "confidence": [0.95, 1.05] },
          { "value": 30, "hazardRatio": 1.5, "confidence": [1.40, 1.60] }
        ],
        "validRange": [18, 40]
      }
    }
  ]
}
```

### Step 2: Create Calculator Class

Create `/src/engine/calculators/YourDiseaseCalculator.ts`:

```typescript
import { BaseCalculator } from './BaseCalculator';
import { DiseaseModel } from '../../types/knowledge/disease';
import { UserProfile } from '../../types/user';
import { DiseaseRisk } from '../../types/risk/calculation';

export class YourDiseaseCalculator extends BaseCalculator {
  constructor(diseaseModel: DiseaseModel) {
    super(diseaseModel);
  }

  async calculate(profile: UserProfile): Promise<DiseaseRisk> {
    // Use base class implementation, or override for custom logic
    return super.calculate(profile);
  }

  // Optional: Override baseline risk calculation if needed
  protected calculateBaselineRisk(profile: UserProfile): number {
    // Custom baseline risk logic here
    // Fall back to: return super.calculateBaselineRisk(profile);
  }
}
```

### Step 3: Register Calculator in RiskEngine

Edit `/src/engine/RiskEngine.ts`:

```typescript
import { YourDiseaseCalculator } from './calculators/YourDiseaseCalculator';

async initialize(): Promise<void> {
  // ... existing code ...

  const yourDiseaseModel = this.diseaseKB.get('your_disease_10year');
  if (yourDiseaseModel) {
    this.calculators.set('your_disease_10year', new YourDiseaseCalculator(yourDiseaseModel));
  }

  // ... rest of code ...
}
```

### Step 4: Add Disease Name Mapping

Edit `/src/components/dashboard/CompactRiskDisplay.tsx`:

```typescript
const diseaseNames = {
  cvd_10year: 'Heart Disease',
  colorectal_cancer_10year: 'Colorectal Cancer',
  lung_cancer_10year: 'Lung Cancer',
  type2_diabetes_10year: 'Type 2 Diabetes',
  your_disease_10year: 'Your Disease Name', // Add this
};
```

### Step 5: Write Tests

Create `/src/engine/calculators/__tests__/YourDiseaseCalculator.test.ts`:

```typescript
import { YourDiseaseCalculator } from '../YourDiseaseCalculator';
import { loadDiseaseKB } from '../../../knowledge';

describe('YourDiseaseCalculator', () => {
  let calculator: YourDiseaseCalculator;

  beforeAll(async () => {
    const kb = await loadDiseaseKB();
    const model = kb.get('your_disease_10year');
    calculator = new YourDiseaseCalculator(model!);
  });

  it('should calculate baseline risk correctly', async () => {
    const profile = createMockProfile({ age: 45, sex: 'male' });
    const result = await calculator.calculate(profile);
    expect(result.baselineRisk).toBeGreaterThan(0);
  });

  it('should apply risk factors correctly', async () => {
    const profile = createMockProfile({
      age: 45,
      sex: 'male',
      bmi: 30
    });
    const result = await calculator.calculate(profile);
    expect(result.adjustedRisk).toBeGreaterThan(result.baselineRisk);
  });
});
```

---

## How to Add New User Inputs

### Step 1: Update Type Definitions

Edit the appropriate type file in `/src/types/user/`:

**For TimeSeries data** (values that change over time):
```typescript
// In /src/types/user/lifestyle.ts
export interface Lifestyle {
  // ... existing fields ...

  newField?: {
    dataPoints?: DataPoint<number>[];
    mostRecent?: DataPoint<number>;
  };
}
```

**For DataPoint data** (single values):
```typescript
export interface Lifestyle {
  // ... existing fields ...

  newField?: DataPoint<string>;
}
```

### Step 2: Add UI Field

Edit `/src/components/dashboard/CompactProfileEditor.tsx`:

Find the appropriate section (Demographics, Biometrics, Lab Tests, Lifestyle, or Medical History) and add your input:

```typescript
<label>
  New Field Label
  <input
    type="number"
    value={getFieldValue('lifestyle', 'newField')}
    onChange={(e) => {
      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
      updateField('lifestyle', 'newField', val);
    }}
    className="compact-input"
    placeholder="0"
  />
</label>
```

### Step 3: Add Handler in `updateField()`

In the same file, add a handler in the `updateField()` function:

**For TimeSeries fields**:
```typescript
} else if (section === 'lifestyle') {
  // ... existing handlers ...

  } else if (field === 'newField') {
    if (isEmpty) {
      delete sectionData.newField;
    } else {
      const dataPoint = createUserDataPoint(value);
      sectionData.newField = {
        dataPoints: sectionData.newField?.dataPoints || [],
        mostRecent: dataPoint
      };
    }
  }
```

**For DataPoint fields**:
```typescript
// Falls through to generic handler, no special case needed
// It will automatically call: createUserDataPoint(value)
```

### Step 4: Add Handler in `getFieldValue()`

**For TimeSeries fields**:
```typescript
if (section === 'lifestyle') {
  // ... existing handlers ...

  } else if (field === 'newField') {
    return sectionData.newField?.mostRecent?.value ?? '';
  }
}
```

**For DataPoint fields**:
```typescript
// Falls through to generic handler at end of function:
// return current.value ?? '';
```

### Step 5: Update Persistence Logging (Optional)

Edit `/src/components/dashboard/LiveDashboard.tsx`:

```typescript
if (debouncedProfile.lifestyle) {
  console.log('[PERSISTENCE] Saving lifestyle:', {
    alcohol: debouncedProfile.lifestyle.alcohol,
    diet: debouncedProfile.lifestyle.diet,
    exercise: debouncedProfile.lifestyle.exercise,
    smoking: debouncedProfile.lifestyle.smoking,
    newField: debouncedProfile.lifestyle.newField  // Add this
  });
  updateLifestyle(debouncedProfile.lifestyle).catch(console.error);
}
```

### Step 6: Reference in Disease Models

If this field is a risk factor, reference it in disease model JSON:

```json
{
  "factorId": "new_factor",
  "name": "New Factor Name",
  "type": "continuous",
  "evidenceStrength": "moderate",
  "category": "Lifestyle",
  "modifiable": true,
  "citation": "Study establishing this as a risk factor",
  "doi": "10.xxxx/xxxxx",
  "evidenceLevel": "cohort",
  "notes": "Details about effect size, dose-response, etc.",
  "requiredFields": [
    {
      "path": "lifestyle.newField.mostRecent.value",
      "required": false,
      "alternatives": []
    }
  ],
  "mapping": {
    "type": "continuous",
    "strategy": "linear",
    "coefficients": {
      "slope": 0.05,
      "intercept": 0,
      "citation": "Study establishing the coefficient",
      "doi": "10.xxxx/xxxxx"
    },
    "validRange": [0, 100]
  }
}
```

### Step 7: Write E2E Tests (REQUIRED)

**CRITICAL: Every new user profile field MUST have corresponding E2E tests.**

Create an E2E test in the appropriate file in `/e2e/`:

**For Demographics fields**: Add to `/e2e/demographics.spec.ts`
**For Biometrics fields**: Add to `/e2e/biometrics.spec.ts`
**For Lab Tests fields**: Add to `/e2e/labtests.spec.ts`
**For Lifestyle fields**: Add to `/e2e/lifestyle.spec.ts`
**For Medical History fields**: Add to `/e2e/medicalhistory.spec.ts`

Example E2E test for a new field:

```typescript
test('should persist and calculate risk when NewField is changed', async ({ page }) => {
  // Expand the appropriate section
  await expandSection(page, 'SectionName');

  // Set the field value
  await setInputValue(page, 'New Field Label', '100');

  // Wait for persistence
  await page.waitForTimeout(500);

  // Verify IndexedDB has the correct value
  const sectionData = await getIndexedDBValue(page, 'sectionName');

  // For TimeSeries fields, check .mostRecent.value
  expect(sectionData.newField.mostRecent.value).toBe(100);

  // For DataPoint fields, check .value
  // expect(sectionData.newField.value).toBe(100);

  // Wait for risk calculation to complete
  await waitForRiskCalculation(page);

  // Verify the UI shows the new value
  const currentValue = await getInputValue(page, 'New Field Label');
  expect(currentValue).toBe('100');
});
```

**Test Requirements:**
1. Must verify field value is persisted to IndexedDB
2. Must verify risk calculation is triggered (no errors)
3. Must verify UI displays the updated value
4. Should test boundary values (min/max) if applicable
5. Should test empty/cleared values if applicable

**Running E2E Tests:**
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:debug     # Run in debug mode
```

**IMPORTANT:** E2E tests run with debouncing disabled (0ms delay) via the `VITE_E2E_TEST_MODE` environment variable. This ensures tests are fast and deterministic.

### Data Structure Decision Tree

**When to use TimeSeries vs DataPoint:**

- **TimeSeries** → Values that change frequently over time
  - Examples: weight, blood pressure, exercise minutes, diet servings
  - Path in disease model: `field.mostRecent.value`
  - Structure: `{ dataPoints: [], mostRecent: DataPoint }`

- **DataPoint** → Values that are relatively stable
  - Examples: height, sex, race, smoking status
  - Path in disease model: `field.value`
  - Structure: `{ value: T, provenance: { source, timestamp } }`

- **Arrays** → Multiple discrete items
  - Examples: medical conditions, family history
  - Path: Accessed via helper functions (`hasCondition`, `hasFamilyHistory`)
  - Structure: `[{ conditionId, status, ... }]`

---

## Complete Example: Adding a New Risk Factor

### Scenario: Add "Stress Level" to Lifestyle

Let's walk through adding a new lifestyle risk factor with complete E2E testing.

#### 1. Update Type Definition

Edit `/src/types/user/lifestyle.ts`:

```typescript
export interface Lifestyle {
  // ... existing fields ...

  stressLevel?: DataPoint<'low' | 'moderate' | 'high' | 'very_high'>;
}
```

#### 2. Add UI Input

Edit `/src/components/dashboard/CompactProfileEditor.tsx` in the Lifestyle section:

```typescript
<label>
  Stress Level
  <Tooltip content="Chronic stress increases mortality risk. High stress: HR=1.4 for all-cause mortality.">
    <span className="field-help">ℹ️</span>
  </Tooltip>
  <select
    data-testid="profile-lifestyle-stressLevel"
    value={getFieldValue('lifestyle', 'stressLevel')}
    onChange={(e) => updateField('lifestyle', 'stressLevel', e.target.value)}
    className="compact-select"
  >
    <option value="">Select...</option>
    <option value="low">Low</option>
    <option value="moderate">Moderate</option>
    <option value="high">High</option>
    <option value="very_high">Very High</option>
  </select>
</label>
```

**Note:** Since `stressLevel` is a DataPoint<string>, it falls through to the generic handler - NO custom handler needed in `updateField()` or `getFieldValue()`!

#### 3. Add Disease Model Reference

Edit `/src/knowledge/diseases/cvd.json` (or create new disease):

```json
{
  "factorId": "stress_level",
  "name": "Chronic Stress Level",
  "type": "categorical",
  "evidenceStrength": "moderate",
  "category": "Psychosocial",
  "modifiable": true,
  "citation": "Meta-analysis of psychosocial stress and CVD",
  "doi": "10.1016/S0140-6736(12)60916-5",
  "evidenceLevel": "meta_analysis",
  "notes": "Chronic stress associated with 27% increased CVD risk",
  "requiredFields": [
    {
      "path": "lifestyle.stressLevel.value",
      "required": false,
      "alternatives": []
    }
  ],
  "mapping": {
    "type": "categorical",
    "categories": [
      { "value": "low", "hazardRatio": 1.0 },
      { "value": "moderate", "hazardRatio": 1.15 },
      { "value": "high", "hazardRatio": 1.27 },
      { "value": "very_high", "hazardRatio": 1.40 }
    ]
  }
}
```

#### 4. Write E2E Tests

Add to `/e2e/lifestyle.spec.ts`:

```typescript
test('should persist and calculate risk when Stress Level is changed to high', async ({ page }) => {
  // Select high stress level
  await setSelectValue(page, 'Stress Level', 'high');

  // Wait for persistence
  await page.waitForTimeout(1000);

  // Verify IndexedDB has the correct value
  const lifestyle = await getIndexedDBValue(page, 'lifestyle');
  expect(lifestyle.stressLevel.value).toBe('high');

  // Wait for risk calculation to complete
  await waitForRiskCalculation(page);

  // Verify the UI shows the selected value
  const currentValue = await getSelectValue(page, 'Stress Level');
  expect(currentValue).toBe('high');
});

test('should persist optimal stress level (low)', async ({ page }) => {
  await setSelectValue(page, 'Stress Level', 'low');
  await page.waitForTimeout(1000);

  const lifestyle = await getIndexedDBValue(page, 'lifestyle');
  expect(lifestyle.stressLevel.value).toBe('low');

  await waitForRiskCalculation(page);
});
```

#### 5. Run Tests

```bash
# Run just your new tests
npm run test:e2e -- lifestyle.spec.ts --grep "Stress Level"

# Run all lifestyle tests
npm run test:e2e -- lifestyle.spec.ts

# Run all E2E tests
npm run test:e2e
```

#### 6. Verify in Browser

```bash
npm run dev
```

Navigate to http://localhost:5173, scroll to Lifestyle section, and:
1. Set stress level to "high"
2. Check browser console for `[PERSISTENCE]` logs
3. Check Application → IndexedDB → lifestyle → stressLevel
4. Verify risk calculation updates

---

## Best Practices for Different Input Types

### Number Inputs (Age, Weight, Lab Values)

```typescript
<input
  data-testid="profile-biometrics-weight"
  type="number"
  step="0.1"
  value={getFieldValue('biometrics', 'weight')}
  onChange={(e) => {
    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
    updateField('biometrics', 'weight', val);
  }}
  className="compact-input"
  placeholder="70"
  min="0"
  max="500"
/>
```

**Key points:**
- Always parse with `parseFloat()` or `parseInt()`
- Handle empty string separately (don't parse)
- Set reasonable min/max bounds
- Use `step` for decimals

### Select Dropdowns (Categorical Values)

```typescript
<select
  data-testid="profile-lifestyle-smoking-status"
  value={getFieldValue('lifestyle', 'smoking.status')}
  onChange={(e) => updateField('lifestyle', 'smoking.status', e.target.value)}
  className="compact-select"
>
  <option value="">Select...</option>
  <option value="never">Never smoked</option>
  <option value="former">Former smoker</option>
  <option value="current">Current smoker</option>
</select>
```

**Key points:**
- Always include empty option for "not selected"
- Value should match enum in type definition
- No parsing needed - already a string

### Checkboxes (Boolean Values)

```typescript
<label className="checkbox-label">
  <input
    data-testid="profile-medicalHistory-diabetesDiagnosis"
    type="checkbox"
    checked={getFieldValue('medicalHistory', 'conditions') === true}
    onChange={(e) => updateField('medicalHistory', 'diabetesDiagnosis', e.target.checked)}
  />
  Diagnosed with Type 2 Diabetes
</label>
```

**Key points:**
- Use `checked` instead of `value`
- Use `e.target.checked` to get boolean
- Handle clearing (unchecking) properly

### Range Sliders (Continuous with Visual Feedback)

```typescript
<label>
  Waist: {(() => {
    const cm = getFieldValue('biometrics', 'waistCircumference') ?? 85;
    const inches = Math.round(cm * 0.393701);
    return `${cm} cm (${inches}")`;
  })()}
  <input
    data-testid="profile-biometrics-waistCircumference"
    type="range"
    value={getFieldValue('biometrics', 'waistCircumference') ?? 85}
    onChange={(e) => {
      const val = parseFloat(e.target.value);
      updateField('biometrics', 'waistCircumference', val);
    }}
    className="compact-slider"
    min="40"
    max="150"
  />
</label>
```

**Key points:**
- Display current value with units
- Provide visual feedback (converted units, risk zones)
- Set appropriate min/max for the slider

### Tooltips (Educational Context)

```typescript
<Tooltip content="Optimal: 30-50 ng/mL. Low vitamin D increases fall risk and bone fracture risk.">
  <span className="field-help">ℹ️</span>
</Tooltip>
```

**Key points:**
- Provide normal/optimal ranges
- Explain clinical significance
- Reference major health outcomes
- Keep concise (1-2 sentences)

---

## Input Field Checklist

Before deploying a new input field:

- [ ] ✅ Type definition added
- [ ] ✅ UI input added with `data-testid`
- [ ] ✅ Handler added (if TimeSeries or special case)
- [ ] ✅ Tooltip with clinical context
- [ ] ✅ Disease model references field (with citations!)
- [ ] ✅ E2E tests written (set value, verify persistence, verify UI)
- [ ] ✅ E2E tests pass (`npm run test:e2e`)
- [ ] ✅ Build succeeds (`npm run build`)
- [ ] ✅ Manual browser testing (set value, check IndexedDB, check risk update)

---

## Survey Questions (Optional)

The `SwipeSurvey` component (`/src/components/survey/SwipeSurvey.tsx`) provides an alternative onboarding experience. If you want to add survey questions:

### 1. Add Question to Survey

Edit `/src/components/survey/SwipeSurvey.tsx`:

```typescript
{
  id: 'stress_level',
  category: 'Lifestyle',
  question: 'How would you describe your typical stress level?',
  type: 'select',
  options: [
    { value: 'low', label: 'Low - I rarely feel stressed' },
    { value: 'moderate', label: 'Moderate - Occasionally stressed' },
    { value: 'high', label: 'High - Frequently stressed' },
    { value: 'very_high', label: 'Very High - Constantly stressed' }
  ],
  explanation: 'Chronic stress increases cardiovascular disease risk by up to 40%.',
  path: 'lifestyle.stressLevel'
}
```

### 2. Map to Profile

The survey automatically maps answers to the profile using the `path` field. No additional code needed!

### 3. Survey Best Practices

**Good Questions:**
- Clear, single-concept questions
- Mutually exclusive options
- Actionable (relates to modifiable risk factors)
- Brief explanation with health impact

**Bad Questions:**
- Compound questions ("Do you smoke or drink?")
- Ambiguous options
- Non-actionable (e.g., "Are you unlucky?")
- No context or clinical relevance

---

## Data Flow

### 1. User Input → Profile Update
```
User types in field
  ↓
onChange handler called
  ↓
updateField('lifestyle', 'alcohol.drinksPerWeek', 14)
  ↓
Creates DataPoint with timestamp
  ↓
Wraps in TimeSeries structure
  ↓
Updates local profile state
  ↓
Calls onProfileChange(updatedProfile)
```

### 2. Profile Update → Persistence
```
onProfileChange(updatedProfile) called
  ↓
LiveDashboard receives new profile
  ↓
Sets localProfile state
  ↓
Debounce hook waits 50ms
  ↓
debouncedProfile updates
  ↓
useEffect triggers
  ↓
Calls updateLifestyle(lifestyle) (Dexie)
  ↓
Data persisted to IndexedDB
```

### 3. Profile Update → Risk Calculation
```
debouncedProfile updates
  ↓
useRiskCalculation hook receives new profile
  ↓
Calls RiskEngine.calculate(profile)
  ↓
For each disease:
  - Calculator extracts baseline risk
  - FactorAdjuster calculates HRs
  - Multiplies baseline × HRs
  ↓
OverallMortalityAggregator combines diseases
  ↓
Returns RiskCalculationResult
  ↓
CompactRiskDisplay re-renders with new results
```

### 4. Data Extraction in FactorAdjuster
```
FactorAdjuster.extractFactorValue(profile, factor)
  ↓
Checks for special/derived factors (BMI, family history, etc.)
  ↓
If not special, uses path from disease model
  ↓
Calls getValueFromPath(profile, path)
  ↓
Checks if path contains "mostRecent" → TimeSeries
  ↓
Navigates object tree: profile.lifestyle.alcohol.drinksPerWeek.mostRecent.value
  ↓
Returns primitive value (number/string/boolean)
```

---

## Testing

The project has two types of tests: **Unit Tests** (Vitest) and **End-to-End Tests** (Playwright).

### Running Unit Tests
```bash
npm test                    # Run all unit tests
npm test -- --watch        # Watch mode
npm test CVDCalculator     # Specific test file
npm run test:ui            # Run with Vitest UI
```

### Running E2E Tests
```bash
npm run test:e2e           # Run all E2E tests (headless)
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:debug     # Run in debug mode (headed browser)
```

### Test Structure
```
src/
├── engine/
│   ├── calculators/
│   │   └── __tests__/          # Unit tests for calculators
│   │       ├── CVDCalculator.test.ts
│   │       ├── ColorectalCancerCalculator.test.ts
│   │       └── ...
│   └── __tests__/
│       ├── RiskEngine.test.ts
│       └── FactorAdjuster.test.ts
└── utils/
    └── __tests__/
        └── dataExtraction.test.ts

e2e/
├── fixtures/
│   └── base.ts                 # Shared test fixtures
├── helpers/
│   └── test-helpers.ts         # E2E test utilities
├── demographics.spec.ts        # Demographics field tests
├── biometrics.spec.ts          # Biometrics field tests
├── labtests.spec.ts            # Lab tests field tests
├── lifestyle.spec.ts           # Lifestyle field tests
└── medicalhistory.spec.ts      # Medical history field tests
```

### Unit Tests: Writing Tests for New Diseases

```typescript
describe('YourDiseaseCalculator', () => {
  it('should handle missing data gracefully', async () => {
    const profile = createMockProfile({ age: 45 });
    const result = await calculator.calculate(profile);

    expect(result.confidence.level).toBe('low');
    expect(result.confidence.missingCriticalData).toContain('BMI');
  });

  it('should calculate correct HR for specific factor value', async () => {
    const profile = createMockProfile({ age: 45, bmi: 30 });
    const result = await calculator.calculate(profile);

    const bmiContribution = result.factorContributions.find(
      f => f.factorId === 'bmi'
    );

    expect(bmiContribution?.hazardRatio).toBeCloseTo(1.35, 2);
  });
});
```

### E2E Tests: Purpose and Coverage

**Purpose:** E2E tests verify the complete user flow from input → persistence → calculation.

**What E2E Tests Verify:**
1. User input is correctly captured from UI
2. Data is persisted to IndexedDB with correct structure
3. Risk calculation is triggered without errors
4. UI updates to reflect the new data

**Coverage:** Every user profile field has corresponding E2E tests that verify:
- Field value persistence (DataPoint vs TimeSeries structure)
- Risk calculation triggering
- UI state updates
- Boundary value handling (min/max)
- Empty value handling (clearing fields)

**E2E Test Helpers Available:**
- `expandSection(page, sectionName)` - Expand a collapsed section
- `setInputValue(page, label, value)` - Set text/number input value
- `setSelectValue(page, label, value)` - Set select dropdown value
- `toggleCheckbox(page, label, checked)` - Toggle checkbox state
- `waitForProfilePersistence(page, path, value)` - Wait for IndexedDB save
- `waitForRiskCalculation(page)` - Wait for calculation to complete
- `getIndexedDBValue(page, storeName)` - Read from IndexedDB
- `getInputValue(page, label)` - Get current input value
- `isCheckboxChecked(page, label)` - Check checkbox state

**E2E Test Environment:**
- Debouncing is disabled (0ms) via `VITE_E2E_TEST_MODE=true`
- IndexedDB is cleared before each test
- Browser navigates to `/` and waits for app to load
- Tests run in Chromium by default (headless mode)

---

## Common Patterns & Best Practices

### 1. Always Use Type Guards
```typescript
// Bad
const value = getValueAtPath(profile, path);
return value.something; // Runtime error if value is null!

// Good
const value = getValueAtPath(profile, path);
if (typeof value === 'object' && value !== null) {
  return (value as MyType).something;
}
return null;
```

### 2. Cap Risk Values
```typescript
// Always cap cumulative risk at 99.9%
const risk = Math.min(calculateRisk(), 0.999);
```

### 3. Handle Missing Data
```typescript
if (!value) {
  // Track missing data for confidence scoring
  missingCriticalData.push(factor.name);
  return null; // Don't apply this factor
}
```

### 4. Use Memoization for Expensive Calculations
```typescript
const chartData = useMemo(
  () => generateMortalityData(currentAge, tenYearRisk, sex),
  [currentAge, tenYearRisk, sex]
);
```

### 5. Validate Ranges
```typescript
if (mapping.validRange) {
  const [min, max] = mapping.validRange;
  value = Math.max(min, Math.min(max, value)); // Clamp to range
}
```

---

## Troubleshooting

### Field Not Persisting?
1. Check browser console for `[PERSISTENCE]` logs
2. Verify field has proper TimeSeries/DataPoint handler in `updateField()`
3. Verify field is read correctly in `getFieldValue()`
4. Check IndexedDB in browser DevTools → Application → IndexedDB

### Risk Not Changing?
1. Check browser console for `[RISK CALC]` logs
2. Verify disease model has correct path in `requiredFields[].path`
3. Check path matches data structure (TimeSeries needs `.mostRecent.value`)
4. Verify hazard ratio mapping is correct
5. Check that value is within `validRange`

### Chart Not Matching Risk Value?
1. Verify calibration loop uses correct age range (0-9 years, not 1-10)
2. Check that cumulative calculation happens AFTER data point push
3. Ensure chart is using same risk value from `result.overallMortality.estimatedRisk`

---

## References

**All specific citations are embedded in the disease model JSON files and TypeScript type definitions.**

### Disease Models (Primary Sources)

**CVD (Cardiovascular Disease):**
- Framingham Heart Study 30-Year Follow-up - doi:10.1161/CIRCULATIONAHA.107.699579
- ACC/AHA Pooled Cohort Equations (2013) - doi:10.1161/01.cir.0000437741.48606.98
- Systematic Coronary Risk Evaluation (SCORE) - https://www.escardio.org/Education/Practice-Tools/CVD-prevention-toolbox/SCORE-Risk-Charts

**Colorectal Cancer:**
- SEER Cancer Statistics Review, 1975-2018 - https://seer.cancer.gov/statfacts/html/colorect.html
- American Cancer Society Risk Assessment - https://www.cancer.org/cancer/colon-rectal-cancer/causes-risks-prevention/risk-factors.html
- USPSTF CRC Screening Guidelines - doi:10.1001/jama.2021.6238

**Lung Cancer:**
- SEER Cancer Statistics, Lung and Bronchus - https://seer.cancer.gov/statfacts/html/lungb.html
- Bach et al. Variations in Lung Cancer Risk Among Smokers - doi:10.1093/jnci/djg226
- USPSTF Lung Cancer Screening - doi:10.1001/jama.2021.1117

**Type 2 Diabetes:**
- American Diabetes Association Risk Test - https://diabetes.org/risk-test
- Framingham Offspring Study Diabetes Risk Score - doi:10.2337/dc07-0954
- Finnish Diabetes Risk Score (FINDRISC) - doi:10.1007/s001250051591

### Risk Factor Evidence (Key Meta-Analyses)

**Lipids:**
- Cholesterol Treatment Trialists' Collaboration - doi:10.1016/S0140-6736(10)61350-5

**Blood Pressure:**
- Prospective Studies Collaboration - doi:10.1016/S0140-6736(02)11911-8

**Smoking:**
- IARC Monographs on Tobacco Smoke - https://monographs.iarc.who.int/

**Physical Activity:**
- Physical Activity Guidelines Advisory Committee Report (2018) - https://health.gov/sites/default/files/2019-09/PAG_Advisory_Committee_Report.pdf

**BMI:**
- Prospective Studies Collaboration - doi:10.1016/S0140-6736(09)60318-4

### Mortality Data
- CDC/NCHS National Vital Statistics System - https://www.cdc.gov/nchs/nvss/
- U.S. Life Tables (age/sex-specific mortality rates) - https://www.cdc.gov/nchs/products/life_tables.htm

### Methodology
- Complement rule for competing risks - Standard statistical methodology
- Gompertz law for age-related mortality increase - Gompertz B. Phil Trans R Soc Lond. 1825;115:513-583
- Hazard ratio multiplication for multifactorial risk - Standard epidemiological methodology
