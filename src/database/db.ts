import Dexie, { Table } from 'dexie';
import { UserProfile } from '../types/user';
import { RiskCalculationResult } from '../types/risk/calculation';
import { HabitEvent, EventCategory, EventTypeId, EventMetadata } from '../types/events/habitEvent';

/**
 * Main database class
 * Version 1: Initial schema (profiles, risk calculations)
 * Version 2: Add habit tracking (habitEvents, habitTracking)
 */
export class ZivotDB extends Dexie {
  // Tables
  profiles!: Table<UserProfileRecord, string>;
  riskCalculations!: Table<RiskCalculationRecord, string>;
  habitEvents!: Table<HabitEventRecord, string>;
  habitTracking!: Table<HabitTrackingRecord, string>;

  constructor() {
    super('ZivotDB');

    // Version 2 schema - add habit tracking
    this.version(2).stores({
      profiles: 'profileId, version, lastUpdated',
      riskCalculations: 'calculationId, profileId, timestamp',
      // Habit events: indexed for efficient time-range queries
      habitEvents: 'eventId, profileId, timestamp, category, eventType, [profileId+timestamp]',
      // Habit tracking metadata: which metrics are actively tracked
      habitTracking: '++id, profileId, metricPath, active'
    }).upgrade(async (tx) => {
      console.log('[DB] Upgrading to v2: habit tracking enabled');
      // No data migration needed - new tables start empty
    });

    // Version 1 schema (keep for backward compatibility)
    this.version(1).stores({
      profiles: 'profileId, version, lastUpdated',
      riskCalculations: 'calculationId, profileId, timestamp',
    });
  }
}

export const db = new ZivotDB();

/**
 * Database record types
 * These wrap the semantic types for storage
 */
export interface UserProfileRecord {
  profileId: string;
  version: string;
  lastUpdated: number;
  data: UserProfile; // Store entire profile as JSON blob
}

export interface RiskCalculationRecord {
  calculationId: string;
  profileId: string;
  timestamp: number;
  profileVersion: string;
  data: RiskCalculationResult;
}

/**
 * Habit event record - stores discrete habit events
 */
export interface HabitEventRecord {
  eventId: string;
  profileId: string;
  timestamp: number;            // When event occurred
  category: EventCategory;
  eventType: EventTypeId;
  metadata: EventMetadata;      // Type-safe event-specific data
  notes?: string;
  loggedAt: number;             // When user logged it
  source: 'manual' | 'import' | 'device_sync';
}

/**
 * Habit tracking metadata - tracks which metrics are actively being logged
 */
export interface HabitTrackingRecord {
  id?: number;                  // Auto-increment primary key
  profileId: string;
  metricPath: string;           // e.g., "lifestyle.alcohol.drinksPerWeek"
  startDate: number;            // When user started tracking
  active: boolean;              // Currently tracking?
  lastEventTimestamp?: number;  // Most recent event for this metric
}
