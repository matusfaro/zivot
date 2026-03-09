/**
 * Quick Log Modal Component
 *
 * Modal for quickly logging habit events with:
 * - Quick-add buttons for common values
 * - Real-time impact preview
 * - Auto-close with success feedback
 */

import React, { useState } from 'react';
import { EventCategory, HabitEvent, EventMetadata } from '../../types/events/habitEvent';
import { EventTypeDefinition, ImpactPreview } from '../../types/events/eventGroups';
import { getEventGroup } from '../../config/eventRegistry';
import './QuickLogModal.css';

interface QuickLogModalProps {
  categoryId: string;
  profileId: string;
  targetDate: Date;
  onEventLogged: (event: Omit<HabitEvent, 'eventId' | 'loggedAt'>) => Promise<void>;
  onClose: () => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  categoryId,
  profileId,
  targetDate,
  onEventLogged,
  onClose
}) => {
  const [impactPreview, setImpactPreview] = useState<ImpactPreview | null>(null);
  const [showingSuccess, setShowingSuccess] = useState(false);
  const [logging, setLogging] = useState(false);

  const group = getEventGroup(categoryId as EventCategory);

  if (!group) {
    return null;
  }

  const handleQuickLog = async (eventType: EventTypeDefinition, metadata: EventMetadata) => {
    try {
      setLogging(true);

      // Set timestamp to the target date (preserve current time but use target date)
      const timestamp = new Date(targetDate);
      timestamp.setHours(new Date().getHours(), new Date().getMinutes());

      // Log the event
      await onEventLogged({
        profileId,
        timestamp: timestamp.getTime(),
        category: categoryId as EventCategory,
        eventType: eventType.id,
        metadata,
        source: 'manual'
      });

      // Show success state
      setShowingSuccess(true);

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[QuickLogModal] Error logging event:', err);
      setImpactPreview({
        message: 'Error logging event',
        riskDelta: 0,
        confidence: 'estimated'
      });
    } finally {
      setLogging(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !logging) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="quick-log-modal">
        <div className="modal-header">
          <h3>
            {group.emoji} {group.name}
          </h3>
          {!showingSuccess && (
            <button className="close-button" onClick={onClose} disabled={logging}>
              ×
            </button>
          )}
        </div>

        {!showingSuccess ? (
          <div className="event-types">
            {group.eventTypes.map(eventType => (
              <div key={eventType.id} className="event-type-section">
                <h4>
                  {eventType.emoji} {eventType.name}
                </h4>
                {eventType.quickLogValues && (
                  <div className="quick-log-buttons">
                    {eventType.quickLogValues.map((preset, idx) => (
                      <button
                        key={idx}
                        className="quick-log-btn"
                        onClick={() => handleQuickLog(eventType, preset.metadata)}
                        disabled={logging}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Success state
          <div className="success-message">
            <div className="success-icon">✓</div>
            <div className="success-text">Event logged!</div>
          </div>
        )}
      </div>
    </div>
  );
};
