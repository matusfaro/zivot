/**
 * Event Registry Configuration
 *
 * Central registry of all habit event types with their UI properties,
 * quick-log presets, and profile field mappings.
 */

import type { EventGroup, EventTypeDefinition } from '../types/events/eventGroups';

/**
 * Eating & Drinking Event Group
 */
export const EATING_DRINKING_GROUP: EventGroup = {
  id: 'eating_drinking',
  name: 'Eating & Drinking',
  emoji: '🍽️',
  color: '#FF6B35',
  description: 'Track food and beverage consumption',
  eventTypes: [
    {
      id: 'drink_alcohol',
      name: 'Had a drink',
      emoji: '🍷',
      category: 'eating_drinking',
      quickLogValues: [
        { label: '1 drink', metadata: { type: 'alcohol', drinks: 1 } },
        { label: '2 drinks', metadata: { type: 'alcohol', drinks: 2 } },
        { label: '3 drinks', metadata: { type: 'alcohol', drinks: 3 } },
        { label: '4+ drinks', metadata: { type: 'alcohol', drinks: 4 } },
      ],
      profileMappings: [
        {
          profilePath: 'lifestyle.alcohol.drinksPerWeek',
          aggregationType: 'sum',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    },
    {
      id: 'eat_vegetables',
      name: 'Ate vegetables',
      emoji: '🥗',
      category: 'eating_drinking',
      quickLogValues: [
        { label: '1 serving', metadata: { type: 'food', foodType: 'vegetables', servings: 1 } },
        { label: '2 servings', metadata: { type: 'food', foodType: 'vegetables', servings: 2 } },
        { label: '3 servings', metadata: { type: 'food', foodType: 'vegetables', servings: 3 } },
      ],
      detailedForm: true,  // Allow calories entry
      profileMappings: [
        {
          profilePath: 'lifestyle.diet.vegetableServingsPerDay',
          aggregationType: 'average',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    },
    {
      id: 'eat_fruit',
      name: 'Ate fruit',
      emoji: '🍎',
      category: 'eating_drinking',
      quickLogValues: [
        { label: '1 serving', metadata: { type: 'food', foodType: 'fruit', servings: 1 } },
        { label: '2 servings', metadata: { type: 'food', foodType: 'fruit', servings: 2 } },
        { label: '3 servings', metadata: { type: 'food', foodType: 'fruit', servings: 3 } },
      ],
      detailedForm: true,
      profileMappings: [
        {
          profilePath: 'lifestyle.diet.fruitServingsPerDay',
          aggregationType: 'average',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    },
    {
      id: 'eat_processed_meat',
      name: 'Ate processed meat',
      emoji: '🥓',
      category: 'eating_drinking',
      quickLogValues: [
        { label: '1 serving', metadata: { type: 'food', foodType: 'processed_meat', servings: 1 } },
        { label: '2 servings', metadata: { type: 'food', foodType: 'processed_meat', servings: 2 } },
      ],
      profileMappings: [
        {
          profilePath: 'lifestyle.diet.processedMeatServingsPerWeek',
          aggregationType: 'sum',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    },
    {
      id: 'drink_sugar_beverage',
      name: 'Sugary drink',
      emoji: '🥤',
      category: 'eating_drinking',
      quickLogValues: [
        { label: '1 drink', metadata: { type: 'food', foodType: 'sugar_beverage', servings: 1 } },
        { label: '2 drinks', metadata: { type: 'food', foodType: 'sugar_beverage', servings: 2 } },
      ],
      profileMappings: [
        {
          profilePath: 'lifestyle.diet.sugarSweetenedBeveragesPerWeek',
          aggregationType: 'sum',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    }
  ]
};

/**
 * Exercise Event Group
 */
export const EXERCISE_GROUP: EventGroup = {
  id: 'exercise',
  name: 'Exercise',
  emoji: '🏃',
  color: '#4ECDC4',
  description: 'Track physical activity',
  eventTypes: [
    {
      id: 'exercise_moderate',
      name: 'Moderate exercise',
      emoji: '🚶',
      category: 'exercise',
      quickLogValues: [
        { label: '15 min', metadata: { type: 'exercise', activityType: 'moderate', minutes: 15 } },
        { label: '30 min', metadata: { type: 'exercise', activityType: 'moderate', minutes: 30 } },
        { label: '45 min', metadata: { type: 'exercise', activityType: 'moderate', minutes: 45 } },
        { label: '60 min', metadata: { type: 'exercise', activityType: 'moderate', minutes: 60 } },
      ],
      profileMappings: [
        {
          profilePath: 'lifestyle.exercise.moderateMinutesPerWeek',
          aggregationType: 'sum',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    },
    {
      id: 'exercise_vigorous',
      name: 'Vigorous exercise',
      emoji: '🏃',
      category: 'exercise',
      quickLogValues: [
        { label: '15 min', metadata: { type: 'exercise', activityType: 'vigorous', minutes: 15 } },
        { label: '30 min', metadata: { type: 'exercise', activityType: 'vigorous', minutes: 30 } },
        { label: '45 min', metadata: { type: 'exercise', activityType: 'vigorous', minutes: 45 } },
        { label: '60 min', metadata: { type: 'exercise', activityType: 'vigorous', minutes: 60 } },
      ],
      profileMappings: [
        {
          profilePath: 'lifestyle.exercise.vigorousMinutesPerWeek',
          aggregationType: 'sum',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    },
    {
      id: 'exercise_strength',
      name: 'Strength training',
      emoji: '💪',
      category: 'exercise',
      quickLogValues: [
        { label: '1 session', metadata: { type: 'exercise', activityType: 'strength', minutes: 30 } },
      ],
      profileMappings: [
        {
          profilePath: 'lifestyle.exercise.strengthTrainingDaysPerWeek',
          aggregationType: 'count',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    }
  ]
};

/**
 * Sleep Event Group
 */
export const SLEEP_GROUP: EventGroup = {
  id: 'sleep',
  name: 'Sleep',
  emoji: '😴',
  color: '#9D84B7',
  description: 'Track sleep duration and quality',
  eventTypes: [
    {
      id: 'sleep_night',
      name: 'Slept',
      emoji: '🌙',
      category: 'sleep',
      quickLogValues: [
        { label: '5 hours', metadata: { type: 'sleep', hours: 5 } },
        { label: '6 hours', metadata: { type: 'sleep', hours: 6 } },
        { label: '7 hours', metadata: { type: 'sleep', hours: 7 } },
        { label: '8 hours', metadata: { type: 'sleep', hours: 8 } },
        { label: '9 hours', metadata: { type: 'sleep', hours: 9 } },
      ],
      profileMappings: [
        {
          profilePath: 'lifestyle.sleep.averageHoursPerNight',
          aggregationType: 'average',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    }
  ]
};

/**
 * Medical Event Group
 */
export const MEDICAL_GROUP: EventGroup = {
  id: 'medical',
  name: 'Medical',
  emoji: '🩺',
  color: '#E74C3C',
  description: 'Track medical events and health screenings',
  eventTypes: [
    {
      id: 'blood_test',
      name: 'Blood test',
      emoji: '💉',
      category: 'medical',
      detailedForm: true,  // Show lab values form
      profileMappings: []  // Special handling - updates lab test fields directly
    },
    {
      id: 'take_medication',
      name: 'Took medication',
      emoji: '💊',
      category: 'medical',
      detailedForm: true,
      profileMappings: []  // Tracked but not extrapolated
    }
  ]
};

/**
 * Social Event Group
 */
export const SOCIAL_GROUP: EventGroup = {
  id: 'social',
  name: 'Social',
  emoji: '🌳',
  color: '#27AE60',
  description: 'Track social activities and outdoor time',
  eventTypes: [
    {
      id: 'outdoor_time',
      name: 'Outdoor activity',
      emoji: '🌲',
      category: 'social',
      quickLogValues: [
        { label: '15 min', metadata: { type: 'social', activityType: 'outdoor_time', minutes: 15 } },
        { label: '30 min', metadata: { type: 'social', activityType: 'outdoor_time', minutes: 30 } },
        { label: '60 min', metadata: { type: 'social', activityType: 'outdoor_time', minutes: 60 } },
        { label: '120 min', metadata: { type: 'social', activityType: 'outdoor_time', minutes: 120 } },
      ],
      profileMappings: [
        {
          profilePath: 'lifestyle.outdoorTime.minutesPerWeek',
          aggregationType: 'sum',
          rollingWindow: 7,
          conversionFactor: 1
        }
      ]
    },
    {
      id: 'social_interaction',
      name: 'Social activity',
      emoji: '👥',
      category: 'social',
      quickLogValues: [
        { label: '30 min', metadata: { type: 'social', activityType: 'social_interaction', minutes: 30 } },
        { label: '60 min', metadata: { type: 'social', activityType: 'social_interaction', minutes: 60 } },
        { label: '120 min', metadata: { type: 'social', activityType: 'social_interaction', minutes: 120 } },
      ],
      profileMappings: []  // Tracked but not currently mapped to profile
    }
  ]
};

/**
 * Stress Event Group
 */
export const STRESS_GROUP: EventGroup = {
  id: 'stress',
  name: 'Stress & Relaxation',
  emoji: '🧘',
  color: '#8E44AD',
  description: 'Track stress management activities',
  eventTypes: [
    {
      id: 'meditation',
      name: 'Meditated',
      emoji: '🧘',
      category: 'stress',
      quickLogValues: [
        { label: '5 min', metadata: { type: 'stress', stressType: 'meditation', minutes: 5 } },
        { label: '10 min', metadata: { type: 'stress', stressType: 'meditation', minutes: 10 } },
        { label: '20 min', metadata: { type: 'stress', stressType: 'meditation', minutes: 20 } },
      ],
      profileMappings: []  // Tracked but not currently mapped to profile
    }
  ]
};

/**
 * All event groups registry
 */
export const EVENT_GROUPS: EventGroup[] = [
  EATING_DRINKING_GROUP,
  EXERCISE_GROUP,
  SLEEP_GROUP,
  MEDICAL_GROUP,
  SOCIAL_GROUP,
  STRESS_GROUP
];

/**
 * Build lookup map for efficient access by event type ID
 */
export const EVENT_TYPE_REGISTRY = new Map<string, EventTypeDefinition>();
for (const group of EVENT_GROUPS) {
  for (const eventType of group.eventTypes) {
    EVENT_TYPE_REGISTRY.set(eventType.id, eventType);
  }
}

/**
 * Get event type definition by ID
 */
export function getEventTypeDefinition(eventTypeId: string): EventTypeDefinition | undefined {
  return EVENT_TYPE_REGISTRY.get(eventTypeId);
}

/**
 * Get event group by ID
 */
export function getEventGroup(categoryId: string): EventGroup | undefined {
  return EVENT_GROUPS.find(g => g.id === categoryId);
}
