import React from 'react';
import { UserProfile } from '../../types/user';
import { DemographicsSection } from './profile-sections/DemographicsSection';
import { BiometricsSection } from './profile-sections/BiometricsSection';
import { LabTestsSection } from './profile-sections/LabTestsSection';
import { LifestyleSection } from './profile-sections/LifestyleSection';
import { SafetySection } from './profile-sections/SafetySection';
import { MedicalHistorySection } from './profile-sections/MedicalHistorySection';
import { SocialSection } from './profile-sections/SocialSection';
import { ReproductiveSection } from './profile-sections/ReproductiveSection';
import { createUserDataPoint } from '../../types/common/datapoint';
import { calculateAge } from '../../utils/dataExtraction';

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
  const sectionProps = { profile, age, getFieldValue, updateField };

  return (
    <div className="compact-profile-editor">
      <DemographicsSection {...sectionProps} />
      <BiometricsSection {...sectionProps} />
      <LabTestsSection {...sectionProps} />
      <LifestyleSection {...sectionProps} />
      <SafetySection {...sectionProps} />
      <MedicalHistorySection {...sectionProps} />
      <SocialSection {...sectionProps} />
      <ReproductiveSection {...sectionProps} />
    </div>
  );
};
