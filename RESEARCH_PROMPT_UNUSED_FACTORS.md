# Research Prompt: Evidence for Unused Mortality Risk Factors

**Purpose**: Find high-quality scientific evidence linking survey questions to mortality risk to determine whether to:
1. Add these factors to disease models with proper hazard ratios
2. Remove them from the survey if not evidence-based
3. Keep them for future implementation

**Evidence Requirements**:
- Meta-analyses or large cohort studies preferred
- Hazard ratios (HR) or relative risks (RR) with confidence intervals
- 10-year or lifetime mortality outcomes
- Peer-reviewed publications with DOI

---

## Category 1: Sleep and Circadian Health

### Sleep Duration
**Current Survey Question**: "Do you get enough sleep?"
- Options: Poor sleep (<6 hrs) vs Good sleep (7-9 hrs)
- Field: `lifestyle.sleep.averageHoursPerNight`

**Research Questions**:
1. What is the association between sleep duration and all-cause mortality?
2. What are the hazard ratios for:
   - Short sleep duration (<6 hours/night)
   - Long sleep duration (>9 hours/night)
   - Optimal sleep (7-8 hours/night) as reference
3. Is the relationship U-shaped?
4. Are effects different by age, sex, or existing conditions?

**Keywords**: sleep duration, mortality, all-cause mortality, cardiovascular mortality, sleep deprivation, oversleeping

---

### Sleep Quality
**Current Survey Question**: Captures sleep quality on 1-10 scale
- Field: `lifestyle.sleep.sleepQuality`

**Research Questions**:
1. Is poor sleep quality independently associated with mortality after controlling for duration?
2. What are hazard ratios for poor vs good sleep quality?
3. How is "sleep quality" typically measured in studies (PSQI, subjective rating)?

**Keywords**: sleep quality, sleep disturbances, mortality, insomnia, sleep disorders

---

## Category 2: Psychological and Social Factors

### Chronic Stress
**Current Survey Question**: "Are you under chronic stress?"
- Options: High stress vs Low stress
- Field: `lifestyle.stress`

**Research Questions**:
1. What is the association between chronic stress and mortality?
2. Are there validated measures of chronic stress used in epidemiological studies?
3. What are hazard ratios for high vs low stress?
4. Does stress interact with other risk factors (smoking, hypertension)?

**Keywords**: chronic stress, psychological stress, mortality, cortisol, allostatic load, perceived stress

---

### Social Isolation vs Connection
**Current Survey Question**: "Do you have strong social connections?"
- Options: Socially isolated vs Strong connections
- Field: `lifestyle.socialEngagement` (FIXED - now matches Alzheimer's model)

**Research Questions**:
1. What is the association between social isolation and all-cause mortality?
2. What are hazard ratios for social isolation vs strong social connections?
3. How is social isolation typically measured (number of contacts, perceived isolation)?
4. Is this already captured by Alzheimer's model or should it extend to other diseases?

**Keywords**: social isolation, loneliness, social connections, mortality, social networks

---

### Volunteering and Altruism
**Current Survey Question**: "Do you volunteer or help others?"
- Field: `social.volunteering.active`

**Research Questions**:
1. Is volunteering associated with reduced mortality?
2. What are hazard ratios for regular volunteering vs no volunteering?
3. What is the proposed mechanism (increased activity, social connection, purpose)?

**Keywords**: volunteering, altruism, mortality, prosocial behavior, community engagement

---

### Pet Ownership (Dog)
**Current Survey Question**: "Do you own a dog?"
- Field: `social.petOwnership.ownsDog`

**Research Questions**:
1. Is dog ownership associated with reduced mortality, particularly cardiovascular?
2. What are hazard ratios for dog owners vs non-owners?
3. Is the effect due to increased physical activity or other mechanisms?

**Keywords**: dog ownership, pet ownership, mortality, cardiovascular disease, physical activity

---

### Creative Hobbies
**Current Survey Question**: "Do you engage in creative hobbies?"
- Field: `social.hobbies.creative.engaged`

**Research Questions**:
1. Are creative hobbies (art, music, writing) associated with mortality?
2. What are proposed mechanisms (cognitive stimulation, stress reduction)?
3. Are there hazard ratios available?

**Keywords**: creative activities, hobbies, arts, mortality, cognitive engagement

---

### Reading and Intellectual Engagement
**Current Survey Question**: "Do you read books regularly?"
- Field: `social.hobbies.intellectual.engaged`

**Research Questions**:
1. Is reading associated with mortality or cognitive decline?
2. What are hazard ratios for regular readers vs non-readers?
3. Is this mechanism similar to general cognitive engagement?

**Keywords**: reading, cognitive engagement, mortality, intellectual activities

---

### Religious Attendance
**Current Survey Question**: "Do you attend religious services?"
- Options: Never/Rarely vs Weekly+
- Field: `social.religiousAttendance`

**Research Questions**:
1. What is the association between religious attendance and mortality?
2. What are hazard ratios for weekly attendance vs never?
3. Is the effect due to social connection, healthy behaviors, or other factors?
4. Does it vary by religion or culture?

**Keywords**: religious attendance, religiosity, spirituality, mortality, church attendance

---

## Category 3: Lifestyle and Behavior

### Music Listening
**Current Survey Question**: "Do you listen to music regularly?"
- Field: `lifestyle.musicListening`

**Research Questions**:
1. Is music listening associated with mortality or wellbeing?
2. Are there any studies linking music to longevity?

**Keywords**: music listening, music therapy, mortality, wellbeing

---

### Screen Time
**Current Survey Question**: "Excessive screen time (>6 hrs/day)?"
- Options: Yes, very high vs No, moderate
- Field: `lifestyle.screenTime`

**Research Questions**:
1. Is excessive screen time (especially sedentary screen time) associated with mortality?
2. What are hazard ratios for high (>6hrs) vs moderate screen time?
3. Is this independent of physical activity levels?

**Keywords**: screen time, sedentary behavior, mortality, television viewing, sitting time

---

### Nature Exposure / Outdoor Time
**Current Survey Question**: "Do you spend time outdoors daily?" / "Regular exposure to nature/greenspace?"
- Field: `lifestyle.outdoorTime.minutesPerWeek`

**Research Questions**:
1. Is time spent in nature/green spaces associated with mortality?
2. What are hazard ratios for high nature exposure vs low?
3. What is the proposed mechanism (physical activity, stress reduction, air quality)?

**Keywords**: nature exposure, green space, outdoor time, mortality, natural environments

---

### Helmet Use (Biking/Motorcycling)
**Current Survey Question**: "Wear helmet when biking/motorcycling?"
- Field: `lifestyle.helmetUse`

**Research Questions**:
1. What is the mortality risk from cycling/motorcycling without helmets?
2. Are there population-level studies linking helmet use to mortality rates?
3. What percentage of the population bikes/motorcycles regularly?

**Keywords**: helmet use, bicycle helmet, motorcycle helmet, traumatic brain injury, mortality

---

### Sun Exposure
**Current Survey Question**: "Do you get excessive sun exposure?"
- Options: Excessive sun vs Protected/Moderate
- Field: `lifestyle.sunExposure`

**Research Questions**:
1. What is the relationship between sun exposure and mortality (skin cancer risk vs vitamin D benefits)?
2. Are there hazard ratios for excessive sun exposure?
3. Is moderate sun exposure protective?

**Keywords**: sun exposure, ultraviolet radiation, skin cancer, vitamin D, mortality

---

### Recreational Drug Use
**Current Survey Question**: "Do you use recreational drugs?"
- Field: `lifestyle.recreationalDrugs`

**Research Questions**:
1. What is the association between recreational drug use and mortality?
2. Are there hazard ratios for regular drug use vs non-use?
3. Does this vary by drug type (already captured by opioids separately)?

**Keywords**: recreational drug use, illicit drug use, substance abuse, mortality

---

### Marijuana Use
**Current Survey Question**: "Do you use marijuana regularly?"
- Options: Yes, daily vs No/Occasionally
- Field: `lifestyle.marijuana`

**Research Questions**:
1. Is marijuana use associated with mortality?
2. What are hazard ratios for daily use vs no use?
3. Are effects different for smoking vs other consumption methods?

**Keywords**: marijuana, cannabis, mortality, drug use

---

## Category 4: Dental Health

### Tooth Brushing
**Current Survey Question**: "Do you brush teeth twice daily?"
- Field: `lifestyle.dentalHygiene`

**Research Questions**:
1. Is poor dental hygiene associated with mortality (especially cardiovascular)?
2. What is the mechanism (inflammation, periodontal disease)?
3. What are hazard ratios for poor vs good dental hygiene?

**Keywords**: dental hygiene, tooth brushing, periodontal disease, cardiovascular disease, mortality

---

### Flossing
**Current Survey Question**: "Do you floss regularly?"
- Field: `lifestyle.flossing`

**Research Questions**:
1. Is flossing independently associated with mortality beyond brushing?
2. What are hazard ratios for daily flossing vs never?

**Keywords**: dental floss, flossing, periodontal disease, mortality

---

## Category 5: Environmental Exposures

### Air Quality
**Current Survey Question**: "Do you live in area with poor air quality?"
- Options: Yes, high pollution vs No, clean air
- Field: `lifestyle.airQualityExposure`

**Research Questions**:
1. What is the association between chronic air pollution exposure and mortality?
2. What are hazard ratios for high vs low air pollution exposure (by PM2.5 levels)?
3. Which pollutants are most strongly associated with mortality?

**Keywords**: air pollution, air quality, PM2.5, mortality, particulate matter

---

### Water Quality
**Current Survey Question**: "Do you have clean drinking water?"
- Field: `lifestyle.waterQuality`

**Research Questions**:
1. Is poor water quality (contamination, heavy metals) associated with mortality in developed countries?
2. What are specific contaminants linked to mortality?

**Keywords**: water quality, water contamination, drinking water, mortality

---

### Pesticide Exposure
**Current Survey Question**: "Regular pesticide exposure?"
- Field: `lifestyle.pesticideExposure`

**Research Questions**:
1. Is occupational or residential pesticide exposure associated with mortality?
2. What are hazard ratios for regular exposure vs minimal?
3. Which pesticides are most harmful?

**Keywords**: pesticide exposure, agricultural chemicals, occupational exposure, mortality

---

### Radiation Exposure (Occupational)
**Current Survey Question**: "Occupational radiation exposure?"
- Field: `lifestyle.radiationExposure`

**Research Questions**:
1. What is the mortality risk from low-level occupational radiation exposure?
2. What are hazard ratios by exposure level?

**Keywords**: radiation exposure, occupational radiation, ionizing radiation, mortality

---

### Noise Pollution
**Current Survey Question**: "Chronic noise pollution exposure?"
- Field: `lifestyle.noiseExposure`

**Research Questions**:
1. Is chronic noise exposure associated with mortality (especially cardiovascular)?
2. What are hazard ratios for high noise exposure?
3. What is the mechanism (stress, sleep disruption)?

**Keywords**: noise pollution, environmental noise, traffic noise, mortality

---

### Mold Exposure
**Current Survey Question**: "Mold exposure in home/work?"
- Field: `lifestyle.moldExposure`

**Research Questions**:
1. Is chronic mold exposure associated with mortality?
2. What are the health effects of mold (respiratory, immune)?

**Keywords**: mold exposure, indoor air quality, fungal exposure, mortality

---

### Lead Exposure
**Current Survey Question**: "Lead paint exposure (old building)?"
- Field: `lifestyle.leadExposure`

**Research Questions**:
1. Is low-level lead exposure in adults associated with mortality?
2. What are hazard ratios for lead exposure?

**Keywords**: lead exposure, lead poisoning, environmental lead, mortality

---

### General Pollution Proximity
**Current Survey Question**: "Live near major pollution source?"
- Field: `lifestyle.pollutionExposure`

**Research Questions**:
1. Is proximity to highways, factories associated with mortality?
2. What are hazard ratios for living near pollution sources?

**Keywords**: pollution exposure, highway proximity, industrial pollution, mortality

---

## Category 6: Medications and Preventive Interventions

### Statin Use
**Current Survey Question**: "Are you taking a statin?"
- Field: `medicalHistory.medications.statin`

**Research Questions**:
1. What is the mortality benefit of statin use in primary/secondary prevention?
2. What are hazard ratios for statin use vs no use (in appropriate populations)?
3. Should this be modeled as a protective factor in CVD risk?

**Keywords**: statin therapy, HMG-CoA reductase inhibitors, mortality, cardiovascular disease, primary prevention

---

### Aspirin Use (Daily)
**Current Survey Question**: "Taking daily aspirin?"
- Field: `medicalHistory.medications.aspirin`

**Research Questions**:
1. What is the mortality impact of daily aspirin in primary/secondary prevention?
2. Has this changed with recent guidelines?
3. What are hazard ratios for aspirin use?

**Keywords**: aspirin therapy, antiplatelet therapy, mortality, primary prevention, cardiovascular disease

---

### Hormone Replacement Therapy (HRT)
**Current Survey Question**: "Are you on hormone replacement therapy?"
- Field: `medicalHistory.medications.hrt`

**Research Questions**:
1. What is the association between HRT and mortality in postmenopausal women?
2. Does it vary by HRT type (estrogen-only vs combination)?
3. What are hazard ratios for HRT use?

**Keywords**: hormone replacement therapy, HRT, estrogen therapy, mortality, menopause

---

## Category 7: Preventive Screenings

### Flu Vaccine (Annual)
**Current Survey Question**: "Do you get annual flu vaccine?"
- Field: `medicalHistory.vaccinations.fluVaccine`
- Note: Already used in Influenza/Pneumonia model, but check if should extend to other models

**Research Questions**:
1. Is flu vaccination associated with all-cause mortality beyond influenza mortality?
2. What are hazard ratios for annual vaccination vs never?

**Keywords**: influenza vaccination, flu vaccine, mortality, preventive care

---

### Colonoscopy Screening
**Current Survey Question**: "Have you had a colonoscopy (if over 45)?"
- Field: `medicalHistory.screenings.colonoscopy`

**Research Questions**:
1. What is the mortality benefit of colonoscopy screening?
2. Should this be modeled as reducing colorectal cancer risk?
3. What are hazard ratios for screened vs unscreened populations?

**Keywords**: colonoscopy, colorectal cancer screening, mortality, cancer screening

---

### Mammogram Screening
**Current Survey Question**: "Regular mammograms (if female)?"
- Field: `medicalHistory.screenings.mammogram`

**Research Questions**:
1. What is the mortality benefit of mammogram screening?
2. Should this be modeled as reducing breast cancer risk?
3. What are hazard ratios for screened vs unscreened?

**Keywords**: mammography, breast cancer screening, mortality, cancer screening

---

### Dental Checkups
**Current Survey Question**: "Do you visit dentist regularly?"
- Field: `medicalHistory.screenings.dental`

**Research Questions**:
1. Are regular dental visits associated with mortality (beyond dental hygiene)?
2. Is early detection of oral disease protective?

**Keywords**: dental checkups, preventive dentistry, mortality, dental care

---

### Vision and Hearing Screenings
**Current Survey Question**: "Regular vision checkups?" / "Regular hearing checkups?"
- Fields: `medicalHistory.screenings.vision`, `medicalHistory.screenings.hearing`

**Research Questions**:
1. Are vision/hearing screenings associated with mortality (especially falls in elderly)?
2. Is sensory impairment correction protective?

**Keywords**: vision screening, hearing screening, sensory impairment, falls, mortality

---

## Category 8: Blood Donation

### Blood Donation
**Current Survey Question**: "Do you donate blood?"
- Field: `lifestyle.bloodDonation`

**Research Questions**:
1. Is regular blood donation associated with mortality?
2. Are there cardiovascular benefits from regular phlebotomy?
3. What are hazard ratios for donors vs non-donors?

**Keywords**: blood donation, phlebotomy, mortality, iron levels

---

## Category 9: Reproductive Health

### Hormonal Contraception
**Current Survey Question**: "Do you use hormonal contraception?"
- Field: `reproductiveHistory.contraceptionUse`

**Research Questions**:
1. Is long-term hormonal contraception associated with mortality?
2. What are the risks/benefits (thrombosis risk vs cancer protection)?

**Keywords**: hormonal contraception, oral contraceptives, mortality, birth control

---

## Research Methodology Instructions

For each factor above, please provide:

1. **Summary of Evidence**:
   - Overall conclusion (strong evidence, moderate evidence, weak/no evidence)
   - Direction of effect (protective, harmful, neutral, U-shaped)

2. **Key Studies**:
   - List 2-5 most relevant meta-analyses or large cohort studies
   - Include: First author, year, journal, DOI
   - Sample size and follow-up duration

3. **Hazard Ratios**:
   - Specific HR or RR values with 95% CI
   - Reference group clearly defined
   - Adjustments made (e.g., age, sex, smoking, etc.)

4. **Evidence Quality**:
   - Meta-analysis (highest quality)
   - Large prospective cohort (>10,000 participants, >5 years follow-up)
   - Systematic review
   - Single cohort study
   - Cross-sectional or case-control (lower quality)

5. **Implementation Recommendation**:
   - **ADD to disease models**: Strong evidence with clear HR
   - **KEEP for future**: Moderate evidence, needs more research
   - **REMOVE from survey**: Weak/no evidence, not worth collecting

6. **Disease Model Mapping**:
   - Which disease model(s) should include this factor?
   - Should it be disease-specific or general mortality modifier?

---

## Output Format

Please provide results in a structured markdown table:

```markdown
| Factor | Evidence Strength | HR (95% CI) | Key Study | DOI | Recommendation | Disease Model |
|--------|-------------------|-------------|-----------|-----|----------------|---------------|
| Sleep Duration (<6h vs 7-8h) | Strong | 1.12 (1.08-1.16) | Cappuccio et al. 2010 | 10.1093/sleep/33.5.585 | ADD | All-cause mortality |
```

---

## Priority Order

**High Priority** (likely to have strong evidence):
1. Sleep duration and quality
2. Chronic stress
3. Social isolation
4. Air quality/pollution
5. Statin use
6. Aspirin use
7. Preventive screenings (colonoscopy, mammogram)
8. Dental hygiene and cardiovascular disease

**Medium Priority**:
9. Religious attendance
10. Pet ownership (dog)
11. Nature exposure
12. Screen time
13. Noise pollution
14. HRT

**Lower Priority** (may have limited evidence):
15. Volunteering
16. Creative hobbies
17. Music listening
18. Blood donation
19. Other environmental exposures

---

## Notes

- Focus on all-cause mortality and major disease-specific mortality (CVD, cancer)
- Prioritize studies from developed countries with similar populations to US
- Note any confounding factors or alternative explanations
- Identify if effect is causal or associational
- Consider whether self-reported data is reliable for each factor
