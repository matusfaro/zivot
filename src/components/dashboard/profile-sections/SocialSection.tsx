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

export const SocialSection: React.FC<ProfileSectionProps> = ({ getFieldValue, updateField }) => {
  return (
    <>
      {/* Social & Wellbeing */}
      <div className="profile-section">
        <div className="section-header-static">
          <span className="section-title">Social & Wellbeing (optional)</span>
        </div>
        <div className="section-content">
          <div className="compact-form-row">
            <label className="checkbox-label">
              <input
                data-testid="profile-social-petOwnership-ownsDog"
                type="checkbox"
                checked={getFieldValue('social', 'petOwnership.ownsDog') || false}
                onChange={(e) => updateField('social', 'petOwnership.ownsDog', e.target.checked)}
              />
              <span>Dog Owner</span>
              <Tooltip content="Dog ownership is associated with 24% lower mortality risk (HR: 0.76). Benefits include increased physical activity and social connection.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
            </label>
          </div>

          <div className="compact-form-row">
            <label>
              Social Connection Strength
              <Tooltip content="Strong social connections reduce mortality risk by 33% (HR: 0.67). This includes close relationships and regular social engagement.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
              <select
                data-testid="profile-social-connections-strength"
                value={getFieldValue('social', 'connections.strength')}
                onChange={(e) => updateField('social', 'connections.strength', e.target.value)}
                className="compact-select"
              >
                <option value="">Select...</option>
                <option value="isolated">Isolated (few or no connections)</option>
                <option value="weak">Weak (limited network, infrequent contact)</option>
                <option value="moderate">Moderate (some close relationships)</option>
                <option value="strong">Strong (multiple close relationships)</option>
                <option value="very_strong">Very Strong (rich social network)</option>
              </select>
            </label>
          </div>

          <div className="compact-form-row">
            <label className="checkbox-label">
              <input
                data-testid="profile-social-connections-livesAlone"
                type="checkbox"
                checked={getFieldValue('social', 'connections.livesAlone') === true}
                onChange={(e) => updateField('social', 'connections.livesAlone', e.target.checked)}
              />
              <span>I live alone</span>
              <Tooltip content="Living alone is associated with 32% higher all-cause mortality (meta-analysis). Combined with other social factors using an attenuated rule, not raw multiplication.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
            </label>
          </div>

          <div className="compact-form-row">
            <label className="checkbox-label">
              <input
                data-testid="profile-social-volunteering-active"
                type="checkbox"
                checked={getFieldValue('social', 'volunteering.active') || false}
                onChange={(e) => updateField('social', 'volunteering.active', e.target.checked)}
              />
              <span>Currently Volunteer</span>
              <Tooltip content="Volunteering reduces mortality risk by 22% (HR: 0.78) through stress buffering, social connection, and sense of purpose.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
            </label>
          </div>

          <div className="compact-form-row">
            <label>
              Religious Service Attendance
              <Tooltip content="Regular religious attendance is associated with 18-27% lower mortality risk (HR: 0.73-0.82) through social support, healthy behaviors, and stress buffering.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
              <select
                data-testid="profile-social-religiousAttendance"
                value={getFieldValue('social', 'religiousAttendance')}
                onChange={(e) => updateField('social', 'religiousAttendance', e.target.value)}
                className="compact-select"
              >
                <option value="">Select...</option>
                <option value="never">Never</option>
                <option value="rarely">Rarely (few times per year)</option>
                <option value="monthly">Monthly (1-3 times per month)</option>
                <option value="weekly">Weekly</option>
                <option value="multiple_weekly">Multiple times per week</option>
                <option value="daily">Daily</option>
              </select>
            </label>
          </div>

          <div className="compact-form-row">
            <label className="checkbox-label">
              <input
                data-testid="profile-social-hobbies-creative-engaged"
                type="checkbox"
                checked={getFieldValue('social', 'hobbies.creative.engaged') || false}
                onChange={(e) => updateField('social', 'hobbies.creative.engaged', e.target.checked)}
              />
              <span>Engage in Creative Hobbies</span>
              <Tooltip content="Creative activities like music, art, writing, gardening, or crafts may reduce mortality risk through cognitive stimulation and stress reduction.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
            </label>
          </div>
        </div>
      </div>
    </>
  );
};
