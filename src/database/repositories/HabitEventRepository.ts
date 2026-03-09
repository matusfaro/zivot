/**
 * Habit Event Repository
 *
 * Handles all database operations for habit events including CRUD operations,
 * time-range queries, and tracking metadata updates.
 */

import { v4 as uuidv4 } from 'uuid';
import { db, HabitEventRecord, HabitTrackingRecord } from '../db';
import { HabitEvent, EventCategory, EventTypeId } from '../../types/events/habitEvent';

export class HabitEventRepository {
  /**
   * Log a new habit event
   */
  async logEvent(event: Omit<HabitEvent, 'eventId' | 'loggedAt'>): Promise<HabitEvent> {
    const fullEvent: HabitEvent = {
      ...event,
      eventId: uuidv4(),
      loggedAt: Date.now()
    };

    const record: HabitEventRecord = {
      eventId: fullEvent.eventId,
      profileId: fullEvent.profileId,
      timestamp: fullEvent.timestamp,
      category: fullEvent.category,
      eventType: fullEvent.eventType,
      metadata: fullEvent.metadata,
      notes: fullEvent.notes,
      loggedAt: fullEvent.loggedAt,
      source: fullEvent.source
    };

    await db.habitEvents.add(record);

    console.log('[HabitEventRepository] Event logged:', {
      eventId: fullEvent.eventId,
      eventType: fullEvent.eventType,
      timestamp: new Date(fullEvent.timestamp).toISOString()
    });

    return fullEvent;
  }

  /**
   * Get events for a profile within a time range
   * Uses compound index [profileId+timestamp] for efficient querying
   */
  async getEventsInRange(
    profileId: string,
    startTime: number,
    endTime: number
  ): Promise<HabitEvent[]> {
    const records = await db.habitEvents
      .where('[profileId+timestamp]')
      .between([profileId, startTime], [profileId, endTime], true, true)
      .toArray();

    return records.map(this.recordToEvent);
  }

  /**
   * Get events by category for recent time period
   */
  async getRecentEventsByCategory(
    profileId: string,
    category: EventCategory,
    days: number = 7
  ): Promise<HabitEvent[]> {
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const records = await db.habitEvents
      .where({ profileId, category })
      .and(record => record.timestamp >= startTime)
      .reverse()
      .sortBy('timestamp');

    return records.map(this.recordToEvent);
  }

  /**
   * Get all events for a profile (last 30 days by default)
   */
  async getAllEvents(profileId: string, days: number = 30): Promise<HabitEvent[]> {
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    return this.getEventsInRange(profileId, startTime, Date.now());
  }

  /**
   * Get events grouped by day for calendar view
   */
  async getEventsByDay(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, HabitEvent[]>> {
    const events = await this.getEventsInRange(
      profileId,
      startDate.getTime(),
      endDate.getTime()
    );

    const byDay = new Map<string, HabitEvent[]>();

    for (const event of events) {
      const date = new Date(event.timestamp);
      const dayKey = this.formatDayKey(date);

      if (!byDay.has(dayKey)) {
        byDay.set(dayKey, []);
      }
      byDay.get(dayKey)!.push(event);
    }

    return byDay;
  }

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<HabitEvent | undefined> {
    const record = await db.habitEvents.get(eventId);
    return record ? this.recordToEvent(record) : undefined;
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: Partial<HabitEvent>): Promise<void> {
    const existing = await db.habitEvents.get(eventId);
    if (!existing) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const updated: HabitEventRecord = {
      ...existing,
      ...updates,
      eventId: existing.eventId, // Can't change ID
      profileId: existing.profileId, // Can't change profileId
    };

    await db.habitEvents.put(updated);

    console.log('[HabitEventRepository] Event updated:', eventId);
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await db.habitEvents.delete(eventId);
    console.log('[HabitEventRepository] Event deleted:', eventId);
  }

  /**
   * Delete all events for a profile
   */
  async deleteAllEvents(profileId: string): Promise<void> {
    await db.habitEvents.where({ profileId }).delete();
    console.log('[HabitEventRepository] All events deleted for profile:', profileId);
  }

  /**
   * Update habit tracking metadata when event is logged
   */
  async updateTrackingMetadata(
    profileId: string,
    metricPath: string,
    timestamp: number
  ): Promise<void> {
    // Find existing tracking record
    const existing = await db.habitTracking
      .where({ profileId, metricPath })
      .first();

    if (existing) {
      // Update existing
      await db.habitTracking.update(existing.id!, {
        lastEventTimestamp: timestamp,
        active: true
      });
    } else {
      // Create new tracking record
      const record: HabitTrackingRecord = {
        profileId,
        metricPath,
        startDate: timestamp,
        active: true,
        lastEventTimestamp: timestamp
      };
      await db.habitTracking.add(record);
    }
  }

  /**
   * Get tracking metadata for a profile
   */
  async getTrackingMetadata(profileId: string): Promise<HabitTrackingRecord[]> {
    return await db.habitTracking
      .where({ profileId })
      .toArray();
  }

  /**
   * Mark a metric as inactive (stop tracking)
   */
  async deactivateTracking(profileId: string, metricPath: string): Promise<void> {
    const existing = await db.habitTracking
      .where({ profileId, metricPath })
      .first();

    if (existing) {
      await db.habitTracking.update(existing.id!, { active: false });
    }
  }

  /**
   * Convert database record to HabitEvent
   */
  private recordToEvent(record: HabitEventRecord): HabitEvent {
    return {
      eventId: record.eventId,
      profileId: record.profileId,
      timestamp: record.timestamp,
      category: record.category,
      eventType: record.eventType,
      metadata: record.metadata,
      notes: record.notes,
      loggedAt: record.loggedAt,
      source: record.source
    };
  }

  /**
   * Format date as day key for calendar grouping
   */
  private formatDayKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}

// Singleton instance
export const habitEventRepository = new HabitEventRepository();
