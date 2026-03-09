import React from 'react';
import { UserProfile } from '../../types/user';
import { createUserDataPoint } from '../../types/common/datapoint';

interface ProfileSectionProps {
  profile: UserProfile | null;
  onProfileChange: (profile: UserProfile) => void;
  onReset?: () => void;
}

// Shared helper functions
const updateField = (
  profile: UserProfile | null,
  section: keyof UserProfile,
  field: string,
  value: any,
  onProfileChange: (profile: UserProfile) => void
) => {
  if (!profile) return;

  const updatedProfile = { ...profile };
  if (!(updatedProfile as any)[section]) {
    (updatedProfile as any)[section] = {};
  }

  const sectionData: any = updatedProfile[section];
  const isEmpty = value === '' || value === null || value === undefined ||
                  (typeof value === 'number' && isNaN(value));

  // Handle special cases based on section and field
  if (section === 'biometrics') {
    if (field === 'weight') {
      if (isEmpty) {
        delete sectionData.weight;
      } else {
        const dataPoint = createUserDataPoint({ value: value, unit: 'kg' });
        sectionData.weight = {
          dataPoints: sectionData.weight?.dataPoints || [],
          mostRecent: dataPoint
        };
      }
    } else if (field === 'height') {
      if (isEmpty) {
        delete sectionData.height;
      } else {
        sectionData.height = createUserDataPoint(value);
      }
    } else if (field === 'waistCircumference') {
      if (isEmpty) {
        delete sectionData.waistCircumference;
      } else {
        const dataPoint = createUserDataPoint(value);
        sectionData.waistCircumference = {
          dataPoints: sectionData.waistCircumference?.dataPoints || [],
          mostRecent: dataPoint
        };
      }
    } else if (field === 'bloodPressure.systolic' || field === 'bloodPressure.diastolic') {
      const current = sectionData.bloodPressure?.mostRecent?.value || { systolic: 120, diastolic: 80 };
      const bp = field.endsWith('systolic')
        ? { ...current, systolic: isEmpty ? 120 : value }
        : { ...current, diastolic: isEmpty ? 80 : value };

      if (bp.systolic === 120 && bp.diastolic === 80) {
        delete sectionData.bloodPressure;
      } else {
        const dataPoint = createUserDataPoint(bp);
        sectionData.bloodPressure = {
          dataPoints: sectionData.bloodPressure?.dataPoints || [],
          mostRecent: dataPoint
        };
      }
    }
  } else if (section === 'labTests') {
    const parts = field.split('.');
    if (parts[0] === 'lipidPanel') {
      if (!sectionData.lipidPanel) sectionData.lipidPanel = {};
      if (isEmpty) {
        delete sectionData.lipidPanel[parts[1]];
      } else {
        const dataPoint = createUserDataPoint(value);
        sectionData.lipidPanel[parts[1]] = {
          dataPoints: sectionData.lipidPanel[parts[1]]?.dataPoints || [],
          mostRecent: dataPoint
        };
      }
    } else if (parts[0] === 'glucoseMetabolism') {
      if (!sectionData.glucoseMetabolism) sectionData.glucoseMetabolism = {};
      if (isEmpty) {
        delete sectionData.glucoseMetabolism[parts[1]];
      } else {
        const dataPoint = createUserDataPoint(value);
        sectionData.glucoseMetabolism[parts[1]] = {
          dataPoints: sectionData.glucoseMetabolism[parts[1]]?.dataPoints || [],
          mostRecent: dataPoint
        };
      }
    }
  } else if (section === 'lifestyle') {
    if (field === 'smoking.status') {
      if (isEmpty) {
        delete sectionData.smoking;
      } else {
        sectionData.smoking = { status: createUserDataPoint(value) };
      }
    } else if (field === 'smoking.packYears') {
      if (!sectionData.smoking) sectionData.smoking = {};
      if (isEmpty) {
        delete sectionData.smoking.packYears;
      } else {
        sectionData.smoking.packYears = createUserDataPoint(value);
      }
    } else if (field === 'exercise.minutesPerWeek') {
      if (isEmpty) {
        delete sectionData.exercise;
      } else {
        const dataPoint = createUserDataPoint(value);
        sectionData.exercise = {
          dataPoints: sectionData.exercise?.dataPoints || [],
          mostRecent: dataPoint,
          minutesPerWeek: dataPoint
        };
      }
    } else if (field === 'alcohol.drinksPerWeek') {
      if (isEmpty) {
        delete sectionData.alcohol;
      } else {
        const dataPoint = createUserDataPoint(value);
        sectionData.alcohol = {
          dataPoints: sectionData.alcohol?.dataPoints || [],
          mostRecent: dataPoint,
          drinksPerWeek: dataPoint
        };
      }
    } else if (field === 'diet.fruitsVegetablesPerDay') {
      if (isEmpty) {
        delete sectionData.diet;
      } else {
        const dataPoint = createUserDataPoint(value);
        sectionData.diet = {
          dataPoints: sectionData.diet?.dataPoints || [],
          mostRecent: dataPoint,
          fruitsVegetablesPerDay: dataPoint
        };
      }
    }
  } else if (section === 'demographics') {
    if (isEmpty) {
      delete sectionData[field];
    } else {
      sectionData[field] = createUserDataPoint(value);
    }
  } else if (section === 'medicalHistory') {
    if (field.startsWith('conditions.')) {
      const conditionId = field.split('.')[1];
      let conditions = sectionData.conditions || [];
      if (!Array.isArray(conditions)) conditions = [];

      if (isEmpty || value === false) {
        sectionData.conditions = conditions.filter((c: any) => c.conditionId !== conditionId);
      } else {
        const exists = conditions.find((c: any) => c.conditionId === conditionId);
        if (!exists) {
          sectionData.conditions = [
            ...conditions,
            {
              conditionId,
              status: createUserDataPoint('active'),
              diagnosedDate: createUserDataPoint(new Date().toISOString()),
            },
          ];
        }
      }
    }
  }

  onProfileChange(updatedProfile);
};

const getFieldValue = (profile: UserProfile | null, section: keyof UserProfile, field: string): any => {
  if (!profile || !profile[section]) return '';
  const sectionData: any = profile[section];

  if (section === 'biometrics') {
    if (field === 'weight') return sectionData.weight?.mostRecent?.value?.value ?? '';
    if (field === 'height') return sectionData.height?.value ?? '';
    if (field === 'waistCircumference') return sectionData.waistCircumference?.mostRecent?.value ?? '';
    if (field === 'bloodPressure.systolic') return sectionData.bloodPressure?.mostRecent?.value?.systolic ?? '';
    if (field === 'bloodPressure.diastolic') return sectionData.bloodPressure?.mostRecent?.value?.diastolic ?? '';
  } else if (section === 'labTests') {
    const parts = field.split('.');
    if (parts[0] === 'lipidPanel') {
      return sectionData.lipidPanel?.[parts[1]]?.mostRecent?.value ?? '';
    } else if (parts[0] === 'glucoseMetabolism') {
      return sectionData.glucoseMetabolism?.[parts[1]]?.mostRecent?.value ?? '';
    }
  } else if (section === 'lifestyle') {
    if (field === 'smoking.status') return sectionData.smoking?.status?.value ?? '';
    if (field === 'smoking.packYears') return sectionData.smoking?.packYears?.value ?? '';
    if (field === 'exercise.minutesPerWeek') return sectionData.exercise?.minutesPerWeek?.value ?? '';
    if (field === 'alcohol.drinksPerWeek') return sectionData.alcohol?.drinksPerWeek?.value ?? '';
    if (field === 'diet.fruitsVegetablesPerDay') return sectionData.diet?.fruitsVegetablesPerDay?.value ?? '';
  } else if (section === 'demographics') {
    const current = sectionData[field];
    if (current && typeof current === 'object' && 'value' in current) {
      return current.value ?? '';
    }
  } else if (section === 'medicalHistory') {
    if (field.startsWith('conditions.')) {
      const conditionId = field.split('.')[1];
      let conditions = sectionData.conditions || [];
      // Handle old object format
      if (!Array.isArray(conditions)) {
        conditions = [];
      }
      return conditions.some((c: any) => c.conditionId === conditionId);
    }
  }

  return '';
};

// Demographics Section
export const ProfileDemographics: React.FC<ProfileSectionProps> = ({ profile, onProfileChange }) => {
  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h3>👤 DEMOGRAPHICS</h3>
      </div>
      <div className="profile-card-body">
        <div className="compact-form-grid">
          <label>
            Age
            <input
              type="number"
              value={(() => {
                const dob = getFieldValue(profile, 'demographics', 'dateOfBirth');
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
                return '';
              })()}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                if (!profile) return;
                if (val && !isNaN(val)) {
                  const today = new Date();
                  const birthYear = today.getFullYear() - val;
                  const dob = `${birthYear}-01-01`;

                  const updatedProfile = { ...profile };
                  if (!updatedProfile.demographics) {
                    updatedProfile.demographics = {} as any;
                  }
                  updatedProfile.demographics!.dateOfBirth = {
                    value: dob,
                    provenance: {
                      source: 'user_input' as any,
                      timestamp: Date.now()
                    }
                  };
                  onProfileChange(updatedProfile);
                } else {
                  const updatedProfile = { ...profile };
                  if (updatedProfile.demographics?.dateOfBirth) {
                    delete updatedProfile.demographics.dateOfBirth;
                  }
                  onProfileChange(updatedProfile);
                }
              }}
              className="compact-input"
              placeholder="45"
            />
          </label>

          <label>
            Sex
            <select
              value={getFieldValue(profile, 'demographics', 'biologicalSex')}
              onChange={(e) => updateField(profile, 'demographics', 'biologicalSex', e.target.value, onProfileChange)}
              className="compact-input"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <label>
            Race/Ethnicity
            <select
              value={getFieldValue(profile, 'demographics', 'race')}
              onChange={(e) => updateField(profile, 'demographics', 'race', e.target.value, onProfileChange)}
              className="compact-input"
            >
              <option value="">Select...</option>
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="hispanic">Hispanic</option>
              <option value="asian">Asian</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

// Biometrics Section
export const ProfileBiometrics: React.FC<ProfileSectionProps> = ({ profile, onProfileChange }) => {
  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h3>📏 BIOMETRICS</h3>
      </div>
      <div className="profile-card-body">
        <div className="compact-form-grid">
          <label>
            Height (cm)
            <input
              type="number"
              value={getFieldValue(profile, 'biometrics', 'height')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'biometrics', 'height', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="170"
            />
          </label>

          <label>
            Weight (kg)
            <input
              type="number"
              value={getFieldValue(profile, 'biometrics', 'weight')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'biometrics', 'weight', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="70"
            />
          </label>

          <label>
            Systolic BP
            <input
              type="number"
              value={getFieldValue(profile, 'biometrics', 'bloodPressure.systolic')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'biometrics', 'bloodPressure.systolic', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="120"
            />
          </label>

          <label>
            Diastolic BP
            <input
              type="number"
              value={getFieldValue(profile, 'biometrics', 'bloodPressure.diastolic')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'biometrics', 'bloodPressure.diastolic', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="80"
            />
          </label>

          <label>
            Waist (cm)
            <input
              type="number"
              value={getFieldValue(profile, 'biometrics', 'waistCircumference')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'biometrics', 'waistCircumference', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="85"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// Lab Tests Section
export const ProfileLabTests: React.FC<ProfileSectionProps> = ({ profile, onProfileChange }) => {
  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h3>🧪 LAB TESTS</h3>
      </div>
      <div className="profile-card-body">
        <div className="compact-form-grid">
          <label>
            LDL
            <input
              type="number"
              value={getFieldValue(profile, 'labTests', 'lipidPanel.ldlCholesterol')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'labTests', 'lipidPanel.ldlCholesterol', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="100"
            />
          </label>

          <label>
            HDL
            <input
              type="number"
              value={getFieldValue(profile, 'labTests', 'lipidPanel.hdlCholesterol')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'labTests', 'lipidPanel.hdlCholesterol', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="50"
            />
          </label>

          <label>
            Total Chol
            <input
              type="number"
              value={getFieldValue(profile, 'labTests', 'lipidPanel.totalCholesterol')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'labTests', 'lipidPanel.totalCholesterol', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="180"
            />
          </label>

          <label>
            Triglycerides
            <input
              type="number"
              value={getFieldValue(profile, 'labTests', 'lipidPanel.triglycerides')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'labTests', 'lipidPanel.triglycerides', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="150"
            />
          </label>

          <label>
            Glucose
            <input
              type="number"
              value={getFieldValue(profile, 'labTests', 'glucoseMetabolism.fastingGlucose')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'labTests', 'glucoseMetabolism.fastingGlucose', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="90"
            />
          </label>

          <label>
            HbA1c
            <input
              type="number"
              step="0.1"
              value={getFieldValue(profile, 'labTests', 'glucoseMetabolism.hba1c')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'labTests', 'glucoseMetabolism.hba1c', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="5.5"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// Lifestyle Section
export const ProfileLifestyle: React.FC<ProfileSectionProps> = ({ profile, onProfileChange }) => {
  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h3>🏃 LIFESTYLE</h3>
      </div>
      <div className="profile-card-body">
        <div className="compact-form-grid">
          <label>
            Smoking
            <select
              value={getFieldValue(profile, 'lifestyle', 'smoking.status')}
              onChange={(e) => updateField(profile, 'lifestyle', 'smoking.status', e.target.value, onProfileChange)}
              className="compact-input"
            >
              <option value="">Select...</option>
              <option value="never">Never</option>
              <option value="former">Former</option>
              <option value="current">Current</option>
            </select>
          </label>

          <label>
            Pack Years
            <input
              type="number"
              value={getFieldValue(profile, 'lifestyle', 'smoking.packYears')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'lifestyle', 'smoking.packYears', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="0"
            />
          </label>

          <label>
            Exercise (min/wk)
            <input
              type="number"
              value={getFieldValue(profile, 'lifestyle', 'exercise.minutesPerWeek')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'lifestyle', 'exercise.minutesPerWeek', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="150"
            />
          </label>

          <label>
            Alcohol (drinks/wk)
            <input
              type="number"
              value={getFieldValue(profile, 'lifestyle', 'alcohol.drinksPerWeek')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'lifestyle', 'alcohol.drinksPerWeek', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="0"
            />
          </label>

          <label>
            Fruits/Veg (servings/day)
            <input
              type="number"
              value={getFieldValue(profile, 'lifestyle', 'diet.fruitsVegetablesPerDay')}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                updateField(profile, 'lifestyle', 'diet.fruitsVegetablesPerDay', val, onProfileChange);
              }}
              className="compact-input"
              placeholder="5"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// Medical History Section
export const ProfileMedicalHistory: React.FC<ProfileSectionProps> = ({ profile, onProfileChange }) => {
  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h3>🏥 MEDICAL HISTORY</h3>
      </div>
      <div className="profile-card-body">
        <div className="compact-form-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={getFieldValue(profile, 'medicalHistory', 'conditions.diabetes')}
              onChange={(e) => updateField(profile, 'medicalHistory', 'conditions.diabetes', e.target.checked, onProfileChange)}
            />
            Diabetes
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={getFieldValue(profile, 'medicalHistory', 'conditions.hypertension')}
              onChange={(e) => updateField(profile, 'medicalHistory', 'conditions.hypertension', e.target.checked, onProfileChange)}
            />
            Hypertension
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={getFieldValue(profile, 'medicalHistory', 'conditions.heartDisease')}
              onChange={(e) => updateField(profile, 'medicalHistory', 'conditions.heartDisease', e.target.checked, onProfileChange)}
            />
            Heart Disease
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={getFieldValue(profile, 'medicalHistory', 'conditions.stroke')}
              onChange={(e) => updateField(profile, 'medicalHistory', 'conditions.stroke', e.target.checked, onProfileChange)}
            />
            Stroke
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={getFieldValue(profile, 'medicalHistory', 'conditions.cancer')}
              onChange={(e) => updateField(profile, 'medicalHistory', 'conditions.cancer', e.target.checked, onProfileChange)}
            />
            Cancer
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={getFieldValue(profile, 'medicalHistory', 'conditions.copd')}
              onChange={(e) => updateField(profile, 'medicalHistory', 'conditions.copd', e.target.checked, onProfileChange)}
            />
            COPD
          </label>
        </div>
      </div>
    </div>
  );
};
