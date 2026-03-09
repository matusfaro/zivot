/**
 * Habit Event Type Definitions
 *
 * Defines the core data model for discrete habit events (e.g., "I had a drink", "I went for a run").
 * Events are stored separately from the user profile and extrapolated into rolling averages.
 */

export type EventCategory =
  | 'eating_drinking'
  | 'exercise'
  | 'sleep'
  | 'medical'
  | 'social'
  | 'stress';

export type EventTypeId =
  // Eating/Drinking
  | 'drink_alcohol'
  | 'eat_vegetables'
  | 'eat_fruit'
  | 'eat_processed_meat'
  | 'drink_sugar_beverage'
  | 'drink_water'
  | 'eat_meal'

  // Exercise
  | 'exercise_moderate'
  | 'exercise_vigorous'
  | 'exercise_strength'
  | 'walk'
  | 'run'
  | 'bike'
  | 'swim'

  // Sleep
  | 'sleep_night'
  | 'nap'

  // Medical
  | 'blood_test'
  | 'doctor_visit'
  | 'take_medication'
  | 'skip_medication'
  | 'health_screening'

  // Social
  | 'social_interaction'
  | 'outdoor_time'

  // Stress
  | 'stress_event'
  | 'meditation'
  | 'relaxation';

/**
 * Alcohol consumption metadata
 */
export interface AlcoholMetadata {
  type: 'alcohol';
  drinks: number;              // Standard drinks (e.g., 1 beer = 1 drink)
  alcoholType?: 'beer' | 'wine' | 'spirits' | 'mixed';
}

/**
 * Food consumption metadata
 */
export interface FoodMetadata {
  type: 'food';
  foodType: 'vegetables' | 'fruit' | 'processed_meat' | 'sugar_beverage' | 'water' | 'meal';
  servings: number;
  calories?: number;           // Optional calorie count for detailed tracking
  description?: string;        // e.g., "grilled chicken", "apple"
}

/**
 * Exercise activity metadata
 */
export interface ExerciseMetadata {
  type: 'exercise';
  activityType: 'moderate' | 'vigorous' | 'strength';
  minutes: number;
  description?: string;        // e.g., "jogging", "yoga", "weights"
  distance?: number;           // Optional distance in km
}

/**
 * Sleep metadata
 */
export interface SleepMetadata {
  type: 'sleep';
  hours: number;
  quality?: number;            // 1-10 scale
  startTime?: number;          // Optional timestamp when sleep started
  endTime?: number;            // Optional timestamp when sleep ended
}

/**
 * Medical event metadata
 */
export interface MedicalMetadata {
  type: 'medical';
  eventSubtype: 'blood_test' | 'doctor_visit' | 'medication' | 'screening';

  // For blood tests
  labValues?: {
    totalCholesterol?: number;
    ldlCholesterol?: number;
    hdlCholesterol?: number;
    triglycerides?: number;
    glucose?: number;
    hba1c?: number;
    creatinine?: number;
    [key: string]: number | undefined;
  };

  // For medications
  medicationName?: string;
  medicationTaken?: boolean;   // true = took, false = skipped

  // General
  notes?: string;
}

/**
 * Social activity metadata
 */
export interface SocialMetadata {
  type: 'social';
  activityType: 'social_interaction' | 'outdoor_time' | 'volunteering';
  minutes: number;
  description?: string;        // e.g., "dinner with friends", "park walk"
  peopleCount?: number;        // Number of people involved
}

/**
 * Stress-related metadata
 */
export interface StressMetadata {
  type: 'stress';
  stressType: 'stress_event' | 'meditation' | 'relaxation';
  minutes?: number;            // For meditation/relaxation
  intensity?: number;          // 1-10 scale for stress events
  description?: string;
}

/**
 * Discriminated union of all event metadata types
 */
export type EventMetadata =
  | AlcoholMetadata
  | FoodMetadata
  | ExerciseMetadata
  | SleepMetadata
  | MedicalMetadata
  | SocialMetadata
  | StressMetadata;

/**
 * Core habit event structure
 */
export interface HabitEvent {
  eventId: string;              // UUID
  profileId: string;            // Links to user profile
  timestamp: number;            // Unix timestamp (when event occurred)

  // Event classification
  category: EventCategory;      // Top-level grouping
  eventType: EventTypeId;       // Specific event identifier

  // Event-specific data
  metadata: EventMetadata;      // Type-safe metadata per event type

  // User notes (optional)
  notes?: string;

  // Tracking metadata
  loggedAt: number;            // When user logged it (may differ from timestamp)
  source: 'manual' | 'import' | 'device_sync';
}

/**
 * Type guard to check if metadata is AlcoholMetadata
 */
export function isAlcoholMetadata(metadata: EventMetadata): metadata is AlcoholMetadata {
  return metadata.type === 'alcohol';
}

/**
 * Type guard to check if metadata is FoodMetadata
 */
export function isFoodMetadata(metadata: EventMetadata): metadata is FoodMetadata {
  return metadata.type === 'food';
}

/**
 * Type guard to check if metadata is ExerciseMetadata
 */
export function isExerciseMetadata(metadata: EventMetadata): metadata is ExerciseMetadata {
  return metadata.type === 'exercise';
}

/**
 * Type guard to check if metadata is SleepMetadata
 */
export function isSleepMetadata(metadata: EventMetadata): metadata is SleepMetadata {
  return metadata.type === 'sleep';
}

/**
 * Type guard to check if metadata is MedicalMetadata
 */
export function isMedicalMetadata(metadata: EventMetadata): metadata is MedicalMetadata {
  return metadata.type === 'medical';
}

/**
 * Type guard to check if metadata is SocialMetadata
 */
export function isSocialMetadata(metadata: EventMetadata): metadata is SocialMetadata {
  return metadata.type === 'social';
}

/**
 * Type guard to check if metadata is StressMetadata
 */
export function isStressMetadata(metadata: EventMetadata): metadata is StressMetadata {
  return metadata.type === 'stress';
}
