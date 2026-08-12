// @ts-nocheck -- extracted from the legacy profile editor; loose typing pending rewrite
import React from 'react';
import { UserProfile } from '../../../types/user';

export interface ProfileSectionProps {
  profile: UserProfile | null;
  age: number | null;
  getFieldValue: (section: keyof UserProfile, field: string) => any;
  updateField: (section: keyof UserProfile, field: string, value: any) => void;
}

export const SafetySection: React.FC<ProfileSectionProps> = ({ age, getFieldValue, updateField }) => {
  return (
    <>
      {/* Safety & Injury Risk */}
      <div className="profile-section">
        <div className="section-header-static">
          <span className="section-title">Safety & Injury Risk</span>
        </div>
        <div className="section-content">
            <h4 className="subsection-title">Driving Habits</h4>
            <div className="compact-form-grid">
              <label>
                Miles Driven Per Year
                <input
                  type="number"
                  value={getFieldValue('lifestyle', 'drivingHabits.milesPerYear')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    updateField('lifestyle', 'drivingHabits.milesPerYear', val);
                  }}
                  className="compact-input"
                  placeholder="12000"
                />
              </label>

              <label>
                Seat Belt Use
                <select
                  value={getFieldValue('lifestyle', 'drivingHabits.seatBeltUse')}
                  onChange={(e) => updateField('lifestyle', 'drivingHabits.seatBeltUse', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="always">Always</option>
                  <option value="usually">Usually</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="never">Never</option>
                </select>
              </label>

              <label>
                Traffic Violations (Past 3 Years)
                <input
                  type="number"
                  value={getFieldValue('lifestyle', 'drivingHabits.trafficViolationsPast3Years')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    updateField('lifestyle', 'drivingHabits.trafficViolationsPast3Years', val);
                  }}
                  className="compact-input"
                  placeholder="0"
                />
              </label>

              <label>
                Phone Use While Driving
                <select
                  value={getFieldValue('lifestyle', 'drivingHabits.phoneUseWhileDriving')}
                  onChange={(e) => updateField('lifestyle', 'drivingHabits.phoneUseWhileDriving', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="never">Never</option>
                  <option value="rare">Rarely</option>
                  <option value="occasional">Occasionally</option>
                  <option value="frequent">Frequently</option>
                </select>
              </label>

              <label>
                Driving Environment
                <select
                  value={getFieldValue('lifestyle', 'drivingHabits.drivingSetting')}
                  onChange={(e) => updateField('lifestyle', 'drivingHabits.drivingSetting', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="urban">Urban</option>
                  <option value="suburban">Suburban</option>
                  <option value="rural">Rural</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
            </div>

            {age !== null && age >= 50 && (
              <>
                <h4 className="subsection-title">Fall Risk (Age 50+)</h4>
                <div className="compact-form-grid">
                  <label>
                    Falls in Past Year
                    <input
                      type="number"
                      value={getFieldValue('medicalHistory', 'fallHistory.fallsPastYear')}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value);
                        updateField('medicalHistory', 'fallHistory.fallsPastYear', val);
                      }}
                      className="compact-input"
                      placeholder="0"
                    />
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={getFieldValue('medicalHistory', 'fallHistory.balanceProblems') || false}
                      onChange={(e) => updateField('medicalHistory', 'fallHistory.balanceProblems', e.target.checked)}
                    />
                    <span>Balance Problems</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={getFieldValue('medicalHistory', 'fallHistory.dizzinessWhenStanding') || false}
                      onChange={(e) => updateField('medicalHistory', 'fallHistory.dizzinessWhenStanding', e.target.checked)}
                    />
                    <span>Dizziness When Standing</span>
                  </label>
                </div>
              </>
            )}
        </div>
      </div>
    </>
  );
};
