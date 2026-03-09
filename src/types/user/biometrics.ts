import { DataPoint, TimeSeries } from '../common/datapoint';

export interface Biometrics {
  // Time series for changing measurements
  weight?: TimeSeries<WeightMeasurement>;
  bloodPressure?: TimeSeries<BloodPressureMeasurement>;
  heartRate?: TimeSeries<number>; // bpm

  // Less frequent changes
  height?: DataPoint<number>; // cm
  waistCircumference?: TimeSeries<number>; // cm
  hipCircumference?: TimeSeries<number>; // cm
}

export interface WeightMeasurement {
  value: number; // kg
  unit: 'kg' | 'lbs';
}

export interface BloodPressureMeasurement {
  systolic: number; // mmHg
  diastolic: number; // mmHg
}
