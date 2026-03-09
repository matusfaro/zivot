# Diseases to Add - Prioritized by Mortality Impact

Based on CDC 2024 data and validated risk prediction model availability.

---

## Current Coverage

**Already Implemented:**
1. ✅ Heart Disease (CVD) - 683,037 deaths/year (22.2% of total)
2. ✅ Colorectal Cancer - subset of 619,812 cancer deaths
3. ✅ Lung Cancer - subset of 619,812 cancer deaths
4. ✅ Type 2 Diabetes - subset of other causes

**Current Total Coverage:** ~25% of all deaths (primarily through CVD)

---

## Top 10 Leading Causes of Death (US 2024)

| Rank | Cause | Deaths/Year | % of Total | Status |
|------|-------|-------------|------------|--------|
| 1 | Heart disease | 683,037 | 22.2% | ✅ Implemented |
| 2 | Cancer (all types) | 619,812 | 20.2% | ⚠️ Partial (2/10+ types) |
| 3 | Unintentional injuries | 196,488 | 6.4% | ❌ No model available |
| 4 | COVID-19 (2023) → Stroke (2024) | ~160,000 | 5.2% | 🟡 Models exist |
| 5 | Chronic lower respiratory | ~140,000 | 4.6% | 🟡 Models exist |
| 6 | Alzheimer's disease | ~120,000 | 3.9% | 🟡 Limited models |
| 7 | Diabetes complications | ~100,000 | 3.3% | ⚠️ Disease risk done, not complications |
| 8 | Chronic kidney disease | ~54,000 | 1.8% | 🟡 Models exist |
| 9 | Chronic liver disease | ~52,000 | 1.7% | 🟡 Models exist |
| 10 | Suicide | ~50,000 | 1.6% | ❌ Not predictive |

---

## Priority 1: HIGH IMPACT + VALIDATED MODELS + MODIFIABLE

### 1. Stroke / Cerebrovascular Disease ⭐⭐⭐⭐⭐
**Mortality Impact:** ~160,000 deaths/year (5.2% of total)
**Implementation Priority:** **HIGHEST**

**Available Models:**
- **Framingham Stroke Risk Profile** - 10-year stroke risk
- **CHA₂DS₂-VASc Score** - For atrial fibrillation patients (c-statistic: 0.644)
- **Modified-CHADS₂** - Best discrimination (c-statistic: 0.715)
- **QRISK cardiovascular** - Includes stroke prediction

**Risk Factors (Modifiable):**
- ✓ Hypertension (already collecting blood pressure)
- ✓ Atrial fibrillation
- ✓ Diabetes (already have)
- ✓ Smoking (already have)
- ✓ Age, sex (already have)
- ✓ Prior stroke/TIA
- ✓ Vascular disease
- ✓ Heart failure

**Data Requirements:**
- ⚠️ Need: Atrial fibrillation diagnosis (checkbox)
- ⚠️ Need: Heart failure diagnosis (checkbox)
- ⚠️ Need: Prior stroke/TIA (checkbox)
- ✅ Have: Blood pressure, diabetes, age, sex, vascular disease

**Implementation Difficulty:** 🟢 Easy (3-5 new input fields)

**Rationale:**
- Large mortality impact (5.2% of deaths)
- Highly validated models with good performance
- Strong overlap with existing CVD risk factors
- Very modifiable (BP control, anticoagulation, lifestyle)
- Easy to add only 3-5 new fields

---

### 2. Breast Cancer (Women) ⭐⭐⭐⭐⭐
**Mortality Impact:** ~43,000 deaths/year (largest cancer killer in women)
**Implementation Priority:** **VERY HIGH**

**Available Models:**
- **Breast Cancer Risk Assessment Tool (BCRAT/Gail Model)** - 5-year and lifetime risk
- **IBIS/Tyrer-Cuzick Model** - Includes genetic factors
- **iCARE Model** - Flexible, well-validated (AUC: 0.51-0.96 depending on factors)

**Risk Factors (Modifiable & Non-modifiable):**
- ✓ Age at first menstrual period
- ✓ Age at first live birth
- ✓ Number of first-degree relatives with breast cancer
- ✓ Number of breast biopsies
- ✓ Atypical hyperplasia
- ✓ Race/ethnicity (already have)
- ✓ BMI (already calculating)
- ⚠️ Alcohol consumption (already have)
- ⚠️ Physical activity (already have)
- ⚠️ Hormone therapy use

**Data Requirements:**
- ⚠️ Need: Reproductive history (4-5 fields)
- ⚠️ Need: Family history breast cancer
- ⚠️ Need: Breast biopsy history
- ⚠️ Need: Hormone therapy use
- ✅ Have: Age, race, BMI, alcohol, exercise

**Implementation Difficulty:** 🟡 Moderate (8-10 new fields, mostly for women)

**Rationale:**
- #1 cancer killer in women
- Excellent validated models (Gail/BCRAT used clinically)
- Can drive screening decisions (mammography timing)
- Some modifiable factors (alcohol, weight, exercise)

---

### 3. Prostate Cancer (Men) ⭐⭐⭐⭐
**Mortality Impact:** ~35,000 deaths/year (largest cancer killer in men)
**Implementation Priority:** **HIGH**

**Available Models:**
- **Prostate Cancer Prevention Trial (PCPT) Risk Calculator** - 7-year risk
- **127+ validated risk models** exist
- **PSA-based models** - Highly predictive when PSA available

**Risk Factors:**
- ✓ Age (already have)
- ✓ Race (already have) - Black men 2× risk
- ✓ Family history
- ⚠️ PSA level (if available)
- ⚠️ Digital rectal exam findings (if available)
- ⚠️ Prior negative biopsy
- ✓ BMI (already have)

**Data Requirements:**
- ⚠️ Need: Family history prostate cancer
- ⚠️ Optional: PSA level (many don't know)
- ⚠️ Optional: DRE findings
- ⚠️ Optional: Prior biopsy
- ✅ Have: Age, race, BMI

**Implementation Difficulty:** 🟢 Easy (2-3 core fields, 3-4 optional)

**Rationale:**
- #1 cancer killer in men
- Many validated models available
- Can work with minimal data (age + race + family history)
- PSA adds precision if available

---

### 4. COPD / Chronic Respiratory Disease ⭐⭐⭐⭐
**Mortality Impact:** ~140,000 deaths/year (4.6% of total)
**Implementation Priority:** **HIGH**

**Available Models:**
- **BODE Index** - BMI, Obstruction (FEV1), Dyspnea, Exercise capacity
- **ADO Index** - Age, Dyspnea, Obstruction (FEV1)
- **VAPORED Risk Score** - 7-variable model for COPD mortality

**Risk Factors (Modifiable):**
- ✓ Smoking (already have - pack-years)
- ✓ Age (already have)
- ✓ BMI (already have)
- ⚠️ FEV1 / lung function (few know this)
- ⚠️ Dyspnea severity
- ⚠️ Exercise capacity (6-min walk - already have general exercise)
- ⚠️ Oxygen saturation
- ⚠️ History of pneumonia
- ✓ Occupational exposures

**Data Requirements:**
- ⚠️ Need: COPD diagnosis (checkbox)
- ⚠️ Need: Dyspnea scale (dropdown)
- ⚠️ Optional: FEV1% predicted (if known from spirometry)
- ⚠️ Need: History of pneumonia
- ⚠️ Need: Occupational exposure (mining, farming, chemicals)
- ✅ Have: Smoking, age, BMI, exercise

**Implementation Difficulty:** 🟡 Moderate (5-6 fields, some optional)

**Rationale:**
- High mortality impact (4.6% of deaths)
- Strong link to smoking (already tracking)
- Validated models available
- Highly preventable (smoking cessation)

---

### 5. Chronic Kidney Disease ⭐⭐⭐⭐
**Mortality Impact:** ~54,000 deaths/year (1.8% of total) + major CVD risk factor
**Implementation Priority:** **HIGH**

**Available Models:**
- **Kidney Failure Risk Equation (KFRE)** - 2-year and 5-year kidney failure risk
- **Multiple validated CKD progression models** - eGFR-based

**Risk Factors:**
- ✓ Age, sex (already have)
- ⚠️ Diabetes (already have)
- ⚠️ Hypertension (BP already tracked)
- ⚠️ eGFR (estimated glomerular filtration rate)
- ⚠️ Albuminuria / proteinuria
- ⚠️ Serum albumin
- ✓ Cardiovascular disease (already tracking)
- ✓ Obesity (BMI already calculated)

**Data Requirements:**
- ⚠️ Need: Serum creatinine (for eGFR calculation)
- ⚠️ Need: Urine albumin/protein (if available)
- ⚠️ Optional: Serum albumin
- ⚠️ Need: CKD diagnosis (checkbox)
- ✅ Have: Age, sex, diabetes, BP, CVD history, BMI

**Implementation Difficulty:** 🟡 Moderate (3-4 lab values, some won't know)

**Rationale:**
- Significant mortality both direct and via CVD
- KFRE is highly validated and clinically used
- Strong modifiable components (BP, diabetes control)
- Many people know their creatinine from routine labs

---

## Priority 2: MODERATE IMPACT + MODELS EXIST

### 6. Pancreatic Cancer ⭐⭐⭐
**Mortality Impact:** ~51,000 deaths/year (very high case-fatality rate)
**Implementation Priority:** MODERATE

**Available Models:**
- **YourDiseaseRisk Pancreatic Model** - Validated in NHS/HPFS cohorts
- **Gender-specific risk models** available

**Risk Factors:**
- ✓ Smoking (already have)
- ✓ Diabetes (already have)
- ✓ Age (already have)
- ✓ BMI/obesity (already have)
- ✓ Family history pancreatic cancer
- ⚠️ Chronic pancreatitis
- ⚠️ Heavy alcohol use (already tracking alcohol)

**Data Requirements:**
- ⚠️ Need: Family history pancreatic cancer
- ⚠️ Need: Chronic pancreatitis diagnosis
- ✅ Have: Smoking, diabetes, age, BMI, alcohol

**Implementation Difficulty:** 🟢 Easy (2 new fields)

---

### 7. Liver Disease (NAFLD/NASH/Cirrhosis) ⭐⭐⭐
**Mortality Impact:** ~52,000 deaths/year (1.7% of total) + increasing rapidly
**Implementation Priority:** MODERATE

**Available Models:**
- **FIB-4 Score** - Predicts fibrosis/cirrhosis (AUROC: 0.84-0.86)
- **NAFLD Fibrosis Score** - Non-invasive fibrosis assessment
- **Markov models for NAFLD progression**

**Risk Factors:**
- ✓ Age (already have)
- ✓ BMI/obesity (already have)
- ✓ Type 2 diabetes (already have)
- ✓ Dyslipidemia (already have cholesterol)
- ⚠️ Alcohol consumption (already have)
- ⚠️ AST, ALT (liver enzymes)
- ⚠️ Platelet count
- ⚠️ Albumin

**Data Requirements:**
- ⚠️ Need: AST (liver enzyme)
- ⚠️ Need: ALT (liver enzyme)
- ⚠️ Need: Platelet count
- ⚠️ Optional: Albumin
- ⚠️ Need: NAFLD/cirrhosis diagnosis
- ✅ Have: Age, BMI, diabetes, cholesterol, alcohol

**Implementation Difficulty:** 🟡 Moderate (4 lab values + diagnosis)

**Rationale:**
- Epidemic growing rapidly (NAFLD affecting 25% of adults)
- 63% projected increase in NASH by 2030
- Highly modifiable (weight loss, diabetes control, alcohol cessation)
- FIB-4 is simple and validated

---

### 8. Alzheimer's Disease / Dementia ⭐⭐⭐
**Mortality Impact:** ~120,000 deaths/year (3.9% of total)
**Implementation Priority:** MODERATE-LOW

**Available Models:**
- **CAIDE Score** - Cardiovascular Risk Factors, Aging and Dementia
- **ANU-ADRI** - Australian National University Alzheimer Disease Risk Index
- **50+ different dementia risk models** (varying accuracy)

**Model Performance:** ⚠️ **POOR** - Current models miss 84-91% of cases at 5% false-positive rate

**Risk Factors:**
- ✓ Age (already have)
- ✓ Education level
- ✓ Hypertension (BP already tracked)
- ✓ BMI (already have)
- ✓ Cholesterol (already have)
- ✓ Physical activity (already have)
- ✓ Diabetes (already have)
- ✓ Smoking (already have)
- ⚠️ APOE-ε4 genetic status (few know this)
- ✓ Family history dementia

**Data Requirements:**
- ⚠️ Need: Education level
- ⚠️ Need: Family history dementia
- ⚠️ Optional: APOE-ε4 status
- ✅ Have: Age, BP, BMI, cholesterol, exercise, diabetes, smoking

**Implementation Difficulty:** 🟢 Easy (2-3 new fields)

**Rationale - AGAINST prioritizing:**
- ⚠️ Models have POOR predictive accuracy (c-statistic 0.49-0.96, highly variable)
- ⚠️ Limited modifiable factors beyond what we already track (vascular health)
- ⚠️ No proven pharmacological prevention
- ✅ Could add for completeness since data overlap is high

---

## Priority 3: LOWER PRIORITY / CHALLENGES

### 9. Other Cancers (Lower Individual Impact)

**Bladder Cancer:** ~17,000 deaths/year
- Models available in YourDiseaseRisk
- Main risk: Smoking (already have)

**Kidney Cancer:** ~15,000 deaths/year
- Models available in YourDiseaseRisk
- Main risks: Smoking, obesity, hypertension (all have)

**Ovarian Cancer:** ~13,000 deaths/year
- Models available
- Limited modifiable risk factors

**Stomach Cancer:** ~11,000 deaths/year
- Models available in YourDiseaseRisk
- Risk factors: H. pylori, smoking, diet

**Skin Cancer (Melanoma):** ~8,000 deaths/year
- Models available
- Main risks: UV exposure, fair skin, moles

---

## NOT RECOMMENDED

### ❌ Unintentional Injuries (196,488 deaths/year)
**Why NOT:** Not predictable with medical risk models. Highly contextual (driving behavior, occupation, accidents).

### ❌ Suicide (50,000 deaths/year)
**Why NOT:** Ethically problematic to predict. Requires mental health screening tools not appropriate for this context.

### ❌ Homicide
**Why NOT:** Not predictable with medical/health data. Sociological factors.

### ❌ COVID-19
**Why NOT:** Pandemic-specific, rapidly changing, vaccine/variant dependent. Better handled separately.

---

## RECOMMENDED IMPLEMENTATION ORDER

### Phase 2 (Next 3 Diseases)
1. **Stroke** - Highest new mortality impact (160k deaths), excellent model overlap with CVD
2. **Breast Cancer** - Top cancer killer in women, excellent models (Gail/BCRAT)
3. **Prostate Cancer** - Top cancer killer in men, simple models

**Expected New Coverage:** +240,000 deaths/year = 8% of total deaths
**Total Coverage:** ~33% of all deaths

### Phase 3 (Next 3 Diseases)
4. **COPD** - High impact (140k), strong smoking link (already tracking)
5. **Chronic Kidney Disease** - Significant impact (54k) + CVD multiplier
6. **Pancreatic Cancer** - High fatality, simple model, reuses existing data

**Expected New Coverage:** +245,000 deaths/year = 8% of total
**Total Coverage:** ~41% of all deaths

### Phase 4 (Next 2 Diseases)
7. **Liver Disease (NAFLD/Cirrhosis)** - Growing epidemic, FIB-4 validated
8. **Alzheimer's/Dementia** - High impact (120k) but poor models

**Expected New Coverage:** +172,000 deaths/year = 5.6% of total
**Total Coverage:** ~47% of all deaths

---

## IMPLEMENTATION EFFORT SUMMARY

| Disease | Deaths/Year | New Fields | Lab Values | Model Quality | Effort |
|---------|-------------|------------|------------|---------------|--------|
| **Stroke** | 160,000 | 3-5 | 0 | High (0.71 c-stat) | 🟢 Low |
| **Breast Cancer** | 43,000 | 8-10 | 0 | High (0.6-0.8 AUC) | 🟡 Med |
| **Prostate Cancer** | 35,000 | 2-3 | 1 optional | High | 🟢 Low |
| **COPD** | 140,000 | 5-6 | 1 optional | High (0.72 c-stat) | 🟡 Med |
| **CKD** | 54,000 | 3-4 | 2-3 | High (0.84 AUC) | 🟡 Med |
| **Pancreatic** | 51,000 | 2 | 0 | Moderate | 🟢 Low |
| **Liver Disease** | 52,000 | 2 | 4 | High (0.84 AUC) | 🟡 Med |
| **Alzheimer's** | 120,000 | 2-3 | 0 | ⚠️ Poor (0.5-0.7) | 🟢 Low |

---

## KEY INSIGHTS

1. **Stroke is the #1 priority** - massive impact (160k deaths), excellent models, minimal new data needed

2. **Cancer suite (breast, prostate, pancreatic)** - Collectively ~130k deaths, all have validated models

3. **Avoid "garbage in, garbage out"** - Alzheimer's models are poor predictors despite high mortality

4. **Lab values are bottleneck** - CKD and liver disease require lab tests most users won't know

5. **Gender-specific makes sense** - Breast (women) and Prostate (men) can be shown conditionally

6. **Synergy with existing data** - Stroke reuses CVD factors, COPD reuses smoking data

---

## TOTAL ADDRESSABLE MORTALITY

With all 8 recommended diseases added:

| Status | Deaths Covered | % of Total Deaths |
|--------|----------------|-------------------|
| Current (Phase 1) | ~765,000 | ~25% |
| + Phase 2 | ~1,005,000 | ~33% |
| + Phase 3 | ~1,250,000 | ~41% |
| + Phase 4 | ~1,422,000 | ~47% |

**Note:** Some overlap exists (e.g., diabetes contributes to multiple causes), so actual coverage is somewhat lower but still substantial.

---

## Sources

- [CDC 2024 Mortality Report](https://blogs.cdc.gov/nchs/2025/09/10/7840/)
- [NCHS Leading Causes of Death](https://www.cdc.gov/nchs/fastats/leading-causes-of-death.htm)
- [Stroke Risk CHA₂DS₂-VASc Validation](https://pmc.ncbi.nlm.nih.gov/articles/PMC3796700/)
- [Breast Cancer Risk Models Validation](https://pmc.ncbi.nlm.nih.gov/articles/PMC7073933/)
- [COPD Mortality Prediction Models](https://pmc.ncbi.nlm.nih.gov/articles/PMC11388367/)
- [Kidney Failure Risk Equation](https://www.kidneyfailurerisk.com/)
- [NAFLD Mortality Risk](https://journals.lww.com/hep/fulltext/2018/01000/modeling_the_epidemic_of_nonalcoholic_fatty_liver.16.aspx)
- [Alzheimer's Risk Model Performance](https://www.mdpi.com/2075-1729/14/11/1489)
