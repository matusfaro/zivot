/**
 * Habits Dashboard Component
 *
 * Compact design:
 * - 7-day calendar with selected day (default: today)
 * - Individual event buttons for quick logging
 * - Incremental events: Click to add (e.g., +15min exercise)
 * - Replacement events: +/- buttons (e.g., sleep hours)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useHabitEvents } from '../../hooks/useHabitEvents';
import { HabitCalendar } from './HabitCalendar';
import { habitEventRepository } from '../../database/repositories/HabitEventRepository';
import { EventMetadata } from '../../types/events/habitEvent';
import { EVENT_GROUPS } from '../../config/eventRegistry';
import './HabitsDashboard.css';

export const HabitsDashboard: React.FC = () => {
  const { profile } = useUserProfile();
  const { logEvent } = useHabitEvents(profile?.profileId);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todayStats, setTodayStats] = useState<Map<string, number>>(new Map());
  const [isLogging, setIsLogging] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadTodayStats = useCallback(async () => {
    if (!profile?.profileId) return;

    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const events = await habitEventRepository.getEventsInRange(
        profile.profileId,
        startOfDay.getTime(),
        endOfDay.getTime()
      );

      const stats = new Map<string, number>();
      const sleepEvents = new Map<string, { timestamp: number, hours: number }>();

      events.forEach(event => {
        const key = event.eventType;

        if (event.metadata.type === 'alcohol') {
          stats.set(key, (stats.get(key) || 0) + event.metadata.drinks);
        } else if (event.metadata.type === 'exercise') {
          stats.set(key, (stats.get(key) || 0) + event.metadata.minutes);
        } else if (event.metadata.type === 'food') {
          stats.set(key, (stats.get(key) || 0) + event.metadata.servings);
        } else if (event.metadata.type === 'sleep') {
          // For sleep, keep only the latest event by timestamp
          const existing = sleepEvents.get(key);
          if (!existing || event.timestamp > existing.timestamp) {
            sleepEvents.set(key, { timestamp: event.timestamp, hours: event.metadata.hours });
          }
        } else if (event.metadata.type === 'social') {
          stats.set(key, (stats.get(key) || 0) + event.metadata.minutes);
        }
      });

      // Add latest sleep values to stats
      sleepEvents.forEach((value, key) => {
        console.log('[loadTodayStats] Sleep event:', key, '=', value.hours, 'h at', new Date(value.timestamp).toLocaleTimeString());
        stats.set(key, value.hours);
      });

      console.log('[loadTodayStats] Final stats:', Object.fromEntries(stats));
      setTodayStats(stats);
    } catch (err) {
      console.error('[HabitsDashboard] Error loading today stats:', err);
    }
  }, [profile?.profileId, selectedDate]);

  // Load today's stats whenever selected date or profile changes
  useEffect(() => {
    loadTodayStats();
  }, [loadTodayStats]);

  const handleQuickLog = async (eventTypeId: string, metadata: EventMetadata, categoryId: string) => {
    if (!profile?.profileId || isLogging) return;

    try {
      setIsLogging(true);
      const event = await logEvent({
        profileId: profile.profileId,
        timestamp: new Date(selectedDate).setHours(new Date().getHours(), new Date().getMinutes()),
        category: categoryId as any,
        eventType: eventTypeId as any,
        metadata,
        source: 'manual'
      });
      console.log('[handleQuickLog] Event logged:', event);
      await loadTodayStats();
      setRefreshKey(k => k + 1); // Trigger calendar refresh
    } catch (err) {
      console.error('[HabitsDashboard] Error logging event:', err);
    } finally {
      setIsLogging(false);
    }
  };

  const getEventLabel = (eventType: any): string => {
    const first = eventType.quickLogValues?.[0];
    if (!first) return 'Log';
    return first.label.replace(/^\d+\s*/, '+').replace(' hours', 'h').replace(' min', 'm').replace('ings?', '').replace(' serving', '');
  };

  const getStatValue = (eventTypeId: string): number => {
    return todayStats.get(eventTypeId) || 0;
  };

  const getStatDisplay = (eventTypeId: string, value: number): string => {
    if (value === 0) return '';
    if (eventTypeId.includes('exercise') || eventTypeId.includes('outdoor') || eventTypeId.includes('social')) {
      return `${value}m`;
    } else if (eventTypeId.includes('sleep')) {
      return `${value}h`;
    }
    return `${value}`;
  };

  const isSleepType = (eventTypeId: string): boolean => {
    return eventTypeId.includes('sleep');
  };

  const formatSelectedDate = (): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) {
      return 'Today';
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[selected.getDay()]} ${selected.getDate()}`;
  };

  if (!profile) {
    return (
      <section className="habits-dashboard">
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section className="habits-dashboard">
      <div className="habits-header">
        <h2>📊 {formatSelectedDate()}</h2>
      </div>

      {/* Calendar */}
      <HabitCalendar
        profileId={profile.profileId}
        selectedDate={selectedDate}
        onDateSelected={setSelectedDate}
        onEventLogged={logEvent}
        onEventDeleted={async () => {}}
        refreshTrigger={refreshKey}
      />

      {/* Quick Event Buttons */}
      <div className="event-buttons">
        {EVENT_GROUPS.filter(group => group.id !== 'medical').map(group =>
          group.eventTypes.map(eventType => {
            if (!eventType.quickLogValues || eventType.quickLogValues.length === 0) return null;

            const firstPreset = eventType.quickLogValues[0];
            const statValue = getStatValue(eventType.id);
            const statDisplay = getStatDisplay(eventType.id, statValue);

            // Sleep uses split button
            if (isSleepType(eventType.id)) {
              return (
                <div key={eventType.id} className="event-btn split-btn">
                  <div className="split-btn-info">
                    <span className="event-icon">{eventType.emoji}</span>
                    <span className="event-label">{eventType.name}</span>
                    <span className="event-value">{statValue}h</span>
                  </div>
                  <div className="split-btn-actions">
                    <button
                      className="split-btn-minus"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickLog(eventType.id, { type: 'sleep', hours: Math.max(0, statValue - 1) }, group.id);
                      }}
                      disabled={statValue === 0 || isLogging}
                    >
                      −
                    </button>
                    <button
                      className="split-btn-plus"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newHours = statValue === 0 ? 7 : statValue + 1;
                        handleQuickLog(eventType.id, { type: 'sleep', hours: newHours }, group.id);
                      }}
                      disabled={isLogging}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            }

            // Regular incremental button
            return (
              <button
                key={eventType.id}
                className="event-btn incremental"
                onClick={() => handleQuickLog(eventType.id, firstPreset.metadata, group.id)}
              >
                <span className="event-icon">{eventType.emoji}</span>
                <span className="event-label">{eventType.name}</span>
                <span className="event-action">{getEventLabel(eventType)}</span>
                {statValue > 0 && <span className="event-count">{statDisplay}</span>}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};

