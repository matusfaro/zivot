/**
 * useHabitEvents Hook
 *
 * React hook for managing habit events. Provides:
 * - Event logging with automatic profile extrapolation
 * - Impact preview before logging
 * - Real-time profile updates that trigger risk recalculation
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { HabitEvent } from '../types/events/habitEvent';
import { ImpactPreview, EventTypeDefinition } from '../types/events/eventGroups';
import { EventMetadata } from '../types/events/habitEvent';
import { habitEventRepository } from '../database/repositories/HabitEventRepository';
import { EventExtrapolator } from '../services/events/EventExtrapolator';
import { ProfileMerger } from '../services/events/ProfileMerger';
import { EVENT_TYPE_REGISTRY } from '../config/eventRegistry';
import { useUserProfile } from './useUserProfile';

export function useHabitEvents(profileId: string | undefined) {
  const [recentEvents, setRecentEvents] = useState<HabitEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { profile, updateLifestyle, updateBiometrics, updateSocial } = useUserProfile();
  const extrapolator = useMemo(() => new EventExtrapolator(), []);
  const merger = useMemo(() => new ProfileMerger(), []);

  // Load recent events on mount and when profileId changes
  useEffect(() => {
    if (profileId) {
      loadRecentEvents();
    }
  }, [profileId]);

  /**
   * Load recent events from database (last 30 days)
   */
  const loadRecentEvents = async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);
      const events = await habitEventRepository.getAllEvents(profileId, 30);
      setRecentEvents(events);
      console.log('[useHabitEvents] Loaded events:', events.length);
    } catch (err) {
      setError(err as Error);
      console.error('[useHabitEvents] Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log a new habit event and trigger profile update
   */
  const logEvent = useCallback(async (event: Omit<HabitEvent, 'eventId' | 'loggedAt'>) => {
    if (!profile) {
      throw new Error('No profile loaded');
    }

    try {
      // 1. Save to database
      const savedEvent = await habitEventRepository.logEvent(event);
      console.log('[useHabitEvents] Event logged:', savedEvent.eventId);

      // 2. Update local state
      setRecentEvents(prev => [...prev, savedEvent]);

      // 3. Recalculate extrapolations and update profile
      await recalculateAndUpdateProfile([...recentEvents, savedEvent]);

      // 4. Update tracking metadata for all affected metrics
      const eventDef = EVENT_TYPE_REGISTRY.get(event.eventType);
      if (eventDef) {
        for (const mapping of eventDef.profileMappings) {
          await habitEventRepository.updateTrackingMetadata(
            event.profileId,
            mapping.profilePath,
            event.timestamp
          );
        }
      }

      return savedEvent;
    } catch (err) {
      setError(err as Error);
      console.error('[useHabitEvents] Error logging event:', err);
      throw err;
    }
  }, [profile, recentEvents]);

  /**
   * Recalculate all extrapolations and merge into profile
   */
  const recalculateAndUpdateProfile = useCallback(async (events: HabitEvent[]) => {
    if (!profile) return;

    try {
      // Calculate all extrapolations
      const extrapolations = new Map();
      const uniqueMappings = getUniqueMappings(events);

      for (const mapping of uniqueMappings) {
        // Filter events relevant to this mapping
        const relevantEvents = events.filter(e => mappingAppliesToEvent(mapping, e));

        const result = extrapolator.calculateRollingAggregate(relevantEvents, mapping);

        if (result.value !== null) {
          extrapolations.set(mapping.profilePath, result);
        }
      }

      console.log('[useHabitEvents] Calculated extrapolations:', extrapolations.size);

      // Merge into profile
      const updatedProfile = merger.mergeExtrapolatedData(profile, extrapolations);

      // Update profile sections (this triggers risk recalculation via LiveDashboard)
      if (updatedProfile.lifestyle) {
        await updateLifestyle(updatedProfile.lifestyle);
      }
      if (updatedProfile.biometrics) {
        await updateBiometrics(updatedProfile.biometrics);
      }
      if (updatedProfile.social) {
        await updateSocial(updatedProfile.social);
      }

      console.log('[useHabitEvents] Profile updated with extrapolated values');
    } catch (err) {
      console.error('[useHabitEvents] Error updating profile:', err);
      throw err;
    }
  }, [profile, extrapolator, merger, updateLifestyle, updateBiometrics, updateSocial]);

  /**
   * Calculate impact preview without saving
   */
  const calculateImpact = useCallback(async (
    eventType: EventTypeDefinition,
    metadata: EventMetadata
  ): Promise<ImpactPreview> => {
    if (!profile || !profileId) {
      return {
        message: '',
        riskDelta: 0,
        confidence: 'estimated'
      };
    }

    try {
      // Create hypothetical event
      const hypotheticalEvent: HabitEvent = {
        eventId: 'preview',
        profileId,
        timestamp: Date.now(),
        category: eventType.category,
        eventType: eventType.id,
        metadata,
        loggedAt: Date.now(),
        source: 'manual'
      };

      // If no profile mappings, return neutral impact
      if (eventType.profileMappings.length === 0) {
        return {
          message: `Logged: ${eventType.name}`,
          riskDelta: 0,
          confidence: 'estimated'
        };
      }

      // Calculate impact with this event included
      const mapping = eventType.profileMappings[0];
      const relevantEvents = [...recentEvents, hypotheticalEvent].filter(e =>
        mappingAppliesToEvent(mapping, e)
      );

      const withEvent = extrapolator.calculateRollingAggregate(relevantEvents, mapping);
      const current = extrapolator.calculateRollingAggregate(
        recentEvents.filter(e => mappingAppliesToEvent(mapping, e)),
        mapping
      );

      const delta = (withEvent.value || 0) - (current.value || 0);
      const numericValue = extrapolator.extractNumericValue(hypotheticalEvent);

      return {
        message: `You ${eventType.name.toLowerCase()} +${numericValue} this week`,
        riskDelta: estimateRiskDelta(mapping.profilePath, delta),
        newWeeklyTotal: withEvent.value || 0,
        confidence: withEvent.confidence
      };
    } catch (err) {
      console.error('[useHabitEvents] Error calculating impact:', err);
      return {
        message: 'Error calculating impact',
        riskDelta: 0,
        confidence: 'estimated'
      };
    }
  }, [profile, profileId, recentEvents, extrapolator]);

  /**
   * Update an existing event
   */
  const updateEvent = useCallback(async (eventId: string, updates: Partial<HabitEvent>) => {
    try {
      await habitEventRepository.updateEvent(eventId, updates);

      // Update local state
      setRecentEvents(prev =>
        prev.map(e => (e.eventId === eventId ? { ...e, ...updates } : e))
      );

      // Recalculate extrapolations
      await recalculateAndUpdateProfile(recentEvents);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [recentEvents, recalculateAndUpdateProfile]);

  /**
   * Delete an event
   */
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await habitEventRepository.deleteEvent(eventId);

      // Update local state
      const updatedEvents = recentEvents.filter(e => e.eventId !== eventId);
      setRecentEvents(updatedEvents);

      // Recalculate extrapolations
      await recalculateAndUpdateProfile(updatedEvents);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [recentEvents, recalculateAndUpdateProfile]);

  return {
    recentEvents,
    loading,
    error,
    logEvent,
    updateEvent,
    deleteEvent,
    calculateImpact,
    reload: loadRecentEvents
  };
}

/**
 * Get unique profile mappings from all events
 */
function getUniqueMappings(events: HabitEvent[]) {
  const mappings = new Map();

  for (const event of events) {
    const eventDef = EVENT_TYPE_REGISTRY.get(event.eventType);
    if (!eventDef) continue;

    for (const mapping of eventDef.profileMappings) {
      const key = `${mapping.profilePath}-${mapping.aggregationType}-${mapping.rollingWindow}`;
      mappings.set(key, mapping);
    }
  }

  return Array.from(mappings.values());
}

/**
 * Check if a profile mapping applies to an event
 */
function mappingAppliesToEvent(mapping: any, event: HabitEvent): boolean {
  const eventDef = EVENT_TYPE_REGISTRY.get(event.eventType);
  if (!eventDef) return false;

  return eventDef.profileMappings.some(
    m => m.profilePath === mapping.profilePath
  );
}

/**
 * Estimate risk delta based on profile path and value change
 *
 * This is a simplified estimation. Actual risk calculation happens
 * in the RiskEngine after profile update.
 */
function estimateRiskDelta(profilePath: string, delta: number): number {
  // Rough estimates based on known hazard ratios

  if (profilePath.includes('alcohol.drinksPerWeek')) {
    // Alcohol: ~0.05% risk increase per drink/week (rough estimate)
    return delta * 0.05;
  }

  if (profilePath.includes('exercise.moderateMinutesPerWeek')) {
    // Exercise: ~-0.01% risk decrease per 10 min/week
    return -(delta / 10) * 0.01;
  }

  if (profilePath.includes('diet.vegetableServingsPerDay')) {
    // Vegetables: ~-0.1% risk decrease per serving/day
    return -delta * 0.1;
  }

  if (profilePath.includes('diet.processedMeatServingsPerWeek')) {
    // Processed meat: ~0.08% risk increase per serving/week
    return delta * 0.08;
  }

  if (profilePath.includes('sleep.averageHoursPerNight')) {
    // Sleep: U-shaped, but simplified as neutral for now
    return 0;
  }

  // Default: neutral
  return 0;
}
