/**
 * Compact Event Logger Component
 *
 * Reusable component for logging events to a specific date.
 * Shows all event types in a compact, inline format with quick inputs.
 */

import React, { useState } from 'react';
import { EventMetadata, HabitEvent } from '../../types/events/habitEvent';
import { EVENT_GROUPS } from '../../config/eventRegistry';
import './CompactEventLogger.css';

interface CompactEventLoggerProps {
  profileId: string;
  targetDate: Date;  // Which date to log events for
  onEventLogged: (event: Omit<HabitEvent, 'eventId' | 'loggedAt'>) => Promise<void>;
}

export const CompactEventLogger: React.FC<CompactEventLoggerProps> = ({
  profileId,
  targetDate,
  onEventLogged
}) => {
  const [logging, setLogging] = useState(false);

  const handleQuickLog = async (eventType: string, metadata: EventMetadata) => {
    try {
      setLogging(true);

      // Set timestamp to the target date (preserve current time but use target date)
      const timestamp = new Date(targetDate);
      timestamp.setHours(new Date().getHours(), new Date().getMinutes());

      await onEventLogged({
        profileId,
        timestamp: timestamp.getTime(),
        category: metadata.type === 'alcohol' || metadata.type === 'food' ? 'eating_drinking' :
                  metadata.type === 'exercise' ? 'exercise' :
                  metadata.type === 'sleep' ? 'sleep' :
                  metadata.type === 'social' ? 'social' : 'stress',
        eventType: eventType as any,
        metadata,
        source: 'manual'
      });
    } catch (err) {
      console.error('[CompactEventLogger] Error:', err);
    } finally {
      setLogging(false);
    }
  };

  // Most common event types for compact display
  const commonEvents = [
    { id: 'drink_alcohol', emoji: '🍷', label: 'Drinks', type: 'alcohol' },
    { id: 'exercise_moderate', emoji: '🚶', label: 'Exercise (min)', type: 'exercise' },
    { id: 'eat_vegetables', emoji: '🥗', label: 'Vegetables', type: 'food' },
    { id: 'sleep_night', emoji: '😴', label: 'Sleep (hrs)', type: 'sleep' },
  ];

  return (
    <div className="compact-event-logger">
      <div className="event-quick-grid">
        {commonEvents.map(event => (
          <div key={event.id} className="event-quick-item">
            <span className="event-quick-emoji">{event.emoji}</span>
            <span className="event-quick-label">{event.label}</span>
            <div className="event-quick-buttons">
              {event.type === 'alcohol' && (
                <>
                  <button onClick={() => handleQuickLog(event.id, { type: 'alcohol', drinks: 1 })} disabled={logging}>1</button>
                  <button onClick={() => handleQuickLog(event.id, { type: 'alcohol', drinks: 2 })} disabled={logging}>2</button>
                  <button onClick={() => handleQuickLog(event.id, { type: 'alcohol', drinks: 3 })} disabled={logging}>3</button>
                </>
              )}
              {event.type === 'exercise' && (
                <>
                  <button onClick={() => handleQuickLog(event.id, { type: 'exercise', activityType: 'moderate', minutes: 15 })} disabled={logging}>15</button>
                  <button onClick={() => handleQuickLog(event.id, { type: 'exercise', activityType: 'moderate', minutes: 30 })} disabled={logging}>30</button>
                  <button onClick={() => handleQuickLog(event.id, { type: 'exercise', activityType: 'moderate', minutes: 60 })} disabled={logging}>60</button>
                </>
              )}
              {event.type === 'food' && (
                <>
                  <button onClick={() => handleQuickLog(event.id, { type: 'food', foodType: 'vegetables', servings: 1 })} disabled={logging}>1</button>
                  <button onClick={() => handleQuickLog(event.id, { type: 'food', foodType: 'vegetables', servings: 2 })} disabled={logging}>2</button>
                  <button onClick={() => handleQuickLog(event.id, { type: 'food', foodType: 'vegetables', servings: 3 })} disabled={logging}>3</button>
                </>
              )}
              {event.type === 'sleep' && (
                <>
                  <button onClick={() => handleQuickLog(event.id, { type: 'sleep', hours: 6 })} disabled={logging}>6</button>
                  <button onClick={() => handleQuickLog(event.id, { type: 'sleep', hours: 7 })} disabled={logging}>7</button>
                  <button onClick={() => handleQuickLog(event.id, { type: 'sleep', hours: 8 })} disabled={logging}>8</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Expandable "More" section for all other event types */}
      <details className="event-more-section">
        <summary>More events...</summary>
        <div className="event-more-grid">
          {EVENT_GROUPS.filter(g => g.id !== 'medical').map(group => (
            <div key={group.id} className="event-more-group">
              <div className="event-more-group-title">{group.emoji} {group.name}</div>
              {group.eventTypes.map(eventType => {
                // Skip ones already shown in quick grid
                if (commonEvents.find(e => e.id === eventType.id)) return null;

                return (
                  <div key={eventType.id} className="event-more-item">
                    <span>{eventType.emoji} {eventType.name}</span>
                    <div className="event-quick-buttons">
                      {eventType.quickLogValues?.slice(0, 3).map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickLog(eventType.id, preset.metadata)}
                          disabled={logging}
                        >
                          {preset.label.replace(' min', '').replace(' serving', '').replace(' drink', '').replace(' hours', '').replace('s', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};
