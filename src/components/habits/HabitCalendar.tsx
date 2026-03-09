/**
 * Habit Calendar Component
 *
 * Always-visible 7-day calendar with event summaries in day cells.
 * Click day → opens detail panel for adding/removing events.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { HabitEvent } from '../../types/events/habitEvent';
import { habitEventRepository } from '../../database/repositories/HabitEventRepository';
import './HabitCalendar.css';

interface HabitCalendarProps {
  profileId: string;
  onEventLogged: (event: Omit<HabitEvent, 'eventId' | 'loggedAt'>) => Promise<HabitEvent>;
  onEventDeleted: (eventId: string) => Promise<void>;
}

interface HabitCalendarPropsExtended extends HabitCalendarProps {
  selectedDate: Date;
  onDateSelected: (date: Date) => void;
  refreshTrigger?: number;
}

export const HabitCalendar: React.FC<HabitCalendarPropsExtended> = ({
  profileId,
  selectedDate,
  onDateSelected,
  onEventLogged,
  onEventDeleted,
  refreshTrigger
}) => {
  const [eventsByDay, setEventsByDay] = useState<Map<string, HabitEvent[]>>(new Map());
  const [loading, setLoading] = useState(true);

  // Generate last 7 days
  const days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      result.push(date);
    }
    return result;
  }, []);

  useEffect(() => {
    loadEvents();
  }, [profileId]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadEvents();
    }
  }, [refreshTrigger]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const events = await habitEventRepository.getEventsByDay(
        profileId,
        startDate,
        endDate
      );

      setEventsByDay(events);
    } catch (err) {
      console.error('[HabitCalendar] Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventLogged = async (event: Omit<HabitEvent, 'eventId' | 'loggedAt'>) => {
    await onEventLogged(event);
    await loadEvents(); // Reload to show updated events
  };

  const handleEventDeleted = async (eventId: string) => {
    await onEventDeleted(eventId);
    await loadEvents(); // Reload to show updated events
  };

  const formatDayKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatDayHeader = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  const isSelected = (date: Date): boolean => {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === selected.getTime();
  };

  const getSummary = (events: HabitEvent[]): string => {
    if (events.length === 0) return '';

    // Aggregate by type
    const summary: { [key: string]: number } = {};

    for (const event of events) {
      if (event.metadata.type === 'alcohol') {
        summary['🍷'] = (summary['🍷'] || 0) + event.metadata.drinks;
      } else if (event.metadata.type === 'exercise') {
        summary['🏃'] = (summary['🏃'] || 0) + event.metadata.minutes;
      } else if (event.metadata.type === 'food' && event.metadata.foodType === 'vegetables') {
        summary['🥗'] = (summary['🥗'] || 0) + event.metadata.servings;
      } else if (event.metadata.type === 'sleep') {
        summary['😴'] = event.metadata.hours; // Use latest for sleep
      }
    }

    return Object.entries(summary)
      .map(([emoji, value]) => {
        if (emoji === '🏃') {
          return `${emoji}${value}m`;
        } else if (emoji === '😴') {
          return `${emoji}${value}h`;
        } else {
          return `${emoji}${value}`;
        }
      })
      .join(' ');
  };

  if (loading) {
    return (
      <div className="habit-calendar">
        <h3>Last 7 Days</h3>
        <div className="calendar-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="habit-calendar-compact">
      <h3>Last 7 Days</h3>
      <div className="calendar-grid-compact">
        {days.map(date => {
          const dayKey = formatDayKey(date);
          const events = eventsByDay.get(dayKey) || [];
          const summary = getSummary(events);

          return (
            <div
              key={dayKey}
              className={`day-cell-compact ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''}`}
              onClick={() => onDateSelected(date)}
            >
              <div className="day-header-compact">{formatDayHeader(date)}</div>
              <div className="day-summary">
                {summary || '-'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
