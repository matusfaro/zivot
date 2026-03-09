import React, { useState } from 'react';
import { UserProfile, Demographics, Biometrics, LabTests, Lifestyle, MedicalHistory, Social } from '../../types/user';
import { createUserDataPoint } from '../../types/common/datapoint';
import { calculateAge } from '../../utils/dataExtraction';
import { Tooltip } from '../common/Tooltip';

interface CompactProfileEditorProps {
  profile: UserProfile | null;
  onProfileChange: (profile: UserProfile) => void;
}

export const CompactProfileEditor: React.FC<CompactProfileEditorProps> = ({ profile, onProfileChange }) => {

  const updateField = (section: keyof UserProfile, field: string, value: any) => {
    if (!profile) return;

    const updatedProfile = { ...profile };
    if (!updatedProfile[section]) {
      (updatedProfile as any)[section] = {};
    }

    const keys = field.split('.');
    const sectionData: any = updatedProfile[section];

    // Check if value is empty/invalid - if so, remove the field
    const isEmpty = value === '' || value === null || value === undefined ||
                    (typeof value === 'number' && isNaN(value));

    // Handle special cases based on field structure
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
      } else if (field === 'hipCircumference') {
        if (isEmpty) {
          delete sectionData.hipCircumference;
        } else {
          const dataPoint = createUserDataPoint(value);
          sectionData.hipCircumference = {
            dataPoints: sectionData.hipCircumference?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'heartRate') {
        if (isEmpty) {
          delete sectionData.heartRate;
        } else {
          const dataPoint = createUserDataPoint(value);
          sectionData.heartRate = {
            dataPoints: sectionData.heartRate?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'bloodPressure.systolic' || field === 'bloodPressure.diastolic') {
        const current = sectionData.bloodPressure?.mostRecent?.value || { systolic: 120, diastolic: 80 };
        const bp = field.endsWith('systolic')
          ? { ...current, systolic: isEmpty ? 120 : value }
          : { ...current, diastolic: isEmpty ? 80 : value };

        // If both values are defaults, remove blood pressure entirely
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
    } else if (section === 'medicalHistory') {
      // Handle medical history with proper array structures
      if (field.startsWith('conditions.')) {
        const conditionId = field.split('.')[1];
        let conditions = sectionData.conditions || [];

        // Convert old object format to array if needed
        if (!Array.isArray(conditions)) {
          conditions = [];
        }

        if (isEmpty || value === false) {
          // Remove the condition
          sectionData.conditions = conditions.filter((c: any) => c.conditionId !== conditionId);
        } else {
          // Add or update the condition
          const existing = conditions.find((c: any) => c.conditionId === conditionId);
          if (!existing) {
            sectionData.conditions = [
              ...conditions,
              {
                conditionId,
                name: conditionId,
                status: 'active'
              }
            ];
          }
        }
      } else if (field.startsWith('familyHistory.')) {
        const conditionId = field.split('.')[1];
        let familyHistory = sectionData.familyHistory || [];

        // Convert old object format to array if needed
        if (!Array.isArray(familyHistory)) {
          familyHistory = [];
        }

        if (isEmpty || value === false) {
          // Remove the family history entry
          sectionData.familyHistory = familyHistory.filter((fh: any) => fh.conditionId !== conditionId);
        } else {
          // Add family history entry (default to parent relation)
          const existing = familyHistory.find((fh: any) => fh.conditionId === conditionId);
          if (!existing) {
            sectionData.familyHistory = [
              ...familyHistory,
              {
                conditionId,
                relation: 'parent'
              }
            ];
          }
        }
      } else {
        // For other medical history fields
        if (isEmpty) {
          let current: any = sectionData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) return;
            current = current[keys[i]];
          }
          delete current[keys[keys.length - 1]];
        } else {
          let current: any = sectionData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = createUserDataPoint(value);
        }
      }
    } else if (section === 'labTests') {
      // Handle lab tests - some are TimeSeries, some are DataPoint
      // TimeSeries: kidneyFunction.*, liverFunction.*, psa
      // DataPoint: lipidPanel.*, metabolic Panel.*, cbc.*
      const keys = field.split('.');

      if (keys[0] === 'kidneyFunction' || keys[0] === 'liverFunction') {
        // TimeSeries fields
        const panel = keys[0];
        const marker = keys[1];
        if (isEmpty) {
          if (sectionData[panel]) {
            delete sectionData[panel][marker];
          }
        } else {
          if (!sectionData[panel]) {
            sectionData[panel] = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData[panel][marker] = {
            dataPoints: sectionData[panel][marker]?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'psa') {
        // PSA is TimeSeries
        if (isEmpty) {
          delete sectionData.psa;
        } else {
          const dataPoint = createUserDataPoint(value);
          sectionData.psa = {
            dataPoints: sectionData.psa?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'vitaminD') {
        // Vitamin D is TimeSeries
        if (isEmpty) {
          delete sectionData.vitaminD;
        } else {
          const dataPoint = createUserDataPoint(value);
          sectionData.vitaminD = {
            dataPoints: sectionData.vitaminD?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'fastingGlucose' || field === 'hba1c') {
        // These are top-level DataPoints
        if (isEmpty) {
          delete sectionData[field];
        } else {
          sectionData[field] = createUserDataPoint(value);
        }
      } else {
        // Everything else (lipidPanel.*, metabolicPanel.*, cbc.*) are nested DataPoints
        if (isEmpty) {
          let current: any = sectionData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) return;
            current = current[keys[i]];
          }
          delete current[keys[keys.length - 1]];
        } else {
          let current: any = sectionData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = createUserDataPoint(value);
        }
      }
    } else if (section === 'lifestyle') {
      // Handle lifestyle fields - some are TimeSeries
      if (field === 'exercise.moderateMinutesPerWeek') {
        if (isEmpty) {
          if (sectionData.exercise) {
            delete sectionData.exercise.moderateMinutesPerWeek;
          }
        } else {
          if (!sectionData.exercise) {
            sectionData.exercise = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.exercise.moderateMinutesPerWeek = {
            dataPoints: sectionData.exercise.moderateMinutesPerWeek?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'exercise.vigorousMinutesPerWeek') {
        if (isEmpty) {
          if (sectionData.exercise) {
            delete sectionData.exercise.vigorousMinutesPerWeek;
          }
        } else {
          if (!sectionData.exercise) {
            sectionData.exercise = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.exercise.vigorousMinutesPerWeek = {
            dataPoints: sectionData.exercise.vigorousMinutesPerWeek?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'exercise.strengthTrainingDaysPerWeek') {
        if (isEmpty) {
          if (sectionData.exercise) {
            delete sectionData.exercise.strengthTrainingDaysPerWeek;
          }
        } else {
          if (!sectionData.exercise) {
            sectionData.exercise = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.exercise.strengthTrainingDaysPerWeek = {
            dataPoints: sectionData.exercise.strengthTrainingDaysPerWeek?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'exercise.sedentaryHoursPerDay') {
        if (isEmpty) {
          if (sectionData.exercise) {
            delete sectionData.exercise.sedentaryHoursPerDay;
          }
        } else {
          if (!sectionData.exercise) {
            sectionData.exercise = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.exercise.sedentaryHoursPerDay = {
            dataPoints: sectionData.exercise.sedentaryHoursPerDay?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'alcohol.drinksPerWeek') {
        if (isEmpty) {
          if (sectionData.alcohol) {
            delete sectionData.alcohol.drinksPerWeek;
          }
        } else {
          if (!sectionData.alcohol) {
            sectionData.alcohol = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.alcohol.drinksPerWeek = {
            dataPoints: sectionData.alcohol.drinksPerWeek?.dataPoints || [],
            mostRecent: dataPoint
          };
          console.log('[ALCOHOL] Storing alcohol.drinksPerWeek:', {
            value,
            dataPoint,
            fullStructure: sectionData.alcohol.drinksPerWeek
          });
        }
      } else if (field === 'diet.vegetableServingsPerDay') {
        if (isEmpty) {
          if (sectionData.diet) {
            delete sectionData.diet.vegetableServingsPerDay;
          }
        } else {
          if (!sectionData.diet) {
            sectionData.diet = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.diet.vegetableServingsPerDay = {
            dataPoints: sectionData.diet.vegetableServingsPerDay?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'diet.processedMeatServingsPerWeek') {
        if (isEmpty) {
          if (sectionData.diet) {
            delete sectionData.diet.processedMeatServingsPerWeek;
          }
        } else {
          if (!sectionData.diet) {
            sectionData.diet = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.diet.processedMeatServingsPerWeek = {
            dataPoints: sectionData.diet.processedMeatServingsPerWeek?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'diet.fruitServingsPerDay') {
        if (isEmpty) {
          if (sectionData.diet) {
            delete sectionData.diet.fruitServingsPerDay;
          }
        } else {
          if (!sectionData.diet) {
            sectionData.diet = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.diet.fruitServingsPerDay = {
            dataPoints: sectionData.diet.fruitServingsPerDay?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'diet.sugarSweetenedBeveragesPerWeek') {
        if (isEmpty) {
          if (sectionData.diet) {
            delete sectionData.diet.sugarSweetenedBeveragesPerWeek;
          }
        } else {
          if (!sectionData.diet) {
            sectionData.diet = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.diet.sugarSweetenedBeveragesPerWeek = {
            dataPoints: sectionData.diet.sugarSweetenedBeveragesPerWeek?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'sleep.averageHoursPerNight') {
        if (isEmpty) {
          if (sectionData.sleep) {
            delete sectionData.sleep.averageHoursPerNight;
          }
        } else {
          if (!sectionData.sleep) {
            sectionData.sleep = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.sleep.averageHoursPerNight = {
            dataPoints: sectionData.sleep.averageHoursPerNight?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'sleep.sleepQuality') {
        if (isEmpty) {
          if (sectionData.sleep) {
            delete sectionData.sleep.sleepQuality;
          }
        } else {
          if (!sectionData.sleep) {
            sectionData.sleep = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.sleep.sleepQuality = {
            dataPoints: sectionData.sleep.sleepQuality?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else if (field === 'outdoorTime.minutesPerWeek') {
        if (isEmpty) {
          if (sectionData.outdoorTime) {
            delete sectionData.outdoorTime.minutesPerWeek;
          }
        } else {
          if (!sectionData.outdoorTime) {
            sectionData.outdoorTime = {};
          }
          const dataPoint = createUserDataPoint(value);
          sectionData.outdoorTime.minutesPerWeek = {
            dataPoints: sectionData.outdoorTime.minutesPerWeek?.dataPoints || [],
            mostRecent: dataPoint
          };
        }
      } else {
        // For other lifestyle fields, use simple nested path setting
        if (isEmpty) {
          let current: any = sectionData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              return;
            }
            current = current[keys[i]];
          }
          delete current[keys[keys.length - 1]];
        } else {
          let current: any = sectionData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = createUserDataPoint(value);
        }
      }
    } else if (section === 'social') {
      // Handle social fields
      if (field === 'petOwnership.ownsDog') {
        if (isEmpty) {
          if (sectionData.petOwnership) {
            delete sectionData.petOwnership.ownsDog;
          }
        } else {
          if (!sectionData.petOwnership) {
            sectionData.petOwnership = {};
          }
          sectionData.petOwnership.ownsDog = createUserDataPoint(value);
        }
      } else if (field === 'connections.strength') {
        if (isEmpty) {
          if (sectionData.connections) {
            delete sectionData.connections.strength;
          }
        } else {
          if (!sectionData.connections) {
            sectionData.connections = {};
          }
          sectionData.connections.strength = createUserDataPoint(value);
        }
      } else if (field === 'volunteering.active') {
        if (isEmpty) {
          if (sectionData.volunteering) {
            delete sectionData.volunteering.active;
          }
        } else {
          if (!sectionData.volunteering) {
            sectionData.volunteering = {};
          }
          sectionData.volunteering.active = createUserDataPoint(value);
        }
      } else if (field === 'religiousAttendance') {
        if (isEmpty) {
          delete sectionData.religiousAttendance;
        } else {
          sectionData.religiousAttendance = createUserDataPoint(value);
        }
      } else if (field === 'hobbies.creative.engaged') {
        if (isEmpty) {
          if (sectionData.hobbies?.creative) {
            delete sectionData.hobbies.creative.engaged;
          }
        } else {
          if (!sectionData.hobbies) {
            sectionData.hobbies = {};
          }
          if (!sectionData.hobbies.creative) {
            sectionData.hobbies.creative = {};
          }
          sectionData.hobbies.creative.engaged = createUserDataPoint(value);
        }
      } else {
        // For other social fields, use generic nested path setting
        if (isEmpty) {
          let current: any = sectionData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              return;
            }
            current = current[keys[i]];
          }
          delete current[keys[keys.length - 1]];
        } else {
          let current: any = sectionData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = createUserDataPoint(value);
        }
      }
    } else {
      // For other sections, use simple nested path setting
      if (isEmpty) {
        // Remove the field by navigating to parent and deleting
        let current: any = sectionData;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            return; // Path doesn't exist, nothing to remove
          }
          current = current[keys[i]];
        }
        delete current[keys[keys.length - 1]];
      } else {
        // Set the value
        let current: any = sectionData;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = createUserDataPoint(value);
      }
    }

    onProfileChange(updatedProfile);
  };

  const getFieldValue = (section: keyof UserProfile, field: string): any => {
    if (!profile || !profile[section]) return '';

    const sectionData: any = profile[section];

    // Handle special cases for biometrics with TimeSeries
    if (section === 'biometrics') {
      if (field === 'weight') {
        return sectionData.weight?.mostRecent?.value?.value ?? '';
      } else if (field === 'height') {
        return sectionData.height?.value ?? '';
      } else if (field === 'waistCircumference') {
        return sectionData.waistCircumference?.mostRecent?.value ?? '';
      } else if (field === 'hipCircumference') {
        return sectionData.hipCircumference?.mostRecent?.value ?? '';
      } else if (field === 'heartRate') {
        return sectionData.heartRate?.mostRecent?.value ?? '';
      } else if (field === 'bloodPressure.systolic') {
        return sectionData.bloodPressure?.mostRecent?.value?.systolic ?? '';
      } else if (field === 'bloodPressure.diastolic') {
        return sectionData.bloodPressure?.mostRecent?.value?.diastolic ?? '';
      }
    }

    // Handle special cases for lab tests
    if (section === 'labTests') {
      const keys = field.split('.');

      if (keys[0] === 'kidneyFunction' || keys[0] === 'liverFunction') {
        // TimeSeries fields
        return sectionData[keys[0]]?.[keys[1]]?.mostRecent?.value ?? '';
      } else if (field === 'psa') {
        // PSA is TimeSeries
        return sectionData.psa?.mostRecent?.value ?? '';
      } else if (field === 'vitaminD') {
        // Vitamin D is TimeSeries
        return sectionData.vitaminD?.mostRecent?.value ?? '';
      } else if (field === 'fastingGlucose' || field === 'hba1c') {
        // Top-level DataPoints
        return sectionData[field]?.value ?? '';
      } else {
        // Nested DataPoints (lipidPanel.*, metabolicPanel.*, cbc.*)
        let current: any = sectionData;
        for (const key of keys) {
          if (!current[key]) return '';
          current = current[key];
        }
        return current.value ?? '';
      }
    }

    // Handle special cases for lifestyle with TimeSeries
    if (section === 'lifestyle') {
      if (field === 'exercise.moderateMinutesPerWeek') {
        return sectionData.exercise?.moderateMinutesPerWeek?.mostRecent?.value ?? '';
      } else if (field === 'exercise.vigorousMinutesPerWeek') {
        return sectionData.exercise?.vigorousMinutesPerWeek?.mostRecent?.value ?? '';
      } else if (field === 'exercise.strengthTrainingDaysPerWeek') {
        return sectionData.exercise?.strengthTrainingDaysPerWeek?.mostRecent?.value ?? '';
      } else if (field === 'exercise.sedentaryHoursPerDay') {
        return sectionData.exercise?.sedentaryHoursPerDay?.mostRecent?.value ?? '';
      } else if (field === 'alcohol.drinksPerWeek') {
        return sectionData.alcohol?.drinksPerWeek?.mostRecent?.value ?? '';
      } else if (field === 'diet.vegetableServingsPerDay') {
        return sectionData.diet?.vegetableServingsPerDay?.mostRecent?.value ?? '';
      } else if (field === 'diet.processedMeatServingsPerWeek') {
        return sectionData.diet?.processedMeatServingsPerWeek?.mostRecent?.value ?? '';
      } else if (field === 'diet.fruitServingsPerDay') {
        return sectionData.diet?.fruitServingsPerDay?.mostRecent?.value ?? '';
      } else if (field === 'diet.sugarSweetenedBeveragesPerWeek') {
        return sectionData.diet?.sugarSweetenedBeveragesPerWeek?.mostRecent?.value ?? '';
      } else if (field === 'sleep.averageHoursPerNight') {
        return sectionData.sleep?.averageHoursPerNight?.mostRecent?.value ?? '';
      } else if (field === 'sleep.sleepQuality') {
        return sectionData.sleep?.sleepQuality?.mostRecent?.value ?? '';
      } else if (field === 'outdoorTime.minutesPerWeek') {
        return sectionData.outdoorTime?.minutesPerWeek?.mostRecent?.value ?? '';
      }
    }

    // Handle social fields
    if (section === 'social') {
      if (field === 'petOwnership.ownsDog') {
        return sectionData.petOwnership?.ownsDog?.value ?? false;
      } else if (field === 'connections.strength') {
        return sectionData.connections?.strength?.value ?? '';
      } else if (field === 'volunteering.active') {
        return sectionData.volunteering?.active?.value ?? false;
      } else if (field === 'religiousAttendance') {
        return sectionData.religiousAttendance?.value ?? '';
      } else if (field === 'hobbies.creative.engaged') {
        return sectionData.hobbies?.creative?.engaged?.value ?? false;
      }
    }

    // Handle medical history arrays
    if (section === 'medicalHistory') {
      if (field.startsWith('conditions.')) {
        const conditionId = field.split('.')[1];
        const conditions = sectionData.conditions;

        // Handle both array format (new) and object format (old)
        if (!conditions) return false;
        if (Array.isArray(conditions)) {
          return conditions.some((c: any) => c.conditionId === conditionId);
        }
        // Old object format: {diabetes: DataPoint}
        return conditions[conditionId]?.value === true;
      } else if (field.startsWith('familyHistory.')) {
        const conditionId = field.split('.')[1];
        const familyHistory = sectionData.familyHistory;

        // Handle both array format (new) and object format (old)
        if (!familyHistory) return false;
        if (Array.isArray(familyHistory)) {
          return familyHistory.some((fh: any) => fh.conditionId === conditionId);
        }
        // Old object format: {cardiovascularDisease: DataPoint}
        return familyHistory[conditionId]?.value === true;
      }
    }

    // For other sections, navigate the path
    const keys = field.split('.');
    let current: any = sectionData;

    for (const key of keys) {
      if (!current[key]) return '';
      current = current[key];
    }

    return current.value ?? '';
  };

  // Calculate age from dateOfBirth
  const age = profile ? calculateAge(profile) : null;

  return (
    <div className="compact-profile-editor">
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
    </div>
  );
};
