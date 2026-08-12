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

export const LabTestsSection: React.FC<ProfileSectionProps> = ({ getFieldValue, updateField }) => {
  return (
    <>
      {/* Lab Tests */}
      <div className="profile-section">
        <div className="section-header-static">
          <span className="section-title">Lab Tests</span>
        </div>
        <div className="section-content">
            <h4 className="subsection-title">Lipid Panel</h4>
            <div className="compact-form-grid">
              <label>
                LDL Cholesterol (mg/dL)
                <Tooltip content="Optimal: <100. Near optimal: 100-129. Borderline high: 130-159. High: ≥160.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-lipidPanel-ldlCholesterol"
                  type="number"
                  value={getFieldValue('labTests', 'lipidPanel.ldlCholesterol')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'lipidPanel.ldlCholesterol', val);
                  }}
                  className="compact-input"
                  placeholder="100"
                  min="20"
                  max="400"
                />
              </label>

              <label>
                HDL Cholesterol (mg/dL)
                <Tooltip content="Poor: <40 (men), <50 (women). Better: 40-59. Best: ≥60.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-lipidPanel-hdlCholesterol"
                  type="number"
                  value={getFieldValue('labTests', 'lipidPanel.hdlCholesterol')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'lipidPanel.hdlCholesterol', val);
                  }}
                  className="compact-input"
                  placeholder="50"
                  min="10"
                  max="150"
                />
              </label>

              <label>
                Total Cholesterol (mg/dL)
                <Tooltip content="Desirable: <200. Borderline high: 200-239. High: ≥240.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-lipidPanel-totalCholesterol"
                  type="number"
                  value={getFieldValue('labTests', 'lipidPanel.totalCholesterol')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'lipidPanel.totalCholesterol', val);
                  }}
                  className="compact-input"
                  placeholder="180"
                  min="50"
                  max="500"
                />
              </label>

              <label>
                Triglycerides (mg/dL)
                <Tooltip content="Normal: <150. Borderline high: 150-199. High: 200-499. Very high: ≥500.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-lipidPanel-triglycerides"
                  type="number"
                  value={getFieldValue('labTests', 'lipidPanel.triglycerides')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'lipidPanel.triglycerides', val);
                  }}
                  className="compact-input"
                  placeholder="150"
                  min="20"
                  max="1000"
                />
              </label>

              <label>
                Non-HDL Cholesterol (mg/dL) (optional)
                <Tooltip content="Total cholesterol minus HDL. Optimal: <130. High: ≥160.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-lipidPanel-nonHdlCholesterol"
                  type="number"
                  value={getFieldValue('labTests', 'lipidPanel.nonHdlCholesterol')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'lipidPanel.nonHdlCholesterol', val);
                  }}
                  className="compact-input"
                  placeholder="130"
                  min="20"
                  max="400"
                />
              </label>

              <label>
                Apolipoprotein B (mg/dL) (optional)
                <Tooltip content="Optimal: <90. High: ≥130. Better predictor of CVD risk than LDL.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-lipidPanel-apolipoproteinB"
                  type="number"
                  value={getFieldValue('labTests', 'lipidPanel.apolipoproteinB')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'lipidPanel.apolipoproteinB', val);
                  }}
                  className="compact-input"
                  placeholder="90"
                  min="20"
                  max="300"
                />
              </label>

              <label>
                Lipoprotein(a) (mg/dL) (optional)
                <Tooltip content="Desirable: <30. Elevated: ≥50. Independent CVD risk factor.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-lipidPanel-lipoproteinA"
                  type="number"
                  value={getFieldValue('labTests', 'lipidPanel.lipoproteinA')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'lipidPanel.lipoproteinA', val);
                  }}
                  className="compact-input"
                  placeholder="20"
                  min="0"
                  max="200"
                />
              </label>
            </div>

            <h4 className="subsection-title">Glucose & Diabetes Markers</h4>
            <div className="compact-form-grid">
              <label>
                Fasting Glucose (mg/dL)
                <Tooltip content="Normal: <100. Prediabetes: 100-125. Diabetes: ≥126.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-fastingGlucose"
                  type="number"
                  value={getFieldValue('labTests', 'fastingGlucose')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'fastingGlucose', val);
                  }}
                  className="compact-input"
                  placeholder="90"
                  min="40"
                  max="500"
                />
              </label>

              <label>
                HbA1c (%)
                <Tooltip content="Normal: <5.7. Prediabetes: 5.7-6.4. Diabetes: ≥6.5.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-hba1c"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'hba1c')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'hba1c', val);
                  }}
                  className="compact-input"
                  placeholder="5.5"
                  min="3.0"
                  max="15.0"
                />
              </label>

              <label>
                Fasting Insulin (µU/mL) (optional)
                <Tooltip content="Normal: 2.6-24.9. Low may indicate Type 1 diabetes. High may indicate insulin resistance.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-metabolicPanel-insulin"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'metabolicPanel.insulin')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'metabolicPanel.insulin', val);
                  }}
                  className="compact-input"
                  placeholder="10"
                  min="0"
                  max="100"
                />
              </label>
            </div>

            <h4 className="subsection-title">Kidney Function</h4>
            <div className="compact-form-grid">
              <label>
                eGFR (mL/min/1.73m²) (optional)
                <Tooltip content="Normal: ≥90. Mild reduction: 60-89. Moderate: 30-59. Severe: <30.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-kidneyFunction-egfr"
                  type="number"
                  value={getFieldValue('labTests', 'kidneyFunction.egfr')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'kidneyFunction.egfr', val);
                  }}
                  className="compact-input"
                  placeholder="90"
                  min="5"
                  max="150"
                />
              </label>

              <label>
                Serum Creatinine (mg/dL) (optional)
                <Tooltip content="Normal: 0.7-1.3 (men), 0.6-1.1 (women). Elevated indicates reduced kidney function.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-kidneyFunction-serumCreatinine"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'kidneyFunction.serumCreatinine')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'kidneyFunction.serumCreatinine', val);
                  }}
                  className="compact-input"
                  placeholder="1.0"
                  min="0.1"
                  max="20.0"
                />
              </label>

              <label>
                Urine ACR (mg/g) (optional)
                <Tooltip content="Normal: <30. Microalbuminuria: 30-300. Macroalbuminuria: >300.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-kidneyFunction-urineACR"
                  type="number"
                  value={getFieldValue('labTests', 'kidneyFunction.urineACR')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'kidneyFunction.urineACR', val);
                  }}
                  className="compact-input"
                  placeholder="15"
                  min="0"
                  max="5000"
                />
              </label>
            </div>

            <h4 className="subsection-title">Liver Function</h4>
            <div className="compact-form-grid">
              <label>
                ALT (U/L) (optional)
                <Tooltip content="Normal: 7-56. Elevated indicates liver inflammation or damage.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-liverFunction-alt"
                  type="number"
                  value={getFieldValue('labTests', 'liverFunction.alt')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'liverFunction.alt', val);
                  }}
                  className="compact-input"
                  placeholder="30"
                  min="0"
                  max="500"
                />
              </label>

              <label>
                AST (U/L) (optional)
                <Tooltip content="Normal: 10-40. Elevated indicates liver or muscle damage.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-liverFunction-ast"
                  type="number"
                  value={getFieldValue('labTests', 'liverFunction.ast')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'liverFunction.ast', val);
                  }}
                  className="compact-input"
                  placeholder="30"
                  min="0"
                  max="500"
                />
              </label>

              <label>
                Platelet Count (×10⁹/L) (optional)
                <Tooltip content="Normal: 150-400. Low may indicate liver disease or bone marrow issues.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-liverFunction-plateletCount"
                  type="number"
                  value={getFieldValue('labTests', 'liverFunction.plateletCount')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'liverFunction.plateletCount', val);
                  }}
                  className="compact-input"
                  placeholder="250"
                  min="0"
                  max="1000"
                />
              </label>

              <label>
                Albumin (g/dL) (optional)
                <Tooltip content="Normal: 3.5-5.5. Low may indicate liver disease, kidney disease, or malnutrition.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-liverFunction-albumin"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'liverFunction.albumin')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'liverFunction.albumin', val);
                  }}
                  className="compact-input"
                  placeholder="4.5"
                  min="0"
                  max="10.0"
                />
              </label>
            </div>

            <h4 className="subsection-title">Complete Blood Count (optional)</h4>
            <div className="compact-form-grid">
              <label>
                WBC (×10⁹/L)
                <Tooltip content="Normal: 4.0-11.0. Elevated indicates infection or inflammation.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-cbc-wbc"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'cbc.wbc')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'cbc.wbc', val);
                  }}
                  className="compact-input"
                  placeholder="7.0"
                  min="0"
                  max="100"
                />
              </label>

              <label>
                RBC (×10¹²/L)
                <Tooltip content="Normal: 4.5-5.5 (men), 4.0-5.0 (women).">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-cbc-rbc"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'cbc.rbc')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'cbc.rbc', val);
                  }}
                  className="compact-input"
                  placeholder="5.0"
                  min="0"
                  max="10"
                />
              </label>

              <label>
                Hemoglobin (g/dL)
                <Tooltip content="Normal: 13.5-17.5 (men), 12.0-15.5 (women). Low indicates anemia.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-cbc-hemoglobin"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'cbc.hemoglobin')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'cbc.hemoglobin', val);
                  }}
                  className="compact-input"
                  placeholder="14.0"
                  min="0"
                  max="25"
                />
              </label>

              <label>
                Hematocrit (%)
                <Tooltip content="Normal: 38-50 (men), 36-44 (women). Percentage of blood volume that is red blood cells.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-cbc-hematocrit"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'cbc.hematocrit')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'cbc.hematocrit', val);
                  }}
                  className="compact-input"
                  placeholder="42"
                  min="0"
                  max="100"
                />
              </label>

              <label>
                Platelets (×10⁹/L)
                <Tooltip content="Normal: 150-400. Help with blood clotting.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-cbc-platelets"
                  type="number"
                  value={getFieldValue('labTests', 'cbc.platelets')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'cbc.platelets', val);
                  }}
                  className="compact-input"
                  placeholder="250"
                  min="0"
                  max="1000"
                />
              </label>
            </div>

            <h4 className="subsection-title">Other Markers (optional)</h4>
            <div className="compact-form-grid">
              <label>
                PSA (ng/mL) (men only)
                <Tooltip content="Normal: <4.0. Elevated may indicate prostate issues. Screening recommended age 50+.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-psa"
                  type="number"
                  step="0.1"
                  value={getFieldValue('labTests', 'psa')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'psa', val);
                  }}
                  className="compact-input"
                  placeholder="1.0"
                  min="0"
                  max="100"
                />
              </label>

              <label>
                Vitamin D (ng/mL)
                <Tooltip content="Optimal: 30-50 ng/mL. Low vitamin D increases fall risk and bone fracture risk. Important for bone health and immune function.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-labTests-vitaminD"
                  type="number"
                  step="1"
                  value={getFieldValue('labTests', 'vitaminD')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateField('labTests', 'vitaminD', val);
                  }}
                  className="compact-input"
                  placeholder="30"
                  min="0"
                  max="100"
                />
              </label>

              <label>
                CAC Score (Coronary Artery Calcium)
                <Tooltip content="Measures calcium buildup in coronary arteries. 0 = no plaque, >400 = severe atherosclerosis. Powerful CVD risk predictor. CT scan required.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <select
                  data-testid="profile-medicalHistory-cacScore"
                  value={getFieldValue('medicalHistory', 'cacScore')}
                  onChange={(e) => updateField('medicalHistory', 'cacScore', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Not tested</option>
                  <option value="0">0 (No plaque)</option>
                  <option value="1-100">1-100 (Mild plaque)</option>
                  <option value="101-400">101-400 (Moderate plaque)</option>
                  <option value=">400">&gt;400 (Severe plaque)</option>
                </select>
              </label>
            </div>
        </div>
      </div>
    </>
  );
};
