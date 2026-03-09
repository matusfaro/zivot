/**
 * Event Groups Configuration Types
 *
 * Defines how habit events are organized into categories and how they map to user profile fields.
 */

import type { EventCategory, EventTypeId, EventMetadata } from './habitEvent';

/**
 * Aggregation strategy for extrapolating events into profile values
 */
export type AggregationType = 'sum' | 'average' | 'count' | 'latest';

/**
 * Profile mapping definition - how events extrapolate to profile fields
 */
export interface ProfileMapping {
  profilePath: string;          // e.g., "lifestyle.alcohol.drinksPerWeek"
  aggregationType: AggregationType;
  rollingWindow: number;        // Days (e.g., 7 for weekly, 30 for monthly)
  conversionFactor?: number;    // Optional multiplier (e.g., daily to weekly = 7)
}

/**
 * Quick log preset - predefined values for fast event logging
 */
export interface QuickLogPreset {
  label: string;                // Display text (e.g., "1 drink", "30 min")
  metadata: EventMetadata;      // Event metadata to log
}

/**
 * Event type definition - specific event within a category
 */
export interface EventTypeDefinition {
  id: EventTypeId;
  name: string;                 // Display name (e.g., "Had a drink")
  emoji: string;                // Emoji icon for UI
  category: EventCategory;      // Parent category

  // UI configuration
  quickLogValues?: QuickLogPreset[];        // Quick-add buttons
  detailedForm?: boolean;                   // Show detailed form (for calories, etc.)

  // Profile mapping
  profileMappings: ProfileMapping[];        // How to extrapolate to profile
}

/**
 * Event group - collection of related event types
 */
export interface EventGroup {
  id: EventCategory;
  name: string;                 // Display name (e.g., "Eating & Drinking")
  emoji: string;                // Emoji icon for category
  color: string;                // Color for UI theming (hex code)
  description?: string;         // Optional description
  eventTypes: EventTypeDefinition[];
}

/**
 * Extrapolation result from rolling window aggregation
 */
export interface ExtrapolationResult {
  value: number | null;         // Aggregated value
  confidence: ConfidenceLevel;  // Confidence based on data completeness
  dataPoints: number;           // Number of events used in calculation
  daysTracked: number;          // Number of unique days with data
  completeness: number;         // 0-1 scale (daysTracked / windowSize)
}

/**
 * Confidence level for extrapolated data
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'estimated';

/**
 * Impact preview for showing user feedback before logging
 */
export interface ImpactPreview {
  message: string;              // e.g., "You exercised +30 min this week"
  riskDelta: number;            // Change in risk percentage (can be negative)
  newWeeklyTotal?: number;      // Updated metric value (optional)
  confidence: ConfidenceLevel;  // Confidence in the extrapolation
}

/**
 * Habit tracking metadata - tracks which metrics are actively being logged
 */
export interface HabitTrackingMetadata {
  profileId: string;
  metricPath: string;           // e.g., "lifestyle.alcohol.drinksPerWeek"
  startDate: number;            // When user started tracking this metric
  active: boolean;              // Currently tracking?
  lastEventTimestamp?: number;  // Most recent event for this metric
}
