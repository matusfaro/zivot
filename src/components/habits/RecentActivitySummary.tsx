/**
 * Recent Activity Summary Component
 *
 * Displays weekly statistics for tracked habits
 */

import React, { useMemo } from 'react';
import { HabitEvent } from '../../types/events/habitEvent';
import { EVENT_TYPE_REGISTRY } from '../../config/eventRegistry';
import { EventExtrapolator } from '../../services/events/EventExtrapolator';
import './RecentActivitySummary.css';

interface RecentActivitySummaryProps {
  events: HabitEvent[];
}

interface StatCardData {
  label: string;
  value: number | string;
  unit: string;
  emoji: string;
  color: string;
  isGood?: boolean;  // For color coding
}

export const RecentActivitySummary: React.FC<RecentActivitySummaryProps> = ({ events }) => {
  const extrapolator = useMemo(() => new EventExtrapolator(), []);

  const weeklyStats = useMemo(() => {
    const stats = new Map<string, number>();
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentEvents = events.filter(e => e.timestamp >= weekAgo);

    for (const event of recentEvents) {
      const eventDef = EVENT_TYPE_REGISTRY.get(event.eventType);
      if (!eventDef) continue;

      for (const mapping of eventDef.profileMappings) {
        const relevantEvents = recentEvents.filter(e => {
          const eDef = EVENT_TYPE_REGISTRY.get(e.eventType);
          return eDef?.profileMappings.some(m => m.profilePath === mapping.profilePath);
        });

        const result = extrapolator.calculateRollingAggregate(relevantEvents, mapping);
        if (result.value !== null) {
          stats.set(mapping.profilePath, result.value);
        }
      }
    }

    return stats;
  }, [events, extrapolator]);

  const statCards: StatCardData[] = [
    {
      label: 'Alcohol',
      value: weeklyStats.get('lifestyle.alcohol.drinksPerWeek')?.toFixed(0) || '0',
      unit: 'drinks/week',
      emoji: '🍷',
      color: '#FF6B35',
      isGood: (weeklyStats.get('lifestyle.alcohol.drinksPerWeek') || 0) <= 7
    },
    {
      label: 'Exercise',
      value: (
        (weeklyStats.get('lifestyle.exercise.moderateMinutesPerWeek') || 0) +
        (weeklyStats.get('lifestyle.exercise.vigorousMinutesPerWeek') || 0)
      ).toFixed(0),
      unit: 'min/week',
      emoji: '🏃',
      color: '#4ECDC4',
      isGood: (
        (weeklyStats.get('lifestyle.exercise.moderateMinutesPerWeek') || 0) +
        (weeklyStats.get('lifestyle.exercise.vigorousMinutesPerWeek') || 0)
      ) >= 150
    },
    {
      label: 'Vegetables',
      value: weeklyStats.get('lifestyle.diet.vegetableServingsPerDay')?.toFixed(1) || '0',
      unit: 'servings/day',
      emoji: '🥗',
      color: '#27AE60',
      isGood: (weeklyStats.get('lifestyle.diet.vegetableServingsPerDay') || 0) >= 3
    },
    {
      label: 'Sleep',
      value: weeklyStats.get('lifestyle.sleep.averageHoursPerNight')?.toFixed(1) || '-',
      unit: 'hrs/night',
      emoji: '😴',
      color: '#9D84B7',
      isGood: (() => {
        const hours = weeklyStats.get('lifestyle.sleep.averageHoursPerNight') || 0;
        return hours >= 7 && hours <= 9;
      })()
    }
  ];

  if (events.length === 0) {
    return (
      <div className="recent-activity-summary">
        <h3>This Week</h3>
        <p className="no-data">No events logged yet. Start tracking to see your weekly stats!</p>
      </div>
    );
  }

  return (
    <div className="recent-activity-summary">
      <h3>This Week</h3>
      <div className="stat-cards">
        {statCards.map(stat => (
          <div
            key={stat.label}
            className={`stat-card ${stat.isGood ? 'good' : 'needs-work'}`}
            style={{ borderColor: stat.color }}
          >
            <div className="stat-emoji">{stat.emoji}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">
              {stat.value} <span className="stat-unit">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
