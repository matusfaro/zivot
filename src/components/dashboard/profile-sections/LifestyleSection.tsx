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

export const LifestyleSection: React.FC<ProfileSectionProps> = ({ getFieldValue, updateField }) => {
  return (
    <>
      {/* Lifestyle */}
      <div className="profile-section">
        <div className="section-header-static">
          <span className="section-title">Lifestyle</span>
        </div>
        <div className="section-content">
            <div className="compact-form-row">
              <label>
                Smoking Status
                <select
                  data-testid="profile-lifestyle-smoking-status"
                  value={getFieldValue('lifestyle', 'smoking.status')}
                  onChange={(e) => updateField('lifestyle', 'smoking.status', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="never">Never smoked</option>
                  <option value="former">Former smoker</option>
                  <option value="current">Current smoker</option>
                </select>
              </label>
            </div>

            {(getFieldValue('lifestyle', 'smoking.status') === 'former' ||
              getFieldValue('lifestyle', 'smoking.status') === 'current') && (
              <div className="compact-form-grid">
                <label>
                  Pack-Years
                  <input
                    data-testid="profile-lifestyle-smoking-packYears"
                    type="number"
                    value={getFieldValue('lifestyle', 'smoking.packYears')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      updateField('lifestyle', 'smoking.packYears', val);
                    }}
                    className="compact-input"
                    placeholder="10"
                  />
                </label>

                {getFieldValue('lifestyle', 'smoking.status') === 'former' && (
                  <label>
                    Years Since Quit
                    <input
                      data-testid="profile-lifestyle-smoking-yearsSinceQuitting"
                      type="number"
                      value={getFieldValue('lifestyle', 'smoking.yearsSinceQuitting')}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value);
                        updateField('lifestyle', 'smoking.yearsSinceQuitting', val);
                      }}
                      className="compact-input"
                      placeholder="5"
                    />
                  </label>
                )}
              </div>
            )}

            <div className="compact-form-grid">
              <label>
                Exercise: {getFieldValue('lifestyle', 'exercise.moderateMinutesPerWeek') ?? 150} min/week
                <Tooltip content="Recommended: ≥150 min/week moderate activity or ≥75 min/week vigorous. Benefits increase up to 300 min/week.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-exercise-moderateMinutesPerWeek"
                  type="range"
                  value={getFieldValue('lifestyle', 'exercise.moderateMinutesPerWeek') ?? 150}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'exercise.moderateMinutesPerWeek', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="500"
                />
              </label>

              <label>
                Vigorous Exercise: {getFieldValue('lifestyle', 'exercise.vigorousMinutesPerWeek') ?? 0} min/week
                <Tooltip content="Recommended: ≥75 min/week vigorous activity. Examples: running, swimming laps, cycling fast.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-exercise-vigorousMinutesPerWeek"
                  type="range"
                  value={getFieldValue('lifestyle', 'exercise.vigorousMinutesPerWeek') ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'exercise.vigorousMinutesPerWeek', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="500"
                />
              </label>

              <label>
                Strength Training: {getFieldValue('lifestyle', 'exercise.strengthTrainingDaysPerWeek') ?? 0} days/week
                <Tooltip content="Recommended: ≥2 days/week. Weight lifting, resistance bands, body weight exercises.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-exercise-strengthTrainingDaysPerWeek"
                  type="range"
                  value={getFieldValue('lifestyle', 'exercise.strengthTrainingDaysPerWeek') ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'exercise.strengthTrainingDaysPerWeek', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="7"
                />
              </label>

              <label>
                Sedentary Time: {getFieldValue('lifestyle', 'exercise.sedentaryHoursPerDay') ?? 8} hours/day
                <Tooltip content="Includes sitting at desk, watching TV, driving. Lower is better.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-exercise-sedentaryHoursPerDay"
                  type="range"
                  value={getFieldValue('lifestyle', 'exercise.sedentaryHoursPerDay') ?? 8}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'exercise.sedentaryHoursPerDay', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="24"
                />
              </label>

              <label>
                Alcohol: {getFieldValue('lifestyle', 'alcohol.drinksPerWeek') ?? 0} drinks/week
                <Tooltip content="Low risk: ≤7 drinks/week (women), ≤14 drinks/week (men). Binge drinking: ≥4 drinks/occasion (women), ≥5 (men).">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-alcohol-drinksPerWeek"
                  type="range"
                  value={getFieldValue('lifestyle', 'alcohol.drinksPerWeek') ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'alcohol.drinksPerWeek', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="50"
                />
              </label>

              <label>
                Vegetables: {getFieldValue('lifestyle', 'diet.vegetableServingsPerDay') ?? 3} servings/day
                <Tooltip content="Recommended: ≥5 servings/day. 1 serving = 1 cup raw or ½ cup cooked vegetables.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-diet-vegetableServingsPerDay"
                  type="range"
                  value={getFieldValue('lifestyle', 'diet.vegetableServingsPerDay') ?? 3}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'diet.vegetableServingsPerDay', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="15"
                />
              </label>

              <label>
                Fruits: {getFieldValue('lifestyle', 'diet.fruitServingsPerDay') ?? 2} servings/day
                <Tooltip content="Recommended: ≥2 servings/day. 1 serving = 1 medium fruit or ½ cup fresh/frozen fruit.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-diet-fruitServingsPerDay"
                  type="range"
                  value={getFieldValue('lifestyle', 'diet.fruitServingsPerDay') ?? 2}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'diet.fruitServingsPerDay', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="15"
                />
              </label>

              <label>
                Processed Meat: {getFieldValue('lifestyle', 'diet.processedMeatServingsPerWeek') ?? 0} servings/week
                <Tooltip content="Lower is better. Each serving/day increases colorectal cancer risk ~18%. Examples: bacon, sausage, hot dogs, deli meats.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-diet-processedMeatServingsPerWeek"
                  type="range"
                  value={getFieldValue('lifestyle', 'diet.processedMeatServingsPerWeek') ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'diet.processedMeatServingsPerWeek', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="20"
                />
              </label>

              <label>
                Sugar-Sweetened Beverages: {getFieldValue('lifestyle', 'diet.sugarSweetenedBeveragesPerWeek') ?? 0} servings/week
                <Tooltip content="Includes soda, sweetened tea, energy drinks, sports drinks. Lower is better.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-diet-sugarSweetenedBeveragesPerWeek"
                  type="range"
                  value={getFieldValue('lifestyle', 'diet.sugarSweetenedBeveragesPerWeek') ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'diet.sugarSweetenedBeveragesPerWeek', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="50"
                />
              </label>

              <label>
                Sleep: {getFieldValue('lifestyle', 'sleep.averageHoursPerNight') ?? 7} hours/night
                <Tooltip content="Recommended: 7-9 hours for adults. Both too little and too much sleep linked to health risks.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-sleep-averageHoursPerNight"
                  type="range"
                  value={getFieldValue('lifestyle', 'sleep.averageHoursPerNight') ?? 7}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'sleep.averageHoursPerNight', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="12"
                />
              </label>

              <label>
                Sleep Quality: {getFieldValue('lifestyle', 'sleep.sleepQuality') ?? 7}/10
                <Tooltip content="Rate from 1 (very poor) to 10 (excellent). Considers ease of falling/staying asleep and feeling rested.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-sleep-sleepQuality"
                  type="range"
                  value={getFieldValue('lifestyle', 'sleep.sleepQuality') ?? 7}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'sleep.sleepQuality', val);
                  }}
                  className="compact-slider"
                  min="1"
                  max="10"
                />
              </label>

              <label>
                Outdoor Time: {getFieldValue('lifestyle', 'outdoorTime.minutesPerWeek') ?? 0} min/week
                <Tooltip content="Time spent outdoors in natural environments. Associated with mental and physical health benefits.">
                <span className="field-help">ℹ️</span>
              </Tooltip>
                <input
                  data-testid="profile-lifestyle-outdoorTime-minutesPerWeek"
                  type="range"
                  value={getFieldValue('lifestyle', 'outdoorTime.minutesPerWeek') ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateField('lifestyle', 'outdoorTime.minutesPerWeek', val);
                  }}
                  className="compact-slider"
                  min="0"
                  max="1000"
                />
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Alcohol Pattern
                <select
                  data-testid="profile-lifestyle-alcohol-pattern"
                  value={getFieldValue('lifestyle', 'alcohol.pattern')}
                  onChange={(e) => updateField('lifestyle', 'alcohol.pattern', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="light">Light (1-2 drinks occasionally)</option>
                  <option value="moderate">Moderate (up to 1 drink/day women, 2 men)</option>
                  <option value="heavy">Heavy (exceeds moderate limits)</option>
                </select>
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Diet Pattern
                <select
                  data-testid="profile-lifestyle-diet-pattern"
                  value={getFieldValue('lifestyle', 'diet.pattern')}
                  onChange={(e) => updateField('lifestyle', 'diet.pattern', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="mediterranean">Mediterranean</option>
                  <option value="dash">DASH (Dietary Approaches to Stop Hypertension)</option>
                  <option value="plant_based">Plant-Based</option>
                  <option value="western">Western (high processed foods)</option>
                  <option value="mixed">Mixed</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <div className="compact-form-row">
              <label>
                Outdoor Setting
                <select
                  data-testid="profile-lifestyle-outdoorTime-setting"
                  value={getFieldValue('lifestyle', 'outdoorTime.setting')}
                  onChange={(e) => updateField('lifestyle', 'outdoorTime.setting', e.target.value)}
                  className="compact-input"
                >
                  <option value="">Select...</option>
                  <option value="urban_parks">Urban Parks</option>
                  <option value="suburban_parks">Suburban Parks</option>
                  <option value="nature_trails">Nature Trails</option>
                  <option value="wilderness">Wilderness</option>
                  <option value="beaches">Beaches</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
            </div>

            <div className="compact-form-row">
              <label className="checkbox-label">
                <input
                  data-testid="profile-lifestyle-alcohol-bingeDrinking"
                  type="checkbox"
                  checked={getFieldValue('lifestyle', 'alcohol.bingeDrinking') || false}
                  onChange={(e) => updateField('lifestyle', 'alcohol.bingeDrinking', e.target.checked)}
                />
                <span>Binge Drinking (≥4 drinks/occasion women, ≥5 men)</span>
              </label>
            </div>

            <div className="compact-form-row">
              <label className="checkbox-label">
                <input
                  data-testid="profile-lifestyle-occupationalExposures"
                  type="checkbox"
                  checked={getFieldValue('lifestyle', 'occupationalExposures') || false}
                  onChange={(e) => updateField('lifestyle', 'occupationalExposures', e.target.checked)}
                />
                <span>Occupational Chemical Exposures (dyes, aromatic amines, etc.)</span>
              </label>
            </div>
        </div>
      </div>
    </>
  );
};
