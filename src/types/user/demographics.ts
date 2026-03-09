import { DataPoint } from '../common/datapoint';

export interface Demographics {
  // Core demographics (mostly static)
  dateOfBirth?: DataPoint<string>; // ISO date
  biologicalSex?: DataPoint<'male' | 'female' | 'intersex'>;
  ethnicity?: DataPoint<Ethnicity>;
  educationLevel?: DataPoint<EducationLevel>;

  // Location (may change)
  country?: DataPoint<string>;
  region?: DataPoint<string>; // State/province
  urbanicity?: DataPoint<Urbanicity>;
  zipCode?: DataPoint<string>; // For future socioeconomic modeling

  // Optional
  genderIdentity?: DataPoint<string>;
}

export type Ethnicity =
  | 'white'
  | 'black'
  | 'hispanic'
  | 'asian'
  | 'native_american'
  | 'pacific_islander'
  | 'mixed'
  | 'other';

export type EducationLevel =
  | 'less_than_high_school'
  | 'high_school'
  | 'some_college'
  | 'bachelors'
  | 'graduate';

export type Urbanicity = 'urban' | 'suburban' | 'rural';
