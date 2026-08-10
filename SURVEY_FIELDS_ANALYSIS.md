# Survey Fields Analysis - Used vs Unused in Risk Calculations

**Analysis Date**: 2026-01-04
**Total Survey Questions**: ~70
**Questions with UNUSED or MISMATCHED fields**: 42-47

---

## Categories of Issues

### 1. COMPLETELY UNUSED FIELDS (35 questions)

These fields are captured but never referenced in any disease model:

#### Lifestyle
- `lifestyle.sleep.averageHoursPerNight` - sleep question
- `lifestyle.sleep.sleepQuality` - sleep question
- `lifestyle.stress` - stress question
- `lifestyle.sunExposure` - sunExposure question
- `lifestyle.helmetUse` - helmet question
- `lifestyle.recreationalDrugs` - drugs question
- `lifestyle.marijuana` - marijuana question
- `lifestyle.musicListening` - music question
- `lifestyle.gaming` - gaming question
- `lifestyle.screenTime` - screenTime question
- `lifestyle.dentalHygiene` - teeth question
- `lifestyle.flossing` - floss question
- `lifestyle.bloodDonation` - bloodDonation question

#### Environmental Exposures
- `lifestyle.airQualityExposure` - airQuality question
- `lifestyle.waterQuality` - waterQuality question
- `lifestyle.pesticideExposure` - pesticides question
- `lifestyle.radiationExposure` - radiation question
- `lifestyle.pollutionExposure` - pollution question
- `lifestyle.noiseExposure` - noise question
- `lifestyle.moldExposure` - mold question
- `lifestyle.leadExposure` - leadPaint question
- `lifestyle.asbestosExposure` - asbestos question (disease models use `customFields.asbestosExposure`)

#### Social/Wellbeing
- `social.volunteering.active` - volunteering question
- `social.petOwnership.ownsDog` - dog_ownership/pets questions
- `social.hobbies.creative.engaged` - creative_hobbies/hobbies questions
- `social.hobbies.intellectual.engaged` - reading question
- `social.religiousAttendance` - religious_attendance/religion questions
- `lifestyle.outdoorTime.minutesPerWeek` - nature_exposure/outdoorTime/nature questions

#### Medications
- `medicalHistory.medications.statin` - statin question
- `medicalHistory.medications.aspirin` - aspirin question
- `medicalHistory.medications.hrt` - hrt question

#### Preventive Care/Screenings
- `medicalHistory.screenings.colonoscopy` - colonoscopy question
- `medicalHistory.screenings.mammogram` - mammogram question
- `medicalHistory.screenings.dental` - dentist question
- `medicalHistory.screenings.vision` - vision question
- `medicalHistory.screenings.hearing` - hearing question (NOT IN SURVEY YET)

#### Reproductive
- `reproductiveHistory.contraceptionUse` - contraception question

---

### 2. PATH MISMATCHES (7 questions)

Survey writes to one location, but disease models read from a different location:

| Survey Question ID | Survey Writes To | Disease Models Read From | Affected Models |
|-------------------|------------------|--------------------------|-----------------|
| `opioids` | `lifestyle.opioidUse` | `medicalHistory.substanceUse.prescribedOpioids` | Drug Overdose |
| `socialConnection` / `social_connections` | `social.connections.strength` | `lifestyle.socialEngagement` | Alzheimer's |
| `prediabetic` | `labTests.metabolicPanel.hba1c` | `labTests.metabolicPanel.glucose.value` | Type 2 Diabetes |
| `asbestos` | `lifestyle.asbestosExposure` | `customFields.asbestosExposure` | Lung Cancer |
| `bloodPressureMeds` | `medicalHistory.medications.bloodPressureMeds` | `medicalHistory.medications.takesBloodPressureMeds` | Falls |

**Note on Depression**:
- Survey writes to `medicalHistory.conditions` array with `conditionId: 'depression'`
- Drug Overdose model reads from `medicalHistory.mentalHealth.depressionDiagnosis.value`
- This is a mismatch, but depression may still be checked via conditions array

---

### 3. PARTIALLY USED FIELDS (3 questions)

Some fields are used, others from the same question are not:

#### exercise question
- ✓ `lifestyle.exercise.moderateMinutesPerWeek` - USED (5 diseases)
- ✗ `lifestyle.exercise.vigorousMinutesPerWeek` - NOT USED

#### alcohol question
- ✓ `lifestyle.alcohol.drinksPerWeek` - USED (8 diseases)
- ✗ `lifestyle.alcohol.bingeDrinking` - NOT USED
- ✗ `lifestyle.alcohol.pattern` - NOT USED

#### diet question
- ✓ `lifestyle.diet.vegetableServingsPerDay` - USED (Type 2 Diabetes)
- ✓ `lifestyle.diet.processedMeatServingsPerWeek` - USED (Colorectal Cancer)
- ✗ `lifestyle.diet.fruitServingsPerDay` - NOT USED
- ✗ `lifestyle.diet.pattern` - NOT USED

---

### 4. POTENTIALLY UNUSED CONDITION FLAGS (5 questions)

These write to `medicalHistory.conditions` array, but specific condition checks may not exist:

- `anxiety` - May not be specifically checked by any disease model
- `bipolar` - May not be specifically checked by any disease model
- `ptsd` - May not be specifically checked by any disease model
- `eatingDisorder` - May not be specifically checked by any disease model
- `asthma` - May not be specifically checked by any disease model

**Note**: Disease models often check `medicalHistory.conditions` generically or look for specific condition IDs. Need to verify which conditions are actually checked.

---

## Summary Statistics

| Category | Count | % of Total |
|----------|-------|------------|
| Completely Unused | 35 | ~50% |
| Path Mismatches | 7 | ~10% |
| Partially Used | 3 | ~4% |
| **Total Issues** | **45** | **~64%** |

---

## Action Items

### Priority 1: Fix Path Mismatches
- [ ] Fix opioids field path
- [ ] Fix social connections field path
- [ ] Fix prediabetic field path
- [ ] Fix asbestos field path
- [ ] Fix bloodPressureMeds field path
- [ ] Fix depression field path

### Priority 2: Research Evidence for Unused Fields
Create research prompts to find scientific evidence for:
- Sleep quality/duration and mortality
- Stress and mortality
- Sun exposure and mortality
- Environmental exposures (air quality, water quality, noise, etc.)
- Social factors (volunteering, pet ownership, hobbies, religious attendance)
- Preventive care (screenings, vaccinations)
- Dental health and mortality
- Medications (statins, aspirin, HRT)

### Priority 3: Decide on Unused Fields
For each unused field, either:
1. Add to disease models with proper evidence-based risk factors
2. Remove from survey if not evidence-based
3. Keep for future use if evidence exists but not yet modeled

---

## Fields Currently Used in Disease Models (77 unique paths)

See agent analysis (agentId: ab56cf3) for complete breakdown of all 77 profile field paths referenced by the 19 disease models.

**Most commonly used:**
1. `biometrics.weight.mostRecent.value` (13 diseases)
2. `lifestyle.smoking.status.value` (9 diseases)
3. `lifestyle.alcohol.drinksPerWeek.mostRecent.value` (8 diseases)
4. `medicalHistory.conditions` (11 diseases)
5. `medicalHistory.familyHistory` (8 diseases)
6. `biometrics.bloodPressure.mostRecent.value.systolic` (5 diseases)
7. `lifestyle.exercise.moderateMinutesPerWeek.mostRecent.value` (5 diseases)
