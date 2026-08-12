// @ts-nocheck -- legacy survey component; type-safe rewrite pending
import React, { useState, useEffect, useRef, useTransition } from 'react';
import { UserProfile } from '../../types/user';
import { SwipeQuestion } from './surveyTypes';
import { isQuestionAnswered } from './surveyHelpers';
import { generateQuestions } from './surveyQuestions';

interface SwipeSurveyProps {
  profile: UserProfile | null;
  onProfileChange: (profile: UserProfile) => void;
  riskEngine: any; // RiskEngine instance for calculating impacts
  currentRisk?: number; // Current 10-year mortality risk (already calculated)
}

interface HistoryEntry {
  questionIndex: number;
  previousProfile: UserProfile;
  direction: 'left' | 'right';
}

export const SwipeSurvey: React.FC<SwipeSurveyProps> = ({ profile, onProfileChange, riskEngine, currentRisk }) => {
  const [questions, setQuestions] = useState<SwipeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isAppearing, setIsAppearing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [customValue, setCustomValue] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const questionsInitialized = useRef(false);
  const [dynamicImpacts, setDynamicImpacts] = useState<Map<string, { left: number; right: number }>>(new Map());
  const questionBaselineRef = useRef<{ questionId: string; baseline: number; profile: UserProfile } | null>(null);
  const forceRecalculateRef = useRef(false);
  const undoTargetProfileRef = useRef<UserProfile | null>(null);

  // Log when riskEngine changes
  useEffect(() => {
    console.log('[SURVEY] Risk engine prop updated:', riskEngine ? 'initialized' : 'null');
  }, [riskEngine]);

  // Generate and shuffle questions once on mount
  useEffect(() => {
    if (!profile || questionsInitialized.current) return;

    const allQuestions = generateQuestions();
    // Filter out questions that have already been answered
    const unanswered = allQuestions.filter(q => !isQuestionAnswered(q, profile));
    // Shuffle questions once for randomization
    const shuffled = [...unanswered].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    questionsInitialized.current = true;
  }, [profile]);

  const currentQuestion = questions[currentIndex];

  // Calculate dynamic mortality impact for current question
  // Only recalculates when question changes, NOT when profile/currentRisk change
  // Exception: forceRecalculateRef.current === true (after undo)
  useEffect(() => {
    if (!currentQuestion) {
      console.log('[SURVEY IMPACT] No current question');
      return;
    }
    if (!profile) {
      console.log('[SURVEY IMPACT] No profile');
      return;
    }
    if (!riskEngine) {
      console.log('[SURVEY IMPACT] No risk engine - waiting for initialization');
      return;
    }
    if (currentRisk === undefined) {
      console.log('[SURVEY IMPACT] Waiting for current risk to be calculated');
      return;
    }

    // Check if we've already calculated for this question (unless forced recalculation)
    if (questionBaselineRef.current?.questionId === currentQuestion.id && !forceRecalculateRef.current) {
      console.log('[SURVEY IMPACT] Already calculated for this question, skipping');
      return;
    }

    // Determine which profile to use for calculation
    // After undo, use the target profile from the undo operation instead of the profile prop
    // (profile prop may not have updated yet due to async parent re-render)
    const profileToUse = undoTargetProfileRef.current || profile;
    const isUndoCalculation = !!undoTargetProfileRef.current;

    if (isUndoCalculation) {
      console.log('[SURVEY IMPACT] Force recalculation with UNDO target profile (not current profile prop)');
      // Clear the refs now that we're using the correct profile
      forceRecalculateRef.current = false;
      undoTargetProfileRef.current = null;
    } else if (forceRecalculateRef.current) {
      console.log('[SURVEY IMPACT] Force recalculation triggered');
      forceRecalculateRef.current = false;
    }

    console.log('[SURVEY IMPACT] Starting calculation for:', currentQuestion.id, 'with baseline:', currentRisk.toFixed(1) + '%');

    // Lock in the baseline for this question
    questionBaselineRef.current = {
      questionId: currentQuestion.id,
      baseline: currentRisk,
      profile: JSON.parse(JSON.stringify(profileToUse))
    };

    const profileSnapshot = questionBaselineRef.current.profile;
    const currentRiskSnapshot = questionBaselineRef.current.baseline;

    const calculateImpact = async () => {
      try {
        // Create test profiles to compare
        const leftProfile = currentQuestion.leftOption.profileUpdate(JSON.parse(JSON.stringify(profileSnapshot)));
        const rightProfile = currentQuestion.rightOption.profileUpdate(JSON.parse(JSON.stringify(profileSnapshot)));

        // Compare profiles to see which matches current (if any)
        const leftMatchesCurrent = JSON.stringify(leftProfile) === JSON.stringify(profileSnapshot);
        const rightMatchesCurrent = JSON.stringify(rightProfile) === JSON.stringify(profileSnapshot);

        let leftImpact = 0;
        let rightImpact = 0;

        const baselineRisk = currentRiskSnapshot || 0;

        if (leftMatchesCurrent) {
          // Current profile already has left option selected - only calculate right
          console.log('[SURVEY IMPACT] Current profile matches LEFT option - only calculating right');
          leftImpact = 0;
          const rightResult = await riskEngine.calculate(rightProfile);
          rightImpact = (rightResult.overallMortality.estimatedRisk * 100) - baselineRisk;
        } else if (rightMatchesCurrent) {
          // Current profile already has right option selected - only calculate left
          console.log('[SURVEY IMPACT] Current profile matches RIGHT option - only calculating left');
          rightImpact = 0;
          const leftResult = await riskEngine.calculate(leftProfile);
          leftImpact = (leftResult.overallMortality.estimatedRisk * 100) - baselineRisk;
        } else {
          // Question not answered yet - calculate both
          console.log('[SURVEY IMPACT] Question not answered - calculating both options');
          const leftResult = await riskEngine.calculate(leftProfile);
          const leftRisk = leftResult.overallMortality.estimatedRisk * 100;

          const rightResult = await riskEngine.calculate(rightProfile);
          const rightRisk = rightResult.overallMortality.estimatedRisk * 100;

          leftImpact = leftRisk - baselineRisk;
          rightImpact = rightRisk - baselineRisk;
        }

        console.log('[SURVEY IMPACT] Results:', {
          left: `${leftImpact >= 0 ? '+' : ''}${leftImpact.toFixed(1)}%`,
          right: `${rightImpact >= 0 ? '+' : ''}${rightImpact.toFixed(1)}%`
        });

        // Store the impacts
        setDynamicImpacts(prev => {
          const newMap = new Map(prev);
          newMap.set(currentQuestion.id, {
            left: leftImpact,
            right: rightImpact
          });
          return newMap;
        });
      } catch (error) {
        console.error('[SURVEY IMPACT] Error:', error);
        setDynamicImpacts(prev => {
          const newMap = new Map(prev);
          newMap.set(currentQuestion.id, { left: 0, right: 0 });
          return newMap;
        });
      }
    };

    calculateImpact();
  }, [currentQuestion, currentRisk, riskEngine]); // currentRisk only for initial wait, won't recalc once baseline is locked

  // Get impact values from calculated dynamic impacts
  const getImpactValue = (side: 'left' | 'right'): number => {
    if (!currentQuestion) return 0;
    const dynamic = dynamicImpacts.get(currentQuestion.id);
    return dynamic ? dynamic[side] : 0;
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentQuestion || !profile) return;

    setSwipeDirection(direction);

    // Save current state to history
    setHistory(prev => {
      const newEntry: HistoryEntry = {
        questionIndex: currentIndex,
        previousProfile: JSON.parse(JSON.stringify(profile)), // Deep copy to preserve state
        direction
      };
      return [...prev, newEntry];
    });

    // Apply the profile update
    const option = direction === 'left' ? currentQuestion.leftOption : currentQuestion.rightOption;
    const updatedProfile = option.profileUpdate(profile);
    onProfileChange(updatedProfile);

    // Move to next question after animation
    setTimeout(() => {
      setSwipeDirection(null);
      setDragOffset(0);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    console.log('[SURVEY UNDO] Undoing last answer');

    // Get the last history entry
    const lastEntry = history[history.length - 1];

    // Clear stale impact calculations - they're based on old profile state
    console.log('[SURVEY UNDO] Clearing stale impact calculations');
    questionBaselineRef.current = null;
    setDynamicImpacts(new Map());

    // Store the target profile for impact calculation
    // This is critical because the profile prop won't update immediately
    // (parent component needs to re-render), but we need to calculate impacts
    // with the correct restored profile
    undoTargetProfileRef.current = lastEntry.previousProfile;

    // Set flag to force recalculation of impacts with restored profile
    forceRecalculateRef.current = true;

    // Batch state updates to prevent race conditions
    startTransition(() => {
      // Restore the previous profile
      onProfileChange(lastEntry.previousProfile);

      // Go back to that question
      setCurrentIndex(lastEntry.questionIndex);

      // Remove this entry from history
      setHistory(prev => prev.slice(0, -1));
    });

    console.log('[SURVEY UNDO] Restored to question index:', lastEntry.questionIndex);
  };

  const handleSkip = () => {
    if (!currentQuestion) return;

    console.log('[SURVEY SKIP] Skipping question:', currentQuestion.id);

    // Move to next question without updating profile or saving to history
    setSwipeDirection(null);
    setDragOffset(0);
    setCurrentIndex(prev => prev + 1);
  };

  const handleCustomSubmit = () => {
    if (!currentQuestion || !profile || !currentQuestion.detailedInput) return;

    console.log('[SURVEY CUSTOM] Submitting custom value:', customValue);

    // Save current state to history
    setHistory(prev => {
      const newEntry: HistoryEntry = {
        questionIndex: currentIndex,
        previousProfile: JSON.parse(JSON.stringify(profile)),
        direction: 'right' // Treat custom as "right" (neutral)
      };
      return [...prev, newEntry];
    });

    // Apply the custom value using the detailedInput's profileUpdate
    const updatedProfile = currentQuestion.detailedInput.profileUpdate(profile, customValue);
    onProfileChange(updatedProfile);

    // Move to next question
    setCurrentIndex(prev => prev + 1);
  };

  // Initialize custom value when question changes
  useEffect(() => {
    if (currentQuestion?.detailedInput && profile) {
      const currentValue = currentQuestion.detailedInput.getCurrentValue(profile);
      setCustomValue(currentValue ?? '');
    }
  }, [currentQuestion, profile]);

  // Trigger fade-in animation when currentIndex changes (but not on initial load or undo)
  useEffect(() => {
    // Skip animation on the very first question (initial load)
    if (currentIndex === 0 && history.length === 0) {
      return;
    }

    // Only animate for forward navigation (swipe), not undo
    // Undo is instantaneous to feel more responsive
    if (forceRecalculateRef.current) {
      return;
    }

    setIsAppearing(true);
    const timer = setTimeout(() => {
      setIsAppearing(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [currentIndex, history.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const offset = e.clientX - startXRef.current;
    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    if (Math.abs(dragOffset) > 100) {
      handleSwipe(dragOffset > 0 ? 'right' : 'left');
    } else {
      setDragOffset(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const offset = e.touches[0].clientX - startXRef.current;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (Math.abs(dragOffset) > 100) {
      handleSwipe(dragOffset > 0 ? 'right' : 'left');
    } else {
      setDragOffset(0);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="swipe-survey">
        <div className="survey-complete">
          <h2>🎉 Survey Complete!</h2>
          <p>You've answered all available questions.</p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setHistory([]); // Clear history when restarting
              questionsInitialized.current = false; // Allow re-initialization
            }}
            className="restart-button"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const rotation = dragOffset / 20;
  const opacity = 1 - Math.abs(dragOffset) / 300;

  return (
    <div className="swipe-survey">
      <div className="survey-header">
        <h2>Swipe Survey</h2>
        <p className="survey-progress">
          {currentIndex + 1} / {questions.length}
        </p>
      </div>

      <div className="survey-instructions">
        <div className="instruction left">
          <span className="arrow">←</span>
          <span>Higher Risk</span>
        </div>
        <div className="instruction right">
          <span>Lower Risk</span>
          <span className="arrow">→</span>
        </div>
      </div>

      <div className="card-container">
        {/* Current card */}
        <div
          ref={cardRef}
          className={`card card-active ${swipeDirection ? `swiping-${swipeDirection}` : ''} ${isAppearing ? 'appearing' : ''}`}
          style={swipeDirection ? undefined : {
            transform: `translate3d(${dragOffset}px, 0, 0) rotate(${rotation}deg)`,
            opacity: isAppearing ? undefined : opacity,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="card-category">{currentQuestion.category}</div>
          <div className="card-question">{currentQuestion.question}</div>

          <div className="card-options">
            <div
              className="option option-left"
              onClick={(e) => {
                e.stopPropagation();
                handleSwipe('left');
              }}
            >
              <div className="option-emoji">{currentQuestion.leftOption.emoji}</div>
              <div className="option-label">{currentQuestion.leftOption.label}</div>
              <div className="option-impact bad">
                {getImpactValue('left') >= 0 ? '+' : ''}{getImpactValue('left').toFixed(1)}%
              </div>
            </div>

            <div
              className="option option-right"
              onClick={(e) => {
                e.stopPropagation();
                handleSwipe('right');
              }}
            >
              <div className="option-emoji">{currentQuestion.rightOption.emoji}</div>
              <div className="option-label">{currentQuestion.rightOption.label}</div>
              <div className="option-impact good">
                {getImpactValue('right') >= 0 ? '+' : ''}{getImpactValue('right').toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Detailed input section (optional) - always visible if present */}
          {currentQuestion.detailedInput && (
            <div
              className="detailed-input-section"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseMove={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="detailed-input-content">
                <div className="detailed-input-label">{currentQuestion.detailedInput.label}</div>

                {currentQuestion.detailedInput.inputType.type === 'slider' && (
                  <div className="input-wrapper">
                    <input
                      type="range"
                      min={currentQuestion.detailedInput.inputType.min}
                      max={currentQuestion.detailedInput.inputType.max}
                      step={currentQuestion.detailedInput.inputType.step}
                      value={customValue || currentQuestion.detailedInput.inputType.min}
                      onChange={(e) => setCustomValue(parseFloat(e.target.value))}
                      className="custom-slider"
                    />
                    <div className="value-display">
                      {customValue !== null && customValue !== undefined
                        ? `${customValue} ${currentQuestion.detailedInput.inputType.unit}`
                        : '-'}
                    </div>
                  </div>
                )}

                {currentQuestion.detailedInput.inputType.type === 'number' && (
                  <div className="input-wrapper">
                    <input
                      type="number"
                      min={currentQuestion.detailedInput.inputType.min}
                      max={currentQuestion.detailedInput.inputType.max}
                      step={currentQuestion.detailedInput.inputType.step}
                      value={customValue || ''}
                      onChange={(e) => setCustomValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="custom-number"
                      placeholder="Enter value"
                    />
                    <span className="unit-label">{currentQuestion.detailedInput.inputType.unit}</span>
                  </div>
                )}

                {currentQuestion.detailedInput.inputType.type === 'select' && (
                  <div className="input-wrapper">
                    <select
                      value={customValue || ''}
                      onChange={(e) => setCustomValue(e.target.value)}
                      className="custom-select"
                    >
                      <option value="">Select...</option>
                      {currentQuestion.detailedInput.inputType.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  className="submit-custom-button"
                  onClick={handleCustomSubmit}
                  disabled={customValue === null || customValue === '' || customValue === undefined}
                >
                  Submit Custom Value →
                </button>
              </div>
            </div>
          )}

          {/* Swipe indicators */}
          {dragOffset < -50 && (
            <div className="swipe-indicator swipe-left">
              <span className="indicator-emoji">💀</span>
              <span className="indicator-text">HIGHER RISK</span>
            </div>
          )}
          {dragOffset > 50 && (
            <div className="swipe-indicator swipe-right">
              <span className="indicator-emoji">💚</span>
              <span className="indicator-text">LOWER RISK</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation controls - Undo and Skip */}
      <div className="nav-controls">
        <button
          className="nav-button undo-button"
          onClick={handleUndo}
          disabled={history.length === 0 || isPending}
          title={isPending ? "Processing..." : "Undo last answer"}
        >
          <span className="button-emoji">{isPending ? '⏳' : '↩️'}</span>
          <span className="button-label">{isPending ? "Wait..." : "Undo"}</span>
        </button>

        <button
          className="nav-button skip-button"
          onClick={handleSkip}
          title="Skip this question"
        >
          <span className="button-emoji">⏭️</span>
          <span className="button-label">Skip</span>
        </button>
      </div>

      <style>{`
        .swipe-survey {
          width: 100%;
          margin: 0;
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          position: relative;
          font-family: 'Courier New', monospace;
        }

        .survey-header {
          text-align: center;
          margin-bottom: var(--spacing-sm);
          padding-bottom: var(--spacing-xs);
          border-bottom: 2px solid var(--color-border);
        }

        .survey-header h2 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 0.85rem;
          color: var(--color-text);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'Courier New', monospace;
        }

        .survey-progress {
          font-size: 0.7rem;
          color: var(--color-text-secondary);
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }

        .survey-instructions {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--spacing-sm);
          padding: 0 var(--spacing-sm);
        }

        .instruction {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Courier New', monospace;
        }

        .instruction.left {
          color: var(--color-danger);
        }

        .instruction.right {
          color: var(--color-success);
        }

        .arrow {
          font-size: 0.9rem;
        }

        .card-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-sm);
          min-height: 280px;
        }

        .card {
          position: absolute;
          width: 100%;
          max-width: 420px;
          background: white;
          border: 2px solid var(--color-border);
          box-shadow: inset 0 0 0 1px rgba(163, 155, 139, 0.2);
          padding: var(--spacing-md);
          user-select: none;
          z-index: 2;
          will-change: transform, opacity;
          transform: translate3d(0, 0, 0) rotate(0deg);
          opacity: 1;
        }

        .card.appearing {
          animation: fadeIn 0.45s ease-out forwards;
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
        }

        .card.swiping-left {
          transform: translate3d(-600px, 0, 0) rotate(-30deg) !important;
          opacity: 0 !important;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease !important;
        }

        .card.swiping-right {
          transform: translate3d(600px, 0, 0) rotate(30deg) !important;
          opacity: 0 !important;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease !important;
        }

        .card-category {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-text-secondary);
          letter-spacing: 0.5px;
          margin-bottom: var(--spacing-xs);
          font-family: 'Courier New', monospace;
        }

        .card-question {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--spacing-md);
          line-height: 1.3;
          font-family: 'Courier New', monospace;
        }

        .card-options {
          display: flex;
          gap: var(--spacing-sm);
        }

        .option {
          flex: 1;
          text-align: center;
          padding: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .option:hover {
          transform: scale(1.02);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .option:active {
          transform: scale(0.98);
        }

        .option-left {
          border-left: 4px solid var(--color-danger);
          background: var(--color-bg);
        }

        .option-left:hover {
          background: #fff5f5;
        }

        .option-right {
          border-left: 4px solid var(--color-success);
          background: var(--color-bg);
        }

        .option-right:hover {
          background: #f5fff5;
        }

        .option-emoji {
          font-size: 2rem;
          margin-bottom: var(--spacing-xs);
        }

        .option-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--spacing-xs);
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .option-impact {
          font-size: 0.85rem;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }

        .option-impact.bad {
          color: var(--color-danger);
        }

        .option-impact.good {
          color: var(--color-success);
        }

        .swipe-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.8rem;
          font-weight: 700;
          padding: var(--spacing-sm);
          border: 3px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .swipe-left {
          left: var(--spacing-sm);
          background: var(--color-danger);
          color: white;
          border-color: var(--color-primary-dark);
        }

        .swipe-right {
          right: var(--spacing-sm);
          background: var(--color-success);
          color: white;
          border-color: var(--color-primary-dark);
        }

        .indicator-emoji {
          font-size: 1.5rem;
        }

        .indicator-text {
          font-size: 0.65rem;
          letter-spacing: 1px;
        }

        .nav-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-md);
        }

        .nav-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          border: 2px solid var(--color-border);
          background: var(--color-bg);
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
          font-family: 'Courier New', monospace;
        }

        .nav-button:hover:not(:disabled) {
          transform: translateY(-2px);
          background: var(--color-bg-secondary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .nav-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .nav-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .nav-button .button-emoji {
          font-size: 1.2rem;
        }

        .nav-button .button-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text);
        }

        .skip-button {
          border-color: var(--color-text-secondary);
        }

        .skip-button:hover:not(:disabled) {
          border-color: var(--color-primary);
        }

        .undo-button {
          border-color: var(--color-warning);
        }

        .undo-button:hover:not(:disabled) {
          border-color: var(--color-warning);
          background: var(--color-warning);
        }

        .undo-button:hover:not(:disabled) .button-label {
          color: white;
        }

        .detailed-input-section {
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 2px solid var(--color-border);
        }


        .detailed-input-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .detailed-input-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--color-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Courier New', monospace;
        }

        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          align-items: stretch;
        }

        .custom-slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: var(--color-border);
          outline: none;
          border: 1px solid var(--color-primary-dark);
        }

        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: var(--color-primary);
          cursor: pointer;
          border: 2px solid var(--color-primary-dark);
        }

        .custom-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: var(--color-primary);
          cursor: pointer;
          border: 2px solid var(--color-primary-dark);
        }

        .custom-number {
          padding: var(--spacing-xs);
          font-size: 0.75rem;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          border: 2px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          text-align: center;
        }

        .custom-number:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .custom-select {
          padding: var(--spacing-xs);
          font-size: 0.75rem;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          border: 2px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
        }

        .custom-select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .value-display {
          text-align: center;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-primary);
          font-family: 'Courier New', monospace;
        }

        .unit-label {
          font-size: 0.7rem;
          color: var(--color-text-secondary);
          font-family: 'Courier New', monospace;
          text-align: center;
        }

        .submit-custom-button {
          width: 100%;
          padding: var(--spacing-sm);
          font-size: 0.75rem;
          font-weight: 700;
          background: var(--color-primary);
          color: white;
          border: 2px solid var(--color-primary-dark);
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Courier New', monospace;
          margin-top: var(--spacing-xs);
        }

        .submit-custom-button:hover:not(:disabled) {
          background: var(--color-primary-dark);
          transform: translateY(-1px);
        }

        .submit-custom-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-custom-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: var(--color-bg-secondary);
          border-color: var(--color-border);
          color: var(--color-text-secondary);
        }

        .survey-complete {
          text-align: center;
          padding: var(--spacing-xl) var(--spacing-md);
        }

        .survey-complete h2 {
          font-size: 1.2rem;
          margin-bottom: var(--spacing-sm);
          font-family: 'Courier New', monospace;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .survey-complete p {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
          font-family: 'Courier New', monospace;
        }

        .restart-button {
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 0.7rem;
          font-weight: 700;
          background: var(--color-primary);
          color: white;
          border: 2px solid var(--color-primary-dark);
          cursor: pointer;
          transition: background 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Courier New', monospace;
        }

        .restart-button:hover {
          background: var(--color-primary-dark);
        }

        @media (max-width: 640px) {
          .card-question {
            font-size: 0.85rem;
          }

          .card-options {
            flex-direction: column;
          }

          .swipe-buttons {
            gap: var(--spacing-xs);
          }

          .swipe-button {
            width: 40px;
            height: 40px;
          }

          .button-emoji {
            font-size: 1.2rem;
          }

          .undo-button {
            width: 28px;
            height: 28px;
            right: var(--spacing-sm);
          }

          .undo-button .button-emoji {
            font-size: 0.85rem;
          }

          .card-container {
            min-height: 320px;
          }
        }
      `}</style>
    </div>
  );
};
