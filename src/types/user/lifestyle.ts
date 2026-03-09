import { DataPoint, TimeSeries } from '../common/datapoint';

export interface Lifestyle {
  smoking?: SmokingHistory;
  alcohol?: AlcoholConsumption;
  exercise?: ExerciseHabits;
  sleep?: SleepPatterns;
  diet?: DietaryPatterns;
  drivingHabits?: DrivingHabits;
  occupationalExposures?: DataPoint<boolean>;
  outdoorTime?: OutdoorTime;
}

export interface SmokingHistory {
  status?: DataPoint<SmokingStatus>;
  packsPerDay?: TimeSeries<number>;
  packYears?: DataPoint<number>; // Calculated or user-entered
  quitDate?: DataPoint<number>; // timestamp
  yearsSinceQuitting?: DataPoint<number>; // Years since quitting (alternative to quitDate)
}

export type SmokingStatus = 'never' | 'former' | 'current';

export interface AlcoholConsumption {
  drinksPerWeek?: TimeSeries<number>;
  bingeDrinking?: DataPoint<boolean>;
  pattern?: DataPoint<'none' | 'light' | 'moderate' | 'heavy'>;
}

export interface ExerciseHabits {
  moderateMinutesPerWeek?: TimeSeries<number>;
  vigorousMinutesPerWeek?: TimeSeries<number>;
  strengthTrainingDaysPerWeek?: TimeSeries<number>;
  sedentaryHoursPerDay?: TimeSeries<number>;
}

export interface SleepPatterns {
  averageHoursPerNight?: TimeSeries<number>;
  sleepQuality?: TimeSeries<number>; // 1-10 scale
}

export interface DietaryPatterns {
  vegetableServingsPerDay?: TimeSeries<number>;
  fruitServingsPerDay?: TimeSeries<number>;
  processedMeatServingsPerWeek?: TimeSeries<number>;
  sugarSweetenedBeveragesPerWeek?: TimeSeries<number>;
  pattern?: DataPoint<DietPattern>;
}

export type DietPattern =
  | 'mediterranean'
  | 'dash'
  | 'plant_based'
  | 'western'
  | 'mixed'
  | 'other';

export interface DrivingHabits {
  milesPerYear?: DataPoint<number>;
  seatBeltUse?: DataPoint<SeatBeltFrequency>;
  trafficViolationsPast3Years?: DataPoint<number>;
  phoneUseWhileDriving?: DataPoint<PhoneUseFrequency>;
  drivingSetting?: DataPoint<DrivingSetting>;
}

export type SeatBeltFrequency = 'always' | 'usually' | 'sometimes' | 'never';
export type PhoneUseFrequency = 'never' | 'rare' | 'occasional' | 'frequent';
export type DrivingSetting = 'urban' | 'suburban' | 'rural' | 'mixed';

export interface OutdoorTime {
  minutesPerWeek?: TimeSeries<number>; // Time spent in nature/greenspace per week
  setting?: DataPoint<OutdoorSetting>;
}

export type OutdoorSetting =
  | 'urban_parks' // City parks, green spaces
  | 'suburban_parks' // Neighborhood parks
  | 'nature_trails' // Hiking trails, nature reserves
  | 'wilderness' // Remote natural areas
  | 'beaches' // Beach/coastal areas
  | 'mixed'; // Variety of settings
