/**
 * Day Detail Panel Component
 *
 * Shows when clicking on a calendar day. Displays:
 * - Event logger for that specific day
 * - List of existing events with delete buttons
 */

import React from 'react';
import { HabitEvent } from '../../types/events/habitEvent';
import { CompactEventLogger } from './CompactEventLogger';
import { getEventTypeDefinition } from '../../config/eventRegistry';
import './DayDetailPanel.css';

interface DayDetailPanelProps {
  date: Date;
  profileId: string;
  events: HabitEvent[];
  onEventLogged: (event: Omit<HabitEvent, 'eventId' | 'loggedAt'>) => Promise<void>;
  onEventDeleted: (eventId: string) => Promise<void>;
  onClose: () => void;
}

export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  date,
  profileId,
  events,
  onEventLogged,
  onEventDeleted,
  onClose
}) => {
  const formatDate = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="day-detail-backdrop" onClick={onClose}>
      <div className="day-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="day-detail-header">
          <h3>
            {formatDate(date)}
            {isToday(date) && <span className="today-badge">Today</span>}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="day-detail-content">
          {/* Event Logger */}
          <div className="day-detail-section">
            <h4>Add Events</h4>
            <CompactEventLogger
              profileId={profileId}
              targetDate={date}
              onEventLogged={onEventLogged}
            />
          </div>

          {/* Existing Events */}
          {events.length > 0 && (
            <div className="day-detail-section">
              <h4>Logged Events ({events.length})</h4>
              <div className="existing-events-list">
                {events.map(event => {
                  const eventDef = getEventTypeDefinition(event.eventType);
                  if (!eventDef) return null;

                  // Extract display value
                  let displayValue = '';
                  if (event.metadata.type === 'alcohol') {
                    displayValue = `${event.metadata.drinks} drink${event.metadata.drinks > 1 ? 's' : ''}`;
                  } else if (event.metadata.type === 'food') {
                    displayValue = `${event.metadata.servings} serving${event.metadata.servings > 1 ? 's' : ''}`;
                  } else if (event.metadata.type === 'exercise') {
                    displayValue = `${event.metadata.minutes} min`;
                  } else if (event.metadata.type === 'sleep') {
                    displayValue = `${event.metadata.hours} hrs`;
                  } else if (event.metadata.type === 'social') {
                    displayValue = `${event.metadata.minutes} min`;
                  }

                  return (
                    <div key={event.eventId} className="existing-event-item">
                      <span className="event-icon">{eventDef.emoji}</span>
                      <span className="event-name">{eventDef.name}</span>
                      <span className="event-value">{displayValue}</span>
                      <button
                        className="delete-btn"
                        onClick={() => onEventDeleted(event.eventId)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="no-events-message">
              No events logged for this day yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
