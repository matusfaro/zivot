# Disease Model Scientific Reference Research Request

## Overview

This document requests research to find scientific citations, DOI links, and URLs for disease risk models in a mortality risk calculator. The system requires evidence-based references for all baseline risk curves and risk factors to ensure medical accuracy and transparency.

## Reference Requirements

For each disease model, we need:

### 1. Baseline Risk Curves
Each baseline risk curve must have:
- **source**: Name of the population study or epidemiological database
- **doi** OR **url**: Link to the data source
- **notes** (optional): Context about the data source, limitations, population characteristics

### 2. Risk Factors
Each risk factor must have:
- **citation**: Short citation to the study establishing the risk factor relationship
- **doi** OR **url**: Link to the evidence
- **evidenceLevel**: Classification of evidence quality (meta_analysis, rct, cohort, case_control, expert_opinion)
- **notes** (optional): Effect size details, dose-response information, limitations

### 3. Metadata Sources
Each disease model's metadata.sources array needs:
- **citation**: Full citation to primary studies
- **doi** OR **url**: Link to the publication
- **evidenceLevel**: Quality classification

---

## Disease Models Classification

### Category A: Fully Compliant (Reference Only - No Action Needed)
These models already have complete references and serve as examples:

1. **cvd.json** - Cardiovascular Disease ✅
2. **colorectal-cancer.json** - Colorectal Cancer ✅
3. **lung-cancer.json** - Lung Cancer ✅
4. **type2-diabetes.json** - Type 2 Diabetes ✅

---

### Category B: Partially Complete (Need Minor Additions)

#### 5. Stroke (stroke.json)

**Status**: Has some references but missing DOIs/URLs

**Missing Information Needed**:

**Baseline Risk Curves** (3 curves need sources):
- `male_us` (ages 40-79): Need population study for male stroke incidence rates in US
- `female_us` (ages 40-79): Need population study for female stroke incidence rates in US
- `generic` (ages 40-79): Need generic/international stroke incidence data

**Risk Factors Needing Citations**:
1. **atrial_fibrillation** - Need study showing stroke HR for atrial fibrillation (~5.0)
2. **blood_pressure_stroke** - Need study for systolic BP and stroke risk (escalating HR by BP level)
3. **diabetes_stroke** - Need study showing stroke HR for diabetes (~2.0)
4. **smoking_stroke** - Need study for smoking status and stroke risk (never: 1.0, former: 1.3, current: 2.0)

**Metadata Sources**:
- Currently has generic "American Heart Association / American Stroke Association Guidelines" - need specific DOI

**Research Questions**:
- What are the landmark stroke epidemiology studies for US populations?
- What studies established atrial fibrillation as a major stroke risk factor with HR ~5.0?
- What meta-analyses cover blood pressure and stroke risk?

---

#### 6. Breast Cancer (breast-cancer.json)

**Status**: Has some structure but missing specific citations

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `female_us` (ages 30-89): Need source for breast cancer incidence in US females (likely SEER data)
- `female_high_risk` (ages 30-89): Need source for high-risk populations

**Risk Factors Needing Citations**:
1. **age_first_birth_breast** - Need study for age at first birth and breast cancer risk
2. **alcohol_breast** - Need study for alcohol consumption (drinks/week) and breast cancer HR
3. **bmi_postmenopausal_breast** - Need study for BMI and postmenopausal breast cancer risk
4. **family_history_breast** - Need study for family history HR (~2.0)
5. **hormone_replacement_therapy** - Need study for HRT duration and breast cancer risk
6. **reproductive_history_breast** - Need study for number of births and breast cancer protection

**Metadata Sources**:
- Need primary sources for breast cancer risk models (possibly Gail Model, Tyrer-Cuzick model)

**Research Questions**:
- What are the validated breast cancer risk models (Gail, Tyrer-Cuzick, BCRAT)?
- What large cohort studies established HRT and breast cancer association?
- Where does SEER publish breast cancer incidence data by age?

---

#### 7. Prostate Cancer (prostate-cancer.json)

**Status**: Has basic structure but missing all citations

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 40-89): Need source for prostate cancer incidence in US males (likely SEER)
- `male_african_american` (ages 40-89): Need source showing elevated risk in African American males

**Risk Factors Needing Citations**:
1. **age_prostate** - Baseline is age-based, need epidemiological source
2. **family_history_prostate** - Need study for family history HR (~2.5)
3. **race_african_american_prostate** - Need study confirming elevated risk in African American men (~1.6)

**Metadata Sources**:
- Need primary epidemiological sources for prostate cancer incidence

**Research Questions**:
- What are the SEER data sources for prostate cancer incidence by race?
- What studies established family history as major prostate cancer risk factor?
- What explains the racial disparity in prostate cancer incidence?

---

### Category C: Needs Extensive Research (Missing Most Citations)

#### 8. COPD Mortality (copd.json)

**Status**: Has baseline curves but missing all risk factor citations

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 40-79): Need COPD mortality rates for US males
- `female_us` (ages 40-79): Need COPD mortality rates for US females

**Risk Factors Needing Citations**:
1. **smoking_copd** - Need study for pack-years and COPD mortality (linear relationship, coefficient: 0.03)
2. **air_pollution_copd** - Need study for air quality and COPD mortality
3. **occupational_exposure_copd** - Need study for occupational exposures (dust, chemicals, fumes)

**Metadata Sources**:
- Need COPD epidemiology sources (possibly NHANES, GOLD guidelines)

**Research Questions**:
- What are the landmark studies on smoking pack-years and COPD mortality?
- What studies quantify air pollution's effect on COPD mortality?
- Where is the best source for COPD mortality baseline rates?

---

#### 9. Chronic Kidney Disease Progression (chronic-kidney-disease.json)

**Status**: Has structure but missing all scientific sources

**Missing Information Needed**:

**Baseline Risk Curves** (3 curves need sources):
- `ckd_stage_3` (ages 40-79): Need progression rates for CKD stage 3
- `ckd_stage_4` (ages 40-79): Need progression rates for CKD stage 4
- `ckd_generic` (ages 40-79): Need generic CKD progression data

**Risk Factors Needing Citations**:
1. **diabetes_ckd** - Need study for diabetes and CKD progression HR (~2.0)
2. **hypertension_ckd** - Need study for hypertension and CKD progression HR (~1.5)
3. **proteinuria_ckd** - Need study for proteinuria levels and progression risk
4. **egfr_decline** - Need study for eGFR decline rate and kidney failure risk

**Metadata Sources**:
- Need nephrology studies on CKD progression (possibly KDIGO guidelines, cohort studies)

**Research Questions**:
- What are the validated CKD progression models?
- What studies established diabetes as major CKD progression accelerator?
- Where can we find CKD stage-specific progression rates?

---

#### 10. Pancreatic Cancer (pancreatic-cancer.json)

**Status**: Has baseline but missing all risk factor sources

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 40-79): Need pancreatic cancer incidence for US males (SEER)
- `female_us` (ages 40-79): Need pancreatic cancer incidence for US females (SEER)

**Risk Factors Needing Citations**:
1. **smoking_pancreatic** - Need study for smoking and pancreatic cancer HR (~2.0)
2. **diabetes_pancreatic** - Need study for diabetes and pancreatic cancer HR (~2.0)
3. **chronic_pancreatitis** - Need study for chronic pancreatitis HR (~13.0 - very high!)
4. **family_history_pancreatic** - Need study for family history HR (~2.0)
5. **alcohol_pancreatic** - Need study for heavy alcohol use and pancreatic cancer

**Metadata Sources**:
- Need pancreatic cancer epidemiology sources

**Research Questions**:
- What studies established chronic pancreatitis as major pancreatic cancer risk (HR ~13)?
- What is the diabetes-pancreatic cancer connection mechanism?
- Where is SEER pancreatic cancer incidence data?

---

#### 11. NAFLD/Liver Disease Cirrhosis (liver-disease.json)

**Status**: Missing all citations and sources

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 30-79): Need NAFLD/cirrhosis progression rates for males
- `female_us` (ages 30-79): Need NAFLD/cirrhosis progression rates for females

**Risk Factors Needing Citations**:
1. **obesity_nafld** - Need study for BMI and NAFLD progression to cirrhosis
2. **diabetes_nafld** - Need study for diabetes and NAFLD progression HR (~2.0)
3. **alcohol_nafld** - Need study for alcohol consumption and liver disease progression
4. **metabolic_syndrome_nafld** - Need study for metabolic syndrome components

**Metadata Sources**:
- Need hepatology sources (possibly NASH/NAFLD cohort studies)

**Research Questions**:
- What are the validated NAFLD progression models?
- What studies quantify progression from NAFLD to cirrhosis?
- What is the interaction between alcohol, obesity, and diabetes in liver disease?

---

#### 12. Alzheimer's Disease / Dementia (alzheimers-dementia.json)

**Status**: Missing all citations

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 60-89): Need dementia incidence for older US males
- `female_us` (ages 60-89): Need dementia incidence for older US females (higher than males)

**Risk Factors Needing Citations**:
1. **apoe4_carrier** - Need study for APOE4 genotype and dementia risk (HR ~3.0 for heterozygous, ~12.0 for homozygous)
2. **education_level** - Need study for education as protective factor
3. **cardiovascular_risk_dementia** - Need study linking CV risk factors to dementia
4. **physical_activity_dementia** - Need study for exercise and dementia prevention
5. **social_engagement** - Need study for social activities and cognitive decline

**Metadata Sources**:
- Need neurology/aging studies (possibly Framingham Heart Study dementia cohort, REGARDS study)

**Research Questions**:
- What studies established APOE4 as major genetic risk factor?
- What is the evidence for "cognitive reserve" (education, social engagement)?
- What large cohort studies track dementia incidence?

---

### Category D: Injury/Accident Models (Need Actuarial/Statistical Sources)

#### 13. Motor Vehicle Crashes (motor-vehicle-crash.json)

**Status**: Missing all sources

**Missing Information Needed**:

**Baseline Risk Curves** (4 curves need sources):
- `male_young_us` (ages 16-30): Need crash fatality rates for young males
- `male_middle_us` (ages 31-65): Need crash fatality rates for middle-aged males
- `female_young_us` (ages 16-30): Need crash fatality rates for young females
- `female_middle_us` (ages 31-65): Need crash fatality rates for middle-aged females

**Risk Factors Needing Citations**:
1. **alcohol_crash** - Need study for alcohol use and crash risk
2. **annual_mileage** - Need study for miles driven and crash probability
3. **seatbelt_use** - Need study for seatbelt protection factor (~0.5)

**Metadata Sources**:
- Need NHTSA (National Highway Traffic Safety Administration) data
- Need CDC injury mortality statistics

**Research Questions**:
- Where does NHTSA publish crash fatality rates by age/sex?
- What studies quantify seatbelt effectiveness?
- What is the relationship between annual mileage and crash risk?

---

#### 14. Falls (falls.json)

**Status**: Missing all sources

**Missing Information Needed**:

**Baseline Risk Curves** (4 curves need sources):
- `male_young_us` (ages 40-64): Need fall fatality rates for younger males
- `male_elderly_us` (ages 65-89): Need fall fatality rates for elderly males
- `female_young_us` (ages 40-64): Need fall fatality rates for younger females
- `female_elderly_us` (ages 65-89): Need fall fatality rates for elderly females (higher than males)

**Risk Factors Needing Citations**:
1. **age_falls** - Age is major risk factor, need geriatric fall studies
2. **balance_impairment** - Need study for balance/gait issues and fall risk
3. **medication_count** - Need study for polypharmacy and fall risk
4. **previous_falls** - Need study for fall history predicting future falls

**Metadata Sources**:
- Need CDC injury data for falls
- Need geriatric medicine fall prevention studies

**Research Questions**:
- What are the CDC statistics on fall-related deaths by age/sex?
- What studies established polypharmacy as fall risk factor?
- What validated fall risk assessment tools exist?

---

#### 15. Influenza and Pneumonia (influenza-pneumonia.json)

**Status**: Missing all sources

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 40-89): Need flu/pneumonia mortality for males
- `female_us` (ages 40-89): Need flu/pneumonia mortality for females

**Risk Factors Needing Citations**:
1. **age_flu** - Need study for age and flu/pneumonia mortality risk
2. **vaccination_status** - Need study for flu vaccine effectiveness (~0.4 HR reduction)
3. **chronic_lung_disease** - Need study for underlying lung disease and flu mortality HR (~3.0)
4. **immunocompromised** - Need study for immunocompromised status and infection risk

**Metadata Sources**:
- Need CDC flu surveillance data
- Need vaccine effectiveness studies

**Research Questions**:
- Where does CDC publish flu/pneumonia mortality by age?
- What are the landmark flu vaccine effectiveness studies?
- What studies quantify flu risk in immunocompromised patients?

---

#### 16. Drug Overdose (drug-overdose.json)

**Status**: Missing all sources

**Missing Information Needed**:

**Baseline Risk Curves** (4 curves need sources):
- `male_young_us` (ages 18-40): Need overdose mortality for young males
- `male_middle_us` (ages 41-64): Need overdose mortality for middle-aged males
- `female_young_us` (ages 18-40): Need overdose mortality for young females
- `female_middle_us` (ages 41-64): Need overdose mortality for middle-aged females

**Risk Factors Needing Citations**:
1. **opioid_prescription** - Need study for prescription opioid use and overdose risk
2. **substance_use_history** - Need study for substance use disorder and overdose mortality
3. **mental_health_conditions** - Need study for depression/anxiety and overdose risk
4. **polysubstance_use** - Need study for combining substances and overdose risk

**Metadata Sources**:
- Need CDC WONDER database overdose statistics
- Need SAMHSA substance abuse data

**Research Questions**:
- Where does CDC publish overdose death rates by age/sex?
- What studies established mental health as overdose risk factor?
- What is the evidence for polysubstance use increasing mortality?

---

### Category E: Rare Cancers (Need Oncology Literature)

#### 17. Esophageal Cancer (esophageal-cancer.json)

**Status**: Missing all sources

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 40-79): Need esophageal cancer incidence for males (likely SEER)
- `female_us` (ages 40-79): Need esophageal cancer incidence for females

**Risk Factors Needing Citations**:
1. **smoking_esophageal** - Need study for smoking and esophageal cancer HR
2. **alcohol_esophageal** - Need study for alcohol and esophageal cancer HR
3. **gerd_esophageal** - Need study for chronic GERD/Barrett's esophagus and cancer risk (~10.0 HR)
4. **obesity_esophageal** - Need study for obesity and esophageal adenocarcinoma

**Metadata Sources**:
- Need GI oncology sources

**Research Questions**:
- What studies established Barrett's esophagus as major risk factor (HR ~10)?
- What is the smoking-alcohol synergy in esophageal cancer?
- Where is SEER esophageal cancer incidence data?

---

#### 18. Liver Cancer (liver-cancer.json)

**Status**: Missing all sources

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 40-79): Need liver cancer (HCC) incidence for males
- `female_us` (ages 40-79): Need liver cancer incidence for females

**Risk Factors Needing Citations**:
1. **hepatitis_b** - Need study for chronic HBV and HCC risk (~15.0 HR - very high!)
2. **hepatitis_c** - Need study for chronic HCV and HCC risk (~17.0 HR - very high!)
3. **cirrhosis_any_cause** - Need study for cirrhosis and HCC development (~5.0 HR)
4. **alcohol_liver_cancer** - Need study for heavy alcohol use and HCC
5. **aflatoxin_exposure** - Need study for aflatoxin contamination and liver cancer

**Metadata Sources**:
- Need hepatology/oncology sources

**Research Questions**:
- What studies established hepatitis B/C as major HCC risk factors?
- What is the progression rate from cirrhosis to HCC?
- Where is SEER liver cancer incidence data?

---

#### 19. Bladder Cancer (bladder-cancer.json)

**Status**: Missing all sources

**Missing Information Needed**:

**Baseline Risk Curves** (2 curves need sources):
- `male_us` (ages 40-79): Need bladder cancer incidence for males (3-4x higher than females)
- `female_us` (ages 40-79): Need bladder cancer incidence for females

**Risk Factors Needing Citations**:
1. **smoking_bladder** - Need study for smoking and bladder cancer HR (~3.0)
2. **occupational_exposure_bladder** - Need study for aromatic amines, dyes, chemicals and bladder cancer
3. **chronic_bladder_infection** - Need study for recurrent infections/stones and cancer risk

**Metadata Sources**:
- Need urologic oncology sources

**Research Questions**:
- What studies established smoking as primary bladder cancer risk?
- What occupations have elevated bladder cancer risk (dye workers, painters)?
- Where is SEER bladder cancer incidence data?

---

## Research Output Format

For each disease model, please provide:

### Template:

**Disease: [Disease Name]**

**Baseline Risk Curve Sources:**
```
[curve_id]:
  - source: "[Population study name]"
  - doi: "[DOI if available]"
  - url: "[URL if no DOI]"
  - notes: "[Context about data]"
```

**Risk Factor Citations:**
```
[factor_id]:
  - citation: "[Study citation]"
  - doi: "[DOI if available]"
  - url: "[URL if no DOI]"
  - evidenceLevel: "[meta_analysis/rct/cohort/case_control/expert_opinion]"
  - notes: "[Effect size, confidence intervals, study details]"
```

**Metadata Primary Sources:**
```
- citation: "[Full citation]"
  doi: "[DOI]"
  evidenceLevel: "[Level]"
```

---

## Priority Order

**High Priority** (Impact on many users):
1. Stroke
2. Breast Cancer
3. Prostate Cancer
4. Alzheimer's/Dementia
5. Falls (elderly)

**Medium Priority**:
6. COPD
7. Chronic Kidney Disease
8. Motor Vehicle Crashes
9. Influenza/Pneumonia
10. Drug Overdose

**Lower Priority** (Rare diseases):
11. Pancreatic Cancer
12. Liver Disease/NAFLD
13. Esophageal Cancer
14. Liver Cancer
15. Bladder Cancer

---

## Preferred Data Sources

**Epidemiological Data:**
- SEER (Surveillance, Epidemiology, and End Results Program)
- CDC WONDER Database
- CDC National Vital Statistics System
- National Health and Nutrition Examination Survey (NHANES)

**Systematic Reviews & Meta-Analyses:**
- Cochrane Library
- PubMed/MEDLINE systematic reviews
- Lancet, JAMA, NEJM high-impact studies

**Clinical Guidelines:**
- American Heart Association (AHA)
- American Cancer Society (ACS)
- US Preventive Services Task Force (USPSTF)
- KDIGO (Kidney Disease: Improving Global Outcomes)
- GOLD (Global Initiative for Chronic Obstructive Lung Disease)

**Validated Risk Calculators:**
- Framingham Risk Score
- ASCVD Risk Calculator
- Gail Model (breast cancer)
- FRAX (fracture risk)

---

## Important Notes

1. **Evidence Quality**: Prefer meta-analyses and large cohort studies over single studies or expert opinion
2. **Recency**: Prefer recent studies (last 10 years) but landmark older studies are acceptable
3. **Population Relevance**: Prefer US population data where available; note if using international data
4. **Quantitative Data**: We need specific hazard ratios (HR), relative risks (RR), or odds ratios (OR) with confidence intervals
5. **Open Access**: When possible, prefer sources with DOIs and publicly accessible links

---

## Questions?

If any disease model's risk factors seem medically implausible (e.g., HR of 13.0 for chronic pancreatitis → pancreatic cancer), please flag for review and provide the actual evidence-based range.

If baseline risk curves seem to have unusual age patterns, please note any discrepancies with known epidemiology.

---

**Thank you for your research assistance!**
