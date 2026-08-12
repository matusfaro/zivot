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

export const DemographicsSection: React.FC<ProfileSectionProps> = ({ getFieldValue, updateField }) => {
  return (
    <>
      {/* Demographics */}
      <div className="profile-section">
        <div className="section-header-static">
          <span className="section-title">Demographics</span>
        </div>
        <div className="section-content">
            <div className="compact-form-row">
              <label>
                Age: {(() => {
                  const dob = getFieldValue('demographics', 'dateOfBirth');
                  if (dob) {
                    const birthDate = new Date(dob);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    return age;
                  }
                  return 45;
                })()} years
                <Tooltip content="Your current age affects baseline risk for many conditions">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-demographics-dateOfBirth"
                  type="range"
                  value={(() => {
                    const dob = getFieldValue('demographics', 'dateOfBirth');
                    if (dob) {
                      const birthDate = new Date(dob);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return age;
                    }
                    return 45;
                  })()}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const today = new Date();
                    const birthYear = today.getFullYear() - val;
                    const dob = `${birthYear}-01-01`;
                    updateField('demographics', 'dateOfBirth', dob);
                  }}
                  className="compact-slider"
                  min="18"
                  max="120"
                />
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Biological Sex
                <select
                  data-testid="profile-demographics-biologicalSex"
                  value={getFieldValue('demographics', 'biologicalSex')}
                  onChange={(e) => updateField('demographics', 'biologicalSex', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Ethnicity (optional)
                <select
                  data-testid="profile-demographics-ethnicity"
                  value={getFieldValue('demographics', 'ethnicity')}
                  onChange={(e) => updateField('demographics', 'ethnicity', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="white">White</option>
                  <option value="black">Black/African American</option>
                  <option value="hispanic">Hispanic/Latino</option>
                  <option value="asian">Asian</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Education Level (optional)
                <select
                  data-testid="profile-demographics-educationLevel"
                  value={getFieldValue('demographics', 'educationLevel')}
                  onChange={(e) => updateField('demographics', 'educationLevel', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="less_than_high_school">Less than High School</option>
                  <option value="high_school">High School / GED</option>
                  <option value="some_college">Some College / Associate Degree</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="graduate">Graduate Degree (Master's, PhD, etc.)</option>
                </select>
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Gender Identity (optional)
                <input
                  data-testid="profile-demographics-genderIdentity"
                  type="text"
                  value={getFieldValue('demographics', 'genderIdentity')}
                  onChange={(e) => updateField('demographics', 'genderIdentity', e.target.value)}
                  className="compact-input"
                  placeholder="e.g., man, woman, non-binary"
                />
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Urbanicity (optional)
                <select
                  data-testid="profile-demographics-urbanicity"
                  value={getFieldValue('demographics', 'urbanicity')}
                  onChange={(e) => updateField('demographics', 'urbanicity', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="urban">Urban</option>
                  <option value="suburban">Suburban</option>
                  <option value="rural">Rural</option>
                </select>
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Country (optional)
                <input
                  data-testid="profile-demographics-country"
                  type="text"
                  value={getFieldValue('demographics', 'country')}
                  onChange={(e) => updateField('demographics', 'country', e.target.value)}
                  className="compact-input"
                  placeholder="e.g., USA"
                />
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                State/Region (optional)
                <input
                  data-testid="profile-demographics-region"
                  type="text"
                  value={getFieldValue('demographics', 'region')}
                  onChange={(e) => updateField('demographics', 'region', e.target.value)}
                  className="compact-input"
                  placeholder="e.g., California"
                />
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Zip Code (optional)
                <input
                  data-testid="profile-demographics-zipCode"
                  type="text"
                  value={getFieldValue('demographics', 'zipCode')}
                  onChange={(e) => updateField('demographics', 'zipCode', e.target.value)}
                  className="compact-input"
                  placeholder="e.g., 94102"
                />
              </label>
            </div>
        </div>
      </div>
    </>
  );
};
