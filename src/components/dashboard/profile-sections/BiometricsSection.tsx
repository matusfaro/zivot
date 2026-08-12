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

export const BiometricsSection: React.FC<ProfileSectionProps> = ({ getFieldValue, updateField }) => {
  return (
    <>
      {/* Biometrics */}
      <div className="profile-section">
        <div className="section-header-static">
          <span className="section-title">Biometrics</span>
        </div>
        <div className="section-content">
            <div className="compact-form-grid">
              <label>
                Height: {(() => {
                  const cm = getFieldValue('biometrics', 'height') ?? 170;
                  const totalInches = cm * 0.393701;
                  const feet = Math.floor(totalInches / 12);
                  const inches = Math.round(totalInches % 12);
                  return `${cm} cm (${feet}'${inches}")`;
                })()}
                <Tooltip content="Normal range: 140-210 cm. Used to calculate BMI.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-biometrics-height"
                  type="range"
                  value={getFieldValue('biometrics', 'height') ?? 170}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateField('biometrics', 'height', val);
                  }}
                  className="compact-slider"
                  min="100"
                  max="250"
                />
              </label>

              <label>
                Weight: {(() => {
                  const kg = getFieldValue('biometrics', 'weight') ?? 70;
                  const lb = Math.round(kg * 2.20462);
                  return `${kg} kg (${lb} lb)`;
                })()}
                <Tooltip content="Normal range varies by height. Used to calculate BMI.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-biometrics-weight"
                  type="range"
                  value={getFieldValue('biometrics', 'weight') ?? 70}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateField('biometrics', 'weight', val);
                  }}
                  className="compact-slider"
                  min="20"
                  max="200"
                />
              </label>

              <label>
                Systolic BP: {getFieldValue('biometrics', 'bloodPressure.systolic') ?? 120} mmHg
                <Tooltip content="Normal: <120. Elevated: 120-129. High: ≥130.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-biometrics-bloodPressure-systolic"
                  type="range"
                  value={getFieldValue('biometrics', 'bloodPressure.systolic') ?? 120}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateField('biometrics', 'bloodPressure.systolic', val);
                  }}
                  className="compact-slider"
                  min="60"
                  max="200"
                />
              </label>

              <label>
                Diastolic BP: {getFieldValue('biometrics', 'bloodPressure.diastolic') ?? 80} mmHg
                <Tooltip content="Normal: <80. Elevated: 80-89. High: ≥90.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-biometrics-bloodPressure-diastolic"
                  type="range"
                  value={getFieldValue('biometrics', 'bloodPressure.diastolic') ?? 80}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateField('biometrics', 'bloodPressure.diastolic', val);
                  }}
                  className="compact-slider"
                  min="40"
                  max="120"
                />
              </label>

              <label>
                Heart Rate: {getFieldValue('biometrics', 'heartRate') ?? 70} bpm
                <Tooltip content="Normal resting: 60-100 bpm. Athletes may be lower.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-biometrics-heartRate"
                  type="range"
                  value={getFieldValue('biometrics', 'heartRate') ?? 70}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateField('biometrics', 'heartRate', val);
                  }}
                  className="compact-slider"
                  min="40"
                  max="150"
                />
              </label>

              <label>
                Waist: {(() => {
                  const cm = getFieldValue('biometrics', 'waistCircumference') ?? 85;
                  const inches = Math.round(cm * 0.393701);
                  return `${cm} cm (${inches}")`;
                })()}
                <Tooltip content={`High risk: Men >102cm (40"), Women >88cm (35"). Measured at belly button.`}>
                <span className="field-help">ℹ️</span>
              </Tooltip>
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

              <label>
                Hip: {(() => {
                  const cm = getFieldValue('biometrics', 'hipCircumference') ?? 95;
                  const inches = Math.round(cm * 0.393701);
                  return `${cm} cm (${inches}")`;
                })()}
                <Tooltip content="Measured at widest part of hips. Used to calculate waist-to-hip ratio.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-biometrics-hipCircumference"
                  type="range"
                  value={getFieldValue('biometrics', 'hipCircumference') ?? 95}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateField('biometrics', 'hipCircumference', val);
                  }}
                  className="compact-slider"
                  min="60"
                  max="180"
                />
              </label>
            </div>
        </div>
      </div>
    </>
  );
};
