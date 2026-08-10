# Mortality Risk Calculator - Database Expansion Research Request

**Date**: 2026-01-04
**Purpose**: Expand evidence-based mortality risk factor database with validated baseline risks and hazard ratios
**Target Audience**: AI Research Assistant

---

## Executive Summary

We are building a comprehensive, evidence-based mortality risk calculator. We need you to research and provide additional disease models and risk factors following our exact data format specification below.

**Current Status**:
- **19 disease models** covering cardiovascular, cancer, metabolic, respiratory, neurological, and external causes
- **130+ risk factors** with hazard ratios and confidence intervals
- **All data backed by peer-reviewed research** with DOI citations

**Your Task**:
1. Review our data storage format (Section 1)
2. Review existing disease models (Section 2)
3. Research and provide NEW disease models or ENHANCEMENTS to existing models (Section 3)
4. Return data in **exact JSON format** specified in Section 1

---

## Section 1: Data Storage Format Specification

### 1.1 Disease Model JSON Schema

Each disease model is stored as a JSON file following this structure:

```json
{
  "metadata": {
    "id": "string (e.g., 'cvd_10year')",
    "name": "string (e.g., 'Cardiovascular Disease (10-year)')",
    "category": "string (cardiovascular|cancer|metabolic|respiratory|neurological|renal|external|other)",
    "timeframe": "number (years, typically 10)",
    "version": "string (semantic versioning, e.g., '1.0.0')",
    "lastUpdated": "string (ISO date, e.g., '2025-01-03')",
    "sources": [
      {
        "citation": "string (full citation)",
        "doi": "string (optional, e.g., '10.1161/01.cir.xxx')",
        "url": "string (optional)",
        "evidenceLevel": "string (meta_analysis|cohort|rct|case_control|expert_opinion)"
      }
    ],
    "description": "string (brief description of what the model predicts)"
  },

  "baselineRisk": {
    "defaultCurve": "string (curve ID to use as default)",
    "curves": [
      {
        "id": "string (e.g., 'white_male_us')",
        "applicability": {
          "sex": "string (male|female|both)",
          "ethnicity": ["array of strings (e.g., ['white', 'caucasian'])"],
          "region": ["array of strings (e.g., ['US', 'North America'])"],
          "ageRange": [number, number]
        },
        "source": "string (population study name)",
        "doi": "string (optional)",
        "url": "string (optional)",
        "notes": "string (optional context)",
        "ageRiskMapping": [
          {
            "age": number,
            "risk": number (decimal, e.g., 0.042 for 4.2%),
            "confidence": [number, number] (optional, 95% CI)
          }
        ]
      }
    ]
  },

  "riskFactors": [
    {
      "factorId": "string (unique identifier, e.g., 'ldl_cholesterol')",
      "name": "string (human-readable name)",
      "type": "string (continuous|categorical|boolean)",
      "evidenceStrength": "string (strong|moderate|weak)",
      "category": "string (e.g., 'Lipids', 'Lifestyle', 'Psychosocial')",
      "modifiable": boolean,
      "citation": "string (full citation of primary evidence)",
      "doi": "string (DOI of primary evidence)",
      "evidenceLevel": "string (meta_analysis|cohort|rct|case_control)",
      "notes": "string (mechanism, context, limitations)",
      "requiredFields": [
        {
          "path": "string (dot-notation path to user profile field)",
          "required": boolean,
          "alternatives": ["array of alternative paths"]
        }
      ],

      "mapping": {
        // FOR CONTINUOUS VARIABLES WITH LOOKUP STRATEGY:
        "type": "continuous",
        "strategy": "lookup",
        "points": [
          {
            "value": number,
            "hazardRatio": number,
            "confidence": [number, number] (optional, 95% CI)
          }
        ],
        "validRange": [number, number]

        // OR FOR CONTINUOUS VARIABLES WITH LINEAR STRATEGY:
        "type": "continuous",
        "strategy": "linear",
        "coefficients": {
          "slope": number,
          "intercept": number,
          "citation": "string (optional)",
          "doi": "string (optional)"
        },
        "validRange": [number, number]

        // OR FOR CATEGORICAL VARIABLES:
        "type": "categorical",
        "categories": [
          {
            "value": "string or array of strings",
            "hazardRatio": number,
            "confidence": [number, number] (optional)
          }
        ]

        // OR FOR BOOLEAN VARIABLES:
        "type": "boolean",
        "trueHazardRatio": number,
        "falseHazardRatio": number,
        "confidence": [number, number] (optional)
      }
    }
  ]
}
```

### 1.2 Field Path Reference

User profile fields that can be referenced in `requiredFields[].path`:

**Demographics**:
- `demographics.dateOfBirth.value`
- `demographics.biologicalSex.value`
- `demographics.ethnicity.value`
- `demographics.educationLevel.value`

**Biometrics**:
- `biometrics.height.value`
- `biometrics.weight.mostRecent.value`
- `biometrics.bloodPressure.mostRecent.value.systolic`
- `biometrics.bloodPressure.mostRecent.value.diastolic`
- `biometrics.waistCircumference.mostRecent.value`

**Lab Tests**:
- `labTests.lipidPanel.ldlCholesterol.value`
- `labTests.lipidPanel.hdlCholesterol.value`
- `labTests.lipidPanel.totalCholesterol.value`
- `labTests.lipidPanel.triglycerides.mostRecent.value`
- `labTests.metabolicPanel.glucose.value`
- `labTests.psa.mostRecent.value`
- `labTests.vitaminD.mostRecent.value`
- `labTests.kidneyFunction.egfr.mostRecent.value`
- `labTests.kidneyFunction.urineACR.mostRecent.value`

**Lifestyle**:
- `lifestyle.smoking.status.value` (never|former|current)
- `lifestyle.smoking.packYears.value`
- `lifestyle.smoking.quitDate.value`
- `lifestyle.alcohol.drinksPerWeek.mostRecent.value`
- `lifestyle.exercise.moderateMinutesPerWeek.mostRecent.value`
- `lifestyle.exercise.vigorousMinutesPerWeek.mostRecent.value`
- `lifestyle.diet.vegetableServingsPerDay.mostRecent.value`
- `lifestyle.diet.fruitServingsPerDay.mostRecent.value`
- `lifestyle.diet.processedMeatServingsPerWeek.mostRecent.value`
- `lifestyle.sleep.averageHoursPerNight.mostRecent.value`
- `lifestyle.stress.value` (low|moderate|high)
- `lifestyle.socialEngagement.value` (low|moderate|high)
- `lifestyle.screenTime.value` (low|moderate|high)
- `lifestyle.dentalHygiene.value` (poor|fair|good)
- `lifestyle.airQualityExposure.value` (good|moderate|poor)
- `lifestyle.noiseExposure.value` (low|moderate|high)
- `lifestyle.outdoorTime.minutesPerWeek.mostRecent.value`

**Medical History**:
- `medicalHistory.conditions` (array - check via helper function)
- `medicalHistory.familyHistory` (array - check via helper function)
- `medicalHistory.medications.statin.value`
- `medicalHistory.medications.bloodPressureMeds.value`
- `medicalHistory.screenings.colonoscopy.value`
- `medicalHistory.screenings.mammogram.value`
- `medicalHistory.screenings.dental.value`
- `medicalHistory.screenings.vision.value`
- `medicalHistory.reproductiveHistory.ageAtMenarche.value`
- `medicalHistory.reproductiveHistory.ageAtFirstBirth.value`
- `medicalHistory.reproductiveHistory.breastBiopsies.value`
- `medicalHistory.substanceUse.prescribedOpioids.value`
- `medicalHistory.substanceUse.opioidDailyDose.value`
- `medicalHistory.geneticFactors.apoeE4Status.value`
- `medicalHistory.respiratoryHistory.fev1Percent.value`
- `medicalHistory.respiratoryHistory.dyspneaSeverity.value`
- `medicalHistory.respiratoryHistory.exacerbationsPerYear.value`
- `medicalHistory.fallHistory.fallsPastYear.value`
- `medicalHistory.fallHistory.balanceProblems.value`

**Social**:
- `social.volunteering.active.value`
- `social.religiousAttendance.value` (never|rarely|monthly|weekly)
- `social.petOwnership.ownsDog.value`
- `social.hobbies.creative.engaged.value`
- `social.hobbies.intellectual.engaged.value`

**Custom**:
- `customFields.asbestosExposure`

---

## Section 2: Current Database Inventory

### 2.1 Existing Disease Models (19 total)

#### Cardiovascular (2 models)
1. **cvd.json** - Cardiovascular Disease (10-year)
   - Baseline risk curves: 4 (white/black, male/female, US)
   - Risk factors: 18 total
     - Lipids: LDL, HDL, Total Cholesterol, Triglycerides
     - Vital Signs: Systolic BP
     - Metabolic: BMI
     - Lifestyle: Physical activity, Sleep duration, Chronic stress, Social isolation, Sedentary time, Periodontal disease
     - Environmental: Air pollution (PM2.5), Noise pollution, Nature exposure
     - Medications: Statin use
     - Psychosocial: Dog ownership, Volunteering, Religious attendance
     - Medical History: Diabetes, Smoking

2. **stroke.json** - Stroke (10-year)
   - Baseline risk curves: 2 (male/female, US)
   - Risk factors: 7 (BP, smoking, diabetes, BMI, cholesterol, atrial fibrillation, family history)

#### Cancer (7 models)
3. **breast-cancer.json** - Breast Cancer (10-year)
   - Baseline risk curves: 2 (white/black female, US)
   - Risk factors: 8 (family history, reproductive history, BMI, alcohol, exercise, mammography screening)

4. **colorectal-cancer.json** - Colorectal Cancer (10-year)
   - Baseline risk curves: 4 (by sex/race)
   - Risk factors: 9 (family history, IBD, processed meat, BMI, smoking, alcohol, diabetes, colonoscopy screening)

5. **lung-cancer.json** - Lung Cancer (10-year)
   - Baseline risk curves: 4 (by sex/race)
   - Risk factors: 6 (smoking pack-years, quit date, family history, COPD, asbestos, air pollution)

6. **prostate-cancer.json** - Prostate Cancer (10-year)
   - Baseline risk curves: 2 (white/black male)
   - Risk factors: 6 (PSA, family history, BMI, prior negative biopsy)

7. **bladder-cancer.json** - Bladder Cancer (10-year)
   - Baseline risk curves: 2 (by sex)
   - Risk factors: 4 (smoking, occupational exposures)

8. **pancreatic-cancer.json** - Pancreatic Cancer (10-year)
   - Baseline risk curves: 2 (by sex)
   - Risk factors: 7 (smoking, diabetes, BMI, alcohol, family history, pancreatitis)

9. **liver-cancer.json** - Liver Cancer (10-year)
   - Baseline risk curves: 2 (by sex)
   - Risk factors: 8 (hepatitis B/C, cirrhosis, alcohol, diabetes, BMI, family history)

10. **esophageal-cancer.json** - Esophageal Cancer (10-year)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 7 (GERD, Barrett's esophagus, smoking, alcohol, BMI)

#### Metabolic (2 models)
11. **type2-diabetes.json** - Type 2 Diabetes (10-year)
    - Baseline risk curves: 4 (by sex/race)
    - Risk factors: 9 (BMI, fasting glucose, BP, waist circumference, family history, exercise, diet)

12. **liver-disease.json** - Chronic Liver Disease (10-year)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 8 (alcohol, hepatitis, BMI, diabetes, FIB-4 score)

#### Respiratory (2 models)
13. **copd.json** - Chronic Obstructive Pulmonary Disease (10-year mortality)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 7 (smoking, FEV1%, dyspnea severity, exacerbations, air pollution)

14. **influenza-pneumonia.json** - Influenza/Pneumonia (10-year)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 6 (age, flu vaccine, pneumococcal vaccine, immune status, smoking, chronic conditions)

#### Neurological (1 model)
15. **alzheimers-dementia.json** - Alzheimer's / Dementia (10-year)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 11 (education, BP, BMI, physical activity, smoking, family history, social engagement, APOE-ε4, creative hobbies, sleep duration, chronic stress, intellectual engagement)

#### Renal (1 model)
16. **chronic-kidney-disease.json** - Chronic Kidney Disease (10-year)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 8 (diabetes, hypertension, BMI, smoking, eGFR, urine ACR)

#### External Causes (3 models)
17. **falls.json** - Falls (10-year mortality risk)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 8 (prior falls, balance problems, medication count, vitamin D, BP medications, dizziness)

18. **motor-vehicle-crash.json** - Motor Vehicle Crash (10-year mortality risk)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 7 (miles driven, seatbelt use, alcohol consumption, traffic violations, phone use, driving setting)

19. **drug-overdose.json** - Drug Overdose (10-year mortality risk)
    - Baseline risk curves: 2 (by sex)
    - Risk factors: 8 (prescribed opioids, opioid dose, benzodiazepines, alcohol, substance abuse history, prior overdose, depression)

### 2.2 Summary Statistics

| Category | Models | Total Risk Factors | Baseline Curves | Evidence Quality |
|----------|--------|-------------------|-----------------|------------------|
| Cardiovascular | 2 | 25 | 6 | High (meta-analyses) |
| Cancer | 7 | 55 | 18 | High (meta-analyses, cohorts) |
| Metabolic | 2 | 17 | 6 | High (meta-analyses) |
| Respiratory | 2 | 13 | 4 | High (meta-analyses) |
| Neurological | 1 | 11 | 2 | Moderate-High (cohorts) |
| Renal | 1 | 8 | 2 | High (cohorts) |
| External Causes | 3 | 23 | 6 | Moderate (cohorts, registries) |
| **TOTAL** | **19** | **~152** | **44** | **Mostly High** |

---

## Section 3: Research Tasks

### Task 3.1: High-Priority NEW Disease Models

Please research and provide complete disease model JSON files for the following conditions:

#### A. Top Causes of Death (Missing from Database)

1. **Suicide (10-year mortality risk)**
   - Baseline risk curves by age, sex, region
   - Risk factors: depression, anxiety, PTSD, substance abuse, social isolation, prior attempts, access to means, chronic pain, unemployment, recent life stressors
   - **Required**: Meta-analyses or large cohort studies with hazard ratios
   - **Required**: Population-level suicide rates by demographics

2. **Chronic Lower Respiratory Disease (Non-COPD)**
   - Asthma, bronchiectasis, interstitial lung disease
   - Baseline risk curves
   - Risk factors: smoking, occupational exposures, air pollution, asthma severity, medication adherence

3. **Nephritis / Kidney Failure (Advanced CKD)**
   - Advanced CKD progression to ESRD
   - Risk factors: eGFR decline rate, proteinuria, diabetes control, BP control, CKD stage

4. **Septicemia / Infections (10-year mortality risk)**
   - Baseline risk by age, sex, immune status
   - Risk factors: immunosuppression, chronic diseases, recent hospitalizations, invasive procedures

5. **Homicide (10-year mortality risk)**
   - Baseline risk by age, sex, region, ethnicity
   - Risk factors: neighborhood violence, domestic violence history, gun access, substance abuse
   - **Note**: This is sensitive - focus on objective risk factors only

6. **Aortic Aneurysm / Dissection (10-year)**
   - Baseline risk
   - Risk factors: family history, smoking, hypertension, connective tissue disorders, atherosclerosis

7. **Hypertensive Disease (10-year)**
   - Malignant hypertension, hypertensive crisis mortality
   - Risk factors: uncontrolled BP, medication non-adherence, secondary hypertension causes

8. **Parkinson's Disease (10-year mortality)**
   - Baseline risk by age, sex
   - Risk factors: disease duration, motor severity, cognitive impairment, falls, dysautonomia

9. **Atherosclerotic Vascular Disease (Non-cardiac, non-stroke)**
   - Peripheral artery disease, mesenteric ischemia
   - Risk factors: smoking, diabetes, PAD severity, ABI

#### B. Additional Cancers (High Incidence)

10. **Skin Cancer (Melanoma) - 10-year mortality**
    - Baseline risk by skin type, region
    - Risk factors: sun exposure, tanning bed use, number of moles, family history, prior skin cancer, immunosuppression

11. **Ovarian Cancer - 10-year**
    - Baseline risk by age, ethnicity
    - Risk factors: family history, BRCA mutations, nulliparity, endometriosis, HRT

12. **Stomach Cancer - 10-year**
    - Baseline risk
    - Risk factors: H. pylori infection, family history, diet (processed/smoked foods), smoking, pernicious anemia

13. **Leukemia / Lymphoma - 10-year**
    - Baseline risk by age, type (AML, CML, ALL, NHL, HL)
    - Risk factors: radiation exposure, chemotherapy exposure, family history, immune disorders

14. **Thyroid Cancer - 10-year**
    - Baseline risk
    - Risk factors: radiation exposure (especially childhood), family history, iodine deficiency

15. **Oral / Pharyngeal Cancer - 10-year**
    - Baseline risk
    - Risk factors: smoking, alcohol, HPV infection, betel nut use, poor oral hygiene

### Task 3.2: ENHANCE Existing Disease Models

For each existing model, please provide:

#### A. Additional Baseline Risk Curves

Add baseline risk curves for:
- **Hispanic/Latino populations** (for all models)
- **Asian populations** (for all models)
- **European populations** (for CVD, cancers)
- **Age ranges**: Extend to younger ages (30+) and older ages (80-100) where data exists

#### B. Additional Risk Factors for Existing Models

Please research and provide risk factors in our JSON format for:

**CVD** (add to cvd.json):
- Lipoprotein(a) [Lp(a)] levels
- Apolipoprotein B (ApoB) levels
- High-sensitivity C-reactive protein (hs-CRP)
- Coronary artery calcium (CAC) score
- Family history of early CVD
- Erectile dysfunction (male-specific risk factor)
- Migraine with aura (female-specific)
- Rheumatoid arthritis
- Psoriasis
- Chronic kidney disease (as CVD risk factor)
- Sleep apnea
- Depression
- Omega-3 fatty acid intake
- Mediterranean diet adherence

**Stroke** (add to stroke.json):
- Migraine with aura
- Oral contraceptive use
- Carotid artery stenosis
- Left atrial enlargement
- Sleep apnea
- Sickle cell disease

**Type 2 Diabetes** (add to type2-diabetes.json):
- Sleep duration (U-shaped)
- Shift work
- Gestational diabetes history (female)
- Polycystic ovary syndrome (female)
- Depression
- Antipsychotic medication use
- Statin use (diabetogenic effect)
- Sedentary time

**Alzheimer's/Dementia** (add to alzheimers-dementia.json):
- Hearing loss (untreated)
- Vision impairment
- Air pollution exposure
- Traumatic brain injury history
- Alcohol consumption (J-shaped curve)
- Anticholinergic medication burden
- Depression (midlife vs late-life)
- Sleep quality / sleep disorders
- Multilingualism (protective)

**Breast Cancer** (add to breast-cancer.json):
- Breast density (mammographic density)
- HRT type (estrogen-only vs combination)
- Oral contraceptive use (duration, recency)
- Breastfeeding duration (protective)
- Night shift work
- Alcohol timing (adolescent vs adult)

**Colorectal Cancer** (add to colorectal-cancer.json):
- Aspirin use (protective)
- Calcium intake
- Vitamin D levels
- Fiber intake
- Red meat consumption
- Physical activity level
- Inflammatory bowel disease duration/severity

**Lung Cancer** (add to lung-cancer.json):
- Radon exposure
- Secondhand smoke exposure
- Dietary antioxidant intake
- Fruit/vegetable consumption
- Arsenic in drinking water

**Prostate Cancer** (add to prostate-cancer.json):
- Dairy consumption
- Lycopene intake
- Vitamin E supplementation
- Selenium levels
- Ejaculation frequency (protective)

**COPD** (add to copd.json):
- Alpha-1 antitrypsin deficiency
- Childhood respiratory infections
- Occupational dust/fume exposure
- Indoor air pollution (cooking fuel)
- Tuberculosis history

### Task 3.3: Age-Specific Risk Models

Some conditions have very different risk profiles at different life stages. Please provide age-stratified models for:

1. **Sudden Cardiac Death in Young Adults (18-45)**
   - Baseline risk
   - Risk factors: hypertrophic cardiomyopathy, long QT syndrome, Brugada syndrome, arrhythmogenic RV cardiomyopathy, myocarditis, cocaine/stimulant use, family history of sudden death

2. **Pregnancy-Related Mortality (Maternal Mortality)**
   - Baseline risk by age, race, region
   - Risk factors: pre-eclampsia, gestational diabetes, placenta previa, multiple pregnancies, maternal age >35 or <20, obesity, hypertension, prior C-section

3. **Infant Mortality (0-1 year)**
   - Baseline risk by region, race
   - Risk factors: prematurity, low birth weight, congenital anomalies, SIDS risk factors, maternal smoking, maternal age, prenatal care

### Task 3.4: Mental Health Mortality Risks

Expand mental health-related mortality:

1. **Depression (10-year mortality from all causes)**
   - Baseline risk by severity (mild, moderate, severe)
   - Risk factors: treatment resistance, suicidal ideation, comorbid anxiety, substance abuse, social isolation, chronic pain, recent diagnosis vs chronic

2. **Anxiety Disorders (10-year mortality)**
   - Baseline risk by type (GAD, panic disorder, PTSD)
   - Risk factors: severity, comorbid depression, substance use, cardiovascular disease

3. **Bipolar Disorder (10-year mortality)**
   - Baseline risk
   - Risk factors: medication non-adherence, rapid cycling, mixed episodes, substance abuse, suicide attempts

4. **Schizophrenia (10-year mortality)**
   - Baseline risk
   - Risk factors: medication non-adherence, negative symptoms, substance abuse, metabolic syndrome, tardive dyskinesia

### Task 3.5: Infectious Disease Mortality

1. **HIV/AIDS (10-year mortality)**
   - Baseline risk by CD4 count, viral load
   - Risk factors: ART adherence, opportunistic infections, substance abuse, hepatitis coinfection

2. **Tuberculosis (10-year mortality if active TB)**
   - Baseline risk by drug resistance
   - Risk factors: HIV coinfection, diabetes, malnutrition, treatment adherence

3. **COVID-19 (Long COVID mortality risk over 10 years)**
   - Baseline risk by initial severity
   - Risk factors: age, vaccination status, comorbidities, long COVID symptoms

### Task 3.6: Autoimmune / Inflammatory Disease Mortality

1. **Systemic Lupus Erythematosus (SLE) - 10-year**
   - Baseline risk by age, ethnicity
   - Risk factors: kidney involvement, CNS involvement, disease activity, autoantibodies

2. **Rheumatoid Arthritis (RA) - 10-year**
   - Baseline risk
   - Risk factors: seropositivity, disease duration, extra-articular manifestations, DMARD use, cardiovascular risk

3. **Inflammatory Bowel Disease (IBD) - 10-year**
   - Crohn's disease vs ulcerative colitis
   - Risk factors: disease extent, surgical history, immunosuppression, colorectal cancer risk

---

## Section 4: Research Methodology Guidelines

### 4.1 Evidence Quality Requirements

**REQUIRED for all submissions**:
- [ ] Baseline risks from population-level epidemiological studies or national registries
- [ ] Hazard ratios from meta-analyses (preferred) or large cohort studies (n>10,000)
- [ ] 95% confidence intervals for all hazard ratios where available
- [ ] DOI citations for all primary evidence
- [ ] Evidence level classification (meta_analysis > cohort > rct > case_control)

**Preferred Sources**:
- Systematic reviews and meta-analyses (Cochrane, USPSTF, etc.)
- Large prospective cohorts (Framingham, Nurses' Health Study, ARIC, etc.)
- National registries (SEER, CDC WONDER, WHO mortality database)
- Validated risk calculators (if evidence-based)

### 4.2 Baseline Risk Extraction

For baseline risk curves, provide:
1. **Source**: Name of population study or registry
2. **DOI/URL**: Direct link to source data
3. **Age range**: Applicable age range for the curve
4. **Stratification**: Sex, ethnicity/race, region
5. **Risk values**: Age-specific 10-year mortality/incidence rates
   - At minimum: ages 40, 50, 60, 70, 80 (if applicable)
   - Ideally: 5-year intervals from age 30-90
6. **Confidence intervals**: If available from source
7. **Notes**: Any important context (e.g., "pre-screening era" vs "modern screening")

**Example Baseline Risk Extraction**:
```json
{
  "id": "white_male_us",
  "applicability": {
    "sex": "male",
    "ethnicity": ["white", "caucasian"],
    "region": ["US", "North America"],
    "ageRange": [40, 79]
  },
  "source": "SEER Cancer Statistics Review, 1975-2018",
  "doi": "10.xxxxx",
  "url": "https://seer.cancer.gov/statfacts/",
  "notes": "Incidence rates per 100,000, converted to 10-year risk",
  "ageRiskMapping": [
    { "age": 40, "risk": 0.0015, "confidence": [0.0012, 0.0018] },
    { "age": 50, "risk": 0.0042, "confidence": [0.0038, 0.0046] },
    { "age": 60, "risk": 0.0095, "confidence": [0.0088, 0.0102] },
    { "age": 70, "risk": 0.0168, "confidence": [0.0155, 0.0181] }
  ]
}
```

### 4.3 Hazard Ratio Extraction

For each risk factor, provide:
1. **Citation**: Full citation of primary evidence
2. **DOI**: Mandatory for verification
3. **Evidence level**: meta_analysis, cohort, rct, case_control
4. **Study details**: Sample size, follow-up duration, population
5. **Hazard ratio**: Point estimate
6. **95% CI**: Confidence interval (mandatory if available)
7. **Comparison**: Reference group clearly defined
8. **Adjustments**: List of confounders adjusted for
9. **Mechanism**: Brief biological explanation

**Example Hazard Ratio Extraction**:
```json
{
  "factorId": "hearing_loss",
  "name": "Untreated Hearing Loss",
  "type": "categorical",
  "evidenceStrength": "strong",
  "category": "Sensory",
  "modifiable": true,
  "citation": "Livingston et al. Dementia prevention, intervention, and care: 2020 report of the Lancet Commission. Lancet. 2020;396(10248):413-446",
  "doi": "10.1016/S0140-6736(20)30367-6",
  "evidenceLevel": "meta_analysis",
  "notes": "Midlife hearing loss (45-65y) associated with 1.9x dementia risk. Mechanism: reduced cognitive stimulation, social isolation, increased cognitive load. Hearing aids may mitigate risk.",
  "requiredFields": [
    {
      "path": "medicalHistory.hearingLoss.severity.value",
      "required": false,
      "alternatives": []
    }
  ],
  "mapping": {
    "type": "categorical",
    "categories": [
      { "value": "none", "hazardRatio": 1.0, "confidence": [0.95, 1.05] },
      { "value": "mild", "hazardRatio": 1.3, "confidence": [1.10, 1.50] },
      { "value": "moderate_severe", "hazardRatio": 1.9, "confidence": [1.60, 2.30] }
    ]
  }
}
```

### 4.4 Handling Missing Data / Limitations

If certain data elements are unavailable, please:
- **State explicitly** what is missing and why
- **Provide best available alternative** with justification
- **Note limitations** in the "notes" field
- **Flag uncertainty** in the evidence strength rating

**Do NOT**:
- Fabricate data or hazard ratios
- Use expert opinion without citation
- Extrapolate beyond what evidence supports
- Omit confidence intervals if they exist in source

---

## Section 5: Output Format Requirements

### 5.1 Deliverable Structure

Please provide your research findings as follows:

1. **Executive Summary** (1-2 pages)
   - Number of new disease models provided
   - Number of risk factors added to existing models
   - Evidence quality overview
   - Key findings and recommendations

2. **New Disease Models** (Full JSON for each)
   - Organized by category (cardiovascular, cancer, etc.)
   - Each model in complete JSON format matching Section 1.1 schema

3. **Enhancements to Existing Models** (JSON snippets)
   - Grouped by disease model filename
   - Provide complete baseline risk curves to add
   - Provide complete risk factor objects to append to riskFactors array

4. **Evidence Summary Table** (for all submissions)
   | Disease/Factor | Evidence Type | Sample Size | Follow-up | HR (95% CI) | DOI |
   |----------------|---------------|-------------|-----------|-------------|-----|
   | ... | ... | ... | ... | ... | ... |

5. **Limitations and Gaps** (1 page)
   - Areas where evidence was insufficient
   - Conflicting findings in literature
   - Recommendations for future research

### 5.2 Quality Checklist

Before submitting, verify:
- [ ] All JSON is valid (no syntax errors)
- [ ] All DOIs are correct and accessible
- [ ] All hazard ratios have citations
- [ ] All baseline risks have population sources
- [ ] All confidence intervals are included where available
- [ ] Field paths match Section 1.2 reference list
- [ ] Evidence levels are accurate (meta_analysis, cohort, etc.)
- [ ] All required schema fields are present
- [ ] Biological mechanisms are explained
- [ ] Reference groups are clearly defined for all HRs

---

## Section 6: Priority Ranking

Please prioritize your research in this order:

### Tier 1 (Highest Priority):
1. **Top 10 Causes of Death** that are missing:
   - Suicide
   - Nephritis/Kidney Failure
   - Septicemia
   - Aortic Aneurysm
   - Parkinson's Disease
   - Melanoma
   - Ovarian Cancer
   - Stomach Cancer

2. **High-Impact Risk Factor Enhancements**:
   - CVD: Family history, Lp(a), CAC score, sleep apnea
   - Alzheimer's: Hearing loss, air pollution, TBI
   - Type 2 Diabetes: Sleep duration, shift work

### Tier 2 (High Priority):
3. Additional baseline risk curves for Hispanic/Latino and Asian populations (all models)
4. Depression and anxiety mortality models
5. Pregnancy-related mortality

### Tier 3 (Medium Priority):
6. Additional cancers (leukemia, thyroid, oral)
7. Autoimmune disease models
8. Mental health disorders (bipolar, schizophrenia)

### Tier 4 (Lower Priority):
9. Infectious disease models (HIV, TB)
10. Age-specific models (sudden cardiac death in young adults, infant mortality)

---

## Section 7: Example of Ideal Submission

Here is an example of a complete new disease model submission:

```json
{
  "metadata": {
    "id": "melanoma_10year",
    "name": "Melanoma (10-year mortality)",
    "category": "cancer",
    "timeframe": 10,
    "version": "1.0.0",
    "lastUpdated": "2026-01-04",
    "sources": [
      {
        "citation": "SEER Cancer Statistics Review, Melanoma of the Skin, 1975-2018",
        "url": "https://seer.cancer.gov/statfacts/html/melan.html",
        "evidenceLevel": "cohort"
      },
      {
        "citation": "Bradford et al. Increased risk of second primary cancers after a diagnosis of melanoma. Arch Dermatol. 2010;146(3):265-72",
        "doi": "10.1001/archdermatol.2010.2",
        "evidenceLevel": "cohort"
      }
    ],
    "description": "10-year risk of melanoma incidence and mortality based on skin type, sun exposure, and genetic factors"
  },
  "baselineRisk": {
    "defaultCurve": "white_us",
    "curves": [
      {
        "id": "white_us",
        "applicability": {
          "sex": "both",
          "ethnicity": ["white", "caucasian"],
          "region": ["US"],
          "ageRange": [30, 85]
        },
        "source": "SEER 21 2015-2019, Age-Adjusted Incidence Rates",
        "url": "https://seer.cancer.gov/statfacts/html/melan.html",
        "notes": "Incidence per 100,000 converted to 10-year risk. Whites have 30x higher incidence than Blacks.",
        "ageRiskMapping": [
          { "age": 30, "risk": 0.0008 },
          { "age": 40, "risk": 0.0018 },
          { "age": 50, "risk": 0.0032 },
          { "age": 60, "risk": 0.0048 },
          { "age": 70, "risk": 0.0062 },
          { "age": 80, "risk": 0.0070 }
        ]
      },
      {
        "id": "black_us",
        "applicability": {
          "sex": "both",
          "ethnicity": ["black", "african american"],
          "region": ["US"],
          "ageRange": [30, 85]
        },
        "source": "SEER 21 2015-2019",
        "url": "https://seer.cancer.gov/statfacts/html/melan.html",
        "notes": "Much lower incidence in Black populations, but often diagnosed at later stages",
        "ageRiskMapping": [
          { "age": 30, "risk": 0.00003 },
          { "age": 40, "risk": 0.00006 },
          { "age": 50, "risk": 0.00011 },
          { "age": 60, "risk": 0.00016 },
          { "age": 70, "risk": 0.00020 },
          { "age": 80, "risk": 0.00023 }
        ]
      }
    ]
  },
  "riskFactors": [
    {
      "factorId": "family_history_melanoma",
      "name": "Family History of Melanoma",
      "type": "boolean",
      "evidenceStrength": "strong",
      "category": "Genetic",
      "modifiable": false,
      "citation": "Gandini et al. Meta-analysis of risk factors for cutaneous melanoma: III. Family history, actinic damage and phenotypic factors. Eur J Cancer. 2005;41(14):2040-59",
      "doi": "10.1016/j.ejca.2005.03.034",
      "evidenceLevel": "meta_analysis",
      "notes": "First-degree relative with melanoma increases risk 2.24-fold (95% CI: 1.62-3.10). Risk higher if multiple affected relatives or young age at diagnosis.",
      "requiredFields": [
        {
          "path": "medicalHistory.familyHistory",
          "required": false
        }
      ],
      "mapping": {
        "type": "boolean",
        "trueHazardRatio": 2.24,
        "falseHazardRatio": 1.0,
        "confidence": [1.62, 3.10]
      }
    },
    {
      "factorId": "number_of_moles",
      "name": "Number of Atypical Moles",
      "type": "categorical",
      "evidenceStrength": "strong",
      "category": "Clinical",
      "modifiable": false,
      "citation": "Gandini et al. Meta-analysis of risk factors for cutaneous melanoma: II. Sun exposure. Eur J Cancer. 2005;41(1):45-60",
      "doi": "10.1016/j.ejca.2004.10.016",
      "evidenceLevel": "meta_analysis",
      "notes": "Atypical (dysplastic) nevi are strongest clinical predictor. Each additional atypical nevus increases risk ~27%.",
      "requiredFields": [
        {
          "path": "medicalHistory.skinExam.atypicalMoles.value",
          "required": false
        }
      ],
      "mapping": {
        "type": "categorical",
        "categories": [
          { "value": "none", "hazardRatio": 1.0 },
          { "value": "1-4", "hazardRatio": 1.5 },
          { "value": "5-10", "hazardRatio": 3.0 },
          { "value": ">10", "hazardRatio": 6.0 }
        ]
      }
    },
    {
      "factorId": "sunburns_history",
      "name": "History of Severe Sunburns",
      "type": "categorical",
      "evidenceStrength": "strong",
      "category": "Environmental",
      "modifiable": false,
      "citation": "Dennis et al. Sunburns and risk of cutaneous melanoma: does age matter? A comprehensive meta-analysis. Ann Epidemiol. 2008;18(8):614-27",
      "doi": "10.1016/j.annepidem.2008.04.006",
      "evidenceLevel": "meta_analysis",
      "notes": "Childhood/adolescent sunburns carry highest risk (HR 2.02). Each additional sunburn increases risk. Mechanism: DNA damage to melanocytes during periods of rapid growth.",
      "requiredFields": [
        {
          "path": "medicalHistory.sunExposure.severeSunburns.value",
          "required": false
        }
      ],
      "mapping": {
        "type": "categorical",
        "categories": [
          { "value": "none", "hazardRatio": 1.0 },
          { "value": "1-2", "hazardRatio": 1.5 },
          { "value": "3-5", "hazardRatio": 2.0 },
          { "value": ">5", "hazardRatio": 2.5 }
        ]
      }
    }
  ]
}
```

---

## Section 8: Questions and Clarifications

If you encounter any of the following scenarios, please document them:

1. **Conflicting Evidence**: If meta-analyses provide different hazard ratios, report both and recommend which to use (most recent, largest sample, best methodology)

2. **Missing Confidence Intervals**: If hazard ratios are reported without CIs in primary literature, note this

3. **Unclear Field Mapping**: If a risk factor doesn't map cleanly to existing user profile fields, suggest a new field path following our naming conventions

4. **Regional Differences**: If risk differs substantially by region (e.g., stomach cancer in Japan vs US), provide multiple baseline curves

5. **Time-Varying Effects**: If hazard ratios change over time (e.g., smoking cessation benefits), note this and provide time-stratified HRs if available

6. **Non-Linear Relationships**: If dose-response is clearly non-linear, use "lookup" strategy with multiple points rather than "linear"

7. **Interaction Effects**: If risk factors interact (e.g., smoking + asbestos), note this in the "notes" field

---

## Section 9: Timeline and Deliverables

**Requested Timeline**: Please complete research in priority tiers:
- **Tier 1**: Deliver within 1 week
- **Tier 2**: Deliver within 2 weeks
- **Tier 3-4**: Deliver within 3-4 weeks

**Interim Deliverables Welcome**: Please submit completed disease models as you finish them rather than waiting for all research to be complete.

**Format**: Please provide:
1. Individual JSON files for each new disease model (named appropriately, e.g., `melanoma.json`)
2. A summary markdown file with evidence tables
3. A "diffs" or "additions" file showing what to add to existing models

---

## Section 10: Contact and Feedback

After receiving your submission, we will:
1. **Validate JSON syntax** and schema compliance
2. **Verify DOI citations** are accessible
3. **Review evidence quality** and appropriateness
4. **Provide feedback** on any issues or clarifications needed
5. **Integrate** validated data into the production database

**Thank you for contributing to evidence-based mortality risk assessment!**

---

## Appendix A: Evidence Level Definitions

| Level | Definition | Examples |
|-------|------------|----------|
| **meta_analysis** | Systematic review and meta-analysis of multiple RCTs or cohort studies | Cochrane reviews, pooled analyses |
| **rct** | Randomized controlled trial | Clinical trials (rare for mortality outcomes) |
| **cohort** | Prospective or retrospective cohort study | Framingham, Nurses' Health Study, SEER |
| **case_control** | Case-control study | Typically lower quality for mortality risk |
| **expert_opinion** | Consensus statements, clinical guidelines | Lowest quality, avoid if possible |

**Preference Order**: meta_analysis > rct > cohort > case_control > expert_opinion

---

## Appendix B: Common Pitfalls to Avoid

1. **Relative Risk vs Hazard Ratio**: Ensure you're using hazard ratios (time-to-event), not just odds ratios or relative risks from case-control studies

2. **Incidence vs Mortality**: Some models predict incidence (disease onset), others predict mortality (death from disease). Be clear which you're modeling.

3. **Baseline Risk Units**: Convert all baseline risks to **10-year cumulative risk** (decimal format, e.g., 0.042 = 4.2% risk over 10 years)

4. **Age-Period-Cohort Effects**: Use most recent data available, as disease incidence/mortality changes over time

5. **Selection Bias**: Recognize that some cohorts (e.g., health professionals) may not represent general population

6. **Geographic Generalizability**: US-based baseline risks may not apply to other regions

7. **Ethnicity/Race Categorization**: Use categories that match population studies (white/black/hispanic/asian are common in US data)

---

**END OF RESEARCH PROMPT**

Please begin with Tier 1 priorities and provide submissions in the format specified above. Thank you!
