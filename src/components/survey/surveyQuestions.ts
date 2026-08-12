// @ts-nocheck -- extracted from the legacy survey; question data uses loose typing
import { createUserDataPoint, DataPoint } from '../../types/common/datapoint';
import { DietPattern } from '../../types/user/lifestyle';
import { SwipeQuestion } from './surveyTypes';
import {
  setCondition,
  updateScreeningArray,
  createTimeSeries,
  setFamilyHistory,
} from './surveyHelpers';

// Generate survey questions
export function generateQuestions(): SwipeQuestion[] {
  return [
    // LIFESTYLE
    {
      id: 'smoking',
      question: 'Do you smoke cigarettes?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Yes, I smoke',
        emoji: '🚬',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            smoking: {
              ...p.lifestyle?.smoking,
              status: createUserDataPoint('current' as const),
              packsPerDay: createTimeSeries(0.5), // 10 cigarettes = 0.5 packs
              packYears: createUserDataPoint(5) // Estimated
            }
          }
        })
      },
      rightOption: {
        label: 'No, I don\'t smoke',
        emoji: '🌬️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            smoking: {
              ...p.lifestyle?.smoking,
              status: createUserDataPoint('never' as const)
            }
          }
        })
      },
      detailedInput: {
        inputType: {
          type: 'select',
          options: [
            { value: 'never', label: 'Never smoked' },
            { value: 'former', label: 'Former smoker (quit)' },
            { value: 'current_light', label: 'Current: <10 cigs/day' },
            { value: 'current_moderate', label: 'Current: 10-20 cigs/day' },
            { value: 'current_heavy', label: 'Current: 20+ cigs/day' }
          ]
        },
        label: 'Smoking status',
        getCurrentValue: (p) => {
          const status = p.lifestyle?.smoking?.status?.value;
          const packsPerDay = p.lifestyle?.smoking?.packsPerDay?.mostRecent?.value || 0;
          if (status === 'never') return 'never';
          if (status === 'former') return 'former';
          if (status === 'current') {
            if (packsPerDay < 0.5) return 'current_light';
            if (packsPerDay <= 1) return 'current_moderate';
            return 'current_heavy';
          }
          return '';
        },
        profileUpdate: (p, value) => {
          const updates: any = {
            never: { status: 'never', packsPerDay: 0, packYears: 0 },
            former: { status: 'former', packsPerDay: 0, packYears: 10 },
            current_light: { status: 'current', packsPerDay: 0.25, packYears: 5 },
            current_moderate: { status: 'current', packsPerDay: 0.75, packYears: 10 },
            current_heavy: { status: 'current', packsPerDay: 1.5, packYears: 20 }
          };
          const update = updates[value] || updates.never;
          return {
            ...p,
            lifestyle: {
              ...p.lifestyle,
              smoking: {
                ...p.lifestyle?.smoking,
                status: createUserDataPoint(update.status as any),
                packsPerDay: createTimeSeries(update.packsPerDay),
                packYears: createUserDataPoint(update.packYears)
              }
            }
          };
        }
      }
    },
    {
      id: 'exercise',
      question: 'Do you exercise regularly?',
      category: 'Lifestyle',
      leftOption: {
        label: 'No exercise',
        emoji: '🛋️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            exercise: {
              ...p.lifestyle?.exercise,
              moderateMinutesPerWeek: createTimeSeries(0),
              vigorousMinutesPerWeek: createTimeSeries(0)
            }
          }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '🏃',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            exercise: {
              ...p.lifestyle?.exercise,
              moderateMinutesPerWeek: createTimeSeries(150),
              vigorousMinutesPerWeek: createTimeSeries(0)
            }
          }
        })
      },
      detailedInput: {
        inputType: { type: 'slider', min: 0, max: 500, step: 10, unit: 'min/week' },
        label: 'Moderate exercise minutes per week',
        getCurrentValue: (p) => p.lifestyle?.exercise?.moderateMinutesPerWeek?.mostRecent?.value || 0,
        profileUpdate: (p, value) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            exercise: {
              ...p.lifestyle?.exercise,
              moderateMinutesPerWeek: createTimeSeries(value),
              vigorousMinutesPerWeek: createTimeSeries(0)
            }
          }
        })
      }
    },
    {
      id: 'alcohol',
      question: 'Do you drink alcohol heavily?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Heavy drinking',
        emoji: '🍺',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            alcohol: {
              ...p.lifestyle?.alcohol,
              drinksPerWeek: createTimeSeries(20),
              bingeDrinking: createUserDataPoint(true),
              pattern: createUserDataPoint('heavy' as const)
            }
          }
        })
      },
      rightOption: {
        label: 'Moderate/None',
        emoji: '💧',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            alcohol: {
              ...p.lifestyle?.alcohol,
              drinksPerWeek: createTimeSeries(3),
              bingeDrinking: createUserDataPoint(false),
              pattern: createUserDataPoint('moderate' as const)
            }
          }
        })
      },
      detailedInput: {
        inputType: { type: 'slider', min: 0, max: 40, step: 1, unit: 'drinks/week' },
        label: 'Alcoholic drinks per week',
        getCurrentValue: (p) => p.lifestyle?.alcohol?.drinksPerWeek?.mostRecent?.value || 0,
        profileUpdate: (p, value) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            alcohol: {
              ...p.lifestyle?.alcohol,
              drinksPerWeek: createTimeSeries(value),
              bingeDrinking: createUserDataPoint(value > 14),
              pattern: createUserDataPoint(value > 14 ? 'heavy' : value > 7 ? 'moderate' : 'light')
            }
          }
        })
      }
    },
    {
      id: 'diet',
      question: 'Do you eat a healthy diet?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Mostly junk food',
        emoji: '🍔',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            diet: {
              ...p.lifestyle?.diet,
              vegetableServingsPerDay: createTimeSeries(1),
              fruitServingsPerDay: createTimeSeries(1),
              processedMeatServingsPerWeek: createTimeSeries(7),
              pattern: createUserDataPoint('western' as const)
            }
          }
        })
      },
      rightOption: {
        label: 'Healthy diet',
        emoji: '🥗',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            diet: {
              ...p.lifestyle?.diet,
              vegetableServingsPerDay: createTimeSeries(5),
              fruitServingsPerDay: createTimeSeries(3),
              processedMeatServingsPerWeek: createTimeSeries(0),
              pattern: createUserDataPoint('mediterranean' as const)
            }
          }
        })
      },
      detailedInput: {
        inputType: { type: 'slider', min: 0, max: 10, step: 0.5, unit: 'servings/day' },
        label: 'Vegetable servings per day',
        getCurrentValue: (p) => p.lifestyle?.diet?.vegetableServingsPerDay?.mostRecent?.value || 0,
        profileUpdate: (p, value) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            diet: {
              ...p.lifestyle?.diet,
              vegetableServingsPerDay: createTimeSeries(value),
              fruitServingsPerDay: createTimeSeries(Math.max(2, value * 0.6)),
              processedMeatServingsPerWeek: createTimeSeries(value > 4 ? 0 : 5),
              pattern: createUserDataPoint(value > 4 ? 'mediterranean' : value > 2 ? 'mixed' : 'western') as DataPoint<DietPattern>
            }
          }
        })
      }
    },
    {
      id: 'sleep',
      question: 'Do you get enough sleep?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Poor sleep (<6 hrs)',
        emoji: '😴',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            sleep: {
              ...p.lifestyle?.sleep,
              averageHoursPerNight: createTimeSeries(5),
              sleepQuality: createTimeSeries(3) // 1-10 scale, 3 = poor
            }
          }
        })
      },
      rightOption: {
        label: 'Good sleep (7-9 hrs)',
        emoji: '😊',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            sleep: {
              ...p.lifestyle?.sleep,
              averageHoursPerNight: createTimeSeries(8),
              sleepQuality: createTimeSeries(8) // 1-10 scale, 8 = good
            }
          }
        })
      },
      detailedInput: {
        inputType: { type: 'slider', min: 0, max: 12, step: 0.5, unit: 'hours/night' },
        label: 'Average hours of sleep per night',
        getCurrentValue: (p) => p.lifestyle?.sleep?.averageHoursPerNight?.mostRecent?.value || 7,
        profileUpdate: (p, value) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            sleep: {
              ...p.lifestyle?.sleep,
              averageHoursPerNight: createTimeSeries(value),
              sleepQuality: createTimeSeries(value >= 7 && value <= 9 ? 8 : value < 6 ? 3 : 5)
            }
          }
        })
      }
    },
    {
      id: 'stress',
      question: 'Are you under chronic stress?',
      category: 'Lifestyle',
      leftOption: {
        label: 'High stress',
        emoji: '😰',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, stress: createUserDataPoint('high') } as any
        })
      },
      rightOption: {
        label: 'Low stress',
        emoji: '😌',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, stress: createUserDataPoint('low') } as any
        })
      }
    },
    {
      id: 'socialConnection',
      question: 'Do you have strong social connections?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Socially isolated',
        emoji: '😔',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            socialEngagement: createUserDataPoint('low')
          }
        })
      },
      rightOption: {
        label: 'Strong connections',
        emoji: '👥',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            socialEngagement: createUserDataPoint('high')
          }
        })
      }
    },
    {
      id: 'sunExposure',
      question: 'Do you get excessive sun exposure?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Excessive sun',
        emoji: '☀️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, sunExposure: createUserDataPoint('excessive') } as any
        })
      },
      rightOption: {
        label: 'Protected/Moderate',
        emoji: '🧴',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, sunExposure: createUserDataPoint('moderate') } as any
        })
      }
    },
    {
      id: 'occupationalHazards',
      question: 'Are you exposed to workplace hazards?',
      category: 'Lifestyle',
      leftOption: {
        label: 'High exposure',
        emoji: '⚠️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            occupationalExposures: createUserDataPoint(true)
          }
        })
      },
      rightOption: {
        label: 'Low/No exposure',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            occupationalExposures: createUserDataPoint(false)
          }
        })
      }
    },

    // DEMOGRAPHICS
    {
      id: 'biologicalSex',
      question: 'What is your biological sex?',
      category: 'Demographics',
      leftOption: {
        label: 'Male',
        emoji: '♂️',
        profileUpdate: (p) => ({
          ...p,
          demographics: {
            ...p.demographics,
            biologicalSex: createUserDataPoint('male' as const)
          }
        })
      },
      rightOption: {
        label: 'Female',
        emoji: '♀️',
        profileUpdate: (p) => ({
          ...p,
          demographics: {
            ...p.demographics,
            biologicalSex: createUserDataPoint('female' as const)
          }
        })
      }
    },

    // MEDICAL CONDITIONS
    {
      id: 'diabetes',
      question: 'Do you have diabetes?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '💉',
        profileUpdate: (p) => setCondition(p, 'diabetes', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'diabetes', false)
      }
    },
    {
      id: 'hypertension',
      question: 'Do you have high blood pressure?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '📈',
        profileUpdate: (p) => setCondition(p, 'hypertension', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'hypertension', false)
      }
    },
    {
      id: 'heartDisease',
      question: 'Do you have heart disease?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '💔',
        profileUpdate: (p) => setCondition(p, 'heartDisease', true)
      },
      rightOption: {
        label: 'No',
        emoji: '❤️',
        profileUpdate: (p) => setCondition(p, 'heartDisease', false)
      }
    },
    {
      id: 'stroke',
      question: 'Have you had a stroke?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🧠',
        profileUpdate: (p) => setCondition(p, 'stroke', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'stroke', false)
      }
    },
    {
      id: 'cancer',
      question: 'Have you had cancer?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🎗️',
        profileUpdate: (p) => setCondition(p, 'cancer', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'cancer', false)
      }
    },
    {
      id: 'copd',
      question: 'Do you have COPD or emphysema?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🫁',
        profileUpdate: (p) => setCondition(p, 'copd', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'copd', false)
      }
    },
    {
      id: 'kidneyDisease',
      question: 'Do you have kidney disease?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🩺',
        profileUpdate: (p) => setCondition(p, 'kidneyDisease', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'kidneyDisease', false)
      }
    },
    {
      id: 'liverDisease',
      question: 'Do you have liver disease?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🫀',
        profileUpdate: (p) => setCondition(p, 'liverDisease', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'liverDisease', false)
      }
    },
    {
      id: 'depression',
      question: 'Do you have depression?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '😢',
        profileUpdate: (p) => setCondition(p, 'depression', true)
      },
      rightOption: {
        label: 'No',
        emoji: '😊',
        profileUpdate: (p) => setCondition(p, 'depression', false)
      }
    },
    {
      id: 'asthma',
      question: 'Do you have asthma?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '😮‍💨',
        profileUpdate: (p) => setCondition(p, 'asthma', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'asthma', false)
      }
    },

    // FAMILY HISTORY
    {
      id: 'familyHeartDisease',
      question: 'Family history of heart disease?',
      category: 'Family History',
      leftOption: {
        label: 'Yes',
        emoji: '👨‍👩‍👧‍👦💔',
        profileUpdate: (p) => setFamilyHistory(p, 'heart_disease', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setFamilyHistory(p, 'heart_disease', false)
      }
    },
    {
      id: 'familyCancer',
      question: 'Family history of cancer?',
      category: 'Family History',
      leftOption: {
        label: 'Yes',
        emoji: '👨‍👩‍👧‍👦🎗️',
        profileUpdate: (p) => setFamilyHistory(p, 'cancer', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setFamilyHistory(p, 'cancer', false)
      }
    },

    // MEDICATIONS
    {
      id: 'statin',
      question: 'Are you taking a statin?',
      category: 'Medications',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), statin: createUserDataPoint(false) }
          }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), statin: createUserDataPoint(true) }
          }
        })
      }
    },
    {
      id: 'bloodPressureMeds',
      question: 'Taking blood pressure medication?',
      category: 'Medications',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), takesBloodPressureMeds: createUserDataPoint(false) }
          }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), takesBloodPressureMeds: createUserDataPoint(true) }
          }
        })
      }
    },
    // REMOVED: Aspirin - No evidence of mortality benefit in primary prevention
    // Meta-analysis (USPSTF 2022): HR 0.99 (0.94-1.03) - no significant all-cause mortality benefit
    // Bleeding risk offsets CVD benefit. Only beneficial in secondary prevention (post-MI/stroke)
    // {
    //   id: 'aspirin',
    //   question: 'Taking daily aspirin?',
    //   category: 'Medications',
    //   leftOption: {
    //     label: 'No',
    //     emoji: '🚫',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       medicalHistory: {
    //         ...p.medicalHistory,
    //         medications: { ...(p.medicalHistory?.medications || {}), aspirin: false }
    //       }
    //     })
    //   },
    //   rightOption: {
    //     label: 'Yes',
    //     emoji: '💊',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       medicalHistory: {
    //         ...p.medicalHistory,
    //         medications: { ...(p.medicalHistory?.medications || {}), aspirin: true }
    //       }
    //     })
    //   }
    // },

    // BIOMETRICS / LAB-STYLE
    {
      id: 'obesity',
      question: 'Are you significantly overweight?',
      category: 'Biometrics',
      leftOption: {
        label: 'Yes (BMI > 30)',
        emoji: '⚖️',
        profileUpdate: (p) => ({
          ...p,
          biometrics: {
            ...p.biometrics,
            // BMI 32 = ~92kg at 170cm height
            height: p.biometrics?.height || createUserDataPoint(170),
            weight: createTimeSeries({ value: 92, unit: 'kg' as const })
          }
        })
      },
      rightOption: {
        label: 'No (Healthy weight)',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          biometrics: {
            ...p.biometrics,
            // BMI 23 = ~66.5kg at 170cm height
            height: p.biometrics?.height || createUserDataPoint(170),
            weight: createTimeSeries({ value: 66.5, unit: 'kg' as const })
          }
        })
      }
    },
    {
      id: 'highCholesterol',
      question: 'Do you have high cholesterol?',
      category: 'Lab Tests',
      leftOption: {
        label: 'Yes',
        emoji: '📊',
        profileUpdate: (p) => ({
          ...p,
          labTests: {
            ...p.labTests,
            lipidPanel: {
              ...p.labTests?.lipidPanel,
              totalCholesterol: createUserDataPoint(260),
              ldlCholesterol: createUserDataPoint(160)
            }
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          labTests: {
            ...p.labTests,
            lipidPanel: {
              ...p.labTests?.lipidPanel,
              totalCholesterol: createUserDataPoint(180),
              ldlCholesterol: createUserDataPoint(100)
            }
          }
        })
      }
    },
    {
      id: 'prediabetic',
      question: 'Are you pre-diabetic?',
      category: 'Lab Tests',
      leftOption: {
        label: 'Yes',
        emoji: '⚠️',
        profileUpdate: (p) => ({
          ...p,
          labTests: {
            ...p.labTests,
            metabolicPanel: {
              ...p.labTests?.metabolicPanel,
              hba1c: createUserDataPoint(6.0)
            }
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          labTests: {
            ...p.labTests,
            metabolicPanel: {
              ...p.labTests?.metabolicPanel,
              hba1c: createUserDataPoint(5.2)
            }
          }
        })
      }
    },

    // PREVENTIVE CARE & VACCINATIONS
    {
      id: 'fluVaccine',
      question: 'Do you get annual flu vaccine?',
      category: 'Preventive Care',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            vaccinations: { ...(p.medicalHistory?.vaccinations || {}), fluVaccineCurrentYear: createUserDataPoint(false) }
          }
        })
      },
      rightOption: {
        label: 'Yes, annually',
        emoji: '💉',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            vaccinations: { ...(p.medicalHistory?.vaccinations || {}), fluVaccineCurrentYear: createUserDataPoint(true) }
          }
        })
      }
    },
    {
      id: 'colonoscopy',
      question: 'Have you had a colonoscopy (if over 45)?',
      category: 'Preventive Care',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'colonoscopy', 'negative', false)
          }
        })
      },
      rightOption: {
        label: 'Yes, up to date',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'colonoscopy', 'negative', true)
          }
        })
      }
    },
    {
      id: 'mammogram',
      question: 'Regular mammograms (if female)?',
      category: 'Preventive Care',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'mammogram', 'negative', false)
          }
        })
      },
      rightOption: {
        label: 'Yes, regular',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'mammogram', 'negative', true)
          }
        })
      }
    },
    {
      id: 'dentist',
      question: 'Do you visit dentist regularly?',
      category: 'Preventive Care',
      leftOption: {
        label: 'Rarely/Never',
        emoji: '🦷',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'dental', 'negative', false)
          }
        })
      },
      rightOption: {
        label: 'Twice yearly',
        emoji: '😁',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'dental', 'negative', true)
          }
        })
      }
    },
    {
      id: 'vision',
      question: 'Regular vision checkups?',
      category: 'Preventive Care',
      leftOption: {
        label: 'No',
        emoji: '👓',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'vision', 'negative', false)
          }
        })
      },
      rightOption: {
        label: 'Yes, regular',
        emoji: '👁️',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'vision', 'negative', true)
          }
        })
      }
    },

    // SAFETY BEHAVIORS
    {
      id: 'seatbelt',
      question: 'Do you always wear a seatbelt?',
      category: 'Safety',
      leftOption: {
        label: 'Rarely/Sometimes',
        emoji: '🚗',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, seatBeltUse: createUserDataPoint('never' as const) } }
        })
      },
      rightOption: {
        label: 'Always',
        emoji: '🔒',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, seatBeltUse: createUserDataPoint('always' as const) } }
        })
      }
    },
    {
      id: 'texting',
      question: 'Do you text while driving?',
      category: 'Safety',
      leftOption: {
        label: 'Yes',
        emoji: '📱',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, phoneUseWhileDriving: createUserDataPoint('frequent' as const) } }
        })
      },
      rightOption: {
        label: 'Never',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, phoneUseWhileDriving: createUserDataPoint('never' as const) } }
        })
      }
    },
    {
      id: 'speeding',
      question: 'Do you regularly speed?',
      category: 'Safety',
      leftOption: {
        label: 'Yes, often',
        emoji: '🏎️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, trafficViolationsPast3Years: createUserDataPoint(3) } }
        })
      },
      rightOption: {
        label: 'No, drive safely',
        emoji: '🚙',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, trafficViolationsPast3Years: createUserDataPoint(0) } }
        })
      }
    },
    {
      id: 'helmet',
      question: 'Wear helmet when biking/motorcycling?',
      category: 'Safety',
      leftOption: {
        label: 'No',
        emoji: '🚴',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, helmetUse: createUserDataPoint(false) } as any
        })
      },
      rightOption: {
        label: 'Always',
        emoji: '⛑️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, helmetUse: createUserDataPoint(true) } as any
        })
      }
    },

    // SUBSTANCE USE
    {
      id: 'drugs',
      question: 'Do you use recreational drugs?',
      category: 'Substance Use',
      leftOption: {
        label: 'Yes, regularly',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, recreationalDrugs: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, recreationalDrugs: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'opioids',
      question: 'Do you use opioid painkillers?',
      category: 'Substance Use',
      leftOption: {
        label: 'Yes, regularly',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            substanceUse: {
              ...p.medicalHistory?.substanceUse,
              prescribedOpioids: createUserDataPoint(true)
            }
          }
        })
      },
      rightOption: {
        label: 'No/As prescribed',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            substanceUse: {
              ...p.medicalHistory?.substanceUse,
              prescribedOpioids: createUserDataPoint(false)
            }
          }
        })
      }
    },
    {
      id: 'marijuana',
      question: 'Do you use marijuana regularly?',
      category: 'Substance Use',
      leftOption: {
        label: 'Yes, daily',
        emoji: '🌿',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, marijuana: createUserDataPoint('daily') } as any
        })
      },
      rightOption: {
        label: 'No/Occasionally',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, marijuana: createUserDataPoint('none') } as any
        })
      }
    },

    // ENVIRONMENTAL EXPOSURES
    {
      id: 'airQuality',
      question: 'Do you live in area with poor air quality?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, high pollution',
        emoji: '🏭',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, airQualityExposure: createUserDataPoint('poor') } as any
        })
      },
      rightOption: {
        label: 'No, clean air',
        emoji: '🌲',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, airQualityExposure: createUserDataPoint('good') } as any
        })
      }
    },
    // REMOVED: Water Quality - Too heterogeneous for self-report
    // Evidence too location-dependent and requires specific contaminant measurements (arsenic, lead, etc.)
    // Self-reported "clean water" is unreliable without zip-code based water quality index
    // Future: Could implement zip-code lookup for EPA water quality data
    // {
    //   id: 'waterQuality',
    //   question: 'Do you have clean drinking water?',
    //   category: 'Environment',
    //   leftOption: {
    //     label: 'Poor quality',
    //     emoji: '🚰',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       lifestyle: { ...p.lifestyle, waterQuality: createUserDataPoint('poor') } as any
    //     })
    //   },
    //   rightOption: {
    //     label: 'Clean water',
    //     emoji: '💧',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       lifestyle: { ...p.lifestyle, waterQuality: createUserDataPoint('good') } as any
    //     })
    //   }
    // },
    {
      id: 'pesticides',
      question: 'Regular pesticide exposure?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, regular',
        emoji: '🌾',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, pesticideExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No/Minimal',
        emoji: '🥬',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, pesticideExposure: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'radiation',
      question: 'Occupational radiation exposure?',
      category: 'Environment',
      leftOption: {
        label: 'Yes',
        emoji: '☢️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, radiationExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, radiationExposure: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'pollution',
      question: 'Live near major pollution source?',
      category: 'Environment',
      leftOption: {
        label: 'Yes (highway, factory)',
        emoji: '🏭',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, pollutionExposure: createUserDataPoint('high') } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '🏡',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, pollutionExposure: createUserDataPoint('low') } as any
        })
      }
    },
    {
      id: 'noise',
      question: 'Chronic noise pollution exposure?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, very loud',
        emoji: '🔊',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, noiseExposure: createUserDataPoint('high') } as any
        })
      },
      rightOption: {
        label: 'No, quiet',
        emoji: '🤫',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, noiseExposure: createUserDataPoint('low') } as any
        })
      }
    },
    {
      id: 'mold',
      question: 'Mold exposure in home/work?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, significant',
        emoji: '🦠',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, moldExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, moldExposure: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'leadPaint',
      question: 'Lead paint exposure (old building)?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, possible',
        emoji: '🎨',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, leadExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, leadExposure: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'asbestos',
      question: 'Asbestos exposure?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, occupational',
        emoji: '🏗️',
        profileUpdate: (p) => ({
          ...p,
          customFields: { ...p.customFields, asbestosExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          customFields: { ...p.customFields, asbestosExposure: createUserDataPoint(false) } as any
        })
      }
    },

    // MENTAL HEALTH (Additional)
    {
      id: 'anxiety',
      question: 'Do you have anxiety disorder?',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '😰',
        profileUpdate: (p) => setCondition(p, 'anxiety', true)
      },
      rightOption: {
        label: 'No',
        emoji: '😌',
        profileUpdate: (p) => setCondition(p, 'anxiety', false)
      }
    },
    {
      id: 'bipolar',
      question: 'Do you have bipolar disorder?',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '🎭',
        profileUpdate: (p) => setCondition(p, 'bipolar', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'bipolar', false)
      }
    },
    {
      id: 'ptsd',
      question: 'Do you have PTSD?',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '😔',
        profileUpdate: (p) => setCondition(p, 'ptsd', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'ptsd', false)
      }
    },
    {
      id: 'eatingDisorder',
      question: 'Do you have an eating disorder?',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '🍽️',
        profileUpdate: (p) => setCondition(p, 'eatingDisorder', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'eatingDisorder', false)
      }
    },

    // REPRODUCTIVE HEALTH
    {
      id: 'hrt',
      question: 'Are you on hormone replacement therapy?',
      category: 'Reproductive Health',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), hrt: createUserDataPoint(false) } as any
          }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), hrt: createUserDataPoint(true) } as any
          }
        })
      }
    },
    {
      id: 'contraception',
      question: 'Do you use hormonal contraception?',
      category: 'Reproductive Health',
      leftOption: {
        label: 'Yes, long-term',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            reproductiveHistory: { ...p.medicalHistory?.reproductiveHistory, contraceptionUse: createUserDataPoint(true) } as any
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            reproductiveHistory: { ...p.medicalHistory?.reproductiveHistory, contraceptionUse: createUserDataPoint(false) } as any
          }
        })
      }
    },

    // DENTAL HEALTH
    {
      id: 'teeth',
      question: 'Do you brush teeth twice daily?',
      category: 'Dental Health',
      leftOption: {
        label: 'No/Rarely',
        emoji: '🦷',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, dentalHygiene: createUserDataPoint('poor') } as any
        })
      },
      rightOption: {
        label: 'Yes, twice daily',
        emoji: '🪥',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, dentalHygiene: createUserDataPoint('good') } as any
        })
      }
    },
    {
      id: 'floss',
      question: 'Do you floss regularly?',
      category: 'Dental Health',
      leftOption: {
        label: 'No',
        emoji: '🦷',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, flossing: createUserDataPoint(false) } as any
        })
      },
      rightOption: {
        label: 'Yes, daily',
        emoji: '🧵',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, flossing: createUserDataPoint(true) } as any
        })
      }
    },

    // LIFESTYLE & WELLBEING
    {
      id: 'pets',
      question: 'Do you have pets?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, petOwnership: { ...p.social?.petOwnership, ownsDog: createUserDataPoint(false) } }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '🐕',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, petOwnership: { ...p.social?.petOwnership, ownsDog: createUserDataPoint(true) } }
        })
      }
    },
    {
      id: 'volunteering',
      question: 'Do you volunteer or help others?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, volunteering: { ...p.social?.volunteering, active: createUserDataPoint(false) } }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '🤝',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, volunteering: { ...p.social?.volunteering, active: createUserDataPoint(true) } }
        })
      }
    },
    {
      id: 'hobbies',
      question: 'Do you have engaging hobbies?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No, not really',
        emoji: '📺',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, hobbies: { ...p.social?.hobbies, creative: { engaged: createUserDataPoint(false) } } }
        })
      },
      rightOption: {
        label: 'Yes, several',
        emoji: '🎨',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, hobbies: { ...p.social?.hobbies, creative: { engaged: createUserDataPoint(true) } } }
        })
      }
    },
    {
      id: 'religion',
      question: 'Do you attend religious services?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, religiousAttendance: createUserDataPoint('never') }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '🕊️',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, religiousAttendance: createUserDataPoint('weekly') }
        })
      }
    },
    {
      id: 'music',
      question: 'Do you listen to music regularly?',
      category: 'Wellbeing',
      leftOption: {
        label: 'Rarely',
        emoji: '🔇',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, musicListening: createUserDataPoint(false) } as any
        })
      },
      rightOption: {
        label: 'Yes, often',
        emoji: '🎵',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, musicListening: createUserDataPoint(true) } as any
        })
      }
    },
    {
      id: 'reading',
      question: 'Do you read books regularly?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No',
        emoji: '📱',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, hobbies: { ...p.social?.hobbies, intellectual: { engaged: createUserDataPoint(false) } } }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '📚',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, hobbies: { ...p.social?.hobbies, intellectual: { engaged: createUserDataPoint(true) } } }
        })
      }
    },
    {
      id: 'screenTime',
      question: 'Excessive screen time (>6 hrs/day)?',
      category: 'Wellbeing',
      leftOption: {
        label: 'Yes, very high',
        emoji: '📱',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, screenTime: createUserDataPoint('high') } as any
        })
      },
      rightOption: {
        label: 'No, moderate',
        emoji: '📵',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, screenTime: createUserDataPoint('moderate') } as any
        })
      }
    },
    {
      id: 'outdoorTime',
      question: 'Do you spend time outdoors daily?',
      category: 'Wellbeing',
      leftOption: {
        label: 'Rarely',
        emoji: '🏠',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, outdoorTime: { ...p.lifestyle?.outdoorTime, minutesPerWeek: createTimeSeries(30) } }
        })
      },
      rightOption: {
        label: 'Yes, daily',
        emoji: '🌳',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, outdoorTime: { ...p.lifestyle?.outdoorTime, minutesPerWeek: createTimeSeries(300) } }
        })
      }
    },
    {
      id: 'nature',
      question: 'Regular exposure to nature/greenspace?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No, mostly urban',
        emoji: '🏙️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, outdoorTime: { ...p.lifestyle?.outdoorTime, minutesPerWeek: createTimeSeries(30) } }
        })
      },
      rightOption: {
        label: 'Yes, frequent',
        emoji: '🌲',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, outdoorTime: { ...p.lifestyle?.outdoorTime, minutesPerWeek: createTimeSeries(300) } }
        })
      }
    },
    // REMOVED: Blood Donation - Healthy donor bias confounds evidence
    // Apparent benefits (HR 0.98) largely due to "Healthy Donor Effect"
    // Rigorous studies controlling for health status show no significant mortality benefit
    // Blood donors must meet strict health criteria, creating selection bias
    // {
    //   id: 'bloodDonation',
    //   question: 'Do you donate blood?',
    //   category: 'Wellbeing',
    //   leftOption: {
    //     label: 'No',
    //     emoji: '🚫',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       lifestyle: { ...p.lifestyle, bloodDonation: createUserDataPoint(false) } as any
    //     })
    //   },
    //   rightOption: {
    //     label: 'Yes, regularly',
    //     emoji: '🩸',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       lifestyle: { ...p.lifestyle, bloodDonation: createUserDataPoint(true) } as any
    //     })
    //   }
    // },

    // MORTALITY MODIFIERS (Evidence-Based)
    {
      id: 'dog_ownership',
      question: 'Do you own a dog?',
      category: 'Social',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            petOwnership: {
              ...p.social?.petOwnership,
              ownsDog: createUserDataPoint(false)
            }
          }
        })
      },
      rightOption: {
        label: 'Yes, I have a dog',
        emoji: '🐕',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            petOwnership: {
              ...p.social?.petOwnership,
              ownsDog: createUserDataPoint(true)
            }
          }
        })
      }
    },
    {
      id: 'social_connections',
      question: 'How strong are your social connections?',
      category: 'Social',
      leftOption: {
        label: 'Weak/Isolated',
        emoji: '😔',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            socialEngagement: createUserDataPoint('low')
          } as any
        })
      },
      rightOption: {
        label: 'Strong',
        emoji: '💚',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            socialEngagement: createUserDataPoint('high')
          } as any
        })
      }
    },
    {
      id: 'religious_attendance',
      question: 'Do you attend religious services?',
      category: 'Cultural',
      leftOption: {
        label: 'Never/Rarely',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            religiousAttendance: createUserDataPoint('never' as const)
          }
        })
      },
      rightOption: {
        label: 'Weekly+',
        emoji: '⛪',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            religiousAttendance: createUserDataPoint('weekly' as const)
          }
        })
      }
    },
    {
      id: 'nature_exposure',
      question: 'Time spent in nature per week?',
      category: 'Environmental',
      leftOption: {
        label: 'Little/None',
        emoji: '🏢',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            outdoorTime: {
              ...p.lifestyle?.outdoorTime,
              minutesPerWeek: createTimeSeries(30)
            }
          }
        })
      },
      rightOption: {
        label: '2+ hours',
        emoji: '🌳',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            outdoorTime: {
              ...p.lifestyle?.outdoorTime,
              minutesPerWeek: createTimeSeries(150)
            }
          }
        })
      }
    },
    {
      id: 'creative_hobbies',
      question: 'Do you engage in creative hobbies?',
      category: 'Cultural',
      leftOption: {
        label: 'No',
        emoji: '📺',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            hobbies: {
              ...p.social?.hobbies,
              creative: {
                ...p.social?.hobbies?.creative,
                engaged: createUserDataPoint(false)
              }
            }
          }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '🎨',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            hobbies: {
              ...p.social?.hobbies,
              creative: {
                ...p.social?.hobbies?.creative,
                engaged: createUserDataPoint(true)
              }
            }
          }
        })
      }
    },

    // PHASE 3 ADDITIONS - NEW RISK FACTORS

    // MEDICATIONS
    {
      id: 'statin',
      question: 'Are you taking a statin medication for cholesterol?',
      category: 'Medical History',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: {
              ...(p.medicalHistory?.medications || {}),
              statin: createUserDataPoint(false)
            }
          }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: {
              ...(p.medicalHistory?.medications || {}),
              statin: createUserDataPoint(true)
            }
          }
        })
      }
    },

    // LAB TESTS / CARDIOVASCULAR SCREENING
    {
      id: 'cacScore',
      question: 'Have you had a coronary artery calcium (CAC) scan?',
      category: 'Lab Tests',
      leftOption: {
        label: 'No / Not tested',
        emoji: '❓',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            cacScore: undefined
          }
        })
      },
      rightOption: {
        label: 'Yes, tested',
        emoji: '🩺',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            cacScore: createUserDataPoint('0' as const) // Default to 0 (best score)
          }
        })
      }
    },

    // MENTAL HEALTH - SUICIDE RISK (SENSITIVE)
    {
      id: 'suicideAttempts',
      question: 'Have you ever had a suicide attempt? (Confidential)',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '🆘',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            suicideAttempts: createUserDataPoint(true)
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            suicideAttempts: createUserDataPoint(false)
          }
        })
      }
    },

    // SLEEP HEALTH
    {
      id: 'sleepApnea',
      question: 'Have you been diagnosed with sleep apnea?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '😴',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            sleepApnea: {
              ...(p.medicalHistory?.sleepApnea || {}),
              diagnosis: createUserDataPoint(true)
            }
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            sleepApnea: {
              ...(p.medicalHistory?.sleepApnea || {}),
              diagnosis: createUserDataPoint(false)
            }
          }
        })
      }
    },

    // HEARING HEALTH
    {
      id: 'hearingLoss',
      question: 'Do you have hearing loss? Do you use hearing aids?',
      category: 'Medical History',
      leftOption: {
        label: 'Hearing loss (untreated)',
        emoji: '👂',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            hearingLoss: {
              ...(p.medicalHistory?.hearingLoss || {}),
              treated: createUserDataPoint('untreated_moderate_severe' as const)
            }
          }
        })
      },
      rightOption: {
        label: 'No loss / Uses hearing aids',
        emoji: '👍',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            hearingLoss: {
              ...(p.medicalHistory?.hearingLoss || {}),
              treated: createUserDataPoint('none_or_treated' as const)
            }
          }
        })
      }
    },

    // SUN EXPOSURE / SKIN CANCER RISK
    {
      id: 'sunburns',
      question: 'How many severe sunburns have you had in your lifetime?',
      category: 'Medical History',
      leftOption: {
        label: 'Many (5+ times)',
        emoji: '☀️',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            sunExposure: {
              ...(p.medicalHistory?.sunExposure || {}),
              sunburns: createUserDataPoint(10) // Estimate 10 for "many"
            }
          }
        })
      },
      rightOption: {
        label: 'Few/None (0-2 times)',
        emoji: '🧴',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            sunExposure: {
              ...(p.medicalHistory?.sunExposure || {}),
              sunburns: createUserDataPoint(1) // Estimate 1 for "few"
            }
          }
        })
      }
    }
  ];
}

