// @ts-nocheck -- extracted from the legacy profile editor; loose typing pending rewrite
import React from 'react';
import { UserProfile } from '../../../types/user';
import { Tooltip } from '../../common/Tooltip';

export interface ProfileSectionProps {
  profile: UserProfile | null;
  age: number | null;
  getFieldValue: (section: keyof UserProfile, field: string) => any;
  updateField: (section: keyof UserProfile, field: string, value: any) => void;
}

export const MedicalHistorySection: React.FC<ProfileSectionProps> = ({ getFieldValue, updateField }) => {
  return (
    <>
      {/* Medical History */}
      <div className="profile-section">
        <div className="section-header-static">
          <span className="section-title">Medical History</span>
        </div>
        <div className="section-content">
            <div className="compact-checkboxes">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-type2_diabetes"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.type2_diabetes') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.type2_diabetes', e.target.checked)}
                />
                <span>Diabetes</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-cvd"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.cvd') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.cvd', e.target.checked)}
                />
                <span>Heart Disease</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-ibd"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.ibd') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.ibd', e.target.checked)}
                />
                <span>IBD</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-copd"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.copd') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.copd', e.target.checked)}
                />
                <span>COPD</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-atrial_fibrillation"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.atrial_fibrillation') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.atrial_fibrillation', e.target.checked)}
                />
                <span>Atrial Fibrillation</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-stroke"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.stroke') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.stroke', e.target.checked)}
                />
                <span>Prior Stroke</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-tia"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.tia') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.tia', e.target.checked)}
                />
                <span>Prior TIA (Mini-Stroke)</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-chronic_pancreatitis"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.chronic_pancreatitis') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.chronic_pancreatitis', e.target.checked)}
                />
                <span>Chronic Pancreatitis</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-nafld"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.nafld') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.nafld', e.target.checked)}
                />
                <span>NAFLD (Fatty Liver)</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-nash"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.nash') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.nash', e.target.checked)}
                />
                <span>NASH</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-conditions-cirrhosis"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'conditions.cirrhosis') || false}
                  onChange={(e) => updateField('medicalHistory', 'conditions.cirrhosis', e.target.checked)}
                />
                <span>Cirrhosis</span>
              </label>
            </div>

            <h4 className="subsection-title">Family History</h4>
            <div className="compact-checkboxes">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-familyHistory-cvd"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'familyHistory.cvd') || false}
                  onChange={(e) => updateField('medicalHistory', 'familyHistory.cvd', e.target.checked)}
                />
                <span>CVD in Family</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-familyHistory-colorectal_cancer"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'familyHistory.colorectal_cancer') || false}
                  onChange={(e) => updateField('medicalHistory', 'familyHistory.colorectal_cancer', e.target.checked)}
                />
                <span>Colorectal Cancer in Family</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-familyHistory-type2_diabetes"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'familyHistory.type2_diabetes') || false}
                  onChange={(e) => updateField('medicalHistory', 'familyHistory.type2_diabetes', e.target.checked)}
                />
                <span>Diabetes in Family</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-familyHistory-lung_cancer"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'familyHistory.lung_cancer') || false}
                  onChange={(e) => updateField('medicalHistory', 'familyHistory.lung_cancer', e.target.checked)}
                />
                <span>Lung Cancer in Family</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-familyHistory-breast_cancer"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'familyHistory.breast_cancer') || false}
                  onChange={(e) => updateField('medicalHistory', 'familyHistory.breast_cancer', e.target.checked)}
                />
                <span>Breast Cancer in Family</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-familyHistory-prostate_cancer"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'familyHistory.prostate_cancer') || false}
                  onChange={(e) => updateField('medicalHistory', 'familyHistory.prostate_cancer', e.target.checked)}
                />
                <span>Prostate Cancer in Family</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-familyHistory-pancreatic_cancer"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'familyHistory.pancreatic_cancer') || false}
                  onChange={(e) => updateField('medicalHistory', 'familyHistory.pancreatic_cancer', e.target.checked)}
                />
                <span>Pancreatic Cancer in Family</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-familyHistory-dementia"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'familyHistory.dementia') || false}
                  onChange={(e) => updateField('medicalHistory', 'familyHistory.dementia', e.target.checked)}
                />
                <span>Dementia/Alzheimer's in Family</span>
              </label>
            </div>

            <h4 className="subsection-title">Vaccinations</h4>
            <div className="compact-form-grid">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-vaccinations-fluVaccineCurrentYear"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'vaccinations.fluVaccineCurrentYear') || false}
                  onChange={(e) => updateField('medicalHistory', 'vaccinations.fluVaccineCurrentYear', e.target.checked)}
                />
                <span>Flu Vaccine This Year</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-vaccinations-pneumococcalVaccine"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'vaccinations.pneumococcalVaccine') || false}
                  onChange={(e) => updateField('medicalHistory', 'vaccinations.pneumococcalVaccine', e.target.checked)}
                />
                <span>Pneumococcal Vaccine Ever</span>
              </label>

              <label>
                Last Flu Vaccine (year)
                <input
                  data-testid="profile-medicalHistory-vaccinations-lastFluVaccine"
                  type="number"
                  value={getFieldValue('medicalHistory', 'vaccinations.lastFluVaccine')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    updateField('medicalHistory', 'vaccinations.lastFluVaccine', val);
                  }}
                  className="compact-input"
                  placeholder="2024"
                  min="1900"
                  max="2100"
                />
              </label>

              <label>
                Last Pneumococcal Vaccine (year)
                <input
                  data-testid="profile-medicalHistory-vaccinations-lastPneumococcalVaccine"
                  type="number"
                  value={getFieldValue('medicalHistory', 'vaccinations.lastPneumococcalVaccine')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    updateField('medicalHistory', 'vaccinations.lastPneumococcalVaccine', val);
                  }}
                  className="compact-input"
                  placeholder="2020"
                  min="1900"
                  max="2100"
                />
              </label>
            </div>

            <h4 className="subsection-title">Medications</h4>
            <div className="compact-form-grid">
              <label>
                Total Number of Medications
                <input
                  data-testid="profile-medicalHistory-medications-totalMedicationCount"
                  type="number"
                  value={getFieldValue('medicalHistory', 'medications.totalMedicationCount')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    updateField('medicalHistory', 'medications.totalMedicationCount', val);
                  }}
                  className="compact-input"
                  placeholder="0"
                  min="0"
                />
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-medications-takesBloodPressureMeds"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'medications.takesBloodPressureMeds') || false}
                  onChange={(e) => updateField('medicalHistory', 'medications.takesBloodPressureMeds', e.target.checked)}
                />
                <span>Takes Blood Pressure Medications</span>
              </label>
            </div>

            <div className="sensitive-data-warning" style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              padding: '12px',
              marginTop: '20px',
              marginBottom: '12px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Sensitive Information</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                This information is stored only on your device and never transmitted.
                These fields help provide risk assessments but are entirely optional.
                All data remains private and under your control.
              </div>
            </div>

            <h4 className="subsection-title">Mental Health</h4>
            <div className="compact-checkboxes">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-mentalHealth-depressionDiagnosis"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'mentalHealth.depressionDiagnosis') || false}
                  onChange={(e) => updateField('medicalHistory', 'mentalHealth.depressionDiagnosis', e.target.checked)}
                />
                <span>Depression Diagnosis</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-mentalHealth-anxietyDiagnosis"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'mentalHealth.anxietyDiagnosis') || false}
                  onChange={(e) => updateField('medicalHistory', 'mentalHealth.anxietyDiagnosis', e.target.checked)}
                />
                <span>Anxiety Diagnosis</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-mentalHealth-currentlyInTreatment"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'mentalHealth.currentlyInTreatment') || false}
                  onChange={(e) => updateField('medicalHistory', 'mentalHealth.currentlyInTreatment', e.target.checked)}
                />
                <span>Currently in Treatment</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-suicideAttempts"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'suicideAttempts') || false}
                  onChange={(e) => updateField('medicalHistory', 'suicideAttempts', e.target.checked)}
                />
                <span>Prior Suicide Attempt</span>
              </label>
            </div>

            <div className="sensitive-data-warning" style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              padding: '12px',
              marginTop: '20px',
              marginBottom: '12px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Substance Use Assessment</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.4', marginBottom: '8px' }}>
                This assessment is for educational purposes and awareness of prescription medication risks.
                This is not a diagnostic tool. If you have concerns about substance use, please consult a healthcare professional.
              </div>
              <div style={{ fontSize: '0.85em', fontWeight: 'bold' }}>
                If you are in crisis:<br/>
                • Call 988 (Suicide & Crisis Lifeline)<br/>
                • Call 1-800-662-4357 (SAMHSA National Helpline)
              </div>
            </div>

            <h4 className="subsection-title">Substance Use</h4>
            <div className="compact-form-grid">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-substanceUse-prescribedOpioids"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'substanceUse.prescribedOpioids') || false}
                  onChange={(e) => updateField('medicalHistory', 'substanceUse.prescribedOpioids', e.target.checked)}
                />
                <span>Prescribed Opioids</span>
              </label>

              <label>
                Opioid Daily Dose (MME)
                <input
                  data-testid="profile-medicalHistory-substanceUse-opioidDailyDose"
                  type="number"
                  value={getFieldValue('medicalHistory', 'substanceUse.opioidDailyDose')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('medicalHistory', 'substanceUse.opioidDailyDose', val);
                  }}
                  className="compact-input"
                  placeholder="0"
                  min="0"
                />
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-medications-prescribedBenzodiazepines"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'medications.prescribedBenzodiazepines') || false}
                  onChange={(e) => updateField('medicalHistory', 'medications.prescribedBenzodiazepines', e.target.checked)}
                />
                <span>Prescribed Benzodiazepines</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-medications-statin"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'medications.statin') || false}
                  onChange={(e) => updateField('medicalHistory', 'medications.statin', e.target.checked)}
                />
                <span>Takes Statin (Cholesterol Medication)</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-substanceUse-substanceAbuseHistory"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'substanceUse.substanceAbuseHistory') || false}
                  onChange={(e) => updateField('medicalHistory', 'substanceUse.substanceAbuseHistory', e.target.checked)}
                />
                <span>Substance Abuse History</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-substanceUse-priorOverdose"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'substanceUse.priorOverdose') || false}
                  onChange={(e) => updateField('medicalHistory', 'substanceUse.priorOverdose', e.target.checked)}
                />
                <span>Prior Overdose</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-substanceUse-illicitDrugUse"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'substanceUse.illicitDrugUse') || false}
                  onChange={(e) => updateField('medicalHistory', 'substanceUse.illicitDrugUse', e.target.checked)}
                />
                <span>Illicit Drug Use</span>
              </label>
            </div>

            <h4 className="subsection-title">Gastrointestinal History</h4>
            <div className="compact-checkboxes">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-gastrointestinalHistory-gerdDiagnosis"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'gastrointestinalHistory.gerdDiagnosis') || false}
                  onChange={(e) => updateField('medicalHistory', 'gastrointestinalHistory.gerdDiagnosis', e.target.checked)}
                />
                <span>GERD Diagnosis</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-gastrointestinalHistory-barretsEsophagus"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'gastrointestinalHistory.barretsEsophagus') || false}
                  onChange={(e) => updateField('medicalHistory', 'gastrointestinalHistory.barretsEsophagus', e.target.checked)}
                />
                <span>Barrett's Esophagus</span>
              </label>
            </div>

            <h4 className="subsection-title">Hepatitis</h4>
            <div className="compact-checkboxes">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-hepatitisHistory-hepatitisB"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'hepatitisHistory.hepatitisB') || false}
                  onChange={(e) => updateField('medicalHistory', 'hepatitisHistory.hepatitisB', e.target.checked)}
                />
                <span>Hepatitis B</span>
              </label>

              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-hepatitisHistory-hepatitisC"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'hepatitisHistory.hepatitisC') || false}
                  onChange={(e) => updateField('medicalHistory', 'hepatitisHistory.hepatitisC', e.target.checked)}
                />
                <span>Hepatitis C</span>
              </label>
            </div>

            <h4 className="subsection-title">Respiratory History</h4>
            <div className="compact-form-grid">
              <label>
                FEV1 Percent of Predicted (%)
                <input
                  data-testid="profile-medicalHistory-respiratoryHistory-fev1Percent"
                  type="number"
                  value={getFieldValue('medicalHistory', 'respiratoryHistory.fev1Percent')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('medicalHistory', 'respiratoryHistory.fev1Percent', val);
                  }}
                  className="compact-input"
                  placeholder="100"
                  min="0"
                  max="150"
                />
              </label>

              <label>
                Dyspnea Severity
                <select
                  data-testid="profile-medicalHistory-respiratoryHistory-dyspneaSeverity"
                  value={getFieldValue('medicalHistory', 'respiratoryHistory.dyspneaSeverity')}
                  onChange={(e) => updateField('medicalHistory', 'respiratoryHistory.dyspneaSeverity', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="very_severe">Very Severe</option>
                </select>
              </label>

              <label>
                Exacerbations Per Year
                <input
                  data-testid="profile-medicalHistory-respiratoryHistory-exacerbationsPerYear"
                  type="number"
                  value={getFieldValue('medicalHistory', 'respiratoryHistory.exacerbationsPerYear')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    updateField('medicalHistory', 'respiratoryHistory.exacerbationsPerYear', val);
                  }}
                  className="compact-input"
                  placeholder="0"
                  min="0"
                />
              </label>
            </div>

            <h4 className="subsection-title">Sleep & Sensory Health</h4>
            <div className="compact-form-grid">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-sleepApnea-diagnosis"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'sleepApnea.diagnosis') || false}
                  onChange={(e) => updateField('medicalHistory', 'sleepApnea.diagnosis', e.target.checked)}
                />
                <span>Sleep Apnea Diagnosis</span>
              </label>

              <label>
                Hearing Loss Status
                <Tooltip content="Untreated hearing loss increases dementia risk by 90%. Hearing aids reduce risk by ~75%.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <select
                  data-testid="profile-medicalHistory-hearingLoss-treated"
                  value={getFieldValue('medicalHistory', 'hearingLoss.treated')}
                  onChange={(e) => updateField('medicalHistory', 'hearingLoss.treated', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="none_or_treated">No hearing loss / Uses hearing aids</option>
                  <option value="untreated_mild">Mild hearing loss (untreated)</option>
                  <option value="untreated_moderate_severe">Moderate/Severe hearing loss (untreated)</option>
                </select>
              </label>
            </div>

            <h4 className="subsection-title">Sun Exposure History</h4>
            <div className="compact-form-grid">
              <label>
                Lifetime Severe Sunburns (count)
                <Tooltip content="Each severe sunburn increases melanoma risk ~60%. Childhood sunburns have strongest effect. Count blistering/peeling sunburns.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-medicalHistory-sunExposure-sunburns"
                  type="number"
                  value={getFieldValue('medicalHistory', 'sunExposure.sunburns')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    updateField('medicalHistory', 'sunExposure.sunburns', val);
                  }}
                  className="compact-input"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </label>
            </div>

            <h4 className="subsection-title">Urinary History</h4>
            <div className="compact-form-grid">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-urinaryHistory-priorNegativeBiopsy"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'urinaryHistory.priorNegativeBiopsy') || false}
                  onChange={(e) => updateField('medicalHistory', 'urinaryHistory.priorNegativeBiopsy', e.target.checked)}
                />
                <span>Prior Negative Prostate Biopsy</span>
              </label>
            </div>

            <h4 className="subsection-title">Genetic Factors</h4>
            <div className="compact-form-grid">
              <label>
                APOE-ε4 Status
                <select
                  data-testid="profile-medicalHistory-geneticFactors-apoeE4Status"
                  value={getFieldValue('medicalHistory', 'geneticFactors.apoeE4Status')}
                  onChange={(e) => updateField('medicalHistory', 'geneticFactors.apoeE4Status', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="unknown">Unknown</option>
                  <option value="none">None (no copies)</option>
                  <option value="one_copy">One Copy</option>
                  <option value="two_copies">Two Copies</option>
                </select>
              </label>
            </div>

            <h4 className="subsection-title">Fall History</h4>
            <div className="compact-form-grid">
              <label className="checkbox-label">
                <input
                  data-testid="profile-medicalHistory-fallHistory-fallWithInjury"
                  type="checkbox"
                  checked={getFieldValue('medicalHistory', 'fallHistory.fallWithInjury') || false}
                  onChange={(e) => updateField('medicalHistory', 'fallHistory.fallWithInjury', e.target.checked)}
                />
                <span>Fall with Injury in Past Year</span>
              </label>
            </div>

            <h4 className="subsection-title">Immune Status</h4>
            <div className="compact-form-grid">
              <label>
                Immune Status
                <select
                  data-testid="profile-medicalHistory-immuneStatus"
                  value={getFieldValue('medicalHistory', 'immuneStatus') || 'normal'}
                  onChange={(e) => updateField('medicalHistory', 'immuneStatus', e.target.value)}
                  className="compact-select"
                >
                  <option value="normal">Normal</option>
                  <option value="immunocompromised">Immunocompromised</option>
                </select>
              </label>
            </div>
        </div>
      </div>
    </>
  );
};
