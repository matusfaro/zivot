// @ts-nocheck -- extracted from the legacy profile editor; loose typing pending rewrite
import React from 'react';
import { UserProfile } from '../../../types/user';

export interface ProfileSectionProps {
  profile: UserProfile | null;
  age: number | null;
  getFieldValue: (section: keyof UserProfile, field: string) => any;
  updateField: (section: keyof UserProfile, field: string, value: any) => void;
}

export const ReproductiveSection: React.FC<ProfileSectionProps> = ({ getFieldValue, updateField }) => {
  return (
    <>
      {/* Reproductive History (Women Only) */}
      {getFieldValue('demographics', 'biologicalSex') === 'female' && (
        <div className="profile-section">
          <div className="section-header-static">
            <span className="section-title">Reproductive History (optional)</span>
          </div>
          <div className="section-content">
              <div className="compact-form-row">
                <label>
                  Age at First Menstrual Period
                  <input
                    type="number"
                    value={getFieldValue('medicalHistory', 'reproductiveHistory.ageAtMenarche')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value);
                      updateField('medicalHistory', 'reproductiveHistory.ageAtMenarche', val);
                    }}
                    className="compact-input"
                    placeholder="13"
                    min="8"
                    max="20"
                  />
                </label>
              </div>

              <div className="compact-form-row">
                <label>
                  Age at First Live Birth
                  <select
                    value={getFieldValue('medicalHistory', 'reproductiveHistory.ageAtFirstBirth')}
                    onChange={(e) => updateField('medicalHistory', 'reproductiveHistory.ageAtFirstBirth', e.target.value)}
                    className="compact-input"
                  >
                    <option value="">Select...</option>
                    <option value="never">Never had children</option>
                    <option value="under_20">Under 20</option>
                    <option value="20_24">20-24</option>
                    <option value="25_29">25-29</option>
                    <option value="30_34">30-34</option>
                    <option value="35_plus">35 or older</option>
                  </select>
                </label>
              </div>

              <div className="compact-form-row">
                <label>
                  Number of Breast Biopsies
                  <select
                    value={getFieldValue('medicalHistory', 'reproductiveHistory.breastBiopsies')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value);
                      updateField('medicalHistory', 'reproductiveHistory.breastBiopsies', val);
                    }}
                    className="compact-input"
                  >
                    <option value="">Select...</option>
                    <option value="0">0 (None)</option>
                    <option value="1">1</option>
                    <option value="2">2 or more</option>
                  </select>
                </label>
              </div>

              <div className="compact-form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={getFieldValue('medicalHistory', 'reproductiveHistory.atypicalHyperplasia') || false}
                    onChange={(e) => updateField('medicalHistory', 'reproductiveHistory.atypicalHyperplasia', e.target.checked)}
                  />
                  <span>Atypical Hyperplasia (from biopsy)</span>
                </label>
              </div>
          </div>
        </div>
      )}
    </>
  );
};
