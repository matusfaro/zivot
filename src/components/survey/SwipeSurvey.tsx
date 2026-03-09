// @ts-nocheck
import React, { useState, useEffect, useRef, useTransition } from 'react';
import { UserProfile, Screening } from '../../types/user';
import { createUserDataPoint, addToTimeSeries, TimeSeries, DataPoint } from '../../types/common/datapoint';
import { DietPattern } from '../../types/user/lifestyle';

// Helper functions to manage conditions as an array
function hasConditionInProfile(profile: UserProfile, conditionId: string): boolean {
  const conditions = profile.medicalHistory?.conditions;
  if (!conditions) return false;

  // Support both old object format and new array format
  if (Array.isArray(conditions)) {
    return conditions.some((c: any) => c.conditionId === conditionId);
  } else {
    // Old object format: {diabetes: true/false}
    return (conditions as any)[conditionId] === true;
  }
}

function setCondition(profile: UserProfile, conditionId: string, hasCondition: boolean): UserProfile {
  let conditions = profile.medicalHistory?.conditions || [];

  // Migrate old object format to array
  if (!Array.isArray(conditions)) {
    conditions = [];
  }

  if (hasCondition) {
    // Add condition if not already present
    const existing = conditions.find((c: any) => c.conditionId === conditionId);
    if (!existing) {
      conditions = [
        ...conditions,
        {
          conditionId,
          name: conditionId,
          status: 'active' as const,
          diagnosisDate: createUserDataPoint(Date.now())
        }
      ];
    }
  } else {
    // Remove condition
    conditions = conditions.filter((c: any) => c.conditionId !== conditionId);
  }

  return {
    ...profile,
    medicalHistory: {
      ...profile.medicalHistory,
      conditions
    }
  };
}

// Helper function to manage screenings as an array
function updateScreeningArray(
  screenings: Screening[] | undefined,
  screeningType: string,
  outcome: 'negative' | 'positive' | 'inconclusive' | 'abnormal',
  completed: boolean
): Screening[] {
  const existing = Array.isArray(screenings) ? screenings : [];
  if (completed) {
    const alreadyExists = existing.some(s => s.screeningType === screeningType);
    if (alreadyExists) return existing;
    return [
      ...existing,
      {
        screeningType,
        date: Date.now(),
        result: { outcome }
      }
    ];
  } else {
    return existing.filter(s => s.screeningType !== screeningType);
  }
}

// Helper function to create TimeSeries from a single value
function createTimeSeries<T>(value: T): TimeSeries<T> {
  const dataPoint = createUserDataPoint(value);
  return {
    dataPoints: [dataPoint],
    mostRecent: dataPoint
  };
}

// Helper functions to manage family history as an array
function hasFamilyHistoryInProfile(profile: UserProfile, conditionId: string): boolean {
  const familyHistory = profile.medicalHistory?.familyHistory;
  if (!familyHistory || !Array.isArray(familyHistory)) return false;
  return familyHistory.some((c: any) => c.conditionId === conditionId);
}

function setFamilyHistory(profile: UserProfile, conditionId: string, hasCondition: boolean): UserProfile {
  let familyHistory = profile.medicalHistory?.familyHistory || [];

  if (!Array.isArray(familyHistory)) {
    familyHistory = [];
  }

  if (hasCondition) {
    const existing = familyHistory.find((c: any) => c.conditionId === conditionId);
    if (!existing) {
      familyHistory = [
        ...familyHistory,
        {
          conditionId,
          relation: 'parent' as const,
          affected: true
        }
      ];
    }
  } else {
    familyHistory = familyHistory.filter((c: any) => c.conditionId !== conditionId);
  }

  return {
    ...profile,
    medicalHistory: {
      ...profile.medicalHistory,
      familyHistory
    }
  };
}

type DetailedInputType =
  | { type: 'slider'; min: number; max: number; step: number; unit: string }
  | { type: 'number'; min?: number; max?: number; step?: number; unit: string }
  | { type: 'select'; options: Array<{ value: string; label: string }> };

interface SwipeQuestion {
  id: string;
  question: string;
  category: string;
  leftOption: {
    label: string;
    emoji: string;
    profileUpdate: (profile: UserProfile) => UserProfile;
  };
  rightOption: {
    label: string;
    emoji: string;
    profileUpdate: (profile: UserProfile) => UserProfile;
  };
  detailedInput?: {
    inputType: DetailedInputType;
    label: string;
    getCurrentValue: (profile: UserProfile) => any;
    profileUpdate: (profile: UserProfile, value: any) => UserProfile;
    formatDisplay?: (value: any) => string;
  };
}

interface SwipeSurveyProps {
  profile: UserProfile | null;
  onProfileChange: (profile: UserProfile) => void;
  riskEngine: any; // RiskEngine instance for calculating impacts
  currentRisk?: number; // Current 10-year mortality risk (already calculated)
}

// Check if a question has already been answered in the profile
function isQuestionAnswered(question: SwipeQuestion, profile: UserProfile): boolean {
  switch (question.id) {
    case 'smoking':
      return !!profile.lifestyle?.smoking?.status;
    case 'exercise':
      return profile.lifestyle?.exercise?.moderateMinutesPerWeek !== undefined;
    case 'alcohol':
      return profile.lifestyle?.alcohol?.drinksPerWeek !== undefined;
    case 'diet':
      return profile.lifestyle?.diet?.vegetableServingsPerDay !== undefined;
    case 'sleep':
      return profile.lifestyle?.sleep?.averageHoursPerNight !== undefined;
    case 'biologicalSex':
      return !!profile.demographics?.biologicalSex?.value;
    case 'diabetes':
      return hasConditionInProfile(profile, 'diabetes');
    case 'hypertension':
      return hasConditionInProfile(profile, 'hypertension');
    case 'familyHeartDisease':
      return hasFamilyHistoryInProfile(profile, 'cvd');
    case 'familyCancer':
      return hasFamilyHistoryInProfile(profile, 'cancer');
    case 'statin':
      return profile.medicalHistory?.medications?.statin !== undefined;
    case 'bloodPressureMeds':
      return profile.medicalHistory?.medications?.takesBloodPressureMeds !== undefined;
    // REMOVED: Aspirin - no mortality benefit
    // case 'aspirin':
    //   return profile.medicalHistory?.medications?.aspirin !== undefined;
    case 'highCholesterol':
      return profile.labTests?.lipidPanel?.totalCholesterol !== undefined;
    case 'prediabetic':
      return profile.labTests?.metabolicPanel?.fastingGlucose !== undefined || profile.labTests?.metabolicPanel?.hba1c !== undefined;
    case 'obesity':
      return profile.biometrics?.weight !== undefined && profile.biometrics?.height !== undefined;
    case 'stress':
      return false; // Field not in type system
    case 'socialConnection':
      return profile.social?.volunteering !== undefined || profile.social?.petOwnership !== undefined;
    case 'sunExposure':
      return profile.medicalHistory?.sunExposure !== undefined;
    case 'occupationalHazards':
      return profile.lifestyle?.occupationalExposures !== undefined;
    case 'depression':
      return hasConditionInProfile(profile, "depression");
    case 'cancer':
      return hasConditionInProfile(profile, "cancer");
    case 'heartDisease':
      return hasConditionInProfile(profile, "heartDisease");
    case 'stroke':
      return hasConditionInProfile(profile, "stroke");
    case 'kidneyDisease':
      return hasConditionInProfile(profile, "kidneyDisease");
    case 'liverDisease':
      return hasConditionInProfile(profile, "liverDisease");
    case 'copd':
      return hasConditionInProfile(profile, "copd");
    case 'asthma':
      return hasConditionInProfile(profile, "asthma");
    case 'fluVaccine':
      return profile.medicalHistory?.vaccinations?.fluVaccineCurrentYear !== undefined;
    case 'colonoscopy':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'colonoscopy') || false;
    case 'mammogram':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'mammogram') || false;
    case 'seatbelt':
      return profile.lifestyle?.drivingHabits?.seatBeltUse !== undefined;
    case 'texting':
      return profile.lifestyle?.drivingHabits?.phoneUseWhileDriving !== undefined;
    case 'speeding':
      return profile.lifestyle?.drivingHabits?.trafficViolationsPast3Years !== undefined;
    case 'helmet':
      return false; // Field not in type system
    case 'drugs':
      return false; // Field not in type system
    case 'opioids':
      return profile.medicalHistory?.substanceUse?.prescribedOpioids !== undefined;
    case 'marijuana':
      return false; // Field not in type system
    case 'airQuality':
      return false; // Field not in type system
    // REMOVED: Water Quality - too heterogeneous
    // case 'waterQuality':
    //   return profile.lifestyle?.waterQuality !== undefined;
    case 'pesticides':
      return false; // Field not in type system
    case 'radiation':
      return false; // Field not in type system
    case 'anxiety':
      return hasConditionInProfile(profile, "anxiety");
    case 'bipolar':
      return hasConditionInProfile(profile, "bipolar");
    case 'ptsd':
      return hasConditionInProfile(profile, "ptsd");
    case 'eatingDisorder':
      return hasConditionInProfile(profile, "eatingDisorder");
    case 'pregnancy':
      return profile.medicalHistory?.reproductiveHistory?.currentlyPregnant !== undefined;
    case 'breastfeeding':
      return (profile.medicalHistory?.reproductiveHistory as any)?.breastfeedingMonths !== undefined;
    case 'menopause':
      return (profile.medicalHistory?.reproductiveHistory as any)?.menopauseStatus !== undefined;
    case 'hrt':
      return false; // Field not in current Medications interface
    case 'contraception':
      return (profile.medicalHistory?.reproductiveHistory as any)?.oralContraceptiveUse !== undefined;
    case 'teeth':
      return false; // Field not in type system
    case 'floss':
      return false; // Field not in type system
    case 'dentist':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'dental') || false;
    case 'vision':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'vision') || false;
    case 'hearing':
      return profile.medicalHistory?.screenings?.some((s: any) => s.screeningType === 'hearing') || false;
    // REMOVED: Blood Donation - healthy donor bias
    // case 'bloodDonation':
    //   return profile.lifestyle?.bloodDonation !== undefined;
    case 'volunteering':
      return profile.social?.volunteering?.active?.value !== undefined;
    case 'dog_ownership':
      return profile.social?.petOwnership?.ownsDog?.value !== undefined;
    case 'social_connections':
      return (profile.social as any)?.socialEngagement !== undefined;
    case 'creative_hobbies':
      return profile.social?.hobbies?.creative?.engaged?.value !== undefined;
    case 'religious_attendance':
      return profile.social?.religiousAttendance?.value !== undefined;
    case 'music':
      return (profile.lifestyle as any)?.musicListening !== undefined;
    case 'reading':
      return (profile.lifestyle as any)?.reading !== undefined;
    case 'gaming':
      return (profile.lifestyle as any)?.gaming !== undefined;
    case 'screenTime':
      return (profile.lifestyle as any)?.screenTime !== undefined;
    case 'nature_exposure':
      return profile.lifestyle?.outdoorTime?.minutesPerWeek !== undefined;
    case 'pollution':
      return (profile.lifestyle as any)?.pollutionExposure !== undefined;
    case 'noise':
      return (profile.lifestyle as any)?.noiseExposure !== undefined;
    case 'mold':
      return (profile.lifestyle as any)?.moldExposure !== undefined;
    case 'leadPaint':
      return (profile.lifestyle as any)?.leadExposure !== undefined;
    case 'asbestos':
      return profile.customFields?.asbestosExposure !== undefined;
    // PHASE 3 ADDITIONS
    case 'cacScore':
      return profile.medicalHistory?.cacScore !== undefined;
    case 'suicideAttempts':
      return profile.medicalHistory?.suicideAttempts !== undefined;
    case 'sleepApnea':
      return profile.medicalHistory?.sleepApnea?.diagnosis !== undefined;
    case 'hearingLoss':
      return profile.medicalHistory?.hearingLoss?.treated !== undefined;
    case 'sunburns':
      return profile.medicalHistory?.sunExposure?.sunburns !== undefined;
    default:
      return false;
  }
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

// Generate survey questions
function generateQuestions(): SwipeQuestion[] {
  return [
    // LIFESTYLE
    {
      id: 'smoking',
      question: 'Do you smoke cigarettes?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Yes, I smoke',
        emoji: '🚬',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            smoking: {
              ...p.lifestyle?.smoking,
              status: createUserDataPoint('current' as const),
              packsPerDay: createTimeSeries(0.5), // 10 cigarettes = 0.5 packs
              packYears: createUserDataPoint(5) // Estimated
            }
          }
        })
      },
      rightOption: {
        label: 'No, I don\'t smoke',
        emoji: '🌬️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            smoking: {
              ...p.lifestyle?.smoking,
              status: createUserDataPoint('never' as const)
            }
          }
        })
      },
      detailedInput: {
        inputType: {
          type: 'select',
          options: [
            { value: 'never', label: 'Never smoked' },
            { value: 'former', label: 'Former smoker (quit)' },
            { value: 'current_light', label: 'Current: <10 cigs/day' },
            { value: 'current_moderate', label: 'Current: 10-20 cigs/day' },
            { value: 'current_heavy', label: 'Current: 20+ cigs/day' }
          ]
        },
        label: 'Smoking status',
        getCurrentValue: (p) => {
          const status = p.lifestyle?.smoking?.status?.value;
          const packsPerDay = p.lifestyle?.smoking?.packsPerDay?.mostRecent?.value || 0;
          if (status === 'never') return 'never';
          if (status === 'former') return 'former';
          if (status === 'current') {
            if (packsPerDay < 0.5) return 'current_light';
            if (packsPerDay <= 1) return 'current_moderate';
            return 'current_heavy';
          }
          return '';
        },
        profileUpdate: (p, value) => {
          const updates: any = {
            never: { status: 'never', packsPerDay: 0, packYears: 0 },
            former: { status: 'former', packsPerDay: 0, packYears: 10 },
            current_light: { status: 'current', packsPerDay: 0.25, packYears: 5 },
            current_moderate: { status: 'current', packsPerDay: 0.75, packYears: 10 },
            current_heavy: { status: 'current', packsPerDay: 1.5, packYears: 20 }
          };
          const update = updates[value] || updates.never;
          return {
            ...p,
            lifestyle: {
              ...p.lifestyle,
              smoking: {
                ...p.lifestyle?.smoking,
                status: createUserDataPoint(update.status as any),
                packsPerDay: createTimeSeries(update.packsPerDay),
                packYears: createUserDataPoint(update.packYears)
              }
            }
          };
        }
      }
    },
    {
      id: 'exercise',
      question: 'Do you exercise regularly?',
      category: 'Lifestyle',
      leftOption: {
        label: 'No exercise',
        emoji: '🛋️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            exercise: {
              ...p.lifestyle?.exercise,
              moderateMinutesPerWeek: createTimeSeries(0),
              vigorousMinutesPerWeek: createTimeSeries(0)
            }
          }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '🏃',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            exercise: {
              ...p.lifestyle?.exercise,
              moderateMinutesPerWeek: createTimeSeries(150),
              vigorousMinutesPerWeek: createTimeSeries(0)
            }
          }
        })
      },
      detailedInput: {
        inputType: { type: 'slider', min: 0, max: 500, step: 10, unit: 'min/week' },
        label: 'Moderate exercise minutes per week',
        getCurrentValue: (p) => p.lifestyle?.exercise?.moderateMinutesPerWeek?.mostRecent?.value || 0,
        profileUpdate: (p, value) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            exercise: {
              ...p.lifestyle?.exercise,
              moderateMinutesPerWeek: createTimeSeries(value),
              vigorousMinutesPerWeek: createTimeSeries(0)
            }
          }
        })
      }
    },
    {
      id: 'alcohol',
      question: 'Do you drink alcohol heavily?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Heavy drinking',
        emoji: '🍺',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            alcohol: {
              ...p.lifestyle?.alcohol,
              drinksPerWeek: createTimeSeries(20),
              bingeDrinking: createUserDataPoint(true),
              pattern: createUserDataPoint('heavy' as const)
            }
          }
        })
      },
      rightOption: {
        label: 'Moderate/None',
        emoji: '💧',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            alcohol: {
              ...p.lifestyle?.alcohol,
              drinksPerWeek: createTimeSeries(3),
              bingeDrinking: createUserDataPoint(false),
              pattern: createUserDataPoint('moderate' as const)
            }
          }
        })
      },
      detailedInput: {
        inputType: { type: 'slider', min: 0, max: 40, step: 1, unit: 'drinks/week' },
        label: 'Alcoholic drinks per week',
        getCurrentValue: (p) => p.lifestyle?.alcohol?.drinksPerWeek?.mostRecent?.value || 0,
        profileUpdate: (p, value) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            alcohol: {
              ...p.lifestyle?.alcohol,
              drinksPerWeek: createTimeSeries(value),
              bingeDrinking: createUserDataPoint(value > 14),
              pattern: createUserDataPoint(value > 14 ? 'heavy' : value > 7 ? 'moderate' : 'light')
            }
          }
        })
      }
    },
    {
      id: 'diet',
      question: 'Do you eat a healthy diet?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Mostly junk food',
        emoji: '🍔',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            diet: {
              ...p.lifestyle?.diet,
              vegetableServingsPerDay: createTimeSeries(1),
              fruitServingsPerDay: createTimeSeries(1),
              processedMeatServingsPerWeek: createTimeSeries(7),
              pattern: createUserDataPoint('western' as const)
            }
          }
        })
      },
      rightOption: {
        label: 'Healthy diet',
        emoji: '🥗',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            diet: {
              ...p.lifestyle?.diet,
              vegetableServingsPerDay: createTimeSeries(5),
              fruitServingsPerDay: createTimeSeries(3),
              processedMeatServingsPerWeek: createTimeSeries(0),
              pattern: createUserDataPoint('mediterranean' as const)
            }
          }
        })
      },
      detailedInput: {
        inputType: { type: 'slider', min: 0, max: 10, step: 0.5, unit: 'servings/day' },
        label: 'Vegetable servings per day',
        getCurrentValue: (p) => p.lifestyle?.diet?.vegetableServingsPerDay?.mostRecent?.value || 0,
        profileUpdate: (p, value) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            diet: {
              ...p.lifestyle?.diet,
              vegetableServingsPerDay: createTimeSeries(value),
              fruitServingsPerDay: createTimeSeries(Math.max(2, value * 0.6)),
              processedMeatServingsPerWeek: createTimeSeries(value > 4 ? 0 : 5),
              pattern: createUserDataPoint(value > 4 ? 'mediterranean' : value > 2 ? 'mixed' : 'western') as DataPoint<DietPattern>
            }
          }
        })
      }
    },
    {
      id: 'sleep',
      question: 'Do you get enough sleep?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Poor sleep (<6 hrs)',
        emoji: '😴',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            sleep: {
              ...p.lifestyle?.sleep,
              averageHoursPerNight: createTimeSeries(5),
              sleepQuality: createTimeSeries(3) // 1-10 scale, 3 = poor
            }
          }
        })
      },
      rightOption: {
        label: 'Good sleep (7-9 hrs)',
        emoji: '😊',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            sleep: {
              ...p.lifestyle?.sleep,
              averageHoursPerNight: createTimeSeries(8),
              sleepQuality: createTimeSeries(8) // 1-10 scale, 8 = good
            }
          }
        })
      },
      detailedInput: {
        inputType: { type: 'slider', min: 0, max: 12, step: 0.5, unit: 'hours/night' },
        label: 'Average hours of sleep per night',
        getCurrentValue: (p) => p.lifestyle?.sleep?.averageHoursPerNight?.mostRecent?.value || 7,
        profileUpdate: (p, value) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            sleep: {
              ...p.lifestyle?.sleep,
              averageHoursPerNight: createTimeSeries(value),
              sleepQuality: createTimeSeries(value >= 7 && value <= 9 ? 8 : value < 6 ? 3 : 5)
            }
          }
        })
      }
    },
    {
      id: 'stress',
      question: 'Are you under chronic stress?',
      category: 'Lifestyle',
      leftOption: {
        label: 'High stress',
        emoji: '😰',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, stress: createUserDataPoint('high') } as any
        })
      },
      rightOption: {
        label: 'Low stress',
        emoji: '😌',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, stress: createUserDataPoint('low') } as any
        })
      }
    },
    {
      id: 'socialConnection',
      question: 'Do you have strong social connections?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Socially isolated',
        emoji: '😔',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            socialEngagement: createUserDataPoint('low')
          }
        })
      },
      rightOption: {
        label: 'Strong connections',
        emoji: '👥',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            socialEngagement: createUserDataPoint('high')
          }
        })
      }
    },
    {
      id: 'sunExposure',
      question: 'Do you get excessive sun exposure?',
      category: 'Lifestyle',
      leftOption: {
        label: 'Excessive sun',
        emoji: '☀️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, sunExposure: createUserDataPoint('excessive') } as any
        })
      },
      rightOption: {
        label: 'Protected/Moderate',
        emoji: '🧴',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, sunExposure: createUserDataPoint('moderate') } as any
        })
      }
    },
    {
      id: 'occupationalHazards',
      question: 'Are you exposed to workplace hazards?',
      category: 'Lifestyle',
      leftOption: {
        label: 'High exposure',
        emoji: '⚠️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            occupationalExposures: createUserDataPoint(true)
          }
        })
      },
      rightOption: {
        label: 'Low/No exposure',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            occupationalExposures: createUserDataPoint(false)
          }
        })
      }
    },

    // DEMOGRAPHICS
    {
      id: 'biologicalSex',
      question: 'What is your biological sex?',
      category: 'Demographics',
      leftOption: {
        label: 'Male',
        emoji: '♂️',
        profileUpdate: (p) => ({
          ...p,
          demographics: {
            ...p.demographics,
            biologicalSex: createUserDataPoint('male' as const)
          }
        })
      },
      rightOption: {
        label: 'Female',
        emoji: '♀️',
        profileUpdate: (p) => ({
          ...p,
          demographics: {
            ...p.demographics,
            biologicalSex: createUserDataPoint('female' as const)
          }
        })
      }
    },

    // MEDICAL CONDITIONS
    {
      id: 'diabetes',
      question: 'Do you have diabetes?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '💉',
        profileUpdate: (p) => setCondition(p, 'diabetes', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'diabetes', false)
      }
    },
    {
      id: 'hypertension',
      question: 'Do you have high blood pressure?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '📈',
        profileUpdate: (p) => setCondition(p, 'hypertension', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'hypertension', false)
      }
    },
    {
      id: 'heartDisease',
      question: 'Do you have heart disease?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '💔',
        profileUpdate: (p) => setCondition(p, 'heartDisease', true)
      },
      rightOption: {
        label: 'No',
        emoji: '❤️',
        profileUpdate: (p) => setCondition(p, 'heartDisease', false)
      }
    },
    {
      id: 'stroke',
      question: 'Have you had a stroke?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🧠',
        profileUpdate: (p) => setCondition(p, 'stroke', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'stroke', false)
      }
    },
    {
      id: 'cancer',
      question: 'Have you had cancer?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🎗️',
        profileUpdate: (p) => setCondition(p, 'cancer', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'cancer', false)
      }
    },
    {
      id: 'copd',
      question: 'Do you have COPD or emphysema?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🫁',
        profileUpdate: (p) => setCondition(p, 'copd', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'copd', false)
      }
    },
    {
      id: 'kidneyDisease',
      question: 'Do you have kidney disease?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🩺',
        profileUpdate: (p) => setCondition(p, 'kidneyDisease', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'kidneyDisease', false)
      }
    },
    {
      id: 'liverDisease',
      question: 'Do you have liver disease?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '🫀',
        profileUpdate: (p) => setCondition(p, 'liverDisease', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'liverDisease', false)
      }
    },
    {
      id: 'depression',
      question: 'Do you have depression?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '😢',
        profileUpdate: (p) => setCondition(p, 'depression', true)
      },
      rightOption: {
        label: 'No',
        emoji: '😊',
        profileUpdate: (p) => setCondition(p, 'depression', false)
      }
    },
    {
      id: 'asthma',
      question: 'Do you have asthma?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '😮‍💨',
        profileUpdate: (p) => setCondition(p, 'asthma', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'asthma', false)
      }
    },

    // FAMILY HISTORY
    {
      id: 'familyHeartDisease',
      question: 'Family history of heart disease?',
      category: 'Family History',
      leftOption: {
        label: 'Yes',
        emoji: '👨‍👩‍👧‍👦💔',
        profileUpdate: (p) => setFamilyHistory(p, 'heart_disease', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setFamilyHistory(p, 'heart_disease', false)
      }
    },
    {
      id: 'familyCancer',
      question: 'Family history of cancer?',
      category: 'Family History',
      leftOption: {
        label: 'Yes',
        emoji: '👨‍👩‍👧‍👦🎗️',
        profileUpdate: (p) => setFamilyHistory(p, 'cancer', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setFamilyHistory(p, 'cancer', false)
      }
    },

    // MEDICATIONS
    {
      id: 'statin',
      question: 'Are you taking a statin?',
      category: 'Medications',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), statin: createUserDataPoint(false) }
          }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), statin: createUserDataPoint(true) }
          }
        })
      }
    },
    {
      id: 'bloodPressureMeds',
      question: 'Taking blood pressure medication?',
      category: 'Medications',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), takesBloodPressureMeds: createUserDataPoint(false) }
          }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), takesBloodPressureMeds: createUserDataPoint(true) }
          }
        })
      }
    },
    // REMOVED: Aspirin - No evidence of mortality benefit in primary prevention
    // Meta-analysis (USPSTF 2022): HR 0.99 (0.94-1.03) - no significant all-cause mortality benefit
    // Bleeding risk offsets CVD benefit. Only beneficial in secondary prevention (post-MI/stroke)
    // {
    //   id: 'aspirin',
    //   question: 'Taking daily aspirin?',
    //   category: 'Medications',
    //   leftOption: {
    //     label: 'No',
    //     emoji: '🚫',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       medicalHistory: {
    //         ...p.medicalHistory,
    //         medications: { ...(p.medicalHistory?.medications || {}), aspirin: false }
    //       }
    //     })
    //   },
    //   rightOption: {
    //     label: 'Yes',
    //     emoji: '💊',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       medicalHistory: {
    //         ...p.medicalHistory,
    //         medications: { ...(p.medicalHistory?.medications || {}), aspirin: true }
    //       }
    //     })
    //   }
    // },

    // BIOMETRICS / LAB-STYLE
    {
      id: 'obesity',
      question: 'Are you significantly overweight?',
      category: 'Biometrics',
      leftOption: {
        label: 'Yes (BMI > 30)',
        emoji: '⚖️',
        profileUpdate: (p) => ({
          ...p,
          biometrics: {
            ...p.biometrics,
            // BMI 32 = ~92kg at 170cm height
            height: p.biometrics?.height || createUserDataPoint(170),
            weight: createTimeSeries({ value: 92, unit: 'kg' as const })
          }
        })
      },
      rightOption: {
        label: 'No (Healthy weight)',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          biometrics: {
            ...p.biometrics,
            // BMI 23 = ~66.5kg at 170cm height
            height: p.biometrics?.height || createUserDataPoint(170),
            weight: createTimeSeries({ value: 66.5, unit: 'kg' as const })
          }
        })
      }
    },
    {
      id: 'highCholesterol',
      question: 'Do you have high cholesterol?',
      category: 'Lab Tests',
      leftOption: {
        label: 'Yes',
        emoji: '📊',
        profileUpdate: (p) => ({
          ...p,
          labTests: {
            ...p.labTests,
            lipidPanel: {
              ...p.labTests?.lipidPanel,
              totalCholesterol: createUserDataPoint(260),
              ldlCholesterol: createUserDataPoint(160)
            }
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          labTests: {
            ...p.labTests,
            lipidPanel: {
              ...p.labTests?.lipidPanel,
              totalCholesterol: createUserDataPoint(180),
              ldlCholesterol: createUserDataPoint(100)
            }
          }
        })
      }
    },
    {
      id: 'prediabetic',
      question: 'Are you pre-diabetic?',
      category: 'Lab Tests',
      leftOption: {
        label: 'Yes',
        emoji: '⚠️',
        profileUpdate: (p) => ({
          ...p,
          labTests: {
            ...p.labTests,
            metabolicPanel: {
              ...p.labTests?.metabolicPanel,
              hba1c: createUserDataPoint(6.0)
            }
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          labTests: {
            ...p.labTests,
            metabolicPanel: {
              ...p.labTests?.metabolicPanel,
              hba1c: createUserDataPoint(5.2)
            }
          }
        })
      }
    },

    // PREVENTIVE CARE & VACCINATIONS
    {
      id: 'fluVaccine',
      question: 'Do you get annual flu vaccine?',
      category: 'Preventive Care',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            vaccinations: { ...(p.medicalHistory?.vaccinations || {}), fluVaccineCurrentYear: createUserDataPoint(false) }
          }
        })
      },
      rightOption: {
        label: 'Yes, annually',
        emoji: '💉',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            vaccinations: { ...(p.medicalHistory?.vaccinations || {}), fluVaccineCurrentYear: createUserDataPoint(true) }
          }
        })
      }
    },
    {
      id: 'colonoscopy',
      question: 'Have you had a colonoscopy (if over 45)?',
      category: 'Preventive Care',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'colonoscopy', 'negative', false)
          }
        })
      },
      rightOption: {
        label: 'Yes, up to date',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'colonoscopy', 'negative', true)
          }
        })
      }
    },
    {
      id: 'mammogram',
      question: 'Regular mammograms (if female)?',
      category: 'Preventive Care',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'mammogram', 'negative', false)
          }
        })
      },
      rightOption: {
        label: 'Yes, regular',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'mammogram', 'negative', true)
          }
        })
      }
    },
    {
      id: 'dentist',
      question: 'Do you visit dentist regularly?',
      category: 'Preventive Care',
      leftOption: {
        label: 'Rarely/Never',
        emoji: '🦷',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'dental', 'negative', false)
          }
        })
      },
      rightOption: {
        label: 'Twice yearly',
        emoji: '😁',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'dental', 'negative', true)
          }
        })
      }
    },
    {
      id: 'vision',
      question: 'Regular vision checkups?',
      category: 'Preventive Care',
      leftOption: {
        label: 'No',
        emoji: '👓',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'vision', 'negative', false)
          }
        })
      },
      rightOption: {
        label: 'Yes, regular',
        emoji: '👁️',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            screenings: updateScreeningArray(p.medicalHistory?.screenings, 'vision', 'negative', true)
          }
        })
      }
    },

    // SAFETY BEHAVIORS
    {
      id: 'seatbelt',
      question: 'Do you always wear a seatbelt?',
      category: 'Safety',
      leftOption: {
        label: 'Rarely/Sometimes',
        emoji: '🚗',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, seatBeltUse: createUserDataPoint('never' as const) } }
        })
      },
      rightOption: {
        label: 'Always',
        emoji: '🔒',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, seatBeltUse: createUserDataPoint('always' as const) } }
        })
      }
    },
    {
      id: 'texting',
      question: 'Do you text while driving?',
      category: 'Safety',
      leftOption: {
        label: 'Yes',
        emoji: '📱',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, phoneUseWhileDriving: createUserDataPoint('frequent' as const) } }
        })
      },
      rightOption: {
        label: 'Never',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, phoneUseWhileDriving: createUserDataPoint('never' as const) } }
        })
      }
    },
    {
      id: 'speeding',
      question: 'Do you regularly speed?',
      category: 'Safety',
      leftOption: {
        label: 'Yes, often',
        emoji: '🏎️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, trafficViolationsPast3Years: createUserDataPoint(3) } }
        })
      },
      rightOption: {
        label: 'No, drive safely',
        emoji: '🚙',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, drivingHabits: { ...p.lifestyle?.drivingHabits, trafficViolationsPast3Years: createUserDataPoint(0) } }
        })
      }
    },
    {
      id: 'helmet',
      question: 'Wear helmet when biking/motorcycling?',
      category: 'Safety',
      leftOption: {
        label: 'No',
        emoji: '🚴',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, helmetUse: createUserDataPoint(false) } as any
        })
      },
      rightOption: {
        label: 'Always',
        emoji: '⛑️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, helmetUse: createUserDataPoint(true) } as any
        })
      }
    },

    // SUBSTANCE USE
    {
      id: 'drugs',
      question: 'Do you use recreational drugs?',
      category: 'Substance Use',
      leftOption: {
        label: 'Yes, regularly',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, recreationalDrugs: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, recreationalDrugs: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'opioids',
      question: 'Do you use opioid painkillers?',
      category: 'Substance Use',
      leftOption: {
        label: 'Yes, regularly',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            substanceUse: {
              ...p.medicalHistory?.substanceUse,
              prescribedOpioids: createUserDataPoint(true)
            }
          }
        })
      },
      rightOption: {
        label: 'No/As prescribed',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            substanceUse: {
              ...p.medicalHistory?.substanceUse,
              prescribedOpioids: createUserDataPoint(false)
            }
          }
        })
      }
    },
    {
      id: 'marijuana',
      question: 'Do you use marijuana regularly?',
      category: 'Substance Use',
      leftOption: {
        label: 'Yes, daily',
        emoji: '🌿',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, marijuana: createUserDataPoint('daily') } as any
        })
      },
      rightOption: {
        label: 'No/Occasionally',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, marijuana: createUserDataPoint('none') } as any
        })
      }
    },

    // ENVIRONMENTAL EXPOSURES
    {
      id: 'airQuality',
      question: 'Do you live in area with poor air quality?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, high pollution',
        emoji: '🏭',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, airQualityExposure: createUserDataPoint('poor') } as any
        })
      },
      rightOption: {
        label: 'No, clean air',
        emoji: '🌲',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, airQualityExposure: createUserDataPoint('good') } as any
        })
      }
    },
    // REMOVED: Water Quality - Too heterogeneous for self-report
    // Evidence too location-dependent and requires specific contaminant measurements (arsenic, lead, etc.)
    // Self-reported "clean water" is unreliable without zip-code based water quality index
    // Future: Could implement zip-code lookup for EPA water quality data
    // {
    //   id: 'waterQuality',
    //   question: 'Do you have clean drinking water?',
    //   category: 'Environment',
    //   leftOption: {
    //     label: 'Poor quality',
    //     emoji: '🚰',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       lifestyle: { ...p.lifestyle, waterQuality: createUserDataPoint('poor') } as any
    //     })
    //   },
    //   rightOption: {
    //     label: 'Clean water',
    //     emoji: '💧',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       lifestyle: { ...p.lifestyle, waterQuality: createUserDataPoint('good') } as any
    //     })
    //   }
    // },
    {
      id: 'pesticides',
      question: 'Regular pesticide exposure?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, regular',
        emoji: '🌾',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, pesticideExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No/Minimal',
        emoji: '🥬',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, pesticideExposure: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'radiation',
      question: 'Occupational radiation exposure?',
      category: 'Environment',
      leftOption: {
        label: 'Yes',
        emoji: '☢️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, radiationExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, radiationExposure: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'pollution',
      question: 'Live near major pollution source?',
      category: 'Environment',
      leftOption: {
        label: 'Yes (highway, factory)',
        emoji: '🏭',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, pollutionExposure: createUserDataPoint('high') } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '🏡',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, pollutionExposure: createUserDataPoint('low') } as any
        })
      }
    },
    {
      id: 'noise',
      question: 'Chronic noise pollution exposure?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, very loud',
        emoji: '🔊',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, noiseExposure: createUserDataPoint('high') } as any
        })
      },
      rightOption: {
        label: 'No, quiet',
        emoji: '🤫',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, noiseExposure: createUserDataPoint('low') } as any
        })
      }
    },
    {
      id: 'mold',
      question: 'Mold exposure in home/work?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, significant',
        emoji: '🦠',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, moldExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, moldExposure: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'leadPaint',
      question: 'Lead paint exposure (old building)?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, possible',
        emoji: '🎨',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, leadExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, leadExposure: createUserDataPoint(false) } as any
        })
      }
    },
    {
      id: 'asbestos',
      question: 'Asbestos exposure?',
      category: 'Environment',
      leftOption: {
        label: 'Yes, occupational',
        emoji: '🏗️',
        profileUpdate: (p) => ({
          ...p,
          customFields: { ...p.customFields, asbestosExposure: createUserDataPoint(true) } as any
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          customFields: { ...p.customFields, asbestosExposure: createUserDataPoint(false) } as any
        })
      }
    },

    // MENTAL HEALTH (Additional)
    {
      id: 'anxiety',
      question: 'Do you have anxiety disorder?',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '😰',
        profileUpdate: (p) => setCondition(p, 'anxiety', true)
      },
      rightOption: {
        label: 'No',
        emoji: '😌',
        profileUpdate: (p) => setCondition(p, 'anxiety', false)
      }
    },
    {
      id: 'bipolar',
      question: 'Do you have bipolar disorder?',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '🎭',
        profileUpdate: (p) => setCondition(p, 'bipolar', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'bipolar', false)
      }
    },
    {
      id: 'ptsd',
      question: 'Do you have PTSD?',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '😔',
        profileUpdate: (p) => setCondition(p, 'ptsd', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'ptsd', false)
      }
    },
    {
      id: 'eatingDisorder',
      question: 'Do you have an eating disorder?',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '🍽️',
        profileUpdate: (p) => setCondition(p, 'eatingDisorder', true)
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => setCondition(p, 'eatingDisorder', false)
      }
    },

    // REPRODUCTIVE HEALTH
    {
      id: 'hrt',
      question: 'Are you on hormone replacement therapy?',
      category: 'Reproductive Health',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), hrt: createUserDataPoint(false) } as any
          }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: { ...(p.medicalHistory?.medications || {}), hrt: createUserDataPoint(true) } as any
          }
        })
      }
    },
    {
      id: 'contraception',
      question: 'Do you use hormonal contraception?',
      category: 'Reproductive Health',
      leftOption: {
        label: 'Yes, long-term',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            reproductiveHistory: { ...p.medicalHistory?.reproductiveHistory, contraceptionUse: createUserDataPoint(true) } as any
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            reproductiveHistory: { ...p.medicalHistory?.reproductiveHistory, contraceptionUse: createUserDataPoint(false) } as any
          }
        })
      }
    },

    // DENTAL HEALTH
    {
      id: 'teeth',
      question: 'Do you brush teeth twice daily?',
      category: 'Dental Health',
      leftOption: {
        label: 'No/Rarely',
        emoji: '🦷',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, dentalHygiene: createUserDataPoint('poor') } as any
        })
      },
      rightOption: {
        label: 'Yes, twice daily',
        emoji: '🪥',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, dentalHygiene: createUserDataPoint('good') } as any
        })
      }
    },
    {
      id: 'floss',
      question: 'Do you floss regularly?',
      category: 'Dental Health',
      leftOption: {
        label: 'No',
        emoji: '🦷',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, flossing: createUserDataPoint(false) } as any
        })
      },
      rightOption: {
        label: 'Yes, daily',
        emoji: '🧵',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, flossing: createUserDataPoint(true) } as any
        })
      }
    },

    // LIFESTYLE & WELLBEING
    {
      id: 'pets',
      question: 'Do you have pets?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, petOwnership: { ...p.social?.petOwnership, ownsDog: createUserDataPoint(false) } }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '🐕',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, petOwnership: { ...p.social?.petOwnership, ownsDog: createUserDataPoint(true) } }
        })
      }
    },
    {
      id: 'volunteering',
      question: 'Do you volunteer or help others?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, volunteering: { ...p.social?.volunteering, active: createUserDataPoint(false) } }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '🤝',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, volunteering: { ...p.social?.volunteering, active: createUserDataPoint(true) } }
        })
      }
    },
    {
      id: 'hobbies',
      question: 'Do you have engaging hobbies?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No, not really',
        emoji: '📺',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, hobbies: { ...p.social?.hobbies, creative: { engaged: createUserDataPoint(false) } } }
        })
      },
      rightOption: {
        label: 'Yes, several',
        emoji: '🎨',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, hobbies: { ...p.social?.hobbies, creative: { engaged: createUserDataPoint(true) } } }
        })
      }
    },
    {
      id: 'religion',
      question: 'Do you attend religious services?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, religiousAttendance: createUserDataPoint(false ? 'weekly' : 'never') }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '🕊️',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, religiousAttendance: createUserDataPoint(true ? 'weekly' : 'never') }
        })
      }
    },
    {
      id: 'music',
      question: 'Do you listen to music regularly?',
      category: 'Wellbeing',
      leftOption: {
        label: 'Rarely',
        emoji: '🔇',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, musicListening: createUserDataPoint(false) } as any
        })
      },
      rightOption: {
        label: 'Yes, often',
        emoji: '🎵',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, musicListening: createUserDataPoint(true) } as any
        })
      }
    },
    {
      id: 'reading',
      question: 'Do you read books regularly?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No',
        emoji: '📱',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, hobbies: { ...p.social?.hobbies, intellectual: { engaged: createUserDataPoint(false) } } }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '📚',
        profileUpdate: (p) => ({
          ...p,
          social: { ...p.social, hobbies: { ...p.social?.hobbies, intellectual: { engaged: createUserDataPoint(true) } } }
        })
      }
    },
    {
      id: 'screenTime',
      question: 'Excessive screen time (>6 hrs/day)?',
      category: 'Wellbeing',
      leftOption: {
        label: 'Yes, very high',
        emoji: '📱',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, screenTime: createUserDataPoint('high') } as any
        })
      },
      rightOption: {
        label: 'No, moderate',
        emoji: '📵',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, screenTime: createUserDataPoint('moderate') } as any
        })
      }
    },
    {
      id: 'outdoorTime',
      question: 'Do you spend time outdoors daily?',
      category: 'Wellbeing',
      leftOption: {
        label: 'Rarely',
        emoji: '🏠',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, outdoorTime: { ...p.lifestyle?.outdoorTime, minutesPerWeek: createTimeSeries(30) } }
        })
      },
      rightOption: {
        label: 'Yes, daily',
        emoji: '🌳',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, outdoorTime: { ...p.lifestyle?.outdoorTime, minutesPerWeek: createTimeSeries(300) } }
        })
      }
    },
    {
      id: 'nature',
      question: 'Regular exposure to nature/greenspace?',
      category: 'Wellbeing',
      leftOption: {
        label: 'No, mostly urban',
        emoji: '🏙️',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, outdoorTime: { ...p.lifestyle?.outdoorTime, minutesPerWeek: createTimeSeries(30) } }
        })
      },
      rightOption: {
        label: 'Yes, frequent',
        emoji: '🌲',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: { ...p.lifestyle, outdoorTime: { ...p.lifestyle?.outdoorTime, minutesPerWeek: createTimeSeries(300) } }
        })
      }
    },
    // REMOVED: Blood Donation - Healthy donor bias confounds evidence
    // Apparent benefits (HR 0.98) largely due to "Healthy Donor Effect"
    // Rigorous studies controlling for health status show no significant mortality benefit
    // Blood donors must meet strict health criteria, creating selection bias
    // {
    //   id: 'bloodDonation',
    //   question: 'Do you donate blood?',
    //   category: 'Wellbeing',
    //   leftOption: {
    //     label: 'No',
    //     emoji: '🚫',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       lifestyle: { ...p.lifestyle, bloodDonation: createUserDataPoint(false) } as any
    //     })
    //   },
    //   rightOption: {
    //     label: 'Yes, regularly',
    //     emoji: '🩸',
    //     profileUpdate: (p) => ({
    //       ...p,
    //       lifestyle: { ...p.lifestyle, bloodDonation: createUserDataPoint(true) } as any
    //     })
    //   }
    // },

    // MORTALITY MODIFIERS (Evidence-Based)
    {
      id: 'dog_ownership',
      question: 'Do you own a dog?',
      category: 'Social',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            petOwnership: {
              ...p.social?.petOwnership,
              ownsDog: createUserDataPoint(false)
            }
          }
        })
      },
      rightOption: {
        label: 'Yes, I have a dog',
        emoji: '🐕',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            petOwnership: {
              ...p.social?.petOwnership,
              ownsDog: createUserDataPoint(true)
            }
          }
        })
      }
    },
    {
      id: 'social_connections',
      question: 'How strong are your social connections?',
      category: 'Social',
      leftOption: {
        label: 'Weak/Isolated',
        emoji: '😔',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            socialEngagement: createUserDataPoint('low')
          } as any
        })
      },
      rightOption: {
        label: 'Strong',
        emoji: '💚',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            socialEngagement: createUserDataPoint('high')
          } as any
        })
      }
    },
    {
      id: 'religious_attendance',
      question: 'Do you attend religious services?',
      category: 'Cultural',
      leftOption: {
        label: 'Never/Rarely',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            religiousAttendance: createUserDataPoint('never' as const)
          }
        })
      },
      rightOption: {
        label: 'Weekly+',
        emoji: '⛪',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            religiousAttendance: createUserDataPoint('weekly' as const)
          }
        })
      }
    },
    {
      id: 'nature_exposure',
      question: 'Time spent in nature per week?',
      category: 'Environmental',
      leftOption: {
        label: 'Little/None',
        emoji: '🏢',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            outdoorTime: {
              ...p.lifestyle?.outdoorTime,
              minutesPerWeek: createTimeSeries(30)
            }
          }
        })
      },
      rightOption: {
        label: '2+ hours',
        emoji: '🌳',
        profileUpdate: (p) => ({
          ...p,
          lifestyle: {
            ...p.lifestyle,
            outdoorTime: {
              ...p.lifestyle?.outdoorTime,
              minutesPerWeek: createTimeSeries(150)
            }
          }
        })
      }
    },
    {
      id: 'creative_hobbies',
      question: 'Do you engage in creative hobbies?',
      category: 'Cultural',
      leftOption: {
        label: 'No',
        emoji: '📺',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            hobbies: {
              ...p.social?.hobbies,
              creative: {
                ...p.social?.hobbies?.creative,
                engaged: createUserDataPoint(false)
              }
            }
          }
        })
      },
      rightOption: {
        label: 'Yes, regularly',
        emoji: '🎨',
        profileUpdate: (p) => ({
          ...p,
          social: {
            ...p.social,
            hobbies: {
              ...p.social?.hobbies,
              creative: {
                ...p.social?.hobbies?.creative,
                engaged: createUserDataPoint(true)
              }
            }
          }
        })
      }
    },

    // PHASE 3 ADDITIONS - NEW RISK FACTORS

    // MEDICATIONS
    {
      id: 'statin',
      question: 'Are you taking a statin medication for cholesterol?',
      category: 'Medical History',
      leftOption: {
        label: 'No',
        emoji: '🚫',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: {
              ...(p.medicalHistory?.medications || {}),
              statin: createUserDataPoint(false)
            }
          }
        })
      },
      rightOption: {
        label: 'Yes',
        emoji: '💊',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            medications: {
              ...(p.medicalHistory?.medications || {}),
              statin: createUserDataPoint(true)
            }
          }
        })
      }
    },

    // LAB TESTS / CARDIOVASCULAR SCREENING
    {
      id: 'cacScore',
      question: 'Have you had a coronary artery calcium (CAC) scan?',
      category: 'Lab Tests',
      leftOption: {
        label: 'No / Not tested',
        emoji: '❓',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            cacScore: undefined
          }
        })
      },
      rightOption: {
        label: 'Yes, tested',
        emoji: '🩺',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            cacScore: createUserDataPoint('0' as const) // Default to 0 (best score)
          }
        })
      }
    },

    // MENTAL HEALTH - SUICIDE RISK (SENSITIVE)
    {
      id: 'suicideAttempts',
      question: 'Have you ever had a suicide attempt? (Confidential)',
      category: 'Mental Health',
      leftOption: {
        label: 'Yes',
        emoji: '🆘',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            suicideAttempts: createUserDataPoint(true)
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            suicideAttempts: createUserDataPoint(false)
          }
        })
      }
    },

    // SLEEP HEALTH
    {
      id: 'sleepApnea',
      question: 'Have you been diagnosed with sleep apnea?',
      category: 'Medical History',
      leftOption: {
        label: 'Yes',
        emoji: '😴',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            sleepApnea: {
              ...(p.medicalHistory?.sleepApnea || {}),
              diagnosis: createUserDataPoint(true)
            }
          }
        })
      },
      rightOption: {
        label: 'No',
        emoji: '✅',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            sleepApnea: {
              ...(p.medicalHistory?.sleepApnea || {}),
              diagnosis: createUserDataPoint(false)
            }
          }
        })
      }
    },

    // HEARING HEALTH
    {
      id: 'hearingLoss',
      question: 'Do you have hearing loss? Do you use hearing aids?',
      category: 'Medical History',
      leftOption: {
        label: 'Hearing loss (untreated)',
        emoji: '👂',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            hearingLoss: {
              ...(p.medicalHistory?.hearingLoss || {}),
              treated: createUserDataPoint('untreated_moderate_severe' as const)
            }
          }
        })
      },
      rightOption: {
        label: 'No loss / Uses hearing aids',
        emoji: '👍',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            hearingLoss: {
              ...(p.medicalHistory?.hearingLoss || {}),
              treated: createUserDataPoint('none_or_treated' as const)
            }
          }
        })
      }
    },

    // SUN EXPOSURE / SKIN CANCER RISK
    {
      id: 'sunburns',
      question: 'How many severe sunburns have you had in your lifetime?',
      category: 'Medical History',
      leftOption: {
        label: 'Many (5+ times)',
        emoji: '☀️',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            sunExposure: {
              ...(p.medicalHistory?.sunExposure || {}),
              sunburns: createUserDataPoint(10) // Estimate 10 for "many"
            }
          }
        })
      },
      rightOption: {
        label: 'Few/None (0-2 times)',
        emoji: '🧴',
        profileUpdate: (p) => ({
          ...p,
          medicalHistory: {
            ...p.medicalHistory,
            sunExposure: {
              ...(p.medicalHistory?.sunExposure || {}),
              sunburns: createUserDataPoint(1) // Estimate 1 for "few"
            }
          }
        })
      }
    }
  ];
}
